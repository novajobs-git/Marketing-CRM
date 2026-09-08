import { IntakeForm } from "@/components/intake-form";

export default function IntakePage() {
  return (
    <main className="flex min-h-full flex-1 justify-center bg-background px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Candidate application
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about yourself and upload your resume to get started.
          </p>
        </div>

        <IntakeForm />
      </div>
    </main>
  );
}
