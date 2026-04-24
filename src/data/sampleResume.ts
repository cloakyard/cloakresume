import type { ResumeData } from "../types.ts";

/**
 * Generates a fresh sample résumé on every call. Content is drawn from
 * realistic tech-industry pools — names, companies, bullets, skills — so
 * the preview feels like a person rather than placeholder Lorem Ipsum.
 *
 * Density is intentionally high: long titles, long URLs, long skill lists,
 * and many items per section, so every template is exercised against
 * overflow, tight-fit, and multi-page pagination edge cases.
 */

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function sampleN<T>(arr: readonly T[], n: number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const FIRST_NAMES = [
  "Ava",
  "Ryan",
  "Maya",
  "Lucas",
  "Zara",
  "Hiroshi",
  "Elena",
  "Diego",
  "Priya",
  "Noah",
  "Isla",
  "Mateo",
  "Nadia",
  "Ezra",
  "Amara",
  "Kai",
  "Sofia",
  "Jamal",
  "Yusuf",
  "Lena",
  "Theo",
  "Anya",
  "Felix",
  "Camille",
  "Rohan",
  "Mila",
  "Omar",
  "Nina",
  "Arjun",
  "Emilia",
] as const;

const LAST_NAMES = [
  "Thompson",
  "Patel",
  "Chen",
  "Kim",
  "Okafor",
  "Tanaka",
  "Rossi",
  "Alvarez",
  "Sharma",
  "Anderson",
  "Nguyen",
  "Silva",
  "Lindqvist",
  "Fernandez",
  "Walsh",
  "Hassan",
  "Rivera",
  "Mukherjee",
  "Bennett",
  "Nakamura",
  "Kowalski",
  "Petrov",
  "Abebe",
  "Johansson",
  "Moreau",
  "Vasquez",
  "Schmidt",
  "Delacroix",
] as const;

const LOCATIONS: ReadonlyArray<{ city: string; region: string }> = [
  { city: "San Francisco", region: "CA" },
  { city: "Berlin", region: "Germany" },
  { city: "Bengaluru", region: "Karnataka" },
  { city: "Amsterdam", region: "Netherlands" },
  { city: "Toronto", region: "ON" },
  { city: "Singapore", region: "Singapore" },
  { city: "Tokyo", region: "Japan" },
  { city: "Austin", region: "TX" },
  { city: "London", region: "United Kingdom" },
  { city: "Sydney", region: "NSW" },
  { city: "Zurich", region: "Switzerland" },
  { city: "Dublin", region: "Ireland" },
  { city: "Stockholm", region: "Sweden" },
  { city: "Seattle", region: "WA" },
];

const HEADLINES = [
  "Principal Software Engineer · Platform Infrastructure Lead",
  "Staff Full-Stack Engineer · Cloud Native Systems",
  "Senior Backend Engineer · Distributed Systems & Streaming",
  "Lead Frontend Architect · Developer Experience",
  "Principal Site Reliability Engineer · Observability & Resilience",
  "Staff Engineer · Developer Platform & Tooling",
  "Senior Software Architect · AI Infrastructure",
  "Principal Engineer · Data Platform & Real-Time Systems",
];

const SUMMARIES = [
  "Seasoned software engineer with 12+ years designing and operating distributed systems at scale. Passionate about turning messy, organically-grown monoliths into composable platforms that ship faster and fail more gracefully. Track record of leading cross-functional initiatives across mobile, web, and backend, mentoring engineers, and driving measurable improvements in latency, cost, and developer velocity. Comfortable owning on-call rotations, reviewing architecture proposals, and writing the kind of documentation teams actually read. Always learning — currently diving into Rust, OpenTelemetry, and applied LLM workflows.",
  "Full-stack engineer with a decade of experience shipping customer-facing products and the platform pieces that sit underneath them. Strong opinions on incremental refactoring, honest SLOs, and documentation as a first-class artifact. Previously led platform reliability for a consumer product serving tens of millions of users, cutting on-call pages by 60% while rolling out a zero-downtime migration to Kubernetes. Equally at home in Go, TypeScript, or Python, and particularly interested in developer-experience work that quietly compounds across every engineer in the building.",
  "Principal engineer focused on the intersection of infrastructure and developer experience. Happiest when turning tribal knowledge into self-serve tooling — build systems, internal platforms, dashboards that surface the thing you actually need when paged at 3am. Experience spans early-stage startups where you wire the whole stack yourself to mid-size companies where you negotiate API contracts across four teams. Believe pragmatism beats purity, and that the best architecture docs are the ones that honestly admit what didn't work.",
  "Engineering lead with a background in distributed systems, observability, and applied machine learning. Built, operated, and paged-for services handling high-cardinality workloads under tight latency budgets. Spent the last three years investing in platform teams — shipping internal SDKs, golden-path templates, and the opinionated defaults that let product engineers move fast without reinventing auth, config, or retries. Excited by developer tooling, the craft of writing clear technical prose, and anything that makes debugging feel less like archaeology.",
  "Software architect with broad experience across cloud, backend, and frontend engineering. Comfortable parachuting into unfamiliar codebases, mapping the real dependency graph, and identifying the two or three changes that unlock the next quarter of product work. Have led migrations between major frameworks, designed event-driven platforms from scratch, and spent plenty of time on the customer-escalation side of the pager. Prefer small reviewable changes, honest post-mortems, and the occasional dramatic whiteboard session.",
];

const COMPANIES = [
  "Vector Labs Inc.",
  "Northwind Systems",
  "Pixelwave Technologies",
  "Helios Cloud Solutions",
  "Orbital Data Co.",
  "Quantum Mesh Software",
  "Stratus Digital",
  "Parallax Labs",
  "Meridian Analytics",
  "Glacier Networks",
  "Nimbus Robotics",
  "Aurora Systems",
  "Beacon Compute",
  "Cascade Foundry",
  "Lighthouse Interactive",
  "Rainforest Engineering",
] as const;

const SENIOR_TITLES = [
  "Principal Software Engineer",
  "Staff Engineer, Platform",
  "Senior Staff Architect",
  "Principal Distributed Systems Engineer",
  "Head of Platform Engineering",
];

const MID_TITLES = [
  "Senior Software Engineer",
  "Senior Backend Engineer",
  "Senior Full-Stack Engineer",
  "Senior Platform Engineer",
  "Senior Frontend Engineer",
];

const EARLY_TITLES = [
  "Software Engineer",
  "Product Engineer",
  "Backend Engineer",
  "Full-Stack Developer",
  "Platform Engineer",
];

const JUNIOR_TITLES = [
  "Software Engineer II",
  "Associate Software Engineer",
  "Junior Backend Engineer",
  "Graduate Software Engineer",
];

const SENIOR_BULLETS = [
  "Led a redesign of the service mesh across forty internal microservices, cutting p99 latency by 38% and eliminating a class of cascading failures that had been the top source of overnight pages for the previous year.",
  "Owned the end-to-end migration from a single-region Postgres cluster to a multi-region Aurora topology, executing the cut-over in under four hours of controlled downtime and keeping replica lag within a strict five-second SLO.",
  "Designed a new event streaming platform on Kafka and Flink that replaced a brittle cron-driven batch pipeline, unlocking real-time personalisation for three flagship product surfaces and cutting feature-to-production time by half.",
  "Partnered with the data science team to productionise an in-house embedding model, building the gRPC serving stack and writing the retry, circuit-breaking, and fallback logic that let downstream services lean on it during peak traffic.",
  "Mentored fourteen engineers across three squads, running weekly architecture reviews and publishing internal playbooks on distributed tracing and SLO design that became required reading for every new hire.",
  "Built the first iteration of the internal developer platform — CLI, service catalog, and golden-path templates — reducing new-service bootstrap time from two weeks to under an afternoon across every product team.",
  "Championed a migration from bespoke Terraform modules to a thin, opinionated Pulumi framework, coordinating with four infra teams and retiring roughly sixty thousand lines of copy-pasted HCL in the process.",
  "Rolled out a standardised OpenTelemetry baseline across twenty-plus services, feeding traces into Tempo and metrics into Prometheus — the resulting dashboards became the default starting point for every incident review at the company.",
  "Led the rewrite of the billing ingestion pipeline from Python Celery workers to a Go-based streaming service on NATS JetStream, absorbing a 5× traffic increase without adding operational headcount.",
  "Introduced a feature-flag-driven release strategy on LaunchDarkly and GitHub Actions, letting the team ship changes to 1% of traffic by default and recover from regressions in under two minutes instead of two hours.",
  "Architected a multi-tenant identity service on AWS built around short-lived IAM Roles Anywhere credentials, replacing a static access-key scheme that had been flagged during the most recent SOC 2 audit cycle.",
  "Drove adoption of Kubernetes across the organisation, from the first EKS proof-of-concept through cluster federation, ArgoCD-based GitOps, and a standardised Helm chart library used by every platform team today.",
];

const MID_BULLETS = [
  "Reduced monthly cloud spend by 34% by right-sizing compute, moving batch jobs to spot capacity, introducing Karpenter for worker-node scaling, and retiring seven dormant services identified during an infra audit.",
  "Designed a canary analysis pipeline on Flagger and Argo Rollouts that automatically rolls back regressions based on Datadog error-budget signals, removing manual release coordination from every deploy.",
  "Rewrote the mobile-gateway BFF layer in TypeScript on Fastify, consolidating six legacy Express services into one — median fan-out dropped from eleven downstream calls to three and cut app start time on low-end devices.",
  "Led a cross-functional working group on API versioning, landing a documented policy and deprecation tooling that replaced the ad-hoc process mobile, web, and partner teams had each been running differently for years.",
  "Built an internal chat-ops assistant on LangChain and Slack that surfaces on-call context, recent deploys, and open incidents — adopted by four teams and used on roughly 80% of paged incidents within a quarter.",
  "Contributed to the open-source fork of a core dependency, upstreaming a thread-safety fix and a performance patch that cut CPU usage in steady-state by roughly 12% across the entire production fleet.",
  "Stood up the organisation's first chaos-engineering program using LitmusChaos, building a weekly game-day cadence and a library of targeted failure injections that surfaced three latent bugs in the first two months.",
  "Introduced contract testing with Pact across the growth org's services, enabling independent deploys between the web frontend and its three backends without blocking on shared integration suites.",
  "Owned the front-end pipeline refactor from Webpack to Vite, shaving cold-start dev-server time from 42 seconds to under three and turning HMR into a first-class part of the developer workflow again.",
  "Shipped the first production Next.js rollout at the company, establishing deployment patterns on Vercel and the CDN-level caching rules that the rest of the org adopted within six months.",
];

const EARLY_BULLETS = [
  "Built the first iteration of the internal analytics dashboard in React and D3, used by regional leadership for weekly business reviews and eventually adopted by the customer-success org as their primary reporting surface.",
  "Automated the nightly ETL workflow that had been a brittle bash script, rewriting it in Python with Airflow — eliminated roughly twenty engineering hours per week of manual intervention and stabilised downstream reporting.",
  "Contributed across the stack on a six-engineer team, shipping REST endpoints in Node.js, building React components against the emerging design system, and taking the on-call pager for the team's two user-facing services.",
  "Led the migration of three flagship services from REST to gRPC, including the internal shim layer that kept existing HTTP consumers working during the transition — retired the old gateway six months ahead of the original plan.",
  "Owned the developer onboarding experience for new hires — wrote the local-setup guide, built the dev-container image, and ran weekly office hours that shortened time-to-first-PR from two weeks to under three days.",
  "Drove the adoption of TypeScript across the frontend codebase, writing the initial tsconfig and incremental migration plan — shipped the final JS-free PR roughly a year in, with zero production regressions attributed to the rollout.",
  "Took part in the company's first design-systems effort, helping land the token architecture, shipping the first thirty primitives, and documenting the composition patterns that the rest of the team extended from there.",
  "Introduced automated accessibility testing into CI via axe-core and Pa11y, catching a meaningful long tail of issues and raising the team's Lighthouse accessibility score from the mid-70s to a consistent 95+.",
];

const JUNIOR_BULLETS = [
  "Built internal dashboards and reporting tools in React used by regional operations leadership for weekly business reviews — the core charts are still in production three years later.",
  "Automated recurring operational workflows with Python scripts and cron, saving the operations team roughly twenty engineer-hours per week on previously-manual reconciliation work.",
  "Contributed to the internal design system, authoring onboarding docs that new hires continued to use as their starting point for the following three years.",
  "Fixed long-standing bugs in the shared authentication library during a hack-week, shipping the patch to production and presenting the root-cause analysis at the engineering all-hands.",
];

const SKILL_GROUP_POOL: ReadonlyArray<{ label: string; icon: string; items: readonly string[] }> = [
  {
    label: "Programming Languages",
    icon: "Bot",
    items: [
      "TypeScript",
      "JavaScript",
      "Python",
      "Go",
      "Rust",
      "Java",
      "Kotlin",
      "Swift",
      "Ruby",
      "Elixir",
      "Scala",
      "C++",
    ],
  },
  {
    label: "Frontend Engineering",
    icon: "Palette",
    items: [
      "React",
      "Next.js",
      "Remix",
      "Vue",
      "Svelte",
      "Astro",
      "Vite",
      "Tailwind CSS",
      "Radix UI",
      "Framer Motion",
      "Storybook",
      "TanStack Query",
    ],
  },
  {
    label: "Backend & APIs",
    icon: "Server",
    items: [
      "Node.js",
      "Deno",
      "Bun",
      "Express",
      "Fastify",
      "NestJS",
      "tRPC",
      "GraphQL",
      "gRPC",
      "OpenAPI",
      "Protocol Buffers",
      "WebSockets",
    ],
  },
  {
    label: "Cloud Platforms",
    icon: "Cloud",
    items: [
      "AWS",
      "Google Cloud",
      "Azure",
      "Cloudflare",
      "Vercel",
      "Fly.io",
      "DigitalOcean",
      "Supabase",
      "Railway",
    ],
  },
  {
    label: "Infrastructure & DevOps",
    icon: "Layers",
    items: [
      "Kubernetes",
      "Docker",
      "Helm",
      "ArgoCD",
      "Terraform",
      "Pulumi",
      "Ansible",
      "GitHub Actions",
      "CircleCI",
      "Jenkins",
    ],
  },
  {
    label: "Databases & Storage",
    icon: "Database",
    items: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "DynamoDB",
      "Cassandra",
      "ClickHouse",
      "Elasticsearch",
      "Neo4j",
      "S3",
    ],
  },
  {
    label: "Observability",
    icon: "Zap",
    items: [
      "OpenTelemetry",
      "Prometheus",
      "Grafana",
      "Datadog",
      "Sentry",
      "Honeycomb",
      "Jaeger",
      "Loki",
      "Tempo",
      "New Relic",
    ],
  },
  {
    label: "Streaming & Messaging",
    icon: "CodeXml",
    items: [
      "Kafka",
      "Flink",
      "NATS JetStream",
      "RabbitMQ",
      "Pulsar",
      "Kinesis",
      "Pub/Sub",
      "Redpanda",
      "Debezium",
    ],
  },
  {
    label: "AI / ML Tooling",
    icon: "Brain",
    items: [
      "PyTorch",
      "TensorFlow",
      "Hugging Face",
      "LangChain",
      "OpenAI API",
      "Anthropic SDK",
      "pgvector",
      "Weaviate",
      "Llama Index",
    ],
  },
  {
    label: "Performance & Systems",
    icon: "Cpu",
    items: [
      "WebAssembly",
      "io_uring",
      "eBPF",
      "gRPC",
      "QUIC",
      "HTTP/3",
      "SIMD",
      "Profiling",
      "Benchmarking",
    ],
  },
  {
    label: "Security & Compliance",
    icon: "Server",
    items: [
      "OWASP Top 10",
      "OAuth 2.1",
      "OpenID Connect",
      "SSO / SAML",
      "HashiCorp Vault",
      "SOC 2",
      "PCI-DSS",
      "Threat Modeling",
    ],
  },
];

