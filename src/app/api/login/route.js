// src/app/api/login/route.js
import pool from "@/lib/db";
import { handleError } from "@/lib/errorHandler";

export const POST = async (req) => {
  try {
    const { email } = await req.json();

    // 关联role表，获取role_name（适配你的role表结构）
    const [users] = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.role_id,
        r.role_name  
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new Error("User not found", { cause: { statusCode: 404 } });
    }

    const user = users[0];

    return new Response(
      JSON.stringify({
        ok: true,
        statusCode: 200,
        message: "Login successful",
        data: user, // 返回字段：id/name/email/role_id/role_name
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleError(error);
  }
};