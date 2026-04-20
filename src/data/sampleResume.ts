import type { ResumeData } from "../types.ts";

/**
 * Default starter data — generic placeholder content used to showcase the
 * available templates. Users replace this with their own details when they
 * start editing.
 */
export const sampleResume: ResumeData = {
  profile: {
    name: "Lorem Ipsum",
    title: "Dolor Sit Amet Consectetur",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
  },
  contact: [
    { id: "c1", kind: "email", value: "lorem.ipsum@example.com" },
    { id: "c2", kind: "phone", value: "+00-0000000000" },
    { id: "c3", kind: "location", value: "Lorem City, Ipsum Country" },
    { id: "c4", kind: "website", value: "loremipsum.dev" },
    { id: "c5", kind: "linkedin", value: "linkedin.com/in/lorem-ipsum" },
    { id: "c6", kind: "github", value: "github.com/loremipsum" },
    { id: "c7", kind: "medium", value: "medium.com/@loremipsum" },
  ],
  skills: [
    {
      id: "s1",
      label: "Lorem Ipsum Dolor",
      iconName: "Bot",
      items:
        "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing, Elit, Sed, Eiusmod, Tempor, Incididunt",
    },
    {
      id: "s2",
      label: "Sit Amet Consectetur",
      iconName: "Brain",
      items: "Lorem, Ipsum, Dolor, Sit, Amet",
    },
    {
      id: "s3",
      label: "Adipiscing Elit",
      iconName: "Cloud",
      items: "Lorem Ipsum, Dolor Sit, Amet Consectetur, Adipiscing Elit, Sed Do",
    },
    {
      id: "s4",
      label: "Eiusmod Tempor",
      iconName: "Layers",
      items: "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing",
    },
    {
      id: "s5",
      label: "Incididunt Labore",
      iconName: "Server",
      items: "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur",
    },
    {
      id: "s6",
      label: "Dolore Magna",
      iconName: "Palette",
      items: "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing, Elit, Sed, Eiusmod",
    },
    {
      id: "s7",
      label: "Aliqua Enim",
      iconName: "CodeXml",
      items: "Lorem, Ipsum, Dolor, Sit, Amet",
    },
    {
      id: "s8",
      label: "Minim Veniam",
      iconName: "Database",
      items: "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing, Elit, Sed",
    },
  ],
  experience: [
    {
      id: "e1",
      title: "Lorem Ipsum Dolor Sit Amet",
      company: "Consectetur Adipiscing Inc.",
      location: "Lorem City, Ipsum",
      start: "Mar 2022",
      end: "Present",
      bullets: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam.",
        "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum — lorem ipsum dolor sit amet consectetur.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident.",
      ],
    },
    {
      id: "e2",
      title: "Dolor Sit Amet Engineer",
      company: "Eiusmod Tempor Corp.",
      location: "Ipsum City, Dolor",
      start: "Jun 2019",
      end: "Feb 2022",
      bullets: [
        "Lorem ipsum dolor sit amet solutions, including a real-time consectetur adipiscing platform used by lorem ipsum leadership to drive sed do eiusmod decisions.",
        "Architected secure lorem-to-ipsum integrations using Dolor, Sit Amet, and Consectetur Adipiscing — enabling enterprise lorem ipsum at scale.",
        "Owned engineering quality standards and benchmarks across several lorem ipsum squads.",
      ],
    },
    {
      id: "e3",
      title: "Adipiscing Developer",
      company: "Elit Sed Do Pvt Ltd.",
      location: "Tempor City, Incididunt",
      start: "May 2016",
      end: "May 2019",
      bullets: [
        "Led the lorem ipsum development team for a dolor sit amet platform that improved consectetur adipiscing throughput and accelerated sed do eiusmod onboarding.",
        "Designed database schemas and built REST APIs using Lorem.js and Ipsum; maintained code quality through TDD and unit testing.",
      ],
    },
    {
      id: "e4",
      title: "Lorem Software Engineer",
      company: "Ipsum Technologies",
      location: "Dolor City, Sit",
      start: "Aug 2013",
      end: "Apr 2016",
      bullets: [
        "Full-stack lorem ipsum developer; built REST APIs with Dolor / Sit Amet and led integration testing initiatives across a cross-functional engineering team.",
        "Multiple internal innovation awards including the Lorem Ipsum App Competition.",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "Bachelor of Lorem Ipsum Science",
      school: "Dolor Sit Amet University",
      location: "Consectetur City, Adipiscing",
      start: "2009",
      end: "2013",
      detail: "First Class with Distinction",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Lorem Ipsum Platform",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt across lorem ipsum markets, integrating with regional dolor sit amet lakes.",
      role: "Architect — designed lorem ipsum framework, service boundaries, and dolor sit amet use cases.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur", "Adipiscing", "Elit"],
    },
    {
      id: "p2",
      name: "Dolor Sit Amet Portal",
      description:
        "Self-service portal for lorem ipsum customers with real-time analytics, dolor sit amet management, and consectetur adipiscing insights.",
      role: "Architect — designed module structure, lorem ipsum framework, backend, and dolor sit amet integration for 3rd-party systems.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur", "Adipiscing", "Elit"],
    },
    {
      id: "p3",
      name: "Consectetur Verification",
      description:
        "Lorem ipsum dolor sit amet using consectetur adipiscing to detect elit sed do and validate eiusmod tempor incididunt, plus a lorem ipsum assistant for dolor sit amet query resolution.",
      role: "Architect — owned infra and application design, built custom lorem ipsum pipeline.",
      stack: ["Lorem Ipsum", "Dolor", "Sit", "Amet Consectetur", "Adipiscing", "Elit"],
    },
    {
      id: "p4",
      name: "Eiusmod Tempor",
      description:
        "Lorem ipsum dolor sit amet product with consectetur adipiscing elit replacing a legacy sed do eiusmod workflow. Includes a lorem ipsum analysis layer and dolor sit amet encryption plugin.",
      role: "Lorem & Ipsum Architect — dolor analysis, sit amet calculation analytics, and consectetur analytics.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur", "Adipiscing"],
    },
    {
      id: "p5",
      name: "Labore Dolore Assistant",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit for internal users with natural-language document retrieval and ticket creation via sed do eiusmod.",
      role: "Architect.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit Amet"],
    },
    {
      id: "p6",
      name: "Magna Aliqua Reports",
      description:
        "Real-time executive reporting app used by lorem ipsum top leadership for dolor sit amet forecasting and consectetur adipiscing elit decisions.",
      role: "End-to-end architect & lorem ipsum lead.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur"],
    },
  ],
  certifications: [
    { id: "ct1", issuer: "Lorem Cloud", name: "Ipsum Leader", year: "2024" },
    { id: "ct2", issuer: "Dolor Cloud", name: "Sit Associate", year: "2023" },
    { id: "ct3", issuer: "Amet Cloud", name: "Consectetur Data Associate", year: "2023" },
    { id: "ct4", issuer: "Adipiscing", name: "Elit Fundamentals", year: "2022" },
    { id: "ct5", issuer: "Sed Do", name: "Eiusmod Foundations", year: "2022" },
    { id: "ct6", issuer: "Tempor", name: "Incididunt Agilist", year: "2021" },
    { id: "ct7", issuer: "Labore Alliance", name: "Certified Dolore Master", year: "2020" },
    { id: "ct8", issuer: "Magna", name: "Enterprise Aliqua Practitioner", year: "" },
  ],
  awards: [
    { id: "a1", title: "Lorem Ipsum Award", year: "2023", detail: "" },
    {
      id: "a2",
      title: "Dolor Champion",
      year: "2021",
      detail: "Innovation with Sit Amet & Consectetur Services",
    },
    { id: "a3", title: "Adipiscing Silver Award", year: "2020", detail: "Elit Reports & Sed Do" },
    { id: "a4", title: "Eiusmod Deep Skill Adder", year: "2019", detail: "" },
    { id: "a5", title: "Tempor Manager's Choice", year: "2018", detail: "" },
    { id: "a6", title: "Incididunt WinnerCircle", year: "2016", detail: "Labore Dolore Services" },
  ],
  languages: [
    { id: "l1", name: "Lorem", level: "Professional" },
    { id: "l2", name: "Ipsum", level: "Professional" },
    { id: "l3", name: "Dolor", level: "Native or Bilingual" },
  ],
  interests: ["Lorem Ipsum", "Dolor Sit"],
  tools: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur", "Adipiscing", "Elit", "Sed"],
  quickStats: [
    { id: "q1", value: "10+", label: "lorem ipsum" },
    { id: "q2", value: "5+", label: "dolor sit shipped" },
    { id: "q3", value: "20+", label: "amet consectetur delivered" },
    { id: "q4", value: "3", label: "adipiscing elit platforms" },
    { id: "q5", value: "6×", label: "sed do eiusmod winner" },
    { id: "q6", value: "12+", label: "tempor incididunt repos" },
  ],
  extras: [{ id: "x1", label: "Lorem", value: "Ipsum dolor sit amet consectetur" }],
};
