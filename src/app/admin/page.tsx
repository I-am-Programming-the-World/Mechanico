"use client";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export default function AdminPage() {
  const { data, isLoading } = api.admin.getDashboardStats.useQuery();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">پنل مدیریت</h1>
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-6 w-16" />
            </div>
          ))}
        </div>
      )}
      {!isLoading && data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600">کاربران</div>
            <div className="text-2xl font-semibold">{data.users}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600">ارائه‌دهندگان</div>
            <div className="text-2xl font-semibold">{data.providers}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600">مشتریان</div>
            <div className="text-2xl font-semibold">{data.customers}</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-sm text-gray-600">سفارش‌ها</div>
            <div className="text-2xl font-semibold">{data.bookings}</div>
          </div>
        </div>
      )}
    </main>
  );
}