const PROJECT_POOL: ReadonlyArray<{
  name: string;
  description: string;
  role: string;
  stack: readonly string[];
}> = [
  {
    name: "LumenStream · Real-time Analytics Platform",
    description:
      "Horizontally-scalable ingest and query platform handling billions of events per day for marketing and product analytics. Built on Kafka, ClickHouse, and a thin Rust query gateway; supports sub-second dashboards and ad-hoc SQL across multi-tenant workspaces.",
    role: "Tech lead — owned the query gateway, ingestion pipeline, and the operational runbooks used by the twelve-person platform team.",
    stack: ["Rust", "Kafka", "ClickHouse", "Kubernetes", "Grafana", "OpenTelemetry", "Helm"],
  },
  {
    name: "Signalforge · Incident Response Copilot",
    description:
      "Internal assistant that ingests alerts, recent deploys, and service-ownership data to suggest the most likely owner and the most likely root cause during live incidents. Integrated with PagerDuty, Slack, and the internal service catalog.",
    role: "Architect — designed the retrieval layer, LLM prompting strategy, and the feedback loop used to iteratively improve suggestion quality.",
    stack: ["TypeScript", "LangChain", "Postgres", "pgvector", "Slack API", "Pulumi"],
  },
  {
    name: "Orbit · Internal Developer Platform",
    description:
      "Self-service platform that exposes a golden path for creating, deploying, and operating services. Ships with a CLI, a service catalog, a template registry, and opinionated defaults for CI, deploys, and observability.",
    role: "Founding engineer — led platform API design, onboarding UX, and the adoption rollout that brought every product team onto the platform within nine months.",
    stack: ["Go", "React", "Next.js", "Backstage", "Kubernetes", "Terraform", "GitHub Actions"],
  },
  {
    name: "Riverbed · Streaming ETL Framework",
    description:
      "Declarative streaming-ETL framework on Flink that replaced a patchwork of Airflow DAGs and bespoke Kafka consumers. Configurable via YAML, with a TypeScript-based planner that generates the underlying job graphs at build time.",
    role: "Lead engineer — built the planner, the runtime shims, and the integration with the internal schema registry.",
    stack: ["Flink", "Kafka", "TypeScript", "Avro", "Kubernetes", "Prometheus"],
  },
  {
    name: "Atlas · Multi-region Service Topology",
    description:
      "Cross-region service-mesh orchestration layer that handles topology-aware routing, regional failover drills, and latency-based traffic shaping across three AWS regions. Replaced a DIY solution that had accumulated years of undocumented behaviour.",
    role: "Architect — owned the control plane, failover testing harness, and documentation that turned mesh ops into a self-serve experience.",
    stack: ["Envoy", "Istio", "Go", "AWS", "Terraform", "CloudWatch"],
  },
  {
    name: "Northstar · ML Feature Store",
    description:
      "In-house feature store serving precomputed features across recommendation, search, and fraud-detection workloads with sub-millisecond online reads and consistent offline materialisation. Integrates with Spark, Flink, and the internal ML training stack.",
    role: "Co-founder of the platform team — owned the online-serving path, consistency guarantees, and the SDK used by every ML engineer at the company.",
    stack: ["Python", "Go", "Redis", "ClickHouse", "Spark", "Flink", "gRPC"],
  },
  {
    name: "Beacon · Edge Rendering Framework",
    description:
      "Production-ready edge-rendering framework on Cloudflare Workers that powers the marketing and documentation sites. Includes a typed routing DSL, per-request A/B testing primitives, and first-class streaming responses.",
    role: "Tech lead — built the routing DSL, the streaming primitives, and the rollout tooling used by the growth engineering team.",
    stack: ["TypeScript", "Cloudflare Workers", "React", "Vite", "Durable Objects"],
  },
  {
    name: "Quartz · Observability Backbone",
    description:
      "Unified logs, metrics, and traces platform that replaced three vendor systems. Built around OpenTelemetry, Tempo, Loki, and Mimir, with a custom query planner that federates searches across backends.",
    role: "Architect — owned the federation layer, ingestion tuning, and the cost model that let the team turn this into a credible vendor alternative internally.",
    stack: ["Go", "OpenTelemetry", "Tempo", "Loki", "Mimir", "Kubernetes", "Grafana"],
  },
  {
    name: "Pinecrest · Release Orchestrator",
    description:
      "Progressive-delivery controller coordinating canary, blue-green, and feature-flag rollouts across twenty production services. Wired into Datadog SLOs so unhealthy rollouts halt and revert automatically.",
    role: "Lead engineer — designed the controller state machine, the SLO polling path, and the audit trail used during post-incident reviews.",
    stack: ["Go", "Argo Rollouts", "Flagger", "LaunchDarkly", "Datadog", "Kubernetes"],
  },
  {
    name: "Harbormaster · Service Catalog",
    description:
      "Ownership, documentation, and on-call metadata aggregator built on Backstage, feeding incident tooling, access control, and the internal developer portal. Surfaces service health, cost, and compliance posture in one place.",
    role: "Tech lead — owned schema design, plugin surface, and integration with fifteen upstream data sources.",
    stack: ["TypeScript", "Backstage", "Postgres", "GraphQL", "Terraform"],
  },
];

