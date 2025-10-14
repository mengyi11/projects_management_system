import { handleError } from '@/lib/errorHandler';
const semesterManager = require('@/services/semester.service');

export const handleGetSemester = async () => {
    try {
        console.log("controller:getFaculty")
        let results = await semesterManager.getSemester();
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

export const handleCreateSemester = async (req) => {
    try {
        console.log("controller: createSemester");
        
        const semesterData = await req.json();
        
        const newSemester = await semesterManager.createSemester(semesterData);
        
        console.log("newSemester:", newSemester);
         return new Response(
            JSON.stringify({
                ok: true,
                message: 'Created Semester successfully',
                data: newSemester
            }),
            { status: 201 }
        );
    } catch (error) {
        return handleError(error);
    }
};