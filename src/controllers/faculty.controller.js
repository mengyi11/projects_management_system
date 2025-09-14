import { handleError } from '@/lib/errorHandler';
const facultyManager = require('@/services/faculty.service');

export const createFaculty = async (req, res, next) => {
    const { email, name, courseCoordinator } = await req.json();
    let userData = [name, email];
    let facultyData = courseCoordinator.toString();
    try {
        let results = await facultyManager.createFaculty(userData, facultyData);
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Faculty created successfully',
                data: res
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
};