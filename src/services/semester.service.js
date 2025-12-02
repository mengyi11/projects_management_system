import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

export const getSemester = async () => {
    console.log("service: getSemester")
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [activeSem] = await connection.query(
            `SELECT * FROM semesters WHERE active = 'active' `
        );

        const [inactiveSem] = await connection.query(
            `SELECT * FROM semesters WHERE active = 'inactive'`
        );
        return [activeSem, inactiveSem];
    } catch (err) {
        console.log("service:", err);
        throwError('Database error', 500, err);
    } finally {
        connection.release();
    }
};

export const getSemesterById = async (id) => {
    console.log("service: getSemesterById");
    console.log("id:", id);
    const connection = await pool.getConnection();
    try {
        const [semester] = await connection.query(
            "SELECT * FROM semesters WHERE id = ?",
            [id]
        );
        console.log("fetched semester:", semester);
        return semester[0] || null;
    } catch (err) {
        console.log("service error: ", err);
        throwError("Failed to fetch semester", 500, err);
    } finally {
        connection.release();
    }
};


export const createSemester = async (semesterData) => {
    console.log("service: createSemester");
    const connection = await pool.getConnection();
    try {
        const {
            semName,
            academicYear,
            active = 'inactive', // 默认设为非活跃
            minCapacity,
            maxCapacity,
        } = semesterData;

        console.log("semName:", semName);
        console.log("academic_year:", academicYear);
        console.log("active:", active);
        console.log("minCapacity:", minCapacity);
        console.log("maxCapacity:", maxCapacity);

        // 执行插入操作
        const [result] = await connection.execute(
            `INSERT INTO semesters 
             (name, academic_year, active, min_cap, max_cap) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                semName,
                academicYear,
                active,
                minCapacity,
                maxCapacity,
            ]
        );

        await connection.commit(); // 提交事务

        return result; // 返回新创建的学期对象
    } catch (err) {
        if (err?.errno === 1062) {
            throwError('Duplicate Semester Name for the Academic Year', 400, err);
        }
        console.log("service: createSemester error", err);
        throwError('Failed to create semester', 500, err);
    } finally {
        connection.release(); // 释放数据库连接
    }
};


export const updateSemester = async (updateData) => {
    console.log("service: updateSemester");
    console.log("update data:", updateData);

    const connection = await pool.getConnection();
    try {
        const { id, semName, minCapacity, maxCapacity, academicYear, ...otherFields } = updateData;

        const updatedSemester = await connection.query(
            `
            UPDATE semesters 
            SET name = ?, academic_year = ?, min_cap = ?, max_cap = ?
            WHERE id = ?
        `,
            [semName, academicYear, minCapacity, maxCapacity, id]
        );

        await connection.commit(); // 提交事务

        return updatedSemester[0] || null;
    } catch (err) {
        console.log("service error: ", err);
        throwError("Failed to update semester", 500, err);
    } finally {
        connection.release();
    }
};

//TimeLine functions
// 1. 查询指定 semester_id 的时间线
export const getSemesterTimeline = async (semesterId) => {
    console.log("service: getSemesterTimeline for semester_id:", semesterId);
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM semester_timelines WHERE semester_id = ?',
            [semesterId]
        );
        // 返回查询结果（若存在则为数组第一项，否则为 null）
        console.log("fetched timeline:", rows);
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        console.log("service: getSemesterTimeline error", err);
        throwError('Failed to get semester timeline', 500, err);
    } finally {
        connection.release();
    }
};

// 2. 创建新的时间线（仅当不存在时调用）
export const createSemesterTimeline = async (timelineData) => {
    console.log("service: createSemesterTimeline");
    const connection = await pool.getConnection();
    try {
        const {
            semester_id,
            sem_start_date,
            sem_end_date,
            faculty_proposal_submission_start,
            faculty_proposal_submission_end,
            faculty_proposal_review_start,
            faculty_proposal_review_end,
            student_registration_start,
            student_registration_end,
            faculty_rank_entry_start,
            faculty_rank_entry_end,
            student_peer_review_start,
            student_peer_review_end
        } = timelineData;

        const [result] = await connection.execute(
            `INSERT INTO semester_timelines 
             (semester_id, sem_start_date, sem_end_date, faculty_proposal_submission_start, faculty_proposal_submission_end, 
              faculty_proposal_review_start, faculty_proposal_review_end, student_registration_start, student_registration_end, 
              faculty_rank_entry_start, faculty_rank_entry_end, student_peer_review_start, student_peer_review_end) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                semester_id,
                sem_start_date,
                sem_end_date,
                faculty_proposal_submission_start,
                faculty_proposal_submission_end,
                faculty_proposal_review_start,
                faculty_proposal_review_end,
                student_registration_start,
                student_registration_end,
                faculty_rank_entry_start,
                faculty_rank_entry_end,
                student_peer_review_start,
                student_peer_review_end
            ]
        );

        await connection.commit();
        return { ...result, isNew: true }; // 标记为新创建
    } catch (err) {
        console.log("service: createSemesterTimeline error", err);
        throwError('Failed to create semester timeline', 500, err);
    } finally {
        connection.release();
    }
};

