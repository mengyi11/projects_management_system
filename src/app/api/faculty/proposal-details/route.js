import { NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import {
  verifyFacultyUser,
  getProfessorIdByUserId,
  getProposalDetails
} from "@/services/faculty.service";

// 接收前端POST请求（传入proposal_id和user_id）
export const POST = async (req) => {
  try {
    console.log("------in00000=")
    // 1. 解析前端请求体参数
    const { proposal_id, user_id } = await req.json();
    // if (!proposal_id || !user_id || isNaN(proposal_id) || isNaN(user_id)) {
    //   throw new Error("Bad Request: proposal_id and user_id are required", { cause: { statusCode: 400 } });
    // }

    // // 2. 调用服务层：验证用户是否为教师
    // // await verifyFacultyUser(user_id);

    // 3. 调用服务层：获取该用户对应的教授ID
    // const professorId = await getProfessorIdByUserId(user_id);

    // 4. 调用服务层：查询提案详情（带权限校验）
    const proposalDetails = await getProposalDetails(proposal_id, user_id);

    // 5. 返回成功响应
    return NextResponse.json({
      ok: true,
      data: proposalDetails
    });
  } catch (error) {
    // 统一错误处理
    return handleError(error);
  }
};