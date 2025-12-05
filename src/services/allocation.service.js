// services/allocation.service.js
import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

/**
 * 生成项目分配（核心算法实现）
 * @param {number} semester_id - 学期ID
 * @returns {Object} 分配结果和统计报告
 */
export const generateAllocation = async (semester_id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ===================== 步骤1：数据预处理 =====================
    console.log('开始数据预处理...');

    // 1.1 读取approved项目，构建project_info
    const [approvedProjects] = await connection.execute(`
      SELECT p.id, p.programme_id, p.capacity 
      FROM proposals p 
      WHERE p.status = 'approved' AND p.semester_id = ?
    `, [semester_id]);

    const projectInfo = {};
    approvedProjects.forEach(project => {
      projectInfo[project.id] = {
        programme_id: project.programme_id,
        total_capacity: project.capacity || 0,
        remaining_capacity: project.capacity || 0
      };
    });
    console.log(`预处理完成：共${Object.keys(projectInfo).length}个已批准项目`);

    // 1.2 读取学生志愿，构建student_preferences
    const [studentPlans] = await connection.execute(`
      SELECT sp.student_id, sp.proposal_id, sp.priority 
      FROM student_plans sp 
      WHERE EXISTS (
        SELECT 1 FROM proposals p 
        WHERE p.id = sp.proposal_id AND p.status = 'approved' AND p.semester_id = ?
      )
    `, [semester_id]);

    // 按学生ID分组并按优先级排序
    const studentPreferences = {};
    studentPlans.forEach(plan => {
      if (!studentPreferences[plan.student_id]) {
        studentPreferences[plan.student_id] = [];
      }
      // 过滤不在approved项目中的志愿
      if (projectInfo[plan.proposal_id]) {
        studentPreferences[plan.student_id].push({
          proposal_id: plan.proposal_id,
          priority: plan.priority
        });
      }
    });
    // 按priority升序排序
    Object.keys(studentPreferences).forEach(studentId => {
      studentPreferences[studentId].sort((a, b) => a.priority - b.priority);
    });
    console.log(`预处理完成：共${Object.keys(studentPreferences).length}个学生志愿`);

    // ===================== 步骤2：按志愿优先级分层录取 =====================
    console.log('开始分层录取...');
    const finalAllocation = {};
    // 初始化所有学生分配结果为null
    Object.keys(studentPreferences).forEach(studentId => {
      finalAllocation[studentId] = {
        proposal_id: null,
        priority: null,
        allocation_type: null
      };
    });

    // 2.1 遍历所有approved项目，按优先级分层处理
    for (const [projectId, projectData] of Object.entries(projectInfo)) {
      if (projectData.remaining_capacity <= 0) continue;

      // 按优先级1-5分层处理
      for (let priority = 1; priority <= 5; priority++) {
        if (projectData.remaining_capacity <= 0) break;

        // 提取该层所有将此项目设为当前优先级的学生
        const layerStudents = [];
        Object.keys(studentPreferences).forEach(studentId => {
          const studentPlan = studentPreferences[studentId].find(
            plan => plan.proposal_id == projectId && plan.priority === priority
          );
          if (studentPlan && !finalAllocation[studentId].proposal_id) {
            layerStudents.push(studentId);
          }
        });

        if (layerStudents.length === 0) continue;

        // 2.2 递归录取逻辑
        const admittedStudents = await admitStudentsByLayer(
          connection,
          layerStudents,
          projectId,
          projectData,
          studentPreferences,
          priority,
          finalAllocation
        );

        // 更新项目剩余容量
        projectInfo[projectId].remaining_capacity -= admittedStudents.length;
        console.log(`项目${projectId}优先级${priority}：录取${admittedStudents.length}人，剩余容量${projectInfo[projectId].remaining_capacity}`);
      }
    }

    // ===================== 步骤3：打分补位 =====================
    console.log('开始补位录取...');
    await fillUnfilledProjects(
      connection,
      projectInfo,
      studentPreferences,
      finalAllocation,
      semester_id
    );

    // ===================== 步骤4：最终兜底 =====================
    console.log('开始兜底分配...');
    await finalBackupAllocation(
      connection,
      projectInfo,
      studentPreferences,
      finalAllocation
    );

    // ===================== 结果保存与统计 =====================
    console.log('保存分配结果...');
    // 清空旧数据
    await connection.execute(`
      DELETE FROM allocation_results WHERE semester_id = ?
    `, [semester_id]);

    // 保存新分配结果
    const allocationValues = [];
    Object.keys(finalAllocation).forEach(studentId => {
      const allocation = finalAllocation[studentId];
      if (allocation.proposal_id) {
        allocationValues.push([
          studentId,
          allocation.proposal_id,
          allocation.priority,
          projectInfo[allocation.proposal_id].programme_id,
          allocation.allocation_type,
          semester_id
        ]);
      }
    });

    if (allocationValues.length > 0) {
      await connection.execute(`
        INSERT INTO allocation_results 
        (student_id, proposal_id, priority, programme_id, allocation_type, semester_id)
        VALUES ${allocationValues.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')}
      `, allocationValues.flat());
    }

    // 生成统计报告
    const stats = await generateAllocationStats(
      connection,
      projectInfo,
      finalAllocation,
      studentPreferences,
      semester_id
    );

    // 保存分配主记录
    const [allocationRecord] = await connection.execute(`
      INSERT INTO allocations 
      (semester_id, allocation_rate, average_preference_score, dropped_projects, 
       project_fill_rate, high_preference_rate, timestamp, is_active)
      VALUES (?, ?, ?, ?, ?, ?, NOW(), 1)
    `, [
      semester_id,
      stats.allocation_rate,
      stats.average_preference_score,
      stats.dropped_projects,
      stats.project_fill_rate,
      stats.high_preference_rate
    ]);

    // 标记其他分配记录为非活跃
    await connection.execute(`
      UPDATE allocations SET is_active = 0 
      WHERE semester_id = ? AND id != ?
    `, [semester_id, allocationRecord.insertId]);

    await connection.commit();
    console.log('分配生成完成！');

    return {
      allocation_id: allocationRecord.insertId,
      stats: stats,
      total_allocated: allocationValues.length
    };

  } catch (err) {
    await connection.rollback();
    console.error('分配生成失败：', err);
    throwError(err.message || 'Failed to generate allocation', 500);
  } finally {
    connection.release();
  }
};

