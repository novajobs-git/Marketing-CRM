import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="max-w-3xl">
        <Skeleton className="h-8 w-64" />

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-9 w-full" />
              </div>
            ))}
            <Skeleton className="mt-2 h-9 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
