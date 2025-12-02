import pool from '@/lib/db';
import { throwError } from '@/lib/errorHandler';

/**
 * 获取指定学期的场地列表
 * @param {number} semesterId - 学期ID
 * @returns {Array} - 场地列表
 */
export const getVenuesBySemester = async (semesterId) => {
    console.log("service: getVenuesBySemester - semesterId:", semesterId);
    const connection = await pool.getConnection();

    try {
        // 查询关联指定学期的场地（通过 semester_venues 关联表）
        const [rows] = await connection.query(
            `SELECT 
                v.id, 
                v.name,  
                v.location,
                v.capacity,
                s.id AS semester_id,
                s.name AS semester_name,
                s.active AS semester_active
            FROM venues v
            INNER JOIN semesters s ON v.semester_id = s.id
            WHERE v.semester_id = ?
            ORDER BY v.name ASC`,
            [semesterId]
        );

        await connection.commit();

        return rows;

    } catch (err) {
        console.error("service: getVenuesBySemester error:", err);
        throwError('Failed to fetch venues', 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 创建单个场地并关联到指定学期
 * @param {Object} venueData - 场地信息
 * @returns {Object} - 创建结果
 */
export const createVenue = async (venueData) => {
    console.log("service: createVenue - data:", venueData);
    const { name, location, capacity, semester_id: semesterId } = venueData;
    const connection = await pool.getConnection();

    try {


        // 1. 创建场地（插入 venues 表）
        const [venueResult] = await connection.execute(
            `INSERT INTO venues (name, location, capacity, semester_id) 
       VALUES (?, ?, ?, ?)`,
            [name, location, capacity, semesterId]
        );
        const venueId = venueResult.insertId;

        // // 2. 关联到学期（插入 semester_venues 关联表）
        // await connection.execute(
        //   `INSERT INTO semester_venues (semester_id, venue_id) 
        //    VALUES (?, ?)`,
        //   [semesterId, venueId]
        // );

        // 提交事务
        await connection.commit();

        // 返回创建的场地信息
        return {
            id: venueId,
            name,
            location,
            capacity,
            semester_id: semesterId
        };
    } catch (err) {
        // 回滚事务
        await connection.rollback();
        console.error("service: createVenue error:", err);
        throwError('Failed to create venue', 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 更新场地信息
 * @param {number} venueId - 场地ID
 * @param {Object} updateData - 更新的字段
 * @returns {Object} - 更新结果
 */
export const updateVenue = async (venueId, updateData) => {
    console.log("service: updateVenue - id:", venueId, "data:", updateData);
    const connection = await pool.getConnection();

    try {
        // 1. 检查场地是否存在
        const [venueExists] = await connection.execute(
            `SELECT id FROM venues WHERE id = ?`,
            [venueId]
        );
        if (venueExists.length === 0) {
            throwError(`Venue with ID ${venueId} not found`, 404);
        }

        // 2. 构建更新SQL（动态拼接字段）
        const updateFields = Object.keys(updateData).filter(key => key !== 'semester_id');
        const semesterId = updateData.semester_id;

        if (updateFields.length > 0) {
            const setClause = updateFields.map(field => `${field} = ?`).join(', ');
            const values = updateFields.map(field => updateData[field]);

            await connection.execute(
                `UPDATE venues SET ${setClause} WHERE id = ?`,
                [...values, venueId]
            );
        }

        await connection.commit();

        // 返回更新后的场地信息
        return {
            id: venueId,
            ...updateData
        };

    } catch (err) {
        console.error("service: updateVenue error:", err);
        if (err.statusCode) throw err;
        throwError('Failed to update venue', 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 删除场地
 * @param {number} venueId - 场地ID
 * @returns {Object} - 删除结果
 */
export const deleteVenue = async (venueId) => {
    console.log("service: deleteVenue - id:", venueId);
    const connection = await pool.getConnection();

    try {

        // 2. 删除场地（从 venues 表）
        const [deleteResult] = await connection.execute(
            `DELETE FROM venues WHERE id = ?`,
            [venueId]
        );

        if (deleteResult.affectedRows === 0) {
            throwError(`Venue with ID ${venueId} not found`, 404);
        }

        return await connection.commit();

    } catch (err) {
        console.error("service: deleteVenue error:", err);
        if (err.statusCode) throw err;
        throwError('Failed to delete venue', 500, err);
    } finally {
        connection.release();
    }
};

// 导出 venueManager 服务（仅保留基础 CRUD 方法）
export const venueManager = {
    getVenuesBySemester,
    createVenue,
    updateVenue,
    deleteVenue
};