/**
 * 同层筛选录取（步骤2核心函数）
 * @param {Object} connection - 数据库连接
 * @param {Array} layerStudents - 该层学生列表
 * @param {number} projectId - 项目ID
 * @param {Object} projectData - 项目数据
 * @param {Object} studentPreferences - 学生志愿
 * @param {number} priority - 当前优先级
 * @param {Object} finalAllocation - 最终分配结果
 * @returns {Array} 录取的学生ID列表
 */
const admitStudentsByLayer = async (
  connection,
  layerStudents,
  projectId,
  projectData,
  studentPreferences,
  priority,
  finalAllocation
) => {
  const remainingCapacity = projectData.remaining_capacity;
  const admittedStudents = [];

  // 情况1：学生数 ≤ 剩余容量，全部录取
  if (layerStudents.length <= remainingCapacity) {
    layerStudents.forEach(studentId => {
      finalAllocation[studentId] = {
        proposal_id: projectId,
        priority: priority,
        allocation_type: '分层录取'
      };
      admittedStudents.push(studentId);
    });
    return admittedStudents;
  }

  // 情况2：学生数 > 剩余容量，按得分排序录取
  const studentScores = [];
  for (const studentId of layerStudents) {
    const studentPlan = studentPreferences[studentId];
    if (!studentPlan || studentPlan.length === 0) continue;

    // 计算匹配度得分 = (同programme志愿数 / 总志愿数) × 70
    const sameProgrammeCount = studentPlan.filter(
      plan => projectInfo[plan.proposal_id]?.programme_id === projectData.programme_id
    ).length;
    const matchScore = (sameProgrammeCount / studentPlan.length) * 70;

    // 计算志愿专注度加分：仅将该项目作为1-2优先级的唯一志愿加30分
    let focusBonus = 0;
    const highPriorityPlans = studentPlan.filter(plan => plan.priority <= 2);
    if (highPriorityPlans.length === 1 && highPriorityPlans[0].proposal_id == projectId) {
      focusBonus = 30;
    }

    const totalScore = matchScore + focusBonus;
    studentScores.push({
      student_id: studentId,
      score: totalScore,
      focusBonus: focusBonus // 用于并列时排序
    });
  }

  // 排序：总分降序 → 专注度加分降序 → 随机
  studentScores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.focusBonus !== a.focusBonus) return b.focusBonus - a.focusBonus;
    return Math.random() - 0.5; // 随机排序
  });

  // 录取前N名
  const topStudents = studentScores.slice(0, remainingCapacity);
  topStudents.forEach(item => {
    finalAllocation[item.student_id] = {
      proposal_id: projectId,
      priority: priority,
      allocation_type: '分层录取'
    };
    admittedStudents.push(item.student_id);
  });

  return admittedStudents;
};

