import { NextResponse } from "next/server";
import { 
  createProposal, 
  getProposals, 
  getProposalById, 
  updateProposal, 
  deleteProposal 
} from "@/services/faculty.service";
import { handleError } from "@/lib/errorHandler";
// import { getUserInfo } from "@/lib/auth"; // 复用登录用户信息工具函数

// ------------------- POST: 创建提案 -------------------
export const POST = async (req) => {
  try {
    // // 1. 校验登录状态和角色（仅教师可创建）
    // const user = getUserInfo(req);
    // if (!user) {
    //   throw new Error("Unauthorized: Please login first", { cause: { statusCode: 401 } });
    // }
    // if (user.role_id !== 2) {
    //   throw new Error("Unauthorized: Only faculty can create proposals", { cause: { statusCode: 403 } });
    // }

    // 2. 解析请求体
    const proposalData = await req.json();

    console.log(proposalData)
    // 3. 调用服务层创建提案（强制使用登录用户的 professor_id，避免篡改）
    const result = await createProposal({
      ...proposalData
    });

    // 4. 返回成功响应（201 Created）
    return NextResponse.json(
      {
        ok: true,
        message: "Proposal created successfully",
        data: result
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
};

// ------------------- GET: 获取提案列表/详情 -------------------
export const GET = async (req) => {
  try {
    // // 1. 校验登录状态
    // const user = getUserInfo(req);
    // if (!user) {
    //   throw new Error("Unauthorized: Please login first", { cause: { statusCode: 401 } });
    // }

    // 2. 解析查询参数（支持筛选和单条查询）
    const url = new URL(req.url, `http://${req.headers.host}`);
    const proposalId = url.searchParams.get("id"); // 单条查询：?id=1
    const status = url.searchParams.get("status"); // 筛选状态：?status=pending
    // const professor_id = user.role_id === 2 ? user.id : undefined; // 教师仅能查看自己的提案

    // 3. 处理单条查询或列表查询
    let result;
    if (proposalId) {
      // 单条查询
      result = await getProposalById(Number(proposalId));
    } else {
      // 列表查询（支持筛选）
      result = await getProposals({
        status,
        // professor_id // 教师只能看自己的提案，管理员可看所有（需在 admin 路由单独实现）
      });
    }

    // 4. 返回响应
    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    return handleError(error);
  }
};

// ------------------- PUT: 更新提案 -------------------
export const PUT = async (req) => {
  try {
    // // 1. 校验登录状态
    // const user = getUserInfo(req);
    // if (!user) {
    //   throw new Error("Unauthorized: Please login first", { cause: { statusCode: 401 } });
    // }

    // 2. 解析提案 ID 和请求体
    const url = new URL(req.url, `http://${req.headers.host}`);
    const proposalId = url.searchParams.get("id");
    if (!proposalId) {
      throw new Error("Proposal ID is required (append ?id=1 to URL)", { cause: { statusCode: 400 } });
    }

    const updateData = await req.json();

    // 3. 权限校验：教师只能更新自己的提案，管理员可更新所有（需扩展角色判断）
    const proposal = await getProposalById(Number(proposalId));
    // if (user.role_id === 2 && proposal.professor_id !== user.id) {
    //   throw new Error("Unauthorized: You can only update your own proposals", { cause: { statusCode: 403 } });
    // }

    // 4. 调用服务层更新提案
    const result = await updateProposal(Number(proposalId), updateData);

    // 5. 返回响应
    return NextResponse.json({
      ok: true,
      message: "Proposal updated successfully",
      data: result
    });
  } catch (error) {
    return handleError(error);
  }
};

// ------------------- DELETE: 删除提案 -------------------
export const DELETE = async (req) => {
  try {
    // // 1. 校验登录状态
    // const user = getUserInfo(req);
    // if (!user) {
    //   throw new Error("Unauthorized: Please login first", { cause: { statusCode: 401 } });
    // }

    // 2. 解析提案 ID
    const url = new URL(req.url, `http://${req.headers.host}`);
    const proposalId = url.searchParams.get("id");
    if (!proposalId) {
      throw new Error("Proposal ID is required (append ?id=1 to URL)", { cause: { statusCode: 400 } });
    }

    // 3. 权限校验：教师只能删除自己的提案，管理员可删除所有
    const proposal = await getProposalById(Number(proposalId));
    // if (user.role_id === 2 && proposal.professor_id !== user.id) {
    //   throw new Error("Unauthorized: You can only delete your own proposals", { cause: { statusCode: 403 } });
    // }

    // 4. 调用服务层删除提案
    const result = await deleteProposal(Number(proposalId));

    // 5. 返回响应
    return NextResponse.json({
      ok: true,
      message: result.message,
      data: { proposalId: result.proposalId }
    });
  } catch (error) {
    return handleError(error);
  }
};