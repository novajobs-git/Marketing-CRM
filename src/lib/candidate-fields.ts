// Canonical candidate-detail field definitions, mirrored from the org's real
// intake form. Drives the admin/public intake forms, the Details tab display,
// and checklist templates (which reference fields by `key`).

export const DECLINE = "prefer_not_to_say";

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  key: string;
  section: "personal" | "professional" | "education" | "eeo";
  label: string;
  type: "text" | "textarea" | "date" | "number" | "select" | "file" | "education-history";
  required: boolean;
  options?: readonly FieldOption[];
  helpText?: string;
};

export const VISA_STATUS_OPTIONS: readonly FieldOption[] = [
  { value: "green_card", label: "Green Card" },
  { value: "h1b", label: "H1B" },
  { value: "f1", label: "F1" },
  { value: "ead", label: "EAD" },
  { value: "other", label: "Other" },
  { value: "us_citizen", label: "US Citizen" },
  { value: "opt", label: "OPT" },
  { value: "h4_ead", label: "H4 EAD" },
];

export const YES_NO_OPTIONS: readonly FieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export const GENDER_OPTIONS: readonly FieldOption[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: DECLINE, label: "Prefer not to say" },
];

export const RACE_OPTIONS: readonly FieldOption[] = [
  { value: "white", label: "White" },
  { value: "black_african_american", label: "Black or African American" },
  { value: "asian", label: "Asian" },
  { value: "hispanic_latino", label: "Hispanic or Latino" },
  { value: "native_american", label: "Native American" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "other", label: "Other" },
  { value: DECLINE, label: "Prefer not to say" },
];

export const VETERAN_STATUS_OPTIONS: readonly FieldOption[] = [
  { value: "veteran", label: "Veteran" },
  { value: "not_veteran", label: "Not a Veteran" },
  { value: DECLINE, label: "Prefer not to say" },
];

export const DISABILITY_STATUS_OPTIONS: readonly FieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: DECLINE, label: "Prefer not to say" },
];

export const US_STATE_OPTIONS: readonly FieldOption[] = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA",
  "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM",
  "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA",
  "WV", "WI", "WY",
].map((abbr) => ({ value: abbr, label: abbr }));

// Personal details — top-level CandidateProfile columns, plus a few
// (addressLine2/city/github/otherLinks) that fold into the applicationQa
// JSON blob since there's no dedicated column for them.
export const PERSONAL_FIELDS: readonly FieldDef[] = [
  { key: "name", section: "personal", label: "Full Name", type: "text", required: true },
  { key: "phone", section: "personal", label: "Phone", type: "text", required: true },
  { key: "email", section: "personal", label: "Email", type: "text", required: true },
  { key: "linkedin", section: "personal", label: "LinkedIn", type: "text", required: true },
  { key: "github", section: "personal", label: "GitHub", type: "text", required: false },
  { key: "dob", section: "personal", label: "DOB", type: "date", required: true },
  { key: "otherLinks", section: "personal", label: "Any other links", type: "textarea", required: false },
  { key: "address", section: "personal", label: "Address Line 1", type: "text", required: true },
  { key: "addressLine2", section: "personal", label: "Address Line 2", type: "text", required: false },
  { key: "city", section: "personal", label: "City", type: "text", required: true },
  { key: "state", section: "personal", label: "State", type: "select", required: true, options: US_STATE_OPTIONS },
  { key: "zipCode", section: "personal", label: "Zip code", type: "text", required: true },
];

