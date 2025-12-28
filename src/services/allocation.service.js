// services/allocation.service.js
import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

/**
 * 生成项目分配（重构后算法）
 * @param {number} semester_id - 学期ID
 * @returns {Object} 分配结果和统计报告
 */
export const generateAllocation = async (semester_id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`[分配开始] 学期ID: ${semester_id}`);

    // ===================== 步骤1：数据预处理 =====================
    console.log('开始数据预处理...');
    
    // 1.1 读取approved项目，构建project_info（包含剩余容量）
    const [approvedProjects] = await connection.execute(`
      SELECT p.id, p.programme_id, p.capacity, p.title 
      FROM proposals p 
      WHERE p.status = 'approved' AND p.semester_id = ?
    `, [semester_id]);
    
    const projectInfo = {};
    approvedProjects.forEach(project => {
      projectInfo[project.id] = {
        programme_id: project.programme_id,
        total_capacity: project.capacity || 0,
        remaining_capacity: project.capacity || 0,
        title: project.title || 'Unnamed Project'
      };
    });
    console.log(`[预处理] 已批准项目总数: ${Object.keys(projectInfo).length}`);
    console.log(`[预处理] 已批准项目详情:`, JSON.stringify(projectInfo, null, 2));

    // 1.2 读取学生志愿（按created_at排序），构建分层志愿结构
    const [studentPlans] = await connection.execute(`
      SELECT sp.student_id, sp.proposal_id, sp.priority, sp.created_at 
      FROM student_plans sp 
      WHERE EXISTS (
        SELECT 1 FROM proposals p 
        WHERE p.id = sp.proposal_id AND p.status = 'approved' AND p.semester_id = ?
      )
      ORDER BY sp.created_at ASC
    `, [semester_id]);
    
    // 构建分层志愿：按优先级1-5分组 + 学生志愿映射
    const priorityLayers = { 1: [], 2: [], 3: [], 4: [], 5: [] }; // 各优先级项目-学生映射
    const studentAllPlans = {}; // 学生所有志愿 {studentId: [{proposal_id, priority, programme_id}, ...]}
    const studentPreferenceLayers = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} }; // 各优先级：{projectId: [studentIds]}

    // 初始化学生志愿
    studentPlans.forEach(plan => {
      const projectId = plan.proposal_id;
      const studentId = plan.student_id;
      const priority = plan.priority;

      // 过滤非approved项目
      if (!projectInfo[projectId]) return;

      // 初始化学生所有志愿
      if (!studentAllPlans[studentId]) {
        studentAllPlans[studentId] = [];
      }
      studentAllPlans[studentId].push({
        proposal_id: projectId,
        priority: priority,
        programme_id: projectInfo[projectId].programme_id
      });

      // 构建优先级分层（项目-学生映射）
      if (!studentPreferenceLayers[priority][projectId]) {
        studentPreferenceLayers[priority][projectId] = [];
      }
      studentPreferenceLayers[priority][projectId].push(studentId);

      // 构建全局分层志愿（备用）
      priorityLayers[priority].push({
        student_id: studentId,
        proposal_id: projectId
      });
    });

    // 初始化分配结果
    const finalAllocation = {};
    Object.keys(studentAllPlans).forEach(studentId => {
      finalAllocation[studentId] = {
        proposal_id: null,
        priority: null,
        allocation_type: null,
        project_title: null
      };
    });
    
    console.log(`[预处理] 有志愿的学生总数: ${Object.keys(studentAllPlans).length}`);
    console.log(`[预处理] 各优先级志愿分布:`);
    for (let i = 1; i <= 5; i++) {
      const totalStudents = Object.values(studentPreferenceLayers[i] || {}).flat().length;
      console.log(`  优先级${i}: ${totalStudents}人次`);
    }
    console.log(`[预处理] 学生志愿详情:`, JSON.stringify(studentAllPlans, null, 2));

    // ===================== 步骤2：按优先级分层录取（核心逻辑） =====================
    console.log('开始分层录取...');
    let currentRemainingProjects = { ...projectInfo }; // 初始剩余项目（所有approved项目）
    const admissionSummary = { // 录取汇总统计
      priority1: 0,
      priority2: 0,
      priority3: 0,
      priority4: 0,
      priority5: 0,
      backup: 0
    };

    // 遍历优先级1-5
    for (let priority = 1; priority <= 5; priority++) {
      if (Object.keys(currentRemainingProjects).length === 0) break; // 无剩余项目则终止
      console.log(`\n[分层录取] 开始处理优先级${priority}录取...`);
      console.log(`[分层录取] 当前剩余项目数: ${Object.keys(currentRemainingProjects).length}`);

      const newRemainingProjects = { ...currentRemainingProjects }; // 本轮结束后剩余项目
      const layerProjectStudents = studentPreferenceLayers[priority] || {};
      let roundAdmissionCount = 0; // 本轮录取人数

      // 遍历本轮剩余项目
      for (const [projectId, projectData] of Object.entries(currentRemainingProjects)) {
        if (projectData.remaining_capacity <= 0) {
          delete newRemainingProjects[projectId];
          continue;
        }

        // 获取该项目当前优先级的学生列表（排除已录取学生）
        const layerStudents = (layerProjectStudents[projectId] || [])
          .filter(studentId => !finalAllocation[studentId].proposal_id);

        if (layerStudents.length === 0) continue;

        const remainingCapacity = projectData.remaining_capacity;
        let admittedStudents = [];

        // 情况1：学生数 ≤ 剩余容量 → 全部录取
        if (layerStudents.length <= remainingCapacity) {
          admittedStudents = [...layerStudents];
          console.log(`[分层录取] 优先级${priority} - 项目${projectId}(${projectData.title}): 申请人数${layerStudents.length} ≤ 剩余容量${remainingCapacity}，全部录取`);
        } 
        // 情况2：学生数 > 剩余容量 → 打分排序录取
        else {
          const studentScores = [];
          for (const studentId of layerStudents) {
            const studentPlans = studentAllPlans[studentId] || [];
            if (studentPlans.length === 0) continue;

            // 1. 匹配分（最多70分）：同专业志愿数占比 ×70
            const sameProgrammeCount = studentPlans.filter(
              plan => plan.programme_id === projectData.programme_id
            ).length;
            const matchScore = (sameProgrammeCount / studentPlans.length) * 70;

            // 2. 专注度加分（最多30分）：一二志愿仅填当前项目则加30分
            let focusBonus = 0;
            const highPriorityPlans = studentPlans.filter(plan => plan.priority <= 2);
            if (highPriorityPlans.length === 1 && highPriorityPlans[0].proposal_id == projectId) {
              focusBonus = 30;
            }

            // 总分 = 匹配分 + 专注度加分
            const totalScore = matchScore + focusBonus;
            studentScores.push({
              student_id: studentId,
              score: totalScore,
              focusBonus: focusBonus // 同分排序用
            });
          }

          // 排序：总分降序 → 专注度加分降序 → 随机
          studentScores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.focusBonus !== a.focusBonus) return b.focusBonus - a.focusBonus;
            return Math.random() - 0.5;
          });

          // 录取前N名
          admittedStudents = studentScores.slice(0, remainingCapacity).map(item => item.student_id);
          console.log(`[分层录取] 优先级${priority} - 项目${projectId}(${projectData.title}): 申请人数${layerStudents.length} > 剩余容量${remainingCapacity}，按分数录取前${remainingCapacity}人`);
          console.log(`[分层录取] 项目${projectId}学生打分详情:`, JSON.stringify(studentScores, null, 2));
        }

        // 更新分配结果和项目剩余容量
        admittedStudents.forEach(studentId => {
          finalAllocation[studentId] = {
            proposal_id: projectId,
            priority: priority,
            allocation_type: 'Stratified admission',
            project_title: projectData.title
          };
        });

        // 更新统计
        roundAdmissionCount += admittedStudents.length;
        admissionSummary[`priority${priority}`] += admittedStudents.length;

        // 更新项目剩余容量
        newRemainingProjects[projectId].remaining_capacity -= admittedStudents.length;
        if (newRemainingProjects[projectId].remaining_capacity <= 0) {
          delete newRemainingProjects[projectId]; // 满员则移出下轮剩余项目
          console.log(`[分层录取] 项目${projectId}已招满，剩余容量: 0`);
        } else {
          console.log(`[分层录取] 项目${projectId}录取${admittedStudents.length}人，剩余容量: ${newRemainingProjects[projectId].remaining_capacity}`);
        }
      }

      console.log(`[分层录取] 优先级${priority}录取完成，本轮共录取${roundAdmissionCount}人`);
      // 更新下一轮剩余项目
      currentRemainingProjects = { ...newRemainingProjects };
    }

    // ===================== 步骤3：兜底分配（未录取学生） =====================
    console.log('\n[兜底分配] 开始兜底分配...');
    // 筛选未录取学生
    const unallocatedStudents = Object.keys(finalAllocation)
      .filter(studentId => !finalAllocation[studentId].proposal_id);

    console.log(`[兜底分配] 未录取学生数: ${unallocatedStudents.length}`);
    console.log(`[兜底分配] 未录取学生列表:`, unallocatedStudents);

    if (unallocatedStudents.length > 0 && Object.keys(currentRemainingProjects).length > 0) {
      // 3.1 分析每个未录取学生的专业偏好（志愿中各专业的数量）
      const studentProgramPreference = {};
      unallocatedStudents.forEach(studentId => {
        const studentPlans = studentAllPlans[studentId] || [];
        const programCount = {};

        // 统计各专业志愿数量
        studentPlans.forEach(plan => {
          const programmeId = plan.programme_id;
          programCount[programmeId] = (programCount[programmeId] || 0) + 1;
        });

        // 按数量降序排序，数量相同则随机
        const sortedPrograms = Object.entries(programCount)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return Math.random() - 0.5;
          })
          .map(item => item[0]);

        studentProgramPreference[studentId] = sortedPrograms;
      });

      console.log(`[兜底分配] 学生专业偏好分析:`, JSON.stringify(studentProgramPreference, null, 2));

      // 3.2 分析剩余项目：按专业分组 + 统计各专业项目的剩余容量/人数
      const programRemainingProjects = {};
      Object.entries(currentRemainingProjects).forEach(([projectId, projectData]) => {
        const programmeId = projectData.programme_id;
        if (!programRemainingProjects[programmeId]) {
          programRemainingProjects[programmeId] = [];
        }
        programRemainingProjects[programmeId].push({
          project_id: projectId,
          remaining_capacity: projectData.remaining_capacity,
          title: projectData.title,
          total_capacity: projectData.total_capacity
        });
      });

      console.log(`[兜底分配] 剩余项目按专业分组:`, JSON.stringify(programRemainingProjects, null, 2));

      // 3.3 逐个分配未录取学生
      let backupAdmissionCount = 0;
      unallocatedStudents.forEach(studentId => {
        const preferredPrograms = studentProgramPreference[studentId] || [];
        let assignedProject = null;

        // 第一步：分配到偏好最多的专业中「人数最少（剩余容量最大）」的项目
        for (const programmeId of preferredPrograms) {
          const programProjects = programRemainingProjects[programmeId] || [];
          if (programProjects.length === 0) continue;

          // 按剩余容量降序排序（剩余容量大=人数少）
          programProjects.sort((a, b) => b.remaining_capacity - a.remaining_capacity);
          assignedProject = programProjects[0];
          break;
        }

        // 第二步：若无偏好专业的剩余项目，分配到剩余空位最多的项目
        if (!assignedProject) {
          const allRemainingProjects = Object.values(currentRemainingProjects)
            .sort((a, b) => b.remaining_capacity - a.remaining_capacity);
          if (allRemainingProjects.length > 0) {
            assignedProject = {
              project_id: allRemainingProjects[0].id,
              remaining_capacity: allRemainingProjects[0].remaining_capacity,
              title: allRemainingProjects[0].title
            };
            console.log(`[兜底分配] 学生${studentId}无偏好专业剩余项目，分配到剩余容量最大的项目${assignedProject.project_id}`);
          }
        }

        // 完成分配
        if (assignedProject) {
          finalAllocation[studentId] = {
            proposal_id: assignedProject.project_id,
            priority: 0, // 兜底分配标记
            allocation_type: '兜底录取',
            project_title: assignedProject.title
          };
          backupAdmissionCount++;
          admissionSummary.backup += 1;

          // 更新项目剩余容量
          currentRemainingProjects[assignedProject.project_id].remaining_capacity -= 1;
          if (currentRemainingProjects[assignedProject.project_id].remaining_capacity <= 0) {
            delete currentRemainingProjects[assignedProject.project_id];
          }

          console.log(`[兜底分配] 学生${studentId} → 项目${assignedProject.project_id}(${assignedProject.title})`);
        } else {
          console.log(`[兜底分配] 学生${studentId}无可用项目分配`);
        }
      });

      console.log(`[兜底分配] 完成，共录取${backupAdmissionCount}人`);
    } else if (unallocatedStudents.length > 0) {
      console.log(`[兜底分配] 无剩余项目，${unallocatedStudents.length}名学生无法分配`);
    } else {
      console.log(`[兜底分配] 所有学生已录取，无需兜底`);
    }

    // ===================== 步骤4：结果保存与统计 =====================
    console.log('\n[结果保存] 开始保存分配结果...');
    console.log(`[结果保存] 最终分配结果预览:`, JSON.stringify(Object.entries(finalAllocation).slice(0, 20), null, 2)); // 只打印前20条避免日志过长
    
    // 清空旧数据
    await connection.execute(`
      DELETE FROM allocation_results WHERE semester_id = ?
    `, [semester_id]);
    console.log(`[结果保存] 已清空学期${semester_id}旧分配数据`);

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
          semester_id,
          allocation.project_title
        ]);
      }
    });

    if (allocationValues.length > 0) {
      await connection.execute(`
        INSERT INTO allocation_results 
        (student_id, proposal_id, priority, programme_id, allocation_type, semester_id, project_title)
        VALUES ${allocationValues.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ')}
      `, allocationValues.flat());
      console.log(`[结果保存] 已保存${allocationValues.length}条分配记录`);
    } else {
      console.log(`[结果保存] 无分配记录需要保存`);
    }

    // 生成统计报告
    console.log('[统计报告] 开始生成分配统计报告...');
    const stats = await generateAllocationStats(
      connection,
      projectInfo,
      finalAllocation,
      studentAllPlans,
      semester_id
    );
    
    console.log('[统计报告] 完整统计数据:', JSON.stringify(stats, null, 2));
    console.log('[录取汇总] 各优先级录取人数:', JSON.stringify(admissionSummary, null, 2));

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
    
    const finalResult = {
      allocation_id: allocationRecord.insertId,
      stats: stats,
      total_allocated: allocationValues.length,
      unallocated_count: Object.keys(finalAllocation).filter(studentId => !finalAllocation[studentId].proposal_id).length,
      admission_summary: admissionSummary
    };
    
    console.log('[分配完成] 最终返回结果:', JSON.stringify(finalResult, null, 2));
    console.log(`[分配完成] 分配记录ID: ${allocationRecord.insertId}`);
    console.log(`[分配完成] 总录取人数: ${allocationValues.length}`);
    console.log(`[分配完成] 未分配人数: ${finalResult.unallocated_count}`);

    return finalResult;

  } catch (err) {
    await connection.rollback();
    console.error('[分配失败] 错误详情:', err);
    throwError(err.message || 'Failed to generate allocation', 500);
  } finally {
    connection.release();
    console.log('[连接释放] 数据库连接已释放');
  }
};