/**
 * 补位录取（步骤3核心函数）
 * @param {Object} connection - 数据库连接
 * @param {Object} projectInfo - 项目信息
 * @param {Object} studentPreferences - 学生志愿
 * @param {Object} finalAllocation - 最终分配结果
 * @param {number} semester_id - 学期ID
 */
const fillUnfilledProjects = async (
  connection,
  projectInfo,
  studentPreferences,
  finalAllocation,
  semester_id
) => {
  // 3.1 筛选待补位对象
  const unfilledProjects = Object.entries(projectInfo)
    .filter(([_, data]) => data.remaining_capacity > 0)
    .map(([id, _]) => id);

  const unallocatedStudents = Object.keys(finalAllocation)
    .filter(studentId => !finalAllocation[studentId].proposal_id);

  // 包含已分配但priority≥4的学生
  const lowPriorityAllocatedStudents = Object.keys(finalAllocation)
    .filter(studentId =>
      finalAllocation[studentId].proposal_id &&
      finalAllocation[studentId].priority >= 4
    );

  const toFillStudents = [...unallocatedStudents, ...lowPriorityAllocatedStudents];
  if (toFillStudents.length === 0 || unfilledProjects.length === 0) return;

  // 3.2 对每个未录满项目进行补位
  for (const projectId of unfilledProjects) {
    const projectData = projectInfo[projectId];
    if (projectData.remaining_capacity <= 0) continue;

    // 筛选志愿包含该项目的待补位学生
    const eligibleStudents = toFillStudents.filter(studentId => {
      return studentPreferences[studentId]?.some(plan => plan.proposal_id == projectId);
    });

    if (eligibleStudents.length === 0) continue;

    // 计算补位得分
    const studentScores = [];
    for (const studentId of eligibleStudents) {
      const studentPlan = studentPreferences[studentId];
      const projectPlan = studentPlan.find(plan => plan.proposal_id == projectId);
      if (!projectPlan) continue;

      // 偏好核心分 = (6 - priority) × 12
      const preferenceScore = (6 - projectPlan.priority) * 12;

      // 同programme匹配分 = (同programme志愿数 / 总志愿数) × 20
      const sameProgrammeCount = studentPlan.filter(
        plan => projectInfo[plan.proposal_id]?.programme_id === projectData.programme_id
      ).length;
      const programmeMatchScore = (sameProgrammeCount / studentPlan.length) * 20;

      // 项目空位调节分 = (remaining_capacity / total_capacity) × 20
      const vacancyAdjustScore = (projectData.remaining_capacity / projectData.total_capacity) * 20;

      const totalScore = preferenceScore + programmeMatchScore + vacancyAdjustScore;

      studentScores.push({
        student_id: studentId,
        score: totalScore,
        priority: projectPlan.priority,
        current_allocation: finalAllocation[studentId].proposal_id
      });
    }

    // 按得分降序排序，得分相同则按priority升序
    studentScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.priority - b.priority;
    });

    // 录取学生直到项目满员
    let filled = 0;
    for (const scoreItem of studentScores) {
      if (projectData.remaining_capacity <= 0) break;
      if (filled >= projectData.remaining_capacity) break;

      const studentId = scoreItem.student_id;
      // 更新分配结果
      finalAllocation[studentId] = {
        proposal_id: projectId,
        priority: scoreItem.priority,
        allocation_type: '补位录取'
      };

      // 从待补位列表中移除
      const index = toFillStudents.indexOf(studentId);
      if (index > -1) toFillStudents.splice(index, 1);

      projectData.remaining_capacity--;
      filled++;
    }
  }
};

/**
 * 最终兜底分配（步骤4核心函数）
 * @param {Object} connection - 数据库连接
 * @param {Object} projectInfo - 项目信息
 * @param {Object} studentPreferences - 学生志愿
 * @param {Object} finalAllocation - 最终分配结果
 */
