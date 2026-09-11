"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

/** longMessage/message can be an empty string on some Clerk errors — `??` lets
 *  those through as "", which is falsy and silently hides the error Alert. */
function describeError(err: { longMessage?: string; message?: string } | null | undefined, fallback: string) {
  return err?.longMessage || err?.message || fallback;
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const { signOut } = useClerk();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Set once Clerk asks for a device-trust code — happens the first time a
  // browser/device signs in, per https://clerk.com/docs/guides/secure/device-trust.
  const [needsDeviceTrustCode, setNeedsDeviceTrustCode] = useState(false);
  const [resent, setResent] = useState(false);

  const submitting = fetchStatus === "fetching";

  function backToSignIn() {
    setNeedsDeviceTrustCode(false);
    setResent(false);
    setCode("");
    setError(null);
    void signIn?.reset();
  }

  async function resendCode() {
    if (!signIn) return;
    setError(null);
    setResent(false);
    setCode("");
    const { error: sendError } = await signIn.mfa.sendEmailCode();
    if (sendError) setError(describeError(sendError, "Couldn't send a verification code. Please try again."));
    else setResent(true);
  }

  async function completeSignIn() {
    if (!signIn) return;

    if (signIn.status === "needs_client_trust") {
      setNeedsDeviceTrustCode(true);
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) setError(describeError(sendError, "Couldn't send a verification code. Please try again."));
      return;
    }

    if (signIn.status !== "complete") {
      setError(
        `This account needs an additional verification step ("${signIn.status}") that isn't supported here. Contact an admin.`
      );
      return;
    }

    const { error: finalizeError } = await signIn.finalize();
    if (finalizeError) {
      setError(describeError(finalizeError, "Something went wrong finishing sign-in. Please try again."));
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!signIn) return;

    let { error: passwordError } = await signIn.password({ identifier: email, password });

    if (passwordError?.code === "session_exists") {
      // A previous (possibly interrupted) sign-in left a stale session in
      // this browser — Clerk refuses a new one until it's cleared. Since the
      // person is actively trying to sign in as someone else, clear it and
      // retry rather than dead-ending on an unhelpful error message.
      await signOut();
      ({ error: passwordError } = await signIn.password({ identifier: email, password }));
    }

    if (passwordError) {
      setError(describeError(passwordError, "Couldn't sign in. Please try again."));
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
      setError(describeError(verifyError, "That code didn't work. Please try again or request a new one."));
      return;
    }

    if (signIn.status === "needs_client_trust") {
      // The code verified, but Clerk still reports this device as untrusted.
      // Surface that instead of silently re-sending another code, which
      // otherwise looks like the "Verify" button does nothing on click.
      setError("Verification didn't go through. Please request a new code and try again.");
      setCode("");
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
          finish signing in. It can take a minute to arrive — check spam if you don&apos;t see it.
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

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={backToSignIn}
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to sign in
          </button>
          <button
            type="button"
            onClick={resendCode}
            disabled={submitting}
            className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resent ? "Code sent — resend again" : "Resend code"}
          </button>
        </div>
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
