"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Set once Clerk asks for a device-trust code — happens the first time a
  // browser/device signs in, per https://clerk.com/docs/guides/secure/device-trust.
  const [needsDeviceTrustCode, setNeedsDeviceTrustCode] = useState(false);

  const submitting = fetchStatus === "fetching";

  async function completeSignIn() {
    if (!signIn) return;

    if (signIn.status === "needs_client_trust") {
      setNeedsDeviceTrustCode(true);
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) setError(sendError.longMessage ?? sendError.message);
      return;
    }

    if (signIn.status !== "complete") {
      setError("This account needs an additional verification step that isn't supported here.");
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setError(finalizeError.longMessage ?? finalizeError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!signIn) return;

    const { error: passwordError } = await signIn.password({ identifier: email, password });
    if (passwordError) {
      setError(passwordError.longMessage ?? passwordError.message);
      return;
    }

    await completeSignIn();
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!signIn) return;

    const { error: verifyError } = await signIn.mfa.verifyEmailCode({ code });
    if (verifyError) {
      setError(verifyError.longMessage ?? verifyError.message);
      return;
    }

    await completeSignIn();
  }

  if (needsDeviceTrustCode) {
    return (
      <form onSubmit={handleCodeSubmit} className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground">
          This is a new device, so we emailed {email} a verification code. Enter it below to
          finish signing in.
        </p>

        <div className="flex flex-col gap-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
          />
        </div>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? <Loader2Icon className="animate-spin" /> : "Verify"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting || !signIn}>
        {submitting ? <Loader2Icon className="animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}
