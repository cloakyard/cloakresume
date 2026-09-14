import { blankResume } from "../../src/data/blankResume.ts";
import { generateSampleResume } from "../../src/data/sampleResume.ts";
import type { ResumeData } from "../../src/types.ts";

function sample(seed: number): ResumeData {
  const random = Math.random;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  try {
    return generateSampleResume();
  } finally {
    Math.random = random;
  }
}

function compact(): ResumeData {
  const resume = sample(732);
  resume.profile = {
    name: "Zara Patel",
    title: "Senior Backend Engineer · Distributed Systems & Streaming",
    summary:
      "Builds reliable distributed systems, leads engineering teams, and improves delivery. **Platform ownership** and careful technical communication are central to this work.",
  };
  resume.experience = [
    {
      id: "job",
      title: "Senior Backend Engineer",
      company: "Platform Works",
      location: "Sydney, NSW",
      start: "Jan 2020",
      end: "Present",
      bullets: [
        "Built a streaming platform serving customers across three regions.",
        "Mentored engineers and improved service reliability.",
      ],
    },
  ];
  resume.projects = [
    {
      id: "project",
      name: "Streaming Platform",
      description: "A reliable event platform for customer operations.",
      roles: ["Owned architecture and delivery."],
      stack: ["TypeScript", "Kafka"],
    },
  ];
  resume.education = [
    {
      id: "education",
      degree: "Master of Computer Science",
      school: "Example University",
      location: "London",
      start: "2016",
      end: "2018",
      detail: "Distributed systems research with distinction.",
    },
  ];
  resume.skills = [
    { id: "skill", label: "Backend Engineering", items: "TypeScript, Go, Kafka, PostgreSQL" },
  ];
  resume.certifications = [
    {
      id: "cert",
      name: "Cloud Professional",
      issuer: "Certification Board",
      year: "2025",
      url: "https://example.com/credential",
    },
  ];
  resume.awards = [
    {
      id: "award",
      title: "Engineering Leadership Award",
      year: "2024",
      detail: "Recognized for improving platform reliability.",
    },
  ];
  resume.languages = [{ id: "language", name: "English", level: "Fluent" }];
  resume.interests = ["Photography", "Hiking"];
  resume.tools = ["Git", "Figma"];
  resume.interestsLabel = "Outside Work";
  resume.toolsLabel = "Daily Tools";
  resume.extras = [{ id: "extra", label: "Availability", value: "One month" }];
  resume.custom = [
    { id: "custom", header: "Community", bullets: ["Mentors early-career engineers."] },
  ];
  resume.quickStats = Array.from({ length: 9 }, (_, i) => ({
    id: `stat-${i}`,
    value: `${i + 12}+`,
    label: `Projects delivered across region ${i + 1}`,
  }));
  return resume;
}

function longFields(): ResumeData {
  const resume = compact();
  const token = "PlatformReliabilityArchitecture".repeat(5);
  resume.profile.name = "Alexandra Montgomery-Wellington";
  resume.profile.title =
    "Senior Backend Engineer · Distributed Systems & Streaming · International Platform Reliability and Engineering Leadership";
  resume.profile.summary =
    "Architected **reliable platforms** and delivered improvements across teams. ".repeat(15);
  resume.contact.push({
    id: "long-contact",
    kind: "website",
    value: `https://example.com/${token}`,
  });
  resume.experience[0].title += " · International Platform Architecture and Service Reliability";
  resume.experience[0].company =
    "International Engineering Research and Distributed Systems Company";
  resume.experience[0].bullets = [
    "Improved platform reliability and mentored engineers across regions. ".repeat(30),
  ];
  resume.skills[0].label = token;
  resume.skills[0].items = `TypeScript, ${token}, Go, Kafka`;
  resume.projects[0].name = token;
  resume.projects[0].description =
    "Delivered a reliable platform with clear operational guidance. ".repeat(20);
  resume.projects[0].roles = [
    "Owned architecture, mentored teams, and improved reliability. ".repeat(15),
  ];
  resume.projects[0].stack.push(token);
  resume.education[0].degree = "Master of Advanced Computing and Distributed Systems Engineering";
  resume.education[0].detail =
    "Research on dependable infrastructure and accessible services. ".repeat(8);
  resume.certifications[0].name =
    "Certified International Cloud Architecture and Platform Engineering Professional";
  resume.certifications[0].issuer =
    "International Association for Cloud Architecture and Engineering";
  resume.awards[0].title = "International Platform Engineering and Technical Leadership Award";
  resume.awards[0].detail =
    "Recognized for supporting engineering teams and improving reliability. ".repeat(8);
  resume.languages[0].level =
    "Professional working proficiency with technical communication and translation";
  resume.interests.push(token);
  resume.tools.push(token);
  resume.extras[0].value =
    "Available for international engineering and consulting engagements. ".repeat(8);
  resume.custom[0].header = "Community Engineering and Technical Mentorship";
  resume.custom[0].bullets = [
    "Organized workshops and mentored engineers across communities. ".repeat(20),
  ];
  resume.quickStats = Array.from({ length: 17 }, (_, i) => ({
    id: `long-stat-${i}`,
    value: i === 0 ? "12345678901234567890+" : `${i + 1}M+`,
    label: "Reliable customer projects delivered across international teams",
  }));
  return resume;
}

export const templateLayoutFixtures = [
  { name: "compact", resume: compact() },
  { name: "sample-241", resume: sample(241) },
  { name: "sample-987", resume: sample(987) },
  { name: "long-fields", resume: longFields() },
  {
    name: "sparse",
    resume: {
      ...structuredClone(blankResume),
      profile: { name: "Zara Patel", title: "Engineer", summary: "" },
    },
  },
];