// /**
//  * 生成分配统计报告
//  */
// const generateAllocationStats = async (
//   connection,
//   projectInfo,
//   finalAllocation,
//   studentAllPlans,
//   semester_id
// ) => {
//   console.log('[统计生成] 开始计算分配统计指标...');
  
//   // 1. 项目满员率
//   const totalProjects = Object.keys(projectInfo).length;
//   const filledProjects = Object.entries(projectInfo).filter(
//     ([_, data]) => data.remaining_capacity === 0
//   ).length;
//   const projectFillRate = totalProjects > 0 ? (filledProjects / totalProjects) * 100 : 0;
//   console.log(`[统计生成] 项目统计 - 总数:${totalProjects}, 满员数:${filledProjects}, 满员率:${projectFillRate.toFixed(2)}%`);

//   // 2. 学生高偏好录取率（priority≤2）
//   const totalAllocatedStudents = Object.keys(finalAllocation).filter(
//     studentId => finalAllocation[studentId].proposal_id
//   ).length;
//   const highPreferenceStudents = Object.keys(finalAllocation).filter(
//     studentId => {
//       const allocation = finalAllocation[studentId];
//       return allocation.proposal_id && allocation.priority <= 2;
//     }
//   ).length;
//   const highPreferenceRate = totalAllocatedStudents > 0 ? (highPreferenceStudents / totalAllocatedStudents) * 100 : 0;
//   console.log(`[统计生成] 高偏好录取 - 总录取:${totalAllocatedStudents}, 高偏好录取:${highPreferenceStudents}, 占比:${highPreferenceRate.toFixed(2)}%`);

