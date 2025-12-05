import { NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";
import {
  verifyFacultyUser,
  getProfessorIdByUserId,
  getMyProposalsList,
  formatProposalsList
} from "@/services/faculty.service";

// 接收前端POST请求（传入user_id）
export const POST = async (req) => {
  try {
    // 1. 解析前端请求体中的user_id
    const { user } = await req.json();
    // if (!user_id || isNaN(user_id)) {
    //   throw new Error("Bad Request: user_id is required and must be a number", { cause: { statusCode: 400 } });
    // }

    // 2. 调用服务层：验证用户是否为教师
    // const user = await verifyFacultyUser(user_id);

    // 3. 调用服务层：获取该用户对应的教授ID
    // const professorId = await getProfessorIdByUserId(user.id);

    // 4. 调用服务层：查询该教授的提案列表

    console.log(user.id)
    const rawProposals = await getMyProposalsList(user.id);

    console.log(rawProposals)

    // 5. 调用服务层：格式化提案数据（适配前端）
    const formattedProposals = formatProposalsList(rawProposals, user);

    // 6. 返回成功响应
    return NextResponse.json({
      ok: true,
      data: formattedProposals
    });
  } catch (error) {
    // 统一错误处理（由errorHandler返回标准化响应）
    return handleError(error);
  }
};