// 3. 更新现有时间线（仅当存在时调用）
export const updateSemesterTimeline = async (timelineData) => {
    console.log("service: updateSemesterTimeline");
    const connection = await pool.getConnection();
    try {
        const {
            semester_id,
            sem_start_date,
            sem_end_date,
            faculty_proposal_submission_start,
            faculty_proposal_submission_end,
            faculty_proposal_review_start,
            faculty_proposal_review_end,
            student_registration_start,
            student_registration_end,
            faculty_rank_entry_start,
            faculty_rank_entry_end,
            student_peer_review_start,
            student_peer_review_end
        } = timelineData;

        const [result] = await connection.execute(
            `UPDATE semester_timelines SET 
             sem_start_date = ?, 
             sem_end_date = ?, 
             faculty_proposal_submission_start = ?, 
             faculty_proposal_submission_end = ?, 
             faculty_proposal_review_start = ?, 
             faculty_proposal_review_end = ?, 
             student_registration_start = ?, 
             student_registration_end = ?, 
             faculty_rank_entry_start = ?, 
             faculty_rank_entry_end = ?, 
             student_peer_review_start = ?, 
             student_peer_review_end = ? 
             WHERE semester_id = ?`,
            [
                sem_start_date,
                sem_end_date,
                faculty_proposal_submission_start,
                faculty_proposal_submission_end,
                faculty_proposal_review_start,
                faculty_proposal_review_end,
                student_registration_start,
                student_registration_end,
                faculty_rank_entry_start,
                faculty_rank_entry_end,
                student_peer_review_start,
                student_peer_review_end,
                semester_id // WHERE 条件
            ]
        );

        await connection.commit();
        return { ...result, isNew: false }; // 标记为更新
    } catch (err) {
        console.log("service: updateSemesterTimeline error", err);
        throwError('Failed to update semester timeline', 500, err);
    } finally {
        connection.release();
    }
};




//getSemesterProgramme 
export const getSemesterProgramme = async (semesterId) => {
    console.log("service: getSemesterProgramme for semester_id:", semesterId);
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.execute(
            `SELECT 
                    p.id AS programme_id,
                    p.name AS name,
                    p.programme_code,
                    prof.id AS coordinator_professor_id,
                    u.name AS coordinator_professor_name,
                    u.email AS coordinator_professor_email
                    FROM programmes p
                    INNER JOIN professors prof 
                    ON p.coordinator_professor_id = prof.id
                    INNER JOIN users u 
                    ON prof.user_id = u.id
                    WHERE p.semester_id = ?
                    ORDER BY p.name ASC`,
            [semesterId]
        );
        // 返回查询结果（若存在则为数组第一项，否则为 null）
        console.log("fetched programme :", rows);
        return rows;
    } catch (err) {
        console.log("service: getSemesterTimeline error", err);
        throwError('Failed to get semester timeline', 500, err);
    } finally {
        connection.release();
    }
};

export const createSemesterProgramme = async (programme) => {
    // console.log("service: createSemesterTimeline");
    console.log("programme data:", programme);
    const connection = await pool.getConnection();
    try {
        const {
            name,
            programme_code,
            coordinator_professor_id,
            semester_id
        } = programme;

        const [result] = await connection.execute(
            `INSERT INTO programmes (name, semester_id, coordinator_professor_id, programme_code) VALUES (?, ?, ?, ?)`,
            [
                name,
                semester_id,
                coordinator_professor_id,
                programme_code,
            ]
        );

        await connection.commit();
        return result; // 标记为新创建
    } catch (err) {
        console.log("service: createSemesterTimeline error", err);
        throwError('Failed to create semester timeline', 500, err);
    } finally {
        connection.release();
    }
};