// Professional details — top-level `role`, the rest live in `applicationQa` JSON.
export const PROFESSIONAL_FIELDS: readonly FieldDef[] = [
  { key: "role", section: "professional", label: "Target Job Title", type: "text", required: true },
  { key: "topSkills", section: "professional", label: "Top 5 Skills", type: "textarea", required: true },
  { key: "certifications", section: "professional", label: "Certifications", type: "textarea", required: true },
  { key: "drivingLicense", section: "professional", label: "Driving Licence", type: "select", required: true, options: YES_NO_OPTIONS },
  { key: "visaStatus", section: "professional", label: "Visa Status", type: "select", required: true, options: VISA_STATUS_OPTIONS },
  { key: "eadEndDate", section: "professional", label: "EAD End Date", type: "date", required: true },
  {
    key: "salaryExpectation",
    section: "professional",
    label: "Salary Expectation",
    type: "number",
    required: true,
    helpText: "Write numbers only (e.g. 100,000)",
  },
  { key: "openToRelocate", section: "professional", label: "Open to Relocate", type: "select", required: true, options: YES_NO_OPTIONS },
  { key: "preferredCitiesStates", section: "professional", label: "Preferred Cities/States", type: "textarea", required: false },
  { key: "resume", section: "professional", label: "Resume Upload", type: "file", required: true },
  {
    key: "jobSearchPriorities",
    section: "professional",
    label: "Job Search Priorities",
    type: "textarea",
    required: true,
    helpText: "Tell us what you're looking for in a new role",
  },
];

// Education history — up to two entries, stored as `educationHistory` JSON array.
export const EDUCATION_FIELD: FieldDef = {
  key: "educationHistory",
  section: "education",
  label: "Education History",
  type: "education-history",
  required: true,
};

export type EducationEntry = {
  school: string;
  degree: string;
  major: string;
  gpa: string;
  startDate: string;
  endDate: string;
};

export const EMPTY_EDUCATION_ENTRY: EducationEntry = {
  school: "",
  degree: "",
  major: "",
  gpa: "",
  startDate: "",
  endDate: "",
};

// EEO — stored in `eeoAnswers` JSON.
export const EEO_FIELDS: readonly FieldDef[] = [
  { key: "gender", section: "eeo", label: "EEO: Gender", type: "select", required: true, options: GENDER_OPTIONS },
  { key: "race", section: "eeo", label: "EEO: Race", type: "select", required: true, options: RACE_OPTIONS },
  { key: "veteranStatus", section: "eeo", label: "EEO: Veteran Status", type: "select", required: true, options: VETERAN_STATUS_OPTIONS },
  { key: "disabilityStatus", section: "eeo", label: "EEO: Disability Status", type: "select", required: true, options: DISABILITY_STATUS_OPTIONS },
];

export const ALL_FIELDS: readonly FieldDef[] = [
  ...PERSONAL_FIELDS,
  ...PROFESSIONAL_FIELDS,
  EDUCATION_FIELD,
  ...EEO_FIELDS,
];

// Every checklist link collects these regardless of which template it uses —
// the minimum a submission needs to become a valid candidate profile once an
// admin approves it (mirrors the public /intake form's required core fields).
// A template only controls which ADDITIONAL fields also get requested.
export const CHECKLIST_ALWAYS_INCLUDED_KEYS: readonly string[] = [
  ...PERSONAL_FIELDS.map((f) => f.key),
  "role",
  "resume",
];

/** Resolves the actual set of fields a checklist link renders: the always-included
 *  core fields plus whatever extra fields its template selected. */
export function getChecklistFields(templateFieldKeys: readonly string[]): FieldDef[] {
  return ALL_FIELDS.filter(
    (f) => CHECKLIST_ALWAYS_INCLUDED_KEYS.includes(f.key) || templateFieldKeys.includes(f.key)
  );
}

export type EeoAnswers = {
  gender: string;
  race: string;
  veteranStatus: string;
  disabilityStatus: string;
};

export type ProfessionalDetails = {
  linkedin: string;
  topSkills: string;
  certifications: string;
  drivingLicense: string;
  visaStatus: string;
  eadEndDate: string;
  salaryExpectation: string;
  openToRelocate: string;
  preferredCitiesStates: string;
  jobSearchPriorities: string;
  // Fold into this same flexible JSON blob rather than adding database
  // columns — optional so existing intake/edit submissions (which never set
  // these) still satisfy the type.
  github?: string;
  otherLinks?: string;
  addressLine2?: string;
  city?: string;
};

export function optionLabel(options: readonly FieldOption[] | undefined, value: string | undefined | null) {
  if (!value) return "—";
  return options?.find((o) => o.value === value)?.label ?? value;
}
