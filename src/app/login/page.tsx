import Image from "next/image";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/nova-staffs-logo.png"
            alt="Nova Staffs"
            width={929}
            height={268}
            priority
            className="h-10 w-auto"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Sign in to continue
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <LoginForm next={next && next.startsWith("/") ? next : "/dashboard"} />
        </div>
      </div>
    </main>
  );
}