export const updateProgrammeCoordinator = async (programmeId, coordinatorProfessorId) => {
  console.log("service: updateProgrammeCoordinator - programmeId:", programmeId, "professorId:", coordinatorProfessorId);
  const connection = await pool.getConnection();
  
  try {
    // 1. 验证参数有效性
    if (!programmeId || isNaN(programmeId)) {
      throwError('Invalid programme ID (must be a number)', 400);
    }
    if (!coordinatorProfessorId || isNaN(coordinatorProfessorId)) {
      throwError('Invalid coordinator professor ID (must be a number)', 400);
    }

    // 2. 检查项目是否存在（关联当前学期，确保数据安全性）
    const [programmeExists] = await connection.execute(
      `SELECT id FROM programmes WHERE id = ?`, // programmes 表主键为 id（与 getSemesterProgramme 一致）
      [programmeId]
    );
    if (programmeExists.length === 0) {
      throwError(`Programme with ID ${programmeId} not found`, 404);
    }

    // 3. 检查教授是否存在（关联 professors 表，与 getSemesterProgramme 表关联逻辑一致）
    const [professorExists] = await connection.execute(
      `SELECT id FROM professors WHERE id = ?`,
      [coordinatorProfessorId]
    );
    if (professorExists.length === 0) {
      throwError(`Professor with ID ${coordinatorProfessorId} not found`, 404);
    }

    // 4. 执行更新操作（更新 programmes 表的 coordinator_professor_id 字段）
    const [updateResult] = await connection.execute(
      `UPDATE programmes 
       SET coordinator_professor_id = ? 
       WHERE id = ?`,
      [coordinatorProfessorId, programmeId]
    );

    // 5. 验证更新结果（确保有数据被修改）
    if (updateResult.affectedRows === 0) {
      throwError('Failed to update coordinator (no changes made)', 500);
    }

    // 6. 返回更新结果（与现有接口数据格式一致）
    return {
      programme_id: programmeId,
      coordinator_professor_id: coordinatorProfessorId,
      affectedRows: updateResult.affectedRows,
      message: 'Coordinator updated successfully'
    };

  } catch (err) {
    console.log("service: updateProgrammeCoordinator error", err);
    // 若为自定义错误直接抛出，否则包装为系统错误
    if (err.statusCode) throw err;
    throwError('Failed to update programme coordinator', 500, err);
  } finally {
    connection.release(); // 确保连接释放
  }
};

export const deleteProgramme = async (semesterId, programmeId) => {
  console.log("service: deleteProgramme - semesterId:", semesterId, "programmeId:", programmeId);
  const connection = await pool.getConnection();
  
  try {
    // 1. 验证参数有效性
    if (!semesterId || isNaN(semesterId)) {
      throwError('Invalid semester ID (must be a number)', 400);
    }
    if (!programmeId || isNaN(programmeId)) {
      throwError('Invalid programme ID (must be a number)', 400);
    }

    // 2. 检查项目是否存在，且属于当前学期（避免删除其他学期的项目）
    const [programmeExists] = await connection.execute(
      `SELECT id FROM programmes WHERE id = ? AND semester_id = ?`,
      [programmeId, semesterId]
    );
    if (programmeExists.length === 0) {
      throwError(`Programme with ID ${programmeId} not found in semester ${semesterId}`, 404);
    }

    // 3. 执行删除操作（可根据实际需求添加事务，若有关联表需先删关联数据）
    const [deleteResult] = await connection.execute(
      `DELETE FROM programmes WHERE id = ? AND semester_id = ?`,
      [programmeId, semesterId]
    );

    // 4. 验证删除结果
    if (deleteResult.affectedRows === 0) {
      throwError('Failed to delete programme (no changes made)', 500);
    }

    // 5. 返回删除结果（与现有接口格式一致）
    return {
      programme_id: programmeId,
      semester_id: semesterId,
      affectedRows: deleteResult.affectedRows,
      message: 'Programme deleted successfully'
    };

  } catch (err) {
    console.log("service: deleteProgramme error", err);
    // 若为自定义错误直接抛出，否则包装为系统错误
    if (err.statusCode) throw err;
    throwError('Failed to delete programme', 500, err);
  } finally {
    connection.release(); // 确保连接释放
  }
};