const UNIVERSITIES: ReadonlyArray<{ name: string; city: string; region: string }> = [
  { name: "University of Waterloo", city: "Waterloo", region: "ON" },
  { name: "Carnegie Mellon University", city: "Pittsburgh", region: "PA" },
  { name: "ETH Zürich", city: "Zürich", region: "Switzerland" },
  { name: "National University of Singapore", city: "Singapore", region: "Singapore" },
  { name: "Indian Institute of Technology Bombay", city: "Mumbai", region: "Maharashtra" },
  { name: "University of Edinburgh", city: "Edinburgh", region: "Scotland" },
  { name: "Technical University of Munich", city: "Munich", region: "Bavaria" },
  { name: "University of Illinois Urbana-Champaign", city: "Urbana", region: "IL" },
  { name: "University of British Columbia", city: "Vancouver", region: "BC" },
  { name: "KTH Royal Institute of Technology", city: "Stockholm", region: "Sweden" },
];

const MASTERS_DEGREES = [
  "Master of Science in Computer Science",
  "Master of Science in Software Engineering",
  "Master of Science in Distributed Systems",
  "Master of Engineering in Computing",
  "Master of Science in Machine Learning",
];

const BACHELORS_DEGREES = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Engineering in Software Engineering",
  "Bachelor of Science in Computer Engineering",
  "Bachelor of Technology in Information Technology",
  "Bachelor of Science in Applied Mathematics & Computer Science",
];

