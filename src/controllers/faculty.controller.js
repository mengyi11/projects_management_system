import { handleError } from '@/lib/errorHandler';
const facultyManager = require('@/services/faculty.service');

export const createFaculty = async (req) => {
    const { email, name, courseCoordinator } = await req.json();
    let userData = [name, email];
    let facultyData = courseCoordinator.toString();
    try {
        let results = await facultyManager.createFaculty(userData, facultyData);
        return new Response(
            JSON.stringify({
                ok: true,
                message: 'Faculty created successfully',
                data: results
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
};

export const getFaculty = async () => {
    try {
        console.log("controller:getFaculty")
        let results = await facultyManager.getFaculty();
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