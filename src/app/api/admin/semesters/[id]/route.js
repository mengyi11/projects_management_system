const semesterManager = require('@/services/semester.service');
import { handleError } from '@/lib/errorHandler';


export const GET = async (req, { params }) => {
    // console.log("req:", req);
    // const id = req.nextUrl.searchParams.get('id')
    const param = await params;
    console.log("id:", param.id);
    try {
        console.log("controller:getFaculty")
        let results = await semesterManager.getSemesterById(param.id);
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Selected faculty successfully',
                data: results
            }),
            { status: 200 }
        );
    } catch (error) {
        return handleError(error);
    }
};

export const PUT = async (req, { params }) => {
    try {
        console.log("controller: updateSemester");
        const param = await params;
        console.log("id:", param.id);
        const updateData = await req.json();
        console.log("Update data:", updateData);

        // 调用服务层更新函数
        const updatedSemester = await semesterManager.updateSemester(updateData);

        if (!updatedSemester) {
            return new Response(
                JSON.stringify({
                    ok: false,
                    message: 'Semester not found'
                }),
                { status: 404 }
            );
        }

        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Semester updated successfully',
                data: updatedSemester
            }),
            { status: 200 }
        );
    } catch (error) {
        return handleError(error);
    }
};