const MASTERS_DETAILS = [
  "Thesis on low-latency consensus protocols in geo-distributed deployments · GPA 3.9/4.0",
  "Research focus on streaming systems and adaptive query optimisation · Distinction",
  "Thesis on program synthesis using neural retrieval · GPA 3.95/4.0",
  "Research assistant in the Programming Languages Lab · Thesis on type inference for effect systems",
  "Thesis on privacy-preserving ML in constrained environments · High Distinction",
];

const BACHELORS_DETAILS = [
  "First Class with Distinction · Dean's List for four consecutive semesters",
  "Graduated summa cum laude · Captain of the ACM programming team",
  "First Class Honours · Undergraduate research on compiler optimisation",
  "GPA 3.88/4.0 · Teaching assistant for Intro to Operating Systems for three semesters",
  "Graduated with Distinction · Senior project on a distributed key-value store",
];

const CERTIFICATIONS: ReadonlyArray<{ issuer: string; name: string }> = [
  { issuer: "Amazon Web Services", name: "AWS Certified Solutions Architect — Professional" },
  { issuer: "Amazon Web Services", name: "AWS Certified DevOps Engineer — Professional" },
  { issuer: "Google Cloud", name: "Google Professional Cloud Architect" },
  { issuer: "Google Cloud", name: "Google Professional Data Engineer" },
  { issuer: "Microsoft", name: "Azure Solutions Architect Expert" },
  { issuer: "CNCF", name: "Certified Kubernetes Administrator (CKA)" },
  { issuer: "CNCF", name: "Certified Kubernetes Application Developer (CKAD)" },
  { issuer: "HashiCorp", name: "Terraform Associate" },
  { issuer: "HashiCorp", name: "Vault Associate" },
  { issuer: "Linux Foundation", name: "Linux Foundation Certified Engineer (LFCE)" },
  { issuer: "Confluent", name: "Confluent Certified Developer for Apache Kafka" },
  { issuer: "MongoDB University", name: "MongoDB Certified Developer Associate" },
  { issuer: "Databricks", name: "Databricks Certified Data Engineer Professional" },
  { issuer: "Scrum.org", name: "Professional Scrum Master II" },
];

