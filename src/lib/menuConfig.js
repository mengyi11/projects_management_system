const menuConfig = {
  Admin: [
    {
      title: "User",
      icon: "Person",
      children: [
        { title: "Manage faculty", path: "/faculty" },
        { title: "Manage students", path: "/students" },
      ],
    },
    {
      title: "Semester",
      icon: "Event",
      children: [
        { title: "Manage semester", path: "/semester" },
        { title: "Venue details", path: "/venues" },
      ],
    },
    {
      title: "Project",
      icon: "Project",
      children: [
        { title: "Approved projects", path: "/projects/approved" },
        { title: "Student registrations", path: "/projects/registrations" },
        { title: "Generate allocation", path: "/projects/allocation" },
      ],
    },
    {
      title: "Grade",
      icon: "Grade",
      children: [
        { title: "View Project Grades", path: "/grades/projects" },
        { title: "View Grades Analytics", path: "/grades/analytics" },
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
      title: "Project",
      icon: "Work",
      children: [
        { title: "My Projects", path: "/projects/my" },
        { title: "Register Project", path: "/projects/register" },
      ],
    },
    {
      title: "Grade",
      icon: "BarChart",
      children: [{ title: "My Grades", path: "/grades/my" }],
    },
  ],
};

export default menuConfig;