//   // 3. 分配率
//   const totalStudents = Object.keys(studentAllPlans).length;
//   const allocationRate = totalStudents > 0 ? (totalAllocatedStudents / totalStudents) * 100 : 0;
//   console.log(`[统计生成] 整体分配率 - 总学生数:${totalStudents}, 已分配:${totalAllocatedStudents}, 分配率:${allocationRate.toFixed(2)}%`);

//   // 4. 平均偏好分
//   let totalPreferenceScore = 0;
//   Object.keys(finalAllocation).forEach(studentId => {
//     const allocation = finalAllocation[studentId];
//     if (allocation.proposal_id && allocation.priority > 0) {
//       totalPreferenceScore += allocation.priority;
//     }
//   });
//   const averagePreferenceScore = totalAllocatedStudents > 0 
//     ? (totalPreferenceScore / totalAllocatedStudents).toFixed(2) 
//     : 0;
//   console.log(`[统计生成] 平均偏好分 - 总偏好分:${totalPreferenceScore}, 平均分:${averagePreferenceScore}`);

//   // 5. 弃用项目数（容量为0或无学生选择的项目）
//   const droppedProjects = Object.entries(projectInfo).filter(
//     ([_, data]) => data.total_capacity === 0 || 
//       !Object.keys(studentAllPlans).some(studentId => 
//         studentAllPlans[studentId].some(plan => plan.proposal_id == _)
//       )
//   ).length;
//   console.log(`[统计生成] 弃用项目数: ${droppedProjects}`);

