import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

export const createFaculty = async (userData, facultyData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [userResult] = await connection.execute(
            'INSERT INTO users (name, email, role_id) VALUES (?, ?, 2)',
            userData
        );
        const userId = userResult.insertId;

        const [facultyResult] = await connection.execute(
            'INSERT INTO professors (user_id, is_course_coordinator) VALUES (?, ?)',
            [userId, facultyData]
        );
        await connection.commit();
        return { userId, facultyId: facultyResult.insertId };
    } catch (err) {
        await connection.rollback();
        console.log("service:", err)
        if (err?.errno === 1062) {
            console.log("here")
            throwError('Duplicate Email', 400, err);
        }
        throwError('Database error', 500, err);
    } finally {
        connection.release();
    }
};