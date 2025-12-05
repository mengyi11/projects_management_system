import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

// 获取所有可用项目
export const getAllProjects = async () => {
    const connection = await pool.getConnection();
    try {
        const [projects] = await connection.query(`
        SELECT 
            p.id AS id,
            p.title AS proposal_title,
            p.description AS proposal_desc,
            p.status AS proposal_status,
            p.capacity AS proposal_capacity,
            DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS proposal_created,
            DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS proposal_updated,
            u.name AS professor_name,
            u.email AS professor_email,
            s.name AS semester_name,
            s.active AS semester_active,
            s.max_cap AS semester_max_cap,
            v.name AS venue_name,
            v.location AS venue_location,
            v.capacity AS venue_capacity,
            pr.name AS programme_name,
            pr.programme_code AS programme_code
        FROM proposals p
        INNER JOIN professors prof ON p.professor_id = prof.user_id
        INNER JOIN users u ON prof.user_id = u.id
        LEFT JOIN semesters s ON p.semester_id = s.id
        LEFT JOIN venues v ON p.venue_id = v.id
        LEFT JOIN programmes pr ON p.programme_id = pr.id
        WHERE p.status = 'approved'
        AND s.active = 'active'
        ORDER BY p.updated_at DESC;
    `);
        return projects;
    } catch (err) {
        console.error('service: getAllProjects error:', err);
        throwError('Failed to fetch projects', 500);
    } finally {
        connection.release();
    }
};

export const addStudentPlans = async (studentId, projects) => {
    console.log('----------------------------------------------------')
    console.log(studentId, projects)
    console.log('----------------------------------------------------')
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. 先删除该学生所有已存在的规划记录（保证数据唯一性）
        await connection.execute(
            'DELETE FROM student_plans WHERE student_id = ?',
            [studentId]
        );

        // 2. 如果有选中的项目，批量插入新记录
        if (projects.length > 0) {
            // 构建批量插入的 SQL 和参数
            const insertSql = `
        INSERT INTO student_plans (student_id, proposal_id, priority)
        VALUES ${projects.map(() => '(?, ?, ?)').join(', ')}
      `;
            const insertParams = projects.flatMap(item => [
                studentId,
                item.proposalId,
                item.priority
            ]);

            await connection.execute(insertSql, insertParams);
        }

        await connection.commit();

        return {
            success: true,
            message: projects.length > 0
                ? 'Student plan saved successfully'
                : 'Student plan cleared successfully',
            data: { studentId, totalProjects: projects.length }
        };
    } catch (err) {
        await connection.rollback();
        console.error('service: addStudentPlans error:', err);

        // 自定义错误处理
        if (err?.code === 'ER_NO_REFERENCED_ROW_2') {
            throwError('Proposal ID does not exist in database', 400);
        }
        throwError(err?.message || 'Failed to save student plan', 500);
    } finally {
        connection.release();
    }
};


export const getStudentPlans = async (studentId) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT proposal_id as projectId, priority FROM student_plans WHERE student_id = ? ORDER BY priority ASC',
            [studentId]
        );
        return rows;
    } catch (err) {
        console.error('service: getStudentPlans error:', err);
        throwError('Failed to get student plan', 500);
    } finally {
        connection.release();
    }
};

// // 获取学生的规划/已注册项目
// export const getStudentProjects = async (studentId, status) => {
//     const connection = await pool.getConnection();
//     console.log("------------------")
//     console.log("status", status)
//     console.log("studentId", studentId)
//     try {
//         const [projects] = await connection.query(`
//       SELECT 
//         p.id, p.title, p.programme, p.supervisor_name,
//         spr.priority, spr.status
//       FROM student_project_registrations spr
//       INNER JOIN projects p ON spr.project_id = p.id
//       LEFT JOIN users u ON p.supervisor_id = u.id
//       WHERE spr.student_id = ? AND spr.status = ?
//       ORDER BY spr.priority ASC
//     `, [studentId, status]);
//     // console.log("projects")
//         return projects;
//     } catch (err) {
//         console.error('service: getStudentProjects error:', err);
//         throwError('Failed to fetch student projects', 500);
//     } finally {
//         connection.release();
//     }
// };


// // // 添加项目到规划/注册（核心修正）
// export const addStudentProject = async (studentId, projectId, status, priority) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // 1. 校验：Planned列表最多5个
//     if (status === 'planned') {
//       const [count] = await connection.query(
//         'SELECT COUNT(*) as total FROM student_project_registrations WHERE student_id = ? AND status = "planned"',
//         [studentId]
//       );
//       if (count[0].total >= 5) {
//         throwError('Cannot add more than 5 planned projects', 400);
//       }
//     }

//     // 2. 校验：项目是否存在且已批准（用proposals表，而非projects）
//     const [proposal] = await connection.query(
//       'SELECT id, venue_capacity as capacity FROM proposals WHERE id = ? AND status = "approved"',
//       [projectId]
//     );
//     if (proposal.length === 0) {
//       throwError('Project not found or not approved', 404);
//     }

//     // 3. 校验：Registered状态才检查容量（Planned不占用容量）
//     if (status === 'registered') {
//       const [registrations] = await connection.query(
//         'SELECT COUNT(*) as total FROM student_project_registrations WHERE project_id = ? AND status = "registered"',
//         [projectId]
//       );
//       if (registrations[0].total >= proposal[0].capacity) {
//         throwError('Project is already full', 400);
//       }
//     }

//     // 4. 插入/更新学生项目记录（Planned默认priority，Registered优先级为null）
//     const [result] = await connection.execute(
//       `INSERT INTO student_project_registrations 
//        (student_id, project_id, status, priority) 
//        VALUES (?, ?, ?, ?)
//        ON DUPLICATE KEY UPDATE status = ?, priority = ?`,
//       [
//         studentId, 
//         projectId, 
//         status, 
//         status === 'planned' ? priority : null, // Registered不需要优先级
//         status, 
//         status === 'planned' ? priority : null
//       ]
//     );

//     // 5. 仅Registered状态更新容量（Planned不更新）
//     if (status === 'registered') {
//       await connection.execute(
//         'UPDATE proposals SET current_registrations = current_registrations + 1 WHERE id = ?',
//         [projectId]
//       );
//     }

//     await connection.commit();
//     return { 
//       success: true, 
//       message: `Project added to ${status} successfully` 
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error('service: addStudentProject error:', err);
//     if (err?.errno === 1062) {
//       throwError('You have already added this project', 400);
//     }
//     throwError(err?.message || 'Failed to add project', 500);
//   } finally {
//     connection.release();
//   }
// };

// // 移除学生的规划/注册项目（核心修正）
// export const removeStudentProject = async (studentId, projectId, status) => {
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();

//     // 1. 删除学生项目记录
//     const [result] = await connection.execute(
//       'DELETE FROM student_project_registrations WHERE student_id = ? AND project_id = ? AND status = ?',
//       [studentId, projectId, status]
//     );

//     if (result.affectedRows === 0) {
//       throwError(`Project not found in your ${status} list`, 404);
//     }

//     // 2. 仅Registered状态回滚容量（Planned不影响容量）
//     if (status === 'registered') {
//       await connection.execute(
//         'UPDATE proposals SET current_registrations = current_registrations - 1 WHERE id = ?',
//         [projectId]
//       );
//     }

//     await connection.commit();
//     return { 
//       success: true, 
//       message: `Project removed from ${status} successfully` 
//     };
//   } catch (err) {
//     await connection.rollback();
//     console.error('service: removeStudentProject error:', err);
//     throwError('Failed to remove project', 500);
//   } finally {
//     connection.release();
//   }
// };