//   // 6. 各programme分配情况
//   const [programmeStats] = await connection.execute(`
//     SELECT p.programme_id, pr.name, COUNT(ar.student_id) as allocated_students
//     FROM allocation_results ar
//     JOIN proposals p ON ar.proposal_id = p.id
//     JOIN programmes pr ON p.programme_id = pr.id
//     WHERE ar.semester_id = ?
//     GROUP BY p.programme_id, pr.name
//   `, [semester_id]);
  
//   console.log(`[统计生成] 各专业分配统计:`, JSON.stringify(programmeStats, null, 2));

//   // 7. 各优先级录取分布
//   const preferenceDistribution = [0, 0, 0, 0, 0];
//   Object.keys(finalAllocation).forEach(studentId => {
//     const allocation = finalAllocation[studentId];
//     if (allocation.proposal_id && allocation.priority >= 1 && allocation.priority <= 5) {
//       preferenceDistribution[allocation.priority - 1]++;
//     }
//   });
//   console.log(`[统计生成] 各优先级录取分布 - 优先级1:${preferenceDistribution[0]}, 优先级2:${preferenceDistribution[1]}, 优先级3:${preferenceDistribution[2]}, 优先级4:${preferenceDistribution[3]}, 优先级5:${preferenceDistribution[4]}`);