const AWARDS: ReadonlyArray<{ title: string; detail: string }> = [
  {
    title: "Engineering Excellence Award",
    detail:
      "Company-wide annual recognition for sustained impact across platform reliability initiatives.",
  },
  {
    title: "Principal's Circle of Innovation",
    detail: "Selected for leading the zero-downtime migration of the billing pipeline.",
  },
  {
    title: "Hack Week — Grand Prize",
    detail: "Cross-company hackathon winner for an AI-assisted incident-response prototype.",
  },
  {
    title: "Open Source Contributor of the Year",
    detail: "Recognised for upstream contributions to Kubernetes and OpenTelemetry projects.",
  },
  {
    title: "Developer Experience Impact Award",
    detail: "Team award for the internal developer platform rollout.",
  },
  {
    title: "Mentor of the Year",
    detail: "Nominated by five engineers across two organisations for sustained mentorship.",
  },
  {
    title: "Patent Award",
    detail: "Issued patent on distributed rate-limiting with eventual-consistency guarantees.",
  },
  {
    title: "Customer Obsession Recognition",
    detail:
      "Awarded for leading on-call through a major customer incident without breaching contractual SLAs.",
  },
];

const LANGUAGES_POOL: ReadonlyArray<{ name: string; level: string }> = [
  { name: "English", level: "Native · Professional" },
  { name: "Spanish", level: "Fluent · Professional" },
  { name: "Mandarin", level: "Fluent · Conversational" },
  { name: "Japanese", level: "Intermediate · Conversational" },
  { name: "Hindi", level: "Native · Fluent" },
  { name: "German", level: "Intermediate · Reading" },
  { name: "French", level: "Intermediate · Conversational" },
  { name: "Portuguese", level: "Basic · Reading" },
];

