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

    //     const updateFields = [];
    //     const queryParams = [];

    //     if (name !== undefined) {
    //         updateFields.push("name = ?");
    //         queryParams.push(name);
    //     }
    //     if (start_date !== undefined) {
    //         updateFields.push("start_date = ?");
    //         queryParams.push(start_date);
    //     }
    //     if (end_date !== undefined) {
    //         updateFields.push("end_date = ?");
    //         queryParams.push(end_date);
    //     }
    //     if (is_active !== undefined) {
    //         updateFields.push("is_active = ?");
    //         queryParams.push(is_active);
    //     }

    //     if (updateFields.length === 0) {
    //         const [currentSemester] = await connection.query(
    //             "SELECT * FROM semesters WHERE id = ?",
    //             [id]
    //         );
    //         return currentSemester[0] || null;
    //     }

    // const updateQuery = `
    //         UPDATE semesters 
    //         SET name = ?, academic_year = ?, min_cap = ?, max_cap = ?
    //         WHERE id = ?
    //     `;
    //     queryParams.push(id); // 最后添加 where 条件的 id

    //     await connection.query(updateQuery, queryParams);

    //     // 更新后查询最新数据并返回
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