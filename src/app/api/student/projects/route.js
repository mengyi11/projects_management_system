// app/api/student/projects/route.js
import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { getAllProjects } from '@/services/project.service';
import { addStudentPlans } from '@/services/project.service';

// 获取所有可用项目（保留原有逻辑）
export const GET = async (req) => {
  try {
    const projects = await getAllProjects();
    return NextResponse.json({
      ok: true,
      data: projects
    });
  } catch (error) {
    return handleError(error);
  }
};

// 保存学生规划（完全适配前端 saveData 格式）
export const POST = async (req) => {
  try {
    // 1. 完整接收前端传递的 saveData
    const saveData = await req.json();

    // 2. 严格校验 saveData 格式和核心参数
    const validationErrors = [];
    if (!saveData?.user?.id) validationErrors.push('student ID (user.id) is required');
    if (!Array.isArray(saveData?.selectedProjects)) validationErrors.push('selectedProjects must be an array');
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: `Invalid request data: ${validationErrors.join(', ')}`,
            details: validationErrors
          }
        },
        { status: 400 }
      );
    }

    // 3. 解析 saveData 中数据库需要的核心字段
    // 提取学生ID（使用 user.id 作为 student_id）
    const studentId = saveData.user.id;
    // 提取项目ID和优先级（过滤冗余字段，仅保留数据库需要的）
    const projectsToSave = saveData.selectedProjects.map((item, index) => ({
      proposalId: item.projectId, // 前端 projectId 对应数据库 proposal_id
      priority: item.priority || (index + 1) // 兼容前端传递的 priority，兜底用索引+1
    })).filter(item => item.proposalId); // 过滤空项目ID

    // 4. 调用 service 层执行数据库操作（先删后插）
    const serviceResult = await addStudentPlans(studentId, projectsToSave);

    // 5. 返回适配前端的响应（包含前端传递的元数据）
    return NextResponse.json({
      ok: true,
      success: true,
      message: serviceResult.message,
      data: {
        // 回传前端的核心元数据
        user: {
          id: saveData.user.id,
          studentId: saveData.user.studentId,
          programme: saveData.user.programme
        },
        selectedProjects: saveData.selectedProjects.map(item => ({
          projectId: item.projectId,
          priority: item.priority
        })),
        totalSelected: saveData.totalSelected,
        timestamp: saveData.timestamp,
        // 数据库操作结果
        dbResult: {
          rowsAffected: serviceResult.rowsAffected || saveData.selectedProjects.length,
          operation: saveData.selectedProjects.length > 0 ? 'insert' : 'clear'
        }
      }
    });
  } catch (error) {
    // 统一错误处理（保留前端可识别的格式）
    return handleError(error);
  }
};