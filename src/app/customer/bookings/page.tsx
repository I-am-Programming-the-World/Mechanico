"use client";

import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { StatusBadge } from "~/components/ui/status-badge";
import Link from "next/link";

export default function CustomerBookingsPage() {
  const { data, isLoading, refetch, isFetching } = api.customer.listBookings.useQuery();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="safe-area-top flex items-center justify-between border-b px-3 py-2">
        <h1 className="text-lg font-semibold">سفارش‌ها</h1>
        <button
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "در حال بروزرسانی..." : "بروزرسانی"}
        </button>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto p-3 pb-4">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="mt-2 h-3 w-40" />
                <Skeleton className="mt-1 h-3 w-52" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <div className="text-center text-sm text-gray-500">
            هنوز سفارشی ثبت نکرده‌اید.
          </div>
        )}
        {!isLoading && data && (
          <div className="space-y-2">
            {data.map((b) => (
              <div key={b.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{b.service?.name ?? "سرویس"}</div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {new Date(b.date).toLocaleString()}
                </div>
                {b.scheduledAt && (
                  <div className="mt-1 text-sm text-gray-600">
                    زمان برنامه‌ریزی شده: {new Date(b.scheduledAt).toLocaleString()}
                  </div>
                )}
                <div className="mt-1 text-sm text-gray-800">قیمت: {b.price.toFixed(0)} تومان</div>
                {b.provider?.profile?.fullName && (
                  <div className="mt-1 text-sm text-gray-700">مکانیک: {b.provider.profile.fullName}</div>
                )}
                {b.addressLabel && (
                  <div className="mt-1 text-sm text-gray-700">آدرس: {b.addressLabel}</div>
                )}
                <div className="mt-2 flex justify-end">
                  <Link href={`/customer/bookings/${b.id}`} className="text-blue-600 hover:underline">
                    مشاهده جزئیات
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