const INTERESTS_POOL = [
  "Long-distance Running",
  "Mechanical Keyboards",
  "Film Photography",
  "Specialty Coffee",
  "Board Games",
  "Vintage Synths",
  "Home Automation",
  "Cycling",
  "Woodworking",
  "Cooking",
  "Electronic Music Production",
  "Chess",
  "Sci-Fi Novels",
  "Trail Running",
  "Open-Source Hardware",
  "Ceramics",
  "Urban Sketching",
  "Astronomy",
];

const TOOLS_POOL = [
  "VS Code",
  "Neovim",
  "iTerm2",
  "Ghostty",
  "Docker Desktop",
  "k9s",
  "Linear",
  "Notion",
  "Figma",
  "Raycast",
  "Obsidian",
  "Slack",
  "GitHub",
  "GitLab",
  "Postman",
  "Insomnia",
  "TablePlus",
  "DBeaver",
  "Datadog",
  "Grafana",
  "Sentry",
  "1Password",
  "Arc",
];

const QUICK_STATS_POOL: ReadonlyArray<{ value: string; label: string }> = [
  { value: "12+", label: "years in software" },
  { value: "40+", label: "services shipped" },
  { value: "3", label: "patents filed" },
  { value: "15", label: "engineers mentored" },
  { value: "6×", label: "hackathon wins" },
  { value: "25+", label: "open-source PRs" },
  { value: "4", label: "conference talks" },
  { value: "99.99%", label: "availability SLO" },
  { value: "2M+", label: "daily users served" },
  { value: "34%", label: "cloud cost reduction" },
];

const EXTRAS_POOL: ReadonlyArray<{ label: string; value: string }> = [
  {
    label: "Publications",
    value:
      "Peer-reviewed papers on streaming systems at SIGMOD 2022 and VLDB 2023 · monthly technical essays on distributed systems internals",
  },
  {
    label: "Speaking",
    value:
      "KubeCon NA 2024 · QCon London 2023 · GopherCon 2022 · internal engineering summits 2020–2024",
  },
  {
    label: "Patents",
    value:
      'US Patent 11,234,567 — "Adaptive rate limiting with eventually-consistent quota propagation"',
  },
  {
    label: "Open Source",
    value:
      "Maintainer of opentel-helpers · contributor to kubernetes/kubernetes, grafana/loki, and vercel/next.js",
  },
  {
    label: "Advisory",
    value:
      "Technical advisor to two early-stage developer-tools startups on platform architecture and GTM",
  },
  {
    label: "Podcasting",
    value:
      "Co-host of the Incident Review podcast — interviews with engineers on post-mortems and reliability work",
  },
];

const VOLUNTEERING_POOL = [
  "Technical mentor for Code Nation, running weekly pairing sessions with high-school engineers from under-represented backgrounds for three consecutive years.",
  "Organising committee for the regional KubeCon community meetup, curating talks and running speaker-coaching workshops for first-time presenters.",
  "Instructor for Rewriting the Code's web-development cohort, teaching the React and testing modules across two consecutive summer programs.",
  "Volunteer code reviewer for the Good Code Project's open-source audit initiative, producing security and architecture reviews for small non-profits.",
  "Board member of the local Girls Who Code chapter, helping scope the annual curriculum and running the year-end showcase event.",
];

