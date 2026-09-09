"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { LabeledSelect } from "@/components/labeled-select";
import { ResumeFileUpload } from "@/components/resume-file-upload";
import {
  EducationHistoryFields,
  emptyEducationHistory,
} from "@/components/education-history-fields";
import {
  VISA_STATUS_OPTIONS,
  YES_NO_OPTIONS,
  GENDER_OPTIONS,
  RACE_OPTIONS,
  VETERAN_STATUS_OPTIONS,
  DISABILITY_STATUS_OPTIONS,
  type EeoAnswers,
  type ProfessionalDetails,
  type EducationEntry,
} from "@/lib/candidate-fields";

export type CandidateDetailDefaults = {
  name: string;
  role: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  state: string;
  zipCode: string;
  eeoAnswers: EeoAnswers;
  professionalDetails: ProfessionalDetails;
  educationHistory: [EducationEntry, EducationEntry];
  existingResumeFilename?: string;
};

export function CandidateDetailFields({ defaultValues }: { defaultValues?: CandidateDetailDefaults }) {
  const [drivingLicense, setDrivingLicense] = useState(
    defaultValues?.professionalDetails.drivingLicense ?? ""
  );
  const [visaStatus, setVisaStatus] = useState(defaultValues?.professionalDetails.visaStatus ?? "");
  const [openToRelocate, setOpenToRelocate] = useState(
    defaultValues?.professionalDetails.openToRelocate ?? ""
  );
  const [gender, setGender] = useState(defaultValues?.eeoAnswers.gender ?? "");
  const [race, setRace] = useState(defaultValues?.eeoAnswers.race ?? "");
  const [veteranStatus, setVeteranStatus] = useState(defaultValues?.eeoAnswers.veteranStatus ?? "");
  const [disabilityStatus, setDisabilityStatus] = useState(
    defaultValues?.eeoAnswers.disabilityStatus ?? ""
  );
  const [educationHistory, setEducationHistory] = useState<[EducationEntry, EducationEntry]>(
    defaultValues?.educationHistory ?? emptyEducationHistory()
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground">Personal details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required defaultValue={defaultValues?.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" required defaultValue={defaultValues?.phone} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue={defaultValues?.email} />
          </div>
          <DatePicker label="DOB" name="dob" isRequired defaultValue={defaultValues?.dob} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" required defaultValue={defaultValues?.address} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" required defaultValue={defaultValues?.state} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="zipCode">Zip code</Label>
            <Input id="zipCode" name="zipCode" required defaultValue={defaultValues?.zipCode} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-foreground">Professional details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="role">Target Job Title</Label>
            <Input id="role" name="role" required defaultValue={defaultValues?.role} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" defaultValue={defaultValues?.professionalDetails.linkedin} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="topSkills">Top 5 Skills</Label>
          <Textarea
            id="topSkills"
            name="topSkills"
            required
            rows={2}
            defaultValue={defaultValues?.professionalDetails.topSkills}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="certifications">Certifications</Label>
          <Textarea
            id="certifications"
            name="certifications"
            rows={2}
            defaultValue={defaultValues?.professionalDetails.certifications}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabeledSelect
            name="drivingLicense"
            label="Driving Licence"
            value={drivingLicense}
            onChange={setDrivingLicense}
            options={YES_NO_OPTIONS}
          />
          <LabeledSelect
            name="visaStatus"
            label="Visa Status"
            value={visaStatus}
            onChange={setVisaStatus}
            options={VISA_STATUS_OPTIONS}
          />
          <DatePicker
            label="EAD End Date"
            name="eadEndDate"
            defaultValue={defaultValues?.professionalDetails.eadEndDate}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="salaryExpectation">Salary Expectation</Label>
            <Input
              id="salaryExpectation"
              name="salaryExpectation"
              type="number"
              required
              placeholder="100000"
              defaultValue={defaultValues?.professionalDetails.salaryExpectation}
            />
            <p className="text-xs text-muted-foreground">Write numbers only (e.g. 100,000)</p>
          </div>
          <LabeledSelect
            name="openToRelocate"
            label="Open to Relocate"
            value={openToRelocate}
            onChange={setOpenToRelocate}
            options={YES_NO_OPTIONS}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="preferredCitiesStates">Preferred Cities/States</Label>
          <Textarea
            id="preferredCitiesStates"
            name="preferredCitiesStates"
            rows={2}
            defaultValue={defaultValues?.professionalDetails.preferredCitiesStates}
          />
        </div>
        <ResumeFileUpload
          required={!defaultValues?.existingResumeFilename}
          existingFilename={defaultValues?.existingResumeFilename}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="jobSearchPriorities">Job Search Priorities</Label>
          <p className="text-xs text-muted-foreground">Tell us what you&apos;re looking for in a new role</p>
          <Textarea
            id="jobSearchPriorities"
            name="jobSearchPriorities"
            required
            rows={2}
            defaultValue={defaultValues?.professionalDetails.jobSearchPriorities}
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">Education History</h2>
          <p className="text-xs text-muted-foreground">
            List your educational qualifications (add up to two entries).
          </p>
        </div>
        <EducationHistoryFields value={educationHistory} onChange={setEducationHistory} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">EEO Information</h2>
          <p className="text-xs text-muted-foreground">
            Provide Equal Employment Opportunity information. This data is used for compliance
            and reporting purposes only.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <LabeledSelect
            name="gender"
            label="EEO: Gender"
            value={gender}
            onChange={setGender}
            options={GENDER_OPTIONS}
          />
          <LabeledSelect
            name="race"
            label="EEO: Race"
            value={race}
            onChange={setRace}
            options={RACE_OPTIONS}
          />
          <LabeledSelect
            name="veteranStatus"
            label="EEO: Veteran Status"
            value={veteranStatus}
            onChange={setVeteranStatus}
            options={VETERAN_STATUS_OPTIONS}
          />
          <LabeledSelect
            name="disabilityStatus"
            label="EEO: Disability Status"
            value={disabilityStatus}
            onChange={setDisabilityStatus}
            options={DISABILITY_STATUS_OPTIONS}
          />
        </div>
      </section>
    </div>
  );
}