const finalBackupAllocation = async (
  connection,
  projectInfo,
  studentPreferences,
  finalAllocation
) => {
  // 筛选仍未分配的学生
  const unallocatedStudents = Object.keys(finalAllocation)
    .filter(studentId => !finalAllocation[studentId].proposal_id);

  if (unallocatedStudents.length === 0) return;

  // 对每个未分配学生，分配至同programme+剩余容量最大的项目
  for (const studentId of unallocatedStudents) {
    const studentPlan = studentPreferences[studentId];
    if (!studentPlan || studentPlan.length === 0) continue;

    // 筛选学生志愿中的同programme项目（按剩余容量降序）
    const eligibleProjects = [];
    for (const plan of studentPlan) {
      const projectData = projectInfo[plan.proposal_id];
      if (projectData && projectData.remaining_capacity > 0) {
        eligibleProjects.push({
          proposal_id: plan.proposal_id,
          remaining_capacity: projectData.remaining_capacity,
          programme_id: projectData.programme_id,
          priority: plan.priority
        });
      }
    }

    if (eligibleProjects.length === 0) continue;

    // 按剩余容量降序排序
    eligibleProjects.sort((a, b) => b.remaining_capacity - a.remaining_capacity);
    const bestProject = eligibleProjects[0];

    // 分配至该项目
    finalAllocation[studentId] = {
      proposal_id: bestProject.proposal_id,
      priority: bestProject.priority,
      allocation_type: '兜底录取'
    };

    // 更新项目剩余容量
    projectInfo[bestProject.proposal_id].remaining_capacity--;
  }
};

/**
 * 生成分配统计报告
 * @param {Object} connection - 数据库连接
 * @param {Object} projectInfo - 项目信息
 * @param {Object} finalAllocation - 最终分配结果
 * @param {Object} studentPreferences - 学生志愿
 * @param {number} semester_id - 学期ID
 * @returns {Object} 统计报告
 */
const generateAllocationStats = async (
  connection,
  projectInfo,
  finalAllocation,
  studentPreferences,
  semester_id
) => {
  // 1. 项目满员率
  const totalProjects = Object.keys(projectInfo).length;
  const filledProjects = Object.entries(projectInfo).filter(
    ([_, data]) => data.remaining_capacity === 0
  ).length;
  const projectFillRate = totalProjects > 0 ? (filledProjects / totalProjects) * 100 : 0;

  // 2. 学生高偏好录取率（priority≤2）
  const totalAllocatedStudents = Object.keys(finalAllocation).filter(
    studentId => finalAllocation[studentId].proposal_id
  ).length;
  const highPreferenceStudents = Object.keys(finalAllocation).filter(
    studentId => {
      const allocation = finalAllocation[studentId];
      return allocation.proposal_id && allocation.priority <= 2;
    }
  ).length;
  const highPreferenceRate = totalAllocatedStudents > 0 ? (highPreferenceStudents / totalAllocatedStudents) * 100 : 0;

  // 3. 分配率
  const totalStudents = Object.keys(studentPreferences).length;
  const allocationRate = totalStudents > 0 ? (totalAllocatedStudents / totalStudents) * 100 : 0;

  // 4. 平均偏好分
  let totalPreferenceScore = 0;
  Object.keys(finalAllocation).forEach(studentId => {
    const allocation = finalAllocation[studentId];
    if (allocation.proposal_id) {
      totalPreferenceScore += allocation.priority;
    }
  });
  const averagePreferenceScore = totalAllocatedStudents > 0
    ? (totalPreferenceScore / totalAllocatedStudents).toFixed(2)
    : 0;

  // 5. 弃用项目数（容量为0或无学生选择的项目）
  const droppedProjects = Object.entries(projectInfo).filter(
    ([_, data]) => data.total_capacity === 0 ||
      !Object.keys(studentPreferences).some(studentId =>
        studentPreferences[studentId].some(plan => plan.proposal_id == _)
      )
  ).length;

  // 6. 各programme分配情况
  const [programmeStats] = await connection.execute(`
    SELECT p.programme_id, pr.name, COUNT(ar.student_id) as allocated_students
    FROM allocation_results ar
    JOIN proposals p ON ar.proposal_id = p.id
    JOIN programmes pr ON p.programme_id = pr.id
    WHERE ar.semester_id = ?
    GROUP BY p.programme_id, pr.name
  `, [semester_id]);

  return {
    allocation_rate: parseFloat(allocationRate.toFixed(2)),
    average_preference_score: parseFloat(averagePreferenceScore),
    dropped_projects: droppedProjects,
    project_fill_rate: parseFloat(projectFillRate.toFixed(2)),
    high_preference_rate: parseFloat(highPreferenceRate.toFixed(2)),
    programme_stats: programmeStats
  };
};

