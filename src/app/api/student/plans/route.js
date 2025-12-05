import { NextResponse } from 'next/server';
import { handleError } from '@/lib/errorHandler';
import { getStudentPlans } from '@/services/project.service';

// 获取学生已保存的规划
export const GET = async (req) => {
  try {
    // 从URL参数获取学生ID
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    // 校验学生ID
    if (!studentId) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: 'Student ID is required (studentId parameter)' }
        },
        { status: 400 }
      );
    }

    // 调用service获取数据
    const plans = await getStudentPlans(studentId);

    return NextResponse.json({
      ok: true,
      data: plans
    });
  } catch (error) {
    return handleError(error);
  }
};