//   const stats = {
//     allocation_rate: parseFloat(allocationRate.toFixed(2)),
//     average_preference_score: parseFloat(averagePreferenceScore),
//     dropped_projects: droppedProjects,
//     project_fill_rate: parseFloat(projectFillRate.toFixed(2)),
//     high_preference_rate: parseFloat(highPreferenceRate.toFixed(2)),
//     programme_stats: programmeStats,
//     preference_distribution: preferenceDistribution,
//     total_allocated_students: totalAllocatedStudents,
//     total_students: totalStudents,
//     total_projects: totalProjects,
//     filled_projects: filledProjects
//   };

//   return stats;
// };

// // 其他辅助接口（保持不变，添加日志）
// export const getAllocationStats = async (semester_id) => {
//   console.log(`[查询统计] 获取学期${semester_id}的分配统计`);
  
//   const [rows] = await pool.execute(`
//     SELECT 
//       a.allocation_rate, 
//       a.average_preference_score, 
//       a.dropped_projects,
//       a.project_fill_rate,
//       a.high_preference_rate,
//       a.is_active,
//       JSON_ARRAY(
//         (SELECT COUNT(*) FROM allocation_results WHERE priority=1 AND semester_id = a.semester_id),
//         (SELECT COUNT(*) FROM allocation_results WHERE priority=2 AND semester_id = a.semester_id),
//         (SELECT COUNT(*) FROM allocation_results WHERE priority=3 AND semester_id = a.semester_id),
//         (SELECT COUNT(*) FROM allocation_results WHERE priority=4 AND semester_id = a.semester_id),
//         (SELECT COUNT(*) FROM allocation_results WHERE priority=5 AND semester_id = a.semester_id)
//       ) AS preference_distribution,
//       (SELECT JSON_ARRAYAGG(
//         JSON_OBJECT(
//           'student_id', ar.student_id,
//           'matric_no', COALESCE(s.matriculation_number, 'N/A'),
//           'student_name', COALESCE(u.name, 'Unknown'),
//           'project_id', ar.proposal_id,
//           'project_title', ar.project_title,
//           'priority', ar.priority,
//           'allocation_type', ar.allocation_type
//         )
//       ) FROM allocation_results ar
//       LEFT JOIN students s ON ar.student_id = s.user_id
//       LEFT JOIN users u ON ar.student_id = u.id
//       WHERE ar.semester_id = a.semester_id) AS results
//     FROM allocations a
//     WHERE a.semester_id = ? AND a.is_active = 1
//     LIMIT 1;
//   `, [semester_id, semester_id]);

