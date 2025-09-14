const facultyController = require("@/controllers/faculty.controller");

export const POST = (req) => facultyController.createFaculty(req);