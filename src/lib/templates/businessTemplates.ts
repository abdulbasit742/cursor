import { registerTemplate, type ProjectTemplate } from "./templateRegistry";

interface BusinessTemplateConfig {
  id: string;
  name: string;
  category: string;
  accent: string;
  entities: string[];
  metrics: string[];
}

const businessTemplateConfigs: BusinessTemplateConfig[] = [
  {
    id: "crm-command-center",
    name: "CRM Command Center",
    category: "crm",
    accent: "orange",
    entities: ["customers", "opportunities", "notes"],
    metrics: ["active customers", "won deals", "open pipeline"],
  },
  {
    id: "learning-platform",
    name: "Learning Platform",
    category: "learning",
    accent: "blue",
    entities: ["courses", "students", "lessons"],
    metrics: ["active students", "course completions", "lesson progress"],
  },
  {
    id: "recruitment-tracker",
    name: "Recruitment Tracker",
    category: "recruitment",
    accent: "violet",
    entities: ["candidates", "jobs", "interviews"],
    metrics: ["open roles", "screened candidates", "scheduled interviews"],
  },
  {
    id: "travel-booking-suite",
    name: "Travel Booking Suite",
    category: "travel",
    accent: "cyan",
    entities: ["bookings", "packages", "travelers"],
    metrics: ["active bookings", "package revenue", "traveler count"],
  },
  {
    id: "automotive-service-desk",
    name: "Automotive Service Desk",
    category: "automotive",
    accent: "red",
    entities: ["vehicles", "mechanics", "invoices"],
    metrics: ["vehicles in service", "mechanic capacity", "invoice value"],
  },
  {
    id: "fitness-member-hub",
    name: "Fitness Member Hub",
    category: "fitness",
    accent: "green",
    entities: ["members", "programs", "attendance"],
    metrics: ["active members", "program enrollments", "attendance rate"],
  },
  {
    id: "restaurant-ops-board",
    name: "Restaurant Ops Board",
    category: "restaurant",
    accent: "amber",
    entities: ["orders", "menu items", "deliveries"],
    metrics: ["today orders", "menu revenue", "delivery queue"],
  },
  {
    id: "finance-control-room",
    name: "Finance Control Room",
    category: "finance",
    accent: "emerald",
    entities: ["expenses", "budgets", "invoices"],
    metrics: ["monthly spend", "budget usage", "invoice total"],
  },
  {
    id: "events-operations-kit",
    name: "Events Operations Kit",
    category: "events",
    accent: "pink",
    entities: ["events", "tickets", "schedules"],
    metrics: ["upcoming events", "tickets sold", "scheduled sessions"],
  },
  {
    id: "logistics-command-board",
    name: "Logistics Command Board",
    category: "logistics",
    accent: "sky",
    entities: ["shipments", "drivers", "inventory"],
    metrics: ["active shipments", "driver load", "stock alerts"],
  },
  {
    id: "healthcare-patient-desk",
    name: "Healthcare Patient Desk",
    category: "healthcare",
    accent: "teal",
    entities: ["patients", "doctors", "prescriptions"],
    metrics: ["patient count", "doctor availability", "prescriptions due"],
  },
  {
    id: "real-estate-portfolio",
    name: "Real Estate Portfolio",
    category: "realestate",
    accent: "slate",
    entities: ["properties", "tenants", "maintenance"],
    metrics: ["occupied units", "rent roll", "maintenance tickets"],
  },
  {
    id: "hospitality-guest-hub",
    name: "Hospitality Guest Hub",
    category: "hospitality",
    accent: "indigo",
    entities: ["guests", "staff", "service requests"],
    metrics: ["checked-in guests", "staff coverage", "open requests"],
  },
];

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

function createTemplate(config: BusinessTemplateConfig): ProjectTemplate {
  const componentName = `${toPascalCase(config.category)}Dashboard`;
  const typeName = `${toPascalCase(config.category)}Entity`;
  const basePath = `src/generated/${config.category}`;

  return {
    id: config.id,
    name: config.name,
    description: `A production-style ${config.category} starter with typed entities, dashboard layout, and business metrics.`,
    category: config.category,
    tags: ["business", "dashboard", "template", config.category, "typescript"],
    createdAt: "2026-05-17T00:00:00.000Z",
    files: {
      "README.md": `# ${config.name}

This starter was generated from the ARIA captured template catalog.

## Includes

- Typed ${config.category} entities
- Dashboard-ready metrics
- Reusable data seed
- Next.js App Router page
`,
      [`${basePath}/types.ts`]: `export type ${typeName}Status = "new" | "active" | "paused" | "closed";

export interface ${typeName} {
  id: string;
  title: string;
  owner: string;
  status: ${typeName}Status;
  value: number;
  updatedAt: string;
}

export interface ${toPascalCase(config.category)}Metric {
  label: string;
  value: string;
  tone: "${config.accent}" | "neutral";
}
`,
      [`${basePath}/data.ts`]: `import type { ${typeName}, ${toPascalCase(config.category)}Metric } from "./types";

export const ${config.category}Entities: ${typeName}[] = [
${config.entities
  .map(
    (entity, index) => `  {
    id: "${config.category}-${index + 1}",
    title: "${entity.charAt(0).toUpperCase()}${entity.slice(1)}",
    owner: "Team ${index + 1}",
    status: "${index === 0 ? "active" : index === 1 ? "new" : "paused"}",
    value: ${(index + 1) * 1250},
    updatedAt: new Date().toISOString(),
  }`
  )
  .join(",\n")}
];

export const ${config.category}Metrics: ${toPascalCase(config.category)}Metric[] = [
${config.metrics
  .map(
    (metric, index) => `  {
    label: "${metric}",
    value: "${index === 0 ? "24" : index === 1 ? "$18.4k" : "91%"}",
    tone: "${index === 0 ? config.accent : "neutral"}",
  }`
  )
  .join(",\n")}
];
`,
      [`${basePath}/Dashboard.tsx`]: `"use client";

import { ${config.category}Entities, ${config.category}Metrics } from "./data";

export function ${componentName}() {
  return (
    <main className="min-h-screen bg-gray-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-wide text-gray-500">${config.category}</p>
          <h1 className="text-3xl font-semibold">${config.name}</h1>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          {${config.category}Metrics.map((metric) => (
            <article key={metric.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-400">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold">{metric.value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900">
          {${config.category}Entities.map((entity) => (
            <article key={entity.id} className="flex items-center justify-between border-b border-gray-800 p-4 last:border-b-0">
              <div>
                <h2 className="font-medium">{entity.title}</h2>
                <p className="text-sm text-gray-500">{entity.owner}</p>
              </div>
              <span className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300">
                {entity.status}
              </span>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
`,
      "src/app/page.tsx": `import { ${componentName} } from "${basePath.replace("src/", "@/")}/Dashboard";

export default function Page() {
  return <${componentName} />;
}
`,
    },
  };
}

export const businessTemplates: ProjectTemplate[] = businessTemplateConfigs.map(createTemplate);

let registered = false;

export function registerBusinessTemplates(): ProjectTemplate[] {
  if (!registered) {
    businessTemplates.forEach((template) => registerTemplate(template));
    registered = true;
  }

  return businessTemplates;
}