//   console.log(`[查询统计] 学期${semester_id}统计结果:`, JSON.stringify(rows[0] || null, null, 2));
//   return rows[0] || null;
// };

// export const getAllocationHistory = async (semester_id) => {
//   console.log(`[查询历史] 获取学期${semester_id}的分配历史`);
  
//   const [rows] = await pool.execute(`
//     SELECT id, timestamp, allocation_rate, average_preference_score, 
//            dropped_projects, project_fill_rate, high_preference_rate
//     FROM allocations
//     WHERE semester_id = ?
//     ORDER BY timestamp DESC
//   `, [semester_id]);
  
//   console.log(`[查询历史] 学期${semester_id}历史记录数: ${rows.length}`);
//   console.log(`[查询历史] 历史记录详情:`, JSON.stringify(rows, null, 2));
//   return rows;
// };

// export const applyAllocation = async (allocationId) => {
//   console.log(`[应用分配] 激活分配记录ID: ${allocationId}`);
  
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
    
//     // 先禁用所有活跃记录
//     const [deactivateResult] = await connection.execute(`UPDATE allocations SET is_active = 0 WHERE is_active = 1`);
//     console.log(`[应用分配] 禁用原有活跃记录: ${deactivateResult.affectedRows}条`);
    
//     // 激活指定记录
//     const [activateResult] = await connection.execute(`UPDATE allocations SET is_active = 1 WHERE id = ?`, [allocationId]);
//     console.log(`[应用分配] 激活记录ID${allocationId}: ${activateResult.affectedRows}条`);
    
//     await connection.commit();
    
//     const result = { message: 'Allocation applied successfully' };
//     console.log(`[应用分配] 操作成功:`, result);
//     return result;
    
//   } catch (err) {
//     await connection.rollback();
//     console.error('[应用分配] 失败:', err);
//     throwError(err.message || 'Failed to apply allocation', 500);
//   } finally {
//     connection.release();
//   }
// };

// export const exportAllocationCSV = async (semester_id) => {
//   console.log(`[导出CSV] 开始导出学期${semester_id}的分配结果`);
  
//   const [results] = await pool.execute(`
//     SELECT s.matriculation_number as matric_no, u.name as student_name, 
//            ar.project_title, ar.priority, pr.name as programme_name, ar.allocation_type
//     FROM allocation_results ar
//     LEFT JOIN students s ON ar.student_id = s.user_id
//     LEFT JOIN users u ON ar.student_id = u.id
//     LEFT JOIN programmes pr ON ar.programme_id = pr.id
//     WHERE ar.semester_id = ?
//   `, [semester_id]);

//   console.log(`[导出CSV] 查询到${results.length}条记录`);
  
//   const headers = ['Matric No', 'Student Name', 'Project Title', 'Priority', 'Programme', 'Allocation Type'];
//   const csvRows = [headers.join(',')];

//   results.forEach((row, index) => {
//     const values = [
//       `"${row.matric_no || ''}"`,
//       `"${row.student_name || ''}"`,
//       `"${row.project_title || ''}"`,
//       row.priority,
//       `"${row.programme_name || ''}"`,
//       `"${row.allocation_type || ''}"`
//     ];
//     csvRows.push(values.join(','));
    
//     // 打印前10条预览
//     if (index < 10) {
//       console.log(`[导出CSV] 预览行${index+1}:`, values.join(','));
//     }
//   });

//   const csvContent = csvRows.join('\n');
//   console.log(`[导出CSV] 生成CSV完成，总行数: ${csvRows.length}`);
//   return csvContent;
// };




//-----------------------------------------------------------------
/**
 * 生成分配统计报告
 * @param {Object} connection - 数据库连接
 * @param {Object} projectInfo - 项目信息
 * @param {Object} finalAllocation - 最终分配结果
 * @param {Object} studentPreferences - 学生志愿
 * @param {number} semester_id - 学期ID
 * @returns {Object} 统计报告
 */
export const generateAllocationStats = async (
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




//-----------------------------------------------------------------
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