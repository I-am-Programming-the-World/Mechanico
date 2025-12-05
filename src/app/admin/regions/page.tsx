"use client";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export default function AdminRegionsPage() {
  const { data, isLoading } = api.admin.getApprovalQueue.useQuery();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">مناطق سرویس</h1>
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
          ))}
        </div>
      )}
      {!isLoading && data && (
        <div className="space-y-4">
          {data.length === 0 && <div className="text-sm text-gray-600">هیچ منطقه‌ای وجود ندارد.</div>}
          {data.map((r) => (
            <div key={r.id} className="rounded-md border p-4">
              <div className="font-medium">{r.profile?.fullName ?? "نامشخص"}</div>
              <div className="text-sm text-gray-600">وضعیت: {r.isApproved ? "فعال" : "غیرفعال"}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}