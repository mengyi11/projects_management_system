import { handleError } from '@/lib/errorHandler';
const studentService = require('@/services/student.service');

// 创建学生（对应 createFaculty 模板）
export const POST = async (req) => {
    const { email, name, matriculation_number, semester_id } = await req.json();

    let userData = [name, email];
    let studentData = [matriculation_number, semester_id];
    try {
        let results = await studentService.createStudent(userData, studentData);
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Student created successfully',
                data: results
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
};

// 获取所有学生（对应 getFaculty 模板）
export const GET = async () => {
    try {
        console.log("controller:getStudents")
        let results = await studentService.getStudents();
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Selected students successfully',
                data: results
            }),
            { status: 200 }
        );
    } catch (error) {
        return handleError(error);
    }
};