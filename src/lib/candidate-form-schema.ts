import { z } from "zod";
import { EMPTY_EDUCATION_ENTRY, type EeoAnswers, type ProfessionalDetails, type EducationEntry } from "@/lib/candidate-fields";

// Shared shape for every place a full candidate-detail form is submitted:
// admin create/edit, the public intake form, and checklist link submissions.
export const candidateDetailSchema = z.object({
  name: z.string().trim().min(1, "Full name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  email: z.string().trim().email("Enter a valid email."),
  dob: z.string().trim().min(1, "DOB is required."),
  address: z.string().trim().min(1, "Address is required."),
  state: z.string().trim().min(1, "State is required."),
  zipCode: z.string().trim().min(1, "Zip code is required."),
  role: z.string().trim().min(1, "Target job title is required."),
  linkedin: z.string().trim().optional(),
  topSkills: z.string().trim().min(1, "Top 5 skills is required."),
  certifications: z.string().trim().optional(),
  drivingLicense: z.string().trim().min(1, "Driving licence is required."),
  visaStatus: z.string().trim().min(1, "Visa status is required."),
  eadEndDate: z.string().trim().optional(),
  salaryExpectation: z.string().trim().min(1, "Salary expectation is required."),
  openToRelocate: z.string().trim().min(1, "Open to relocate is required."),
  preferredCitiesStates: z.string().trim().optional(),
  jobSearchPriorities: z.string().trim().min(1, "Job search priorities is required."),
  gender: z.string().trim().min(1),
  race: z.string().trim().min(1),
  veteranStatus: z.string().trim().min(1),
  disabilityStatus: z.string().trim().min(1),
  educationHistory: z.string().trim().min(1),
});

export type CandidateDetailInput = z.infer<typeof candidateDetailSchema>;

export function parseCandidateDetailForm(formData: FormData) {
  return candidateDetailSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    dob: formData.get("dob"),
    address: formData.get("address"),
    state: formData.get("state"),
    zipCode: formData.get("zipCode"),
    role: formData.get("role"),
    linkedin: formData.get("linkedin") ?? undefined,
    topSkills: formData.get("topSkills"),
    certifications: formData.get("certifications") ?? undefined,
    drivingLicense: formData.get("drivingLicense"),
    visaStatus: formData.get("visaStatus"),
    eadEndDate: formData.get("eadEndDate") ?? undefined,
    salaryExpectation: formData.get("salaryExpectation"),
    openToRelocate: formData.get("openToRelocate"),
    preferredCitiesStates: formData.get("preferredCitiesStates") ?? undefined,
    jobSearchPriorities: formData.get("jobSearchPriorities"),
    gender: formData.get("gender"),
    race: formData.get("race"),
    veteranStatus: formData.get("veteranStatus"),
    disabilityStatus: formData.get("disabilityStatus"),
    educationHistory: formData.get("educationHistory"),
  });
}

/** Converts validated form input into the CandidateProfile column/JSON shape. */
export function candidateDetailToDbFields(data: CandidateDetailInput) {
  let educationHistory: unknown = [];
  try {
    educationHistory = JSON.parse(data.educationHistory);
  } catch {
    // leave as empty array if somehow malformed
  }

  return {
    name: data.name,
    role: data.role,
    phone: data.phone,
    email: data.email,
    dob: new Date(data.dob),
    address: data.address,
    state: data.state,
    zipCode: data.zipCode,
    eeoAnswers: {
      gender: data.gender,
      race: data.race,
      veteranStatus: data.veteranStatus,
      disabilityStatus: data.disabilityStatus,
    },
    applicationQa: {
      linkedin: data.linkedin || "",
      topSkills: data.topSkills,
      certifications: data.certifications || "",
      drivingLicense: data.drivingLicense,
      visaStatus: data.visaStatus,
      eadEndDate: data.eadEndDate || "",
      salaryExpectation: data.salaryExpectation,
      openToRelocate: data.openToRelocate,
      preferredCitiesStates: data.preferredCitiesStates || "",
      jobSearchPriorities: data.jobSearchPriorities,
    },
    educationHistory,
  };
}

type CandidateRecordLike = {
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  dob: Date | null;
  address: string | null;
  state: string | null;
  zipCode: string | null;
  eeoAnswers: unknown;
  applicationQa: unknown;
  educationHistory: unknown;
};

const emptyProfessionalDetails: ProfessionalDetails = {
  linkedin: "",
  topSkills: "",
  certifications: "",
  drivingLicense: "",
  visaStatus: "",
  eadEndDate: "",
  salaryExpectation: "",
  openToRelocate: "",
  preferredCitiesStates: "",
  jobSearchPriorities: "",
};

const emptyEeoAnswers: EeoAnswers = {
  gender: "",
  race: "",
  veteranStatus: "",
  disabilityStatus: "",
};

/** Builds the form-default shape (all strings) from a stored CandidateProfile record. */
export function candidateToFormDefaults(candidate: CandidateRecordLike) {
  const professionalDetails = {
    ...emptyProfessionalDetails,
    ...((candidate.applicationQa as Partial<ProfessionalDetails> | null) ?? {}),
  };
  const eeoAnswers = {
    ...emptyEeoAnswers,
    ...((candidate.eeoAnswers as Partial<EeoAnswers> | null) ?? {}),
  };
  const rawEducation = (candidate.educationHistory as EducationEntry[] | null) ?? [];
  const educationHistory: [EducationEntry, EducationEntry] = [
    { ...EMPTY_EDUCATION_ENTRY, ...(rawEducation[0] ?? {}) },
    { ...EMPTY_EDUCATION_ENTRY, ...(rawEducation[1] ?? {}) },
  ];

  return {
    name: candidate.name,
    role: candidate.role,
    phone: candidate.phone ?? "",
    email: candidate.email ?? "",
    dob: candidate.dob ? candidate.dob.toISOString().slice(0, 10) : "",
    address: candidate.address ?? "",
    state: candidate.state ?? "",
    zipCode: candidate.zipCode ?? "",
    eeoAnswers,
    professionalDetails,
    educationHistory,
  };
}
