
const facultyController = require("@/controllers/semester.controller");

export const GET = () => facultyController.handleGetSemester();

export const POST= (req) => facultyController.handleCreateSemester(req);