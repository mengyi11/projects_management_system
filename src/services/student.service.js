import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

// 创建学生（对应 createFaculty 模板）
export const createStudent = async (userData, studentData) => {
    const connection = await pool.getConnection();
    try {

        // 1. 先在 users 表创建学生用户（role_id=3 对应学生角色）
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, email, role_id) VALUES (?, ?, 3)',
            userData
        );
        const userId = userResult.insertId;

        console.log(studentData)
        // 2. 在 students 表创建学生记录（对应图中字段）
        const [studentResult] = await connection.execute(
            'INSERT INTO students (user_id, matriculation_number, semester_id) VALUES (?, ?, ?)',
            [userId, ...studentData]
        );
        await connection.commit();
        return { userId, studentId: studentResult.insertId };
    } catch (err) {
        await connection.rollback();
        console.log("service:", err)
        // 处理重复邮箱（users表唯一约束）
        if (err?.errno === 1062) {
            throwError('Duplicate Email', 400, err);
        }
        throwError('Database error', 500, err);

        await connection.commit();
    } finally {
        connection.release();
    }
};

// 获取所有学生（对应 getFaculty 模板）
export const getStudents = async () => {
    console.log("service: getStudents")
    const connection = await pool.getConnection();
    try {
        // 关联 users、students、roles 表获取完整信息
        const [studentResult] = await connection.query(
            `SELECT 
                s.id AS id,
                u.name AS name,
                u.email AS email,
                r.role_name AS role,
                s.matriculation_number AS matriculation_number,
                s.semester_id AS semester_id,
                s.project_id AS project_id,
                s.created_at AS created_at,
                s.updated_at AS updated_at,
                sem.name As sem_name
            FROM users AS u
            INNER JOIN students AS s
                ON s.user_id = u.id
            INNER JOIN roles AS r
                ON r.id = u.role_id
            INNER JOIN semesters AS sem
                ON sem.id = s.semester_id;
                ; `
                
        );
        return studentResult;
    } catch (err) {
        console.log("service:", err);
        throwError('Database error', 500, err);
    } finally {
        connection.release();
    }
};