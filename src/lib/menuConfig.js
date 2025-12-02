const menuConfig = {
  Admin: [
    {
      title: "User",
      icon: "Person",
      children: [
        { title: "Manage Faculty", path: "/admin/user/ManageFaculty" },
        { title: "Manage Students", path: "/admin/user/ManageStudents" },
      ],
    },
    {
      title: "Semester",
      icon: "Event",
      children: [
        { title: "Manage Semester", path: "/admin/semester/ManageSemester" },
        { title: "Venue Details", path: "/admin/semester/ManageVenues" },
      ],
    },
    {
      title: "Project",
      icon: "Project",
      children: [
        { title: "Approved Projects", path: "/admin/project/ApprovedProjects" },
        { title: "Student Registrations", path: "/admin/project/StudentRegistrations" },
        { title: "Generate Allocation", path: "/admin/project/GenerateAllocation" },
      ],
    },
    {
      title: "Grade",
      icon: "Grade",
      children: [
        { title: "View Project Grades", path: "/admin/grade/ProjectGrades" },
        { title: "View Grades Analytics", path: "/admin/grade/GradeAnalytics" },
      ],
    },
    {
      title: "Email",
      icon: "Email",
      children: [
        { title: "Template Management", path: "/admin/email/EmailTemplates" },
        { title: "Email Manager", path: "/admin/email/EmailManager" },
      ],
    },
  ],
  Faculty: [
    {
      title: "Proposal",
      icon: "Proposal",
      children: [
        { title: "Add Proposal", path: "/projects/my" },
        { title: "My Proposals", path: "/projects/my" },
        { title: "All Proposals", path: "/projects/register" },
      ],
    },
    {
      title: "Project",
      icon: "Project",
      children: [
        { title: "My Projects", path: "/projects/my" },
        { title: "All Projects", path: "/projects/register" },
      ],
    },
    {
      title: "Grade",
      icon: "Grade",
      children: [
        { title: "Evaluation", path: "/grades/my" },
        { title: "Analytics", path: "/grades/my" },
      ],
    },
    {
      title: "Email",
      icon: "Email",
      children: [
        { title: "Template Management", path: "/email/templates" },
        { title: "Email Manager", path: "/email/manager" },
      ],
    },
  ],
  Student: [
    {
      title: "Registration",
      icon: "Registration",
      children: [
        { title: "Planner", path: "/projects/my" },
        { title: "Registration", path: "/projects/register" },
      ],
    },
    {
      title: "Project Management",
      icon: "Project",
       children: [
        { title: "Allocated Project", path: "/projects/my" },
        { title: "Peer Review", path: "/projects/register" },
      ],
    },
  ],
};

export default menuConfig;