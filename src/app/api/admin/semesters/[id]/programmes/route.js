const semesterManager = require('@/services/semester.service');
import { handleError } from '@/lib/errorHandler';

export const POST = async (req) => {
    try {
        console.log("route: handleProgramms");

        const program = await req.json();
        console.log("Received timeline data:", program);

       const result = await semesterManager.createSemesterProgramme(program);

        console.log("Operation result:", result);

        // 4. 返回响应（区分创建/更新的消息和状态码）
        return new Response(
            JSON.stringify({
                ok: true,
                message: ' Programmedd created successfully',
                data: result
            }),
            { status: 200 }
        );
    } catch (error) {
        return handleError(error);
    }
};

export const GET = async (req, { params }) => {
    try {
        console.log("route: getSemesterProgramme");
        let semesterId = params.id;
        console.log("semesterId:", semesterId);

        // 调用 service 层的 getSemesterTimeline 方法
        const  programmeData = await semesterManager.getSemesterProgramme(semesterId);

        console.log("Fetched programme data:", programmeData);


        // 根据查询结果返回响应
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Semester programme fetched successfully',
                data: programmeData
            }),
            { status: 200 }
        );
    } catch (error) {
        // 统一错误处理（返回标准化错误响应）
        return handleError(error);
    }
}


export const PUT = async (req, { params }) => {
    console.log("in")
//    import { semesterManager } from '@/services/semesterManager'; // 复用现有 semesterManager 服务
// import { handleError } from '@/lib/errorHandler';

  try {
    console.log("route: updateProgrammeCoordinator");
    
    // 1. 获取路由参数（项目ID）和请求体（教授ID）
    // const programmeId = params.programmeId;
    const { coordinator_professor_id , programme_id} = await req.json();
    
    console.log("programmeId:", programme_id);
    console.log("selected coordinator_professor_id:", coordinator_professor_id);

    // 2. 调用 service 层方法执行更新
    const updateResult = await semesterManager.updateProgrammeCoordinator(
      programme_id,
      coordinator_professor_id
    );

    console.log("Update programme coordinator result:", updateResult);

    // 3. 返回成功响应（与现有 GET 接口格式一致）
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Coordinator updated successfully',
        data: updateResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // 4. 统一错误处理（复用现有 handleError 工具）
    return handleError(error);
  }
}



export const DELETE = async (req, { params }) => {
  try {
    console.log("route: deleteSemesterProgramme (Query params mode)");
    
    // 1. 核心：await params 获取动态路由参数（semester ID）
    const { id: semIdStr } = await params;
    console.log("semId (from route params):", semIdStr);

    // 2. 解析 Query 参数（programme_id）
    const url = new URL(req.url);
    const programmeIdStr = url.searchParams.get('programme_id');
    console.log("programme_id (from Query params):", programmeIdStr);

    // 3. 严格参数校验
    // 3.1 转换并校验 semester ID
    const semId = Number(semIdStr);
    if (isNaN(semId) || semId <= 0) {
      throw new Error('Invalid semester ID (must be a positive number)', { cause: { statusCode: 400 } });
    }

    // 3.2 转换并校验 programme ID
    const programmeId = Number(programmeIdStr);
    if (!programmeIdStr || isNaN(programmeId) || programmeId <= 0) {
      throw new Error('Missing or invalid programme_id (must be a positive number)', { cause: { statusCode: 400 } });
    }

    // 4. 调用 service 层执行删除
    const deleteResult = await semesterManager.deleteProgramme(semId, programmeId);

    // 5. 返回成功响应（与现有接口格式一致）
    return new Response(
      JSON.stringify({
        ok: true,
        message: 'Programme deleted successfully',
        data: deleteResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // 统一错误处理
    return handleError(error);
  }
};