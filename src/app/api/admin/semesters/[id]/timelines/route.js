const semesterManager = require('@/services/semester.service');
import { handleError } from '@/lib/errorHandler';

export const POST = async (req) => {
    try {
        console.log("route: handleTimeline (create or update)");

        const timeData = await req.json();
        console.log("Received timeline data:", timeData);

        // 1. 先查询该 semester_id 是否存在
        const existingTimeline = await semesterManager.getSemesterTimeline(timeData.semester_id);

        let result;
        if (!existingTimeline) {
            // 2. 不存在 → 调用创建函数
            console.log(`semester_id ${timeData.semester_id} 不存在，执行创建`);
            result = await semesterManager.createSemesterTimeline(timeData);
        } else {
            // 3. 存在 → 调用更新函数
            console.log(`semester_id ${timeData.semester_id} 已存在，执行更新`);
            result = await semesterManager.updateSemesterTimeline(timeData);
        }

        // 4. 返回响应（区分创建/更新的消息和状态码）
        return new Response(
            JSON.stringify({
                ok: true,
                message: result.isNew
                    ? 'Semester timeline created successfully'
                    : 'Semester timeline updated successfully',
                data: result
            }),
            { status: result.isNew ? 201 : 200 } // 创建：201，更新：200
        );
    } catch (error) {
        return handleError(error);
    }
};


// export const GET = async (req, { params }) => {
//     try {
//         console.log("route: getSemesterTimeline");
//         if (!params || !params.id) {
//             return NextResponse.json(
//                 { ok: false, message: 'semesterId is required in URL' },
//                 { status: 400 }
//             );
//         }
//         let semesterId = params.id;
//         console.log("semesterId:", semesterId);

//         // 调用 service 层的 getSemesterTimeline 方法
//         const timelineData = await semesterManager.getSemesterTimeline(semesterId);

//         console.log("Fetched timeline data:", timelineData);
//         // 根据查询结果返回响应
//         return new Response(
//             JSON.stringify({
//                 ok: true,
//                 message: 'Semester timeline fetched successfully',
//                 data: timelineData
//             }),
//             { status: 200 }
//         );
//     } catch (error) {
//         // 统一错误处理（返回标准化错误响应）
//         return handleError(error);
//     }
// }
export const GET = async (req, { params }) => {
    try {
        console.log("route: getSemesterTimeline");

        // 关键修复：await 解析 params（Next.js 14+ 动态路由参数需异步获取）
        const resolvedParams = await params;

        // 校验参数是否存在
        if (!resolvedParams || !resolvedParams.id) {
            return NextResponse.json(
                { ok: false, message: 'semesterId is required in URL' },
                { status: 400 }
            );
        }

        const semesterId = resolvedParams.id; // 从解析后的 params 中获取 id
        console.log("semesterId:", semesterId);

        // 调用 service 层方法
        const timelineData = await semesterManager.getSemesterTimeline(semesterId);
        console.log("Fetched timeline data:", timelineData);

        // 返回响应（未找到数据时也返回 200，用 data: null 标识）
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Semester timeline fetched successfully',
                data: timelineData
            }),
            { status: 200 }
        );

    } catch (error) {
        return handleError(error);
    }
};