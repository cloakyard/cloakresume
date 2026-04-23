import type { ResumeData } from "../types.ts";

/**
 * Default starter data — generic placeholder content used to showcase the
 * available templates. Users replace this with their own details when they
 * start editing.
 *
 * Content is intentionally verbose and pushed to the 5–6 page range so that
 * every template is exercised against overflow, tight-fit, and multi-page
 * pagination edge cases. Includes long single words, long URLs, long project
 * titles, long skill lists, and many items in every section.
 */
export const sampleResume: ResumeData = {
  profile: {
    name: "Lorem Ipsum Dolorsitametus",
    title: "Principal Consectetur Adipiscing Architect · Eiusmod Tempor Lead",
    summary:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor.",
  },
  contact: [
    {
      id: "c1",
      kind: "email",
      value: "lorem.ipsum.dolor-sit-amet@consectetur-adipiscing.example.com",
    },
    { id: "c2", kind: "phone", value: "+00-000-0000-000000" },
    { id: "c3", kind: "location", value: "Lorem City, Ipsum Province, Consectetur Country" },
    { id: "c4", kind: "website", value: "lorem-ipsum-dolor-sit-amet.consectetur.dev" },
    {
      id: "c5",
      kind: "linkedin",
      value: "linkedin.com/in/lorem-ipsum-dolor-sit-amet-consectetur-adipiscing",
    },
    { id: "c6", kind: "github", value: "github.com/lorem-ipsum-dolor-sit-amet-consectetur" },
    { id: "c7", kind: "medium", value: "medium.com/@lorem-ipsum-dolor-sit-amet" },
  ],
  skills: [
    {
      id: "s1",
      label: "Lorem Ipsum Dolor Sit Amet",
      iconName: "Bot",
      items:
        "Consectetur, Adipiscing, Elit, SedEiusmodTemporIncididunt, UtLaboreEtDoloreMagnaAliqua, UtEnimAdMinimVeniam, Quis Nostrud, Exercitation, Ullamco, Laboris, Nisi, Aliquip",
    },
    {
      id: "s2",
      label: "Consectetur Adipiscing Elit Platforms",
      iconName: "Brain",
      items:
        "Lorem, Ipsum, Dolor, SitAmetConsecteturAdipiscing, Elit, SedDoEiusmod, Tempor, Incididunt, Labore, Dolore",
    },
    {
      id: "s3",
      label: "Adipiscing Elit Cloud",
      iconName: "Cloud",
      items:
        "Lorem Ipsum Services, Dolor Sit Amet, Amet Consectetur, Adipiscing Elit, Sed Do Eiusmod, LaboreEtDolore, MagnaAliqua, UtEnimAdMinim",
    },
    {
      id: "s4",
      label: "Eiusmod Tempor Incididunt",
      iconName: "Layers",
      items:
        "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, AdipiscingElitPlatformFramework, SedDoEiusmod, Tempor",
    },
    {
      id: "s5",
      label: "Incididunt Labore Et Dolore",
      iconName: "Server",
      items: "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing, Elit, Sed, Eiusmod",
    },
    {
      id: "s6",
      label: "Dolore Magna Aliqua",
      iconName: "Palette",
      items:
        "LoremIpsumDolor, Sit, Amet, ConsecteturAdipiscingElit, Sed, Eiusmod, Tempor, Incididunt, Labore, Dolore, MagnaAliqua",
    },
    {
      id: "s7",
      label: "Aliqua Enim Ad Minim",
      iconName: "CodeXml",
      items:
        "Lorem, Ipsum, Dolor, SitAmetConsectetur, AdipiscingElit, SedDoEiusmod, Tempor, Incididunt",
    },
    {
      id: "s8",
      label: "Minim Veniam Quis Nostrud",
      iconName: "Database",
      items:
        "Lorem, Ipsum, Dolor, Sit, Amet, Consectetur, Adipiscing, Elit, Sed, EiusmodTemporIncididuntUtLabore, Dolore",
    },
    {
      id: "s9",
      label: "Exercitation Ullamco Laboris",
      iconName: "Zap",
      items:
        "Lorem, Ipsum, Dolor, Sit, AmetConsecteturAdipiscing, Elit, SedDoEiusmod, Tempor, Incididunt, Labore",
    },
    {
      id: "s10",
      label: "Nisi Ut Aliquip Ex Ea",
      iconName: "Cpu",
      items:
        "Lorem Ipsum, Dolor Sit, Amet Consectetur, Adipiscing Elit, Sed Do, Eiusmod Tempor, Incididunt Labore",
    },
  ],
  experience: [
    {
      id: "e1",
      title: "Principal Lorem Ipsum Dolor Sit Amet Architect",
      company: "Consectetur Adipiscing Elit Worldwide Holdings Inc.",
      location: "Lorem City, Ipsum Province, Consectetur Country",
      start: "Mar 2022",
      end: "Present",
      bullets: [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat.",
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor.",
        "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt.",
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat — lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt.",
        "Led a distributed lorem ipsum team across three dolor sit amet regions, shipping consectetur adipiscing elit platforms that served eiusmod tempor customers with 99.99% labore et dolore availability.",
      ],
    },
    {
      id: "e2",
      title: "Senior Dolor Sit Amet Consectetur Engineer",
      company: "Eiusmod Tempor Incididunt Corporation International",
      location: "Ipsum City, Dolor Province",
      start: "Jun 2019",
      end: "Feb 2022",
      bullets: [
        "Lorem ipsum dolor sit amet solutions, including a real-time consectetur adipiscing platform used by lorem ipsum leadership to drive sed do eiusmod decisions and enable strategic dolor sit amet initiatives.",
        "Architected secure lorem-to-ipsum integrations using Dolor, Sit Amet, and Consectetur Adipiscing — enabling enterprise lorem ipsum at scale across eiusmod tempor markets.",
        "Owned engineering quality standards and benchmarks across several lorem ipsum squads, publishing internal dolor sit amet playbooks for consectetur adipiscing elit teams.",
        "Mentored ten-plus lorem ipsum engineers, running weekly dolor sit amet reviews and shipping consectetur adipiscing documentation across eiusmod tempor regions.",
        "Reduced infrastructure costs by 34% via lorem ipsum capacity planning and dolor sit amet workload consolidation across consectetur adipiscing clusters.",
      ],
    },
    {
      id: "e3",
      title: "Adipiscing Elit Developer, Sed Do Eiusmod",
      company: "Elit Sed Do Eiusmod Private Limited",
      location: "Tempor City, Incididunt Province",
      start: "May 2016",
      end: "May 2019",
      bullets: [
        "Led the lorem ipsum development team for a dolor sit amet platform that improved consectetur adipiscing throughput and accelerated sed do eiusmod onboarding across lorem ipsum regions.",
        "Designed database schemas and built REST APIs using Lorem.js and Ipsum; maintained code quality through TDD and unit testing across dolor sit amet microservices.",
        "Partnered with product on lorem ipsum dolor sit amet discovery and shipped consectetur adipiscing elit features aligned to eiusmod tempor quarterly goals.",
        "Championed the migration from monolithic lorem ipsum architecture to dolor sit amet microservices, cutting release lead time by 60% across consectetur adipiscing teams.",
      ],
    },
    {
      id: "e4",
      title: "Lorem Ipsum Dolor Software Engineer",
      company: "Ipsum Dolor Sit Amet Technologies",
      location: "Dolor City, Sit Province",
      start: "Aug 2013",
      end: "Apr 2016",
      bullets: [
        "Full-stack lorem ipsum developer; built REST APIs with Dolor / Sit Amet and led integration testing initiatives across a cross-functional lorem ipsum engineering team.",
        "Multiple internal innovation awards including the Lorem Ipsum App Competition and the Dolor Sit Amet Hack Day, shipped to production in under two sprints.",
        "Built the first lorem ipsum design system for dolor sit amet applications, adopted by six consectetur adipiscing product teams within a year.",
      ],
    },
    {
      id: "e5",
      title: "Consectetur Adipiscing Junior Developer",
      company: "Sed Do Eiusmod Tempor Solutions",
      location: "Incididunt City, Labore Province",
      start: "Jul 2011",
      end: "Jul 2013",
      bullets: [
        "Built lorem ipsum dashboards and dolor sit amet reporting tools used by consectetur adipiscing regional leadership for weekly business reviews.",
        "Automated recurring eiusmod tempor workflows, saving roughly twenty lorem ipsum hours per week across the dolor sit amet operations team.",
        "Contributed to the internal lorem ipsum design system and authored consectetur adipiscing onboarding docs used by new hires for the next three years.",
      ],
    },
  ],
  education: [
    {
      id: "ed1",
      degree: "Master of Lorem Ipsum Dolor Sit Amet Engineering",
      school: "Consectetur Adipiscing Elit Institute of Technology",
      location: "Eiusmod City, Tempor Province",
      start: "2013",
      end: "2015",
      detail: "Thesis on Lorem Ipsum Dolor Sit Amet Systems · GPA 3.9/4.0",
    },
    {
      id: "ed2",
      degree: "Bachelor of Lorem Ipsum Dolor Sit Amet Science and Engineering",
      school: "Dolor Sit Amet Consectetur Adipiscing University",
      location: "Consectetur City, Adipiscing Province",
      start: "2009",
      end: "2013",
      detail: "First Class with Distinction · Lorem Ipsum Scholar",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Lorem Ipsum Dolor Sit Amet Consectetur Platform",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt across lorem ipsum markets, integrating with regional dolor sit amet lakes and consectetur adipiscing elit warehouses.",
      role: "Architect — designed lorem ipsum framework, service boundaries, and dolor sit amet use cases across eiusmod tempor regions.",
      stack: [
        "LoremFramework",
        "Ipsum",
        "Dolor",
        "Sit",
        "Amet",
        "Consectetur",
        "AdipiscingElitPlatform",
        "EiusmodTempor",
      ],
    },
    {
      id: "p2",
      name: "Dolor Sit Amet Consectetur Adipiscing Portal",
      description:
        "Self-service portal for lorem ipsum customers with real-time analytics, dolor sit amet management, and consectetur adipiscing insights powered by a sed do eiusmod stream-processing backbone.",
      role: "Architect — designed module structure, lorem ipsum framework, backend, and dolor sit amet integration for 3rd-party systems.",
      stack: [
        "Lorem",
        "Ipsum",
        "Dolor",
        "SitAmetPlatform",
        "Consectetur",
        "AdipiscingElit",
        "SedDoEiusmod",
      ],
    },
    {
      id: "p3",
      name: "Consectetur Adipiscing Verification Service",
      description:
        "Lorem ipsum dolor sit amet using consectetur adipiscing to detect elit sed do and validate eiusmod tempor incididunt, plus a lorem ipsum assistant for dolor sit amet query resolution across enterprise customers.",
      role: "Architect — owned infra and application design, built custom lorem ipsum pipeline for consectetur adipiscing workflows.",
      stack: ["LoremIpsumPipeline", "Dolor", "Sit", "AmetConsectetur", "Adipiscing", "Elit"],
    },
    {
      id: "p4",
      name: "Eiusmod Tempor Incididunt Suite",
      description:
        "Lorem ipsum dolor sit amet product with consectetur adipiscing elit replacing a legacy sed do eiusmod workflow. Includes a lorem ipsum analysis layer and dolor sit amet encryption plugin for regulated eiusmod tempor customers.",
      role: "Lorem & Ipsum Architect — dolor analysis, sit amet calculation analytics, and consectetur analytics.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "AmetConsecteturAdipiscing", "Elit"],
    },
    {
      id: "p5",
      name: "Labore Dolore Magna Aliqua Assistant",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit for internal users with natural-language document retrieval and ticket creation via sed do eiusmod integrations across the dolor sit amet support organization.",
      role: "Architect — led end-to-end delivery from lorem ipsum prototyping through dolor sit amet rollout to consectetur adipiscing customers.",
      stack: ["Lorem", "Ipsum", "Dolor", "SitAmet", "ConsecteturAdipiscing", "Elit"],
    },
    {
      id: "p6",
      name: "Magna Aliqua Ut Enim Reports",
      description:
        "Real-time executive reporting app used by lorem ipsum top leadership for dolor sit amet forecasting and consectetur adipiscing elit decisions across eiusmod tempor regions.",
      role: "End-to-end architect & lorem ipsum lead.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "ConsecteturAdipiscing"],
    },
    {
      id: "p7",
      name: "Quis Nostrud Exercitation Graph",
      description:
        "Lorem ipsum dolor sit amet knowledge-graph service indexing consectetur adipiscing elit entities across sed do eiusmod sources, powering internal lorem ipsum search and dolor sit amet recommendation flows.",
      role: "Architect & lead engineer.",
      stack: ["Lorem", "Ipsum", "Dolor", "SitAmet", "Graph", "Consectetur"],
    },
    {
      id: "p8",
      name: "Ullamco Laboris Nisi Ut Aliquip Console",
      description:
        "Internal operator console for lorem ipsum platform teams with dolor sit amet incident triage, consectetur adipiscing runbook automation, and sed do eiusmod capacity forecasting.",
      role: "Architect — owned lorem ipsum UX, dolor sit amet backend, and consectetur adipiscing integration layer.",
      stack: ["Lorem", "Ipsum", "Dolor", "Sit", "Amet", "Consectetur", "Adipiscing"],
    },
  ],
  certifications: [
    {
      id: "ct1",
      issuer: "Lorem Ipsum Cloud Platform",
      name: "Consectetur Adipiscing Elit Solutions Leader",
      year: "2024",
    },
    {
      id: "ct2",
      issuer: "Dolor Sit Amet Cloud",
      name: "Sed Do Eiusmod Tempor Associate",
      year: "2023",
    },
    {
      id: "ct3",
      issuer: "Amet Consectetur Cloud",
      name: "Incididunt Ut Labore Data Associate",
      year: "2023",
    },
    {
      id: "ct4",
      issuer: "Adipiscing Elit",
      name: "Et Dolore Magna Aliqua Fundamentals",
      year: "2022",
    },
    {
      id: "ct5",
      issuer: "Sed Do Eiusmod",
      name: "Ut Enim Ad Minim Veniam Foundations",
      year: "2022",
    },
    {
      id: "ct6",
      issuer: "Tempor Incididunt",
      name: "Quis Nostrud Exercitation Agilist",
      year: "2021",
    },
    {
      id: "ct7",
      issuer: "Labore Dolore Alliance",
      name: "Certified Ullamco Laboris Nisi Master",
      year: "2020",
    },
    {
      id: "ct8",
      issuer: "Magna Aliqua",
      name: "Enterprise Aliquip Ex Ea Commodo Practitioner",
      year: "2019",
    },
    {
      id: "ct9",
      issuer: "Duis Aute Irure Institute",
      name: "Reprehenderit In Voluptate Velit Esse Cillum",
      year: "2019",
    },
    {
      id: "ct10",
      issuer: "Excepteur Sint Occaecat",
      name: "Cupidatat Non Proident Sunt In Culpa Qui Officia",
      year: "2018",
    },
  ],
  awards: [
    {
      id: "a1",
      title: "Lorem Ipsum Dolor Sit Amet Award",
      year: "2023",
      detail:
        "Annual recognition for consectetur adipiscing elit leadership across eiusmod tempor.",
    },
    {
      id: "a2",
      title: "Consectetur Adipiscing Champion",
      year: "2021",
      detail: "Innovation with Sit Amet & Consectetur Adipiscing Elit Services",
    },
    {
      id: "a3",
      title: "Adipiscing Silver Award",
      year: "2020",
      detail: "Elit Sed Do Eiusmod Reports & Tempor Incididunt",
    },
    {
      id: "a4",
      title: "Eiusmod Tempor Deep Skill Adder",
      year: "2019",
      detail: "Recognised for lorem ipsum knowledge-sharing across dolor sit amet squads.",
    },
    {
      id: "a5",
      title: "Tempor Incididunt Manager's Choice",
      year: "2018",
      detail: "Selected by lorem ipsum leadership for cross-team dolor sit amet collaboration.",
    },
    {
      id: "a6",
      title: "Incididunt Ut Labore Winner's Circle",
      year: "2016",
      detail: "Labore Dolore Magna Aliqua Services",
    },
    {
      id: "a7",
      title: "Labore Et Dolore Magna Innovation Prize",
      year: "2015",
      detail: "Lorem ipsum category — dolor sit amet prototype shipped to production.",
    },
    {
      id: "a8",
      title: "Magna Aliqua Ut Enim Hack Day Winner",
      year: "2014",
      detail: "Best lorem ipsum demo across eight dolor sit amet teams.",
    },
  ],
  languages: [
    { id: "l1", name: "Lorem Ipsum", level: "Native · Business" },
    { id: "l2", name: "Ipsum Dolor", level: "Advanced" },
    { id: "l3", name: "Consectetur", level: "Expert" },
    { id: "l4", name: "Adipiscing", level: "Intermediate" },
    { id: "l5", name: "Eiusmod Tempor", level: "Basic" },
  ],
  interests: [
    "Lorem Ipsum Design",
    "Dolor Sit Amet Photography",
    "Consectetur Typography",
    "Adipiscing Elit Travel",
    "Sed Do Eiusmod Cooking",
    "Tempor Incididunt Running",
  ],
  tools: [
    "LoremIpsum",
    "Dolor",
    "SitAmet",
    "ConsecteturAdipiscing",
    "Elit",
    "SedDoEiusmod",
    "Tempor",
    "Incididunt",
    "LaboreEtDolore",
    "MagnaAliqua",
    "UtEnimAdMinim",
    "QuisNostrud",
  ],
  quickStats: [
    { id: "q1", value: "12+", label: "years lorem ipsum" },
    { id: "q2", value: "8+", label: "dolor sit shipped" },
    { id: "q3", value: "25+", label: "amet consectetur delivered" },
    { id: "q4", value: "5", label: "adipiscing elit platforms" },
    { id: "q5", value: "6×", label: "sed do eiusmod winner" },
    { id: "q6", value: "15+", label: "tempor incididunt repos" },
  ],
  extras: [
    {
      id: "x1",
      label: "Lorem Ipsum Publications",
      value:
        "Ipsum dolor sit amet consectetur adipiscing elit · sed do eiusmod tempor incididunt · ut labore et dolore magna aliqua",
    },
    {
      id: "x2",
      label: "Speaking",
      value:
        "Dolor Sit Amet Summit 2024 · Consectetur Adipiscing Conference 2023 · Eiusmod Tempor Keynote 2022",
    },
    {
      id: "x3",
      label: "Patents",
      value: "US Patent 10,123,456 — Lorem Ipsum Dolor Sit Amet Method for Consectetur Adipiscing",
    },
    {
      id: "x4",
      label: "Open Source",
      value: "Maintainer of lorem-ipsum-kit · contributor to dolor-sit-amet and consectetur-utils",
    },
  ],
  custom: [
    {
      id: "cu1",
      header: "Volunteering & Community",
      bullets: [
        "Lorem ipsum dolor sit amet — mentored consectetur adipiscing elit students across sed do eiusmod cohorts, running quarterly lorem ipsum code reviews and dolor sit amet office hours.",
        "Organized quarterly lorem ipsum hackathons, bringing together dolor sit amet engineers from consectetur adipiscing partner teams across eiusmod tempor regions.",
        "Served on the lorem ipsum diversity committee, shaping dolor sit amet hiring practices and consectetur adipiscing outreach programmes.",
      ],
    },
    {
      id: "cu2",
      header: "Advisory & Boards",
      bullets: [
        "Technical advisor to two lorem ipsum early-stage startups in the dolor sit amet space, providing consectetur adipiscing elit architecture reviews and sed do eiusmod hiring guidance.",
        "Member of the lorem ipsum industry council on dolor sit amet standards, contributing to consectetur adipiscing elit working groups.",
      ],
    },
  ],
};