const ADVISORY_POOL = [
  "Technical advisor to a Series A developer-tools startup on platform architecture and GTM for their open-source core.",
  "Member of the CNCF's TAG-Observability working group, contributing to the quarterly state-of-observability report.",
  "Program committee reviewer for the O'Reilly conferences on infrastructure and operations tracks.",
  "Guest lecturer for the university's capstone systems course, running a workshop on production-readiness reviews.",
];

function slugifyName(first: string, last: string): string {
  return `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
}

function handle(first: string, last: string): string {
  return `${first}${last}`.toLowerCase().replace(/[^a-z]/g, "");
}

function buildTimeline(): Array<{ start: string; end: string }> {
  const currentYear = new Date().getFullYear();
  const jobs: Array<{ start: string; end: string }> = [];
  let cursorYear = currentYear;
  let cursorMonthIdx = new Date().getMonth();

  // Job 1 (current): started 3-4 years ago
  const j1Length = randInt(3, 4);
  cursorYear -= j1Length;
  cursorMonthIdx = randInt(0, 11);
  jobs.push({
    start: `${MONTHS[cursorMonthIdx]} ${cursorYear}`,
    end: "Present",
  });

  // Jobs 2-5: each 2-3 years, butted up against the next
  for (let i = 1; i < 5; i++) {
    const endYear = cursorYear;
    const endMonthIdx = Math.max(0, cursorMonthIdx - 1);
    const length = randInt(2, 3);
    cursorYear -= length;
    cursorMonthIdx = randInt(0, 11);
    jobs.push({
      start: `${MONTHS[cursorMonthIdx]} ${cursorYear}`,
      end: `${MONTHS[endMonthIdx]} ${endYear}`,
    });
  }

  return jobs;
}

export function generateSampleResume(): ResumeData {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const userSlug = slugifyName(firstName, lastName);
  const userHandle = handle(firstName, lastName);
  const primaryLocation = pick(LOCATIONS);

  const timeline = buildTimeline();
  const companies = sampleN(COMPANIES, 5);
  const jobLocations = sampleN(LOCATIONS, 5);
  const seniorBulletPool = sampleN(SENIOR_BULLETS, SENIOR_BULLETS.length);
  const midBulletPool = sampleN(MID_BULLETS, MID_BULLETS.length);
  const earlyBulletPool = sampleN(EARLY_BULLETS, EARLY_BULLETS.length);
  const juniorBulletPool = sampleN(JUNIOR_BULLETS, JUNIOR_BULLETS.length);

  let seniorCursor = 0;
  let midCursor = 0;
  let earlyCursor = 0;
  const takeSenior = (n: number): string[] => {
    const slice = seniorBulletPool.slice(seniorCursor, seniorCursor + n);
    seniorCursor += n;
    return slice;
  };
  const takeMid = (n: number): string[] => {
    const slice = midBulletPool.slice(midCursor, midCursor + n);
    midCursor += n;
    return slice;
  };
  const takeEarly = (n: number): string[] => {
    const slice = earlyBulletPool.slice(earlyCursor, earlyCursor + n);
    earlyCursor += n;
    return slice;
  };

  const experience: ResumeData["experience"] = [
    {
      id: "e1",
      title: pick(SENIOR_TITLES),
      company: companies[0] as string,
      location: `${jobLocations[0]?.city}, ${jobLocations[0]?.region}`,
      start: timeline[0]?.start ?? "",
      end: timeline[0]?.end ?? "",
      bullets: takeSenior(6),
    },
    {
      id: "e2",
      title: pick(SENIOR_TITLES),
      company: companies[1] as string,
      location: `${jobLocations[1]?.city}, ${jobLocations[1]?.region}`,
      start: timeline[1]?.start ?? "",
      end: timeline[1]?.end ?? "",
      bullets: [...takeSenior(2), ...takeMid(3)],
    },
    {
      id: "e3",
      title: pick(MID_TITLES),
      company: companies[2] as string,
      location: `${jobLocations[2]?.city}, ${jobLocations[2]?.region}`,
      start: timeline[2]?.start ?? "",
      end: timeline[2]?.end ?? "",
      bullets: takeMid(4),
    },
    {
      id: "e4",
      title: pick(EARLY_TITLES),
      company: companies[3] as string,
      location: `${jobLocations[3]?.city}, ${jobLocations[3]?.region}`,
      start: timeline[3]?.start ?? "",
      end: timeline[3]?.end ?? "",
      bullets: takeEarly(3),
    },
    {
      id: "e5",
      title: pick(JUNIOR_TITLES),
      company: companies[4] as string,
      location: `${jobLocations[4]?.city}, ${jobLocations[4]?.region}`,
      start: timeline[4]?.start ?? "",
      end: timeline[4]?.end ?? "",
      bullets: sampleN(juniorBulletPool, 3),
    },
  ];

  // Education dates come before the earliest job
  const earliestJobYearMatch = timeline[4]?.start.match(/(\d{4})$/);
  const earliestJobYear = earliestJobYearMatch
    ? Number.parseInt(earliestJobYearMatch[1] as string, 10)
    : new Date().getFullYear() - 12;
  const mastersEndYear = earliestJobYear;
  const mastersStartYear = mastersEndYear - 2;
  const bachelorsEndYear = mastersStartYear;
  const bachelorsStartYear = bachelorsEndYear - 4;

  const schools = sampleN(UNIVERSITIES, 2);
  const education: ResumeData["education"] = [
    {
      id: "ed1",
      degree: pick(MASTERS_DEGREES),
      school: schools[0]?.name ?? "",
      location: `${schools[0]?.city}, ${schools[0]?.region}`,
      start: String(mastersStartYear),
      end: String(mastersEndYear),
      detail: pick(MASTERS_DETAILS),
    },
    {
      id: "ed2",
      degree: pick(BACHELORS_DEGREES),
      school: schools[1]?.name ?? "",
      location: `${schools[1]?.city}, ${schools[1]?.region}`,
      start: String(bachelorsStartYear),
      end: String(bachelorsEndYear),
      detail: pick(BACHELORS_DETAILS),
    },
  ];

  const projects: ResumeData["projects"] = sampleN(PROJECT_POOL, 8).map((p, i) => ({
    id: `p${i + 1}`,
    name: p.name,
    description: p.description,
    role: p.role,
    stack: p.stack.slice(),
  }));

  const skillGroups = sampleN(SKILL_GROUP_POOL, 10);
  const skills: ResumeData["skills"] = skillGroups.map((g, i) => ({
    id: `s${i + 1}`,
    label: g.label,
    iconName: g.icon,
    items: sampleN(g.items, randInt(6, Math.min(10, g.items.length))).join(", "),
  }));

  const certPool = sampleN(CERTIFICATIONS, 10);
  const certYearBase = new Date().getFullYear() - 1;
  const certifications: ResumeData["certifications"] = certPool.map((c, i) => ({
    id: `ct${i + 1}`,
    issuer: c.issuer,
    name: c.name,
    year: String(certYearBase - i),
  }));

  const awardPool = sampleN(AWARDS, 8);
  const awardYearBase = new Date().getFullYear() - 1;
  const awards: ResumeData["awards"] = awardPool.map((a, i) => ({
    id: `a${i + 1}`,
    title: a.title,
    year: String(awardYearBase - i - randInt(0, 1)),
    detail: a.detail,
  }));

  const languagesChoice = sampleN(LANGUAGES_POOL, randInt(3, 5));
  const languages: ResumeData["languages"] = languagesChoice.map((l, i) => ({
    id: `l${i + 1}`,
    name: l.name,
    level: l.level,
  }));

  const interests = sampleN(INTERESTS_POOL, 6);
  const tools = sampleN(TOOLS_POOL, 12);

  const quickStatsChoice = sampleN(QUICK_STATS_POOL, 6);
  const quickStats: ResumeData["quickStats"] = quickStatsChoice.map((q, i) => ({
    id: `q${i + 1}`,
    value: q.value,
    label: q.label,
  }));

  const extrasChoice = sampleN(EXTRAS_POOL, 4);
  const extras: ResumeData["extras"] = extrasChoice.map((x, i) => ({
    id: `x${i + 1}`,
    label: x.label,
    value: x.value,
  }));

  const custom: ResumeData["custom"] = [
    {
      id: "cu1",
      header: "Volunteering & Community",
      bullets: sampleN(VOLUNTEERING_POOL, 3),
    },
    {
      id: "cu2",
      header: "Advisory & Boards",
      bullets: sampleN(ADVISORY_POOL, 2),
    },
  ];

  const contact: ResumeData["contact"] = [
    {
      id: "c1",
      kind: "email",
      value: `${userSlug}@${userHandle}.dev`,
    },
    {
      id: "c2",
      kind: "phone",
      value: `+1 (${randInt(200, 989)}) ${randInt(200, 989)}-${String(randInt(1000, 9999)).padStart(4, "0")}`,
    },
    {
      id: "c3",
      kind: "location",
      value: `${primaryLocation.city}, ${primaryLocation.region}`,
    },
    { id: "c4", kind: "website", value: `${userHandle}.dev` },
    { id: "c5", kind: "linkedin", value: `linkedin.com/in/${userSlug.replace(/\./g, "-")}` },
    { id: "c6", kind: "github", value: `github.com/${userHandle}` },
    { id: "c7", kind: "medium", value: `medium.com/@${userHandle}` },
  ];

  return {
    profile: {
      name: fullName,
      title: pick(HEADLINES),
      summary: pick(SUMMARIES),
    },
    contact,
    skills,
    experience,
    education,
    projects,
    certifications,
    awards,
    languages,
    interests,
    tools,
    quickStats,
    extras,
    custom,
  };
}
