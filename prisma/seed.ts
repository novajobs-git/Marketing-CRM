import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const S3_BUCKET = process.env.S3_BUCKET ?? "recruitment-crm";

async function uploadObject(key: string, body: Buffer, contentType: string) {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
  }
  await s3.send(
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType })
  );
}

function buildSamplePdf(title: string): Buffer {
  const text = `Sample Resume - ${title}`.replace(/[()\\]/g, "");
  const stream = `BT /F1 20 Tf 72 700 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  objects.forEach((obj, i) => {
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

// TODO(Phase 5 — Supabase/Clerk seed rewrite): identity now lives in Clerk, not here.
// This creates a placeholder-id local mirror row only (no real Clerk account, no
// credentials) — fine for seeding candidate/application/report demo data that FKs
// against a user id, but NOT usable for actually logging in. Real accounts are
// provisioned directly against Clerk (dashboard or Backend API), which is also
// what populates the `users` mirror for real via the webhook / getSession() upsert.
async function upsertUser(opts: {
  name: string;
  email: string;
  role: "ADMIN" | "RECRUITER";
  status?: "ACTIVE" | "INACTIVE";
}) {
  const existing = await db.user.findUnique({ where: { email: opts.email } });
  if (existing) return existing;
  return db.user.create({
    data: {
      id: randomUUID(),
      name: opts.name,
      email: opts.email,
      role: opts.role,
      status: opts.status ?? "ACTIVE",
    },
  });
}

function defaultEeoAnswers(): Prisma.InputJsonValue {
  return {
    gender: "prefer_not_to_say",
    race: "prefer_not_to_say",
    veteranStatus: "not_veteran",
    disabilityStatus: "no",
  };
}

function sampleProfessionalDetails(opts: {
  linkedinSlug: string;
  topSkills: string;
  visaStatus: string;
  salary: string;
}): Prisma.InputJsonValue {
  return {
    linkedin: `linkedin.com/in/${opts.linkedinSlug}`,
    topSkills: opts.topSkills,
    certifications: "",
    drivingLicense: "yes",
    visaStatus: opts.visaStatus,
    eadEndDate: "",
    salaryExpectation: opts.salary,
    openToRelocate: "no",
    preferredCitiesStates: "",
    jobSearchPriorities: "Remote-friendly role with growth potential.",
  };
}

function sampleEducationHistory(school: string, degree: string, major: string): Prisma.InputJsonValue {
  return [
    { school, degree, major, gpa: "3.6", startDate: "2016-09-01", endDate: "2020-05-15" },
    { school: "", degree: "", major: "", gpa: "", startDate: "", endDate: "" },
  ];
}

async function seedCandidate(opts: {
  name: string;
  role: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  status: "ACTIVE" | "UNASSIGNED" | "ARCHIVED";
  assignedRecruiterId: string | null;
  visaStatus: string;
  salary: string;
  topSkills: string;
  school: string;
  degree: string;
  major: string;
}) {
  const existing = await db.candidateProfile.findFirst({ where: { name: opts.name } });
  if (existing) return existing;

  const slug = opts.name.toLowerCase().replace(/\s+/g, "-");
  const candidate = await db.candidateProfile.create({
    data: {
      name: opts.name,
      role: opts.role,
      address: `${opts.street}, ${opts.city}`,
      state: opts.state,
      zipCode: opts.zipCode,
      phone: opts.phone,
      email: opts.email,
      dob: new Date("1994-03-12"),
      status: opts.status,
      assignedRecruiterId: opts.assignedRecruiterId,
      archivedAt: opts.status === "ARCHIVED" ? new Date() : null,
      eeoAnswers: defaultEeoAnswers(),
      applicationQa: sampleProfessionalDetails({
        linkedinSlug: slug,
        topSkills: opts.topSkills,
        visaStatus: opts.visaStatus,
        salary: opts.salary,
      }),
      educationHistory: sampleEducationHistory(opts.school, opts.degree, opts.major),
    },
  });

  const pdf = buildSamplePdf(opts.name);
  const storageKey = `candidates/${candidate.id}/${Date.now()}-resume.pdf`;
  await uploadObject(storageKey, pdf, "application/pdf");
  await db.resumeFile.create({
    data: {
      candidateId: candidate.id,
      storageKey,
      filename: `${opts.name.replace(/\s+/g, "_")}_Resume.pdf`,
      mimeType: "application/pdf",
      sizeBytes: pdf.byteLength,
      isTailoredVersion: false,
    },
  });

  return candidate;
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  await upsertUser({ name: "Admin", email: adminEmail, role: "ADMIN" });
  console.log(`Admin mirror row: ${adminEmail} (no local credentials — auth is via Clerk)`);

  const recruiter1 = await upsertUser({
    name: "Priya Nair",
    email: "priya@example.com",
    role: "RECRUITER",
  });
  const recruiter2 = await upsertUser({
    name: "Marcus Webb",
    email: "marcus@example.com",
    role: "RECRUITER",
  });
  await upsertUser({
    name: "Sam Torres",
    email: "sam@example.com",
    role: "RECRUITER",
    status: "INACTIVE",
  });
  console.log("Recruiter mirror rows: priya@example.com, marcus@example.com (active), sam@example.com (inactive)");
  console.log("            sam@example.com (inactive) / Recruiter123!");

  const candidates: Array<Parameters<typeof seedCandidate>[0]> = [
    {
      name: "Alice Johnson",
      role: "Software Engineer",
      street: "221 Baker St",
      city: "Springfield",
      state: "IL",
      zipCode: "62701",
      phone: "217-555-0142",
      email: "alice.johnson@example.com",
      status: "ACTIVE",
      assignedRecruiterId: recruiter1.id,
      visaStatus: "us_citizen",
      salary: "110000",
      topSkills: "React, TypeScript, Node.js, GraphQL, AWS",
      school: "University of Illinois",
      degree: "B.S.",
      major: "Computer Science",
    },
    {
      name: "Brian Smith",
      role: "Product Manager",
      street: "18 Elm St",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      phone: "512-555-0198",
      email: "brian.smith@example.com",
      status: "ACTIVE",
      assignedRecruiterId: recruiter1.id,
      visaStatus: "us_citizen",
      salary: "125000",
      topSkills: "Roadmapping, Agile, SQL, User Research, A/B Testing",
      school: "University of Texas at Austin",
      degree: "B.B.A.",
      major: "Business Administration",
    },
    {
      name: "Carla Diaz",
      role: "Data Analyst",
      street: "4 Market St",
      city: "Denver",
      state: "CO",
      zipCode: "80202",
      phone: "303-555-0110",
      email: "carla.diaz@example.com",
      status: "ACTIVE",
      assignedRecruiterId: recruiter2.id,
      visaStatus: "green_card",
      salary: "95000",
      topSkills: "Python, SQL, Tableau, Excel, Statistics",
      school: "Colorado State University",
      degree: "B.S.",
      major: "Statistics",
    },
    {
      name: "David Chen",
      role: "UX Designer",
      street: "77 Pine Ave",
      city: "Seattle",
      state: "WA",
      zipCode: "98101",
      phone: "206-555-0133",
      email: "david.chen@example.com",
      status: "ACTIVE",
      assignedRecruiterId: recruiter2.id,
      visaStatus: "h1b",
      salary: "105000",
      topSkills: "Figma, User Research, Prototyping, Design Systems, HTML/CSS",
      school: "University of Washington",
      degree: "B.F.A.",
      major: "Design",
    },
    {
      name: "Emily Turner",
      role: "Marketing Specialist",
      street: "9 Oak Dr",
      city: "Portland",
      state: "OR",
      zipCode: "97201",
      phone: "503-555-0177",
      email: "emily.turner@example.com",
      status: "UNASSIGNED",
      assignedRecruiterId: null,
      visaStatus: "us_citizen",
      salary: "70000",
      topSkills: "SEO, Content Strategy, HubSpot, Analytics, Copywriting",
      school: "Portland State University",
      degree: "B.A.",
      major: "Marketing",
    },
    {
      name: "Frank Wright",
      role: "DevOps Engineer",
      street: "312 Cedar Ln",
      city: "Raleigh",
      state: "NC",
      zipCode: "27601",
      phone: "919-555-0166",
      email: "frank.wright@example.com",
      status: "UNASSIGNED",
      assignedRecruiterId: null,
      visaStatus: "ead",
      salary: "115000",
      topSkills: "Kubernetes, Terraform, AWS, CI/CD, Docker",
      school: "North Carolina State University",
      degree: "B.S.",
      major: "Computer Engineering",
    },
    {
      name: "Grace Kim",
      role: "Sales Representative",
      street: "56 Birch Blvd",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      phone: "312-555-0188",
      email: "grace.kim@example.com",
      status: "ARCHIVED",
      assignedRecruiterId: recruiter1.id,
      visaStatus: "us_citizen",
      salary: "65000",
      topSkills: "Salesforce, Cold Outreach, Negotiation, CRM, Presentations",
      school: "DePaul University",
      degree: "B.A.",
      major: "Communications",
    },
    {
      name: "Henry Lopez",
      role: "Business Analyst",
      street: "88 Maple Ct",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      phone: "305-555-0155",
      email: "henry.lopez@example.com",
      status: "ACTIVE",
      assignedRecruiterId: recruiter2.id,
      visaStatus: "opt",
      salary: "90000",
      topSkills: "SQL, Power BI, Requirements Gathering, JIRA, Process Mapping",
      school: "Florida International University",
      degree: "B.S.",
      major: "Business Analytics",
    },
  ];

  for (const c of candidates) {
    await seedCandidate(c);
  }
  console.log(`Seeded ${candidates.length} candidate profiles with sample resumes.`);

  // FR-4.x — a couple of pending intake submissions to exercise the review flow.
  const pendingIntakeExists = await db.intakeSubmission.findFirst({
    where: { status: "PENDING" },
  });
  if (!pendingIntakeExists) {
    const intakeCandidates = [
      { name: "Isabella Moore", role: "Frontend Developer" },
      { name: "Jason Patel", role: "Recruiting Coordinator" },
    ];
    for (const ic of intakeCandidates) {
      const pdf = buildSamplePdf(ic.name);
      const storageKey = `intake/${Date.now()}-${ic.name.replace(/\s+/g, "_")}.pdf`;
      await uploadObject(storageKey, pdf, "application/pdf");
      await db.intakeSubmission.create({
        data: {
          status: "PENDING",
          submittedData: {
            name: ic.name,
            role: ic.role,
            phone: "555-010-0100",
            email: `${ic.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
            dob: "1996-01-01T00:00:00.000Z",
            address: "1 Candidate Way",
            state: "NY",
            zipCode: "10001",
            eeoAnswers: defaultEeoAnswers(),
            applicationQa: sampleProfessionalDetails({
              linkedinSlug: ic.name.toLowerCase().replace(/\s+/g, "-"),
              topSkills: "Communication, Organization, Microsoft Office",
              visaStatus: "us_citizen",
              salary: "60000",
            }),
            educationHistory: sampleEducationHistory("State University", "B.A.", "General Studies"),
            resume: {
              storageKey,
              filename: `${ic.name.replace(/\s+/g, "_")}_Resume.pdf`,
              mimeType: "application/pdf",
              sizeBytes: pdf.byteLength,
            },
          },
        },
      });
    }
    console.log(`Seeded ${intakeCandidates.length} pending intake submissions for review.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
