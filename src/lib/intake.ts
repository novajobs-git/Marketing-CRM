import type { EeoAnswers, ProfessionalDetails, EducationEntry } from "@/lib/candidate-fields";

export type IntakeSubmittedData = {
  name: string;
  role: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  state: string;
  zipCode: string;
  eeoAnswers: EeoAnswers;
  applicationQa: ProfessionalDetails;
  educationHistory: EducationEntry[];
  resume: {
    storageKey: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
  };
};
