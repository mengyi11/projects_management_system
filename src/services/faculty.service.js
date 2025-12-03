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


export const getFaculty = async () => {
    console.log("service: getFaculty")
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [facultyResult] = await connection.query(
            `SELECT 
                f.id AS id,
                u.name AS name,
                u.email AS email,
                r.role_name AS role,
                f.is_course_coordinator AS coordinator
            FROM users AS u
            INNER JOIN professors AS f
                ON f.user_id = u.id
            INNER JOIN roles AS r
                ON r.id = u.role_id;`
        );
        return facultyResult;
    } catch (err) {
        console.log("service:", err);
        throwError('Database error', 500, err);
    } finally {
        connection.release();
    }
};




export const createProposal = async (proposalData) => {
    console.log("---------proposalData---------")
    console.log(proposalData)
    const connection = await pool.getConnection();
    try {
        // await connection.beginTransaction();

        // 解构并校验必填字段
        const { title, description, professor_id, semester_id, programme_id, venue_id } = proposalData;
        if (!title || title.trim().length < 2) {
            throwError("Title must be at least 2 characters", 400);
        }
        if (!description || description.trim().length < 15) {
            throwError("Description must be at least 15 characters", 400);
        }
        if (!professor_id || isNaN(professor_id) || professor_id <= 0) {
            throwError("Invalid professor ID (must be a positive integer)", 400);
        }
        if (!semester_id || isNaN(semester_id) || semester_id <= 0) {
            throwError("Invalid semester ID (must be a positive integer)", 400);
        }
        if (!programme_id || isNaN(programme_id) || programme_id <= 0) {
            throwError("Invalid programme ID (must be a positive integer)", 400);
        }

        // 插入提案数据（status 默认为 pending）
        const [insertResult] = await connection.execute(
            `INSERT INTO proposals (
        title, description, professor_id, semester_id, venue_id, programme_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                title.trim(),
                description.trim(),
                Number(professor_id),
                Number(semester_id),
                venue_id ? Number(venue_id) : null, // venue_id 可选，允许为 null
                Number(programme_id),
                "pending" // 默认为待审核状态
            ]
        );

        // 查询创建后的完整提案信息（关联关联表字段，便于前端展示）
        const [proposal] = await connection.query(
            `SELECT 
        p.id, p.title, p.description, p.status, p.reason,
        p.created_at, p.updated_at,
        u.name AS professor_name,
        s.name AS semester_name,
        pr.name AS programme_name,
        v.name AS venue_name, v.location AS venue_location
       FROM proposals p
       LEFT JOIN users u ON p.professor_id = u.id
       LEFT JOIN semesters s ON p.semester_id = s.id
       LEFT JOIN programmes pr ON p.programme_id = pr.id
       LEFT JOIN venues v ON p.venue_id = v.id
       WHERE p.id = ?`,
            [insertResult.insertId]
        );

        await connection.commit();
        return proposal[0]; // 返回单个提案对象
    } catch (err) {
        await connection.rollback();
        console.error("service: createProposal error:", err);

        // 处理外键约束错误（关联的表记录不存在）
        if (err?.errno === 1452) {
            throwError("Invalid reference: One of (professor/semester/programme/venue) does not exist", 400, err);
        }
        throwError("Failed to create proposal", 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 获取所有提案（支持按状态筛选）
 * @param {Object} filters - 筛选条件（可选）
 * @returns {Array} 提案列表
 */
export const getProposals = async (filters = {}) => {
    const connection = await pool.getConnection();
    try {
        const { status, professor_id } = filters;
        let query = `
      SELECT 
        p.id, p.title, p.description, p.status, p.reason,
        p.created_at, p.updated_at,
        u.name AS professor_name, u.email AS professor_email,
        s.name AS semester_name,
        pr.name AS programme_name,
        v.name AS venue_name, v.location AS venue_location
      FROM proposals p
      LEFT JOIN users u ON p.professor_id = u.id
      LEFT JOIN semesters s ON p.semester_id = s.id
      LEFT JOIN programmes pr ON p.programme_id = pr.id
      LEFT JOIN venues v ON p.venue_id = v.id
    `;
        const queryParams = [];

        // 拼接筛选条件
        const whereClauses = [];
        if (status) {
            whereClauses.push("p.status = ?");
            queryParams.push(status);
        }
        if (professor_id) {
            whereClauses.push("p.professor_id = ?");
            queryParams.push(Number(professor_id));
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(" AND ")}`;
        }

        // 按创建时间降序排序（最新的在前）
        query += " ORDER BY p.created_at DESC";

        const [proposals] = await connection.query(query, queryParams);
        return proposals;
    } catch (err) {
        console.error("service: getProposals error:", err);
        throwError("Failed to fetch proposals", 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 根据 ID 获取单个提案详情
 * @param {number} proposalId - 提案 ID
 * @returns {Object} 提案详情
 */
export const getProposalById = async (proposalId) => {
    const connection = await pool.getConnection();
    try {
        // 校验提案 ID
        if (isNaN(proposalId) || proposalId <= 0) {
            throwError("Invalid proposal ID (must be a positive integer)", 400);
        }

        const [proposal] = await connection.query(
            `SELECT 
        p.id, p.title, p.description, p.status, p.reason,
        p.professor_id, p.semester_id, p.programme_id, p.venue_id,
        p.created_at, p.updated_at,
        u.name AS professor_name, u.email AS professor_email,
        s.name AS semester_name,
        pr.name AS programme_name,
        v.name AS venue_name, v.location AS venue_location
      FROM proposals p
      LEFT JOIN users u ON p.professor_id = u.id
      LEFT JOIN semesters s ON p.semester_id = s.id
      LEFT JOIN programmes pr ON p.programme_id = pr.id
      LEFT JOIN venues v ON p.venue_id = v.id
      WHERE p.id = ?`,
            [Number(proposalId)]
        );

        if (proposal.length === 0) {
            throwError("Proposal not found", 404);
        }

        return proposal[0];
    } catch (err) {
        console.error("service: getProposalById error:", err);
        throwError("Failed to fetch proposal details", 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 更新提案（支持更新基本信息或审核状态）
 * @param {number} proposalId - 提案 ID
 * @param {Object} updateData - 待更新数据
 * @returns {Object} 更新后的提案详情
 */
export const updateProposal = async (proposalId, updateData) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 校验提案 ID
        if (isNaN(proposalId) || proposalId <= 0) {
            throwError("Invalid proposal ID (must be a positive integer)", 400);
        }

        // 解构更新数据，筛选有效字段
        const { title, description, semester_id, programme_id, venue_id, status, reason } = updateData;
        const updateFields = [];
        const queryParams = [];

        // 基本信息更新（标题、描述、关联ID）
        if (title) {
            if (title.trim().length < 2) throwError("Title must be at least 2 characters", 400);
            updateFields.push("title = ?");
            queryParams.push(title.trim());
        }
        if (description) {
            if (description.trim().length < 15) throwError("Description must be at least 15 characters", 400);
            updateFields.push("description = ?");
            queryParams.push(description.trim());
        }
        if (semester_id !== undefined) {
            if (isNaN(semester_id) || semester_id <= 0) throwError("Invalid semester ID", 400);
            updateFields.push("semester_id = ?");
            queryParams.push(Number(semester_id));
        }
        if (programme_id !== undefined) {
            if (isNaN(programme_id) || programme_id <= 0) throwError("Invalid programme ID", 400);
            updateFields.push("programme_id = ?");
            queryParams.push(Number(programme_id));
        }
        if (venue_id !== undefined) {
            updateFields.push("venue_id = ?");
            queryParams.push(venue_id ? Number(venue_id) : null);
        }

        // 审核状态更新（status + reason）
        if (status) {
            const validStatus = ["pending", "approved", "rejected"];
            if (!validStatus.includes(status)) {
                throwError(`Invalid status: Must be one of ${validStatus.join(", ")}`, 400);
            }
            updateFields.push("status = ?");
            queryParams.push(status);

            // 拒绝时必须提供原因
            if (status === "rejected" && (!reason || reason.trim().length === 0)) {
                throwError("Reason is required when rejecting a proposal", 400);
            }
            if (reason) {
                updateFields.push("reason = ?");
                queryParams.push(reason.trim());
            }
        }

        // 校验是否有有效更新字段
        if (updateFields.length === 0) {
            throwError("No valid fields to update", 400);
        }

        // 执行更新
        queryParams.push(Number(proposalId)); // 最后拼接提案 ID（WHERE 条件）
        const [updateResult] = await connection.execute(
            `UPDATE proposals SET ${updateFields.join(", ")} WHERE id = ?`,
            queryParams
        );

        if (updateResult.affectedRows === 0) {
            throwError("Proposal not found or no changes made", 404);
        }

        // 查询更新后的提案详情
        const [updatedProposal] = await connection.query(
            `SELECT 
        p.id, p.title, p.description, p.status, p.reason,
        p.created_at, p.updated_at,
        u.name AS professor_name,
        s.name AS semester_name,
        pr.name AS programme_name,
        v.name AS venue_name, v.location AS venue_location
      FROM proposals p
      LEFT JOIN users u ON p.professor_id = u.id
      LEFT JOIN semesters s ON p.semester_id = s.id
      LEFT JOIN programmes pr ON p.programme_id = pr.id
      LEFT JOIN venues v ON p.venue_id = v.id
      WHERE p.id = ?`,
            [Number(proposalId)]
        );

        await connection.commit();
        return updatedProposal[0];
    } catch (err) {
        await connection.rollback();
        console.error("service: updateProposal error:", err);
        if (err?.errno === 1452) {
            throwError("Invalid reference: One of (semester/programme/venue) does not exist", 400, err);
        }
        throwError("Failed to update proposal", 500, err);
    } finally {
        connection.release();
    }
};

/**
 * 删除提案
 * @param {number} proposalId - 提案 ID
 * @returns {Object} 删除结果
 */
export const deleteProposal = async (proposalId) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 校验提案 ID
        if (isNaN(proposalId) || proposalId <= 0) {
            throwError("Invalid proposal ID (must be a positive integer)", 400);
        }

        // 先查询提案是否存在
        const [proposal] = await connection.query(
            "SELECT id FROM proposals WHERE id = ?",
            [Number(proposalId)]
        );
        if (proposal.length === 0) {
            throwError("Proposal not found", 404);
        }

        // 执行删除（若有子表关联，需先删除子表记录或添加 ON DELETE CASCADE）
        const [deleteResult] = await connection.execute(
            "DELETE FROM proposals WHERE id = ?",
            [Number(proposalId)]
        );

        if (deleteResult.affectedRows === 0) {
            throwError("Failed to delete proposal", 500);
        }

        await connection.commit();
        return {
            message: "Proposal deleted successfully",
            proposalId: Number(proposalId)
        };
    } catch (err) {
        await connection.rollback();
        console.error("service: deleteProposal error:", err);
        // 处理外键约束错误（提案被其他表关联）
        if (err?.errno === 1451) {
            throwError("Cannot delete proposal: It is associated with other records", 400, err);
        }
        throwError("Failed to delete proposal", 500, err);
    } finally {
        connection.release();
    }
};