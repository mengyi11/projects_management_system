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