// 其他辅助接口（保持原有）
export const getAllocationStats = async (semester_id) => {
  const [rows] = await pool.execute(`
    SELECT 
      a.allocation_rate, 
      a.average_preference_score, 
      a.dropped_projects,
      a.project_fill_rate,
      a.high_preference_rate,
      a.is_active,
      -- 获取偏好分布
      JSON_ARRAY(
        (SELECT COUNT(*) FROM allocation_results WHERE priority=1 AND semester_id=?),
        (SELECT COUNT(*) FROM allocation_results WHERE priority=2 AND semester_id=?),
        (SELECT COUNT(*) FROM allocation_results WHERE priority=3 AND semester_id=?),
        (SELECT COUNT(*) FROM allocation_results WHERE priority=4 AND semester_id=?),
        (SELECT COUNT(*) FROM allocation_results WHERE priority=5 AND semester_id=?)
      ) AS preference_distribution,
      -- 获取分配结果列表
      (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'student_id', ar.student_id,
            'matric_no', COALESCE(s.matriculation_number, 'N/A'),
            'student_name', COALESCE(u.name, 'Unknown'),
            'project_id', ar.proposal_id,
            'project_title', COALESCE(p.title, p.title, 'Unnamed Project'),
            'priority', ar.priority,
            'allocation_type', ar.allocation_type
          )
        ) FROM allocation_results ar
        LEFT JOIN students s ON ar.student_id = s.user_id
        LEFT JOIN users u ON ar.student_id = u.id
        LEFT JOIN proposals p ON ar.proposal_id = p.id -- 新增关联
        WHERE ar.semester_id = a.semester_id) AS results
      FROM allocations a
      WHERE a.semester_id = ? AND a.is_active = 1
      LIMIT 1;
  `, [semester_id, semester_id, semester_id, semester_id, semester_id, semester_id]);

  console.log(rows[0])
  return rows[0] || null;
};

export const getAllocationHistory = async (semester_id) => {
  const [rows] = await pool.execute(`
    SELECT id, timestamp, allocation_rate, average_preference_score, 
           dropped_projects, project_fill_rate, high_preference_rate
    FROM allocations
    WHERE semester_id = ?
    ORDER BY timestamp DESC
  `, [semester_id]);
  return rows;
};

export const applyAllocation = async (allocationId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 标记当前活跃分配为非活跃
    await connection.execute(`
      UPDATE allocations SET is_active = 0 WHERE is_active = 1
    `);

    // 标记选中的分配为活跃
    await connection.execute(`
      UPDATE allocations SET is_active = 1 WHERE id = ?
    `, [allocationId]);

    await connection.commit();
    return { message: 'Allocation applied successfully' };
  } catch (err) {
    await connection.rollback();
    throwError(err.message || 'Failed to apply allocation', 500);
  } finally {
    connection.release();
  }
};

/**
 * 导出CSV数据
 * @param {number} semester_id - 学期ID
 * @returns {string} CSV格式数据
 */
export const exportAllocationCSV = async (semester_id) => {
  const [results] = await pool.execute(`
    SELECT s.studentId as matric_no, s.name as student_name, 
           p.proposal_title as project_title, ar.priority, 
           pr.name as programme_name, ar.allocation_type
    FROM allocation_results ar
    JOIN students s ON ar.student_id = s.id
    JOIN proposals p ON ar.proposal_id = p.id
    JOIN programmes pr ON ar.programme_id = pr.id
    WHERE ar.semester_id = ?
  `, [semester_id]);

  // 生成CSV头部
  const headers = ['Matric No', 'Student Name', 'Project Title', 'Priority', 'Programme', 'Allocation Type'];
  const csvRows = [headers.join(',')];

  // 生成数据行
  results.forEach(row => {
    const values = [
      `"${row.matric_no}"`,
      `"${row.student_name}"`,
      `"${row.project_title}"`,
      row.priority,
      `"${row.programme_name}"`,
      `"${row.allocation_type}"`
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};