"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { Button } from "~/components/ui/button";
import { StatusBadge } from "~/components/ui/status-badge";

interface ProviderClientProps {
  providerId: string | null;
}

export default function ProviderClient({ providerId }: ProviderClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"jobs" | "offers">("jobs");

  const utils = api.useUtils();

  const { data: jobs, isLoading: jobsLoading } = api.provider.listJobs.useQuery();
  const { data: offers, isLoading: offersLoading } = api.provider.listOffers.useQuery();

  const acceptOffer = api.provider.acceptOffer.useMutation({
    onSuccess: () => {
      toast.success("پیشنهاد پذیرفته شد.");
      void utils.provider.listJobs.invalidate();
      void utils.provider.listOffers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "خطا در پذیرش پیشنهاد");
    },
  });

  const declineOffer = api.provider.declineOffer.useMutation({
    onSuccess: () => {
      toast.success("پیشنهاد رد شد.");
      void utils.provider.listOffers.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "خطا در رد پیشنهاد");
    },
  });

  const startJob = api.booking.startJob.useMutation({
    onSuccess: () => {
      toast.success("مسیر شروع شد.");
      void utils.provider.listJobs.invalidate();
    },
    onError: () => {
      toast.error("خطا در شروع مسیر");
    },
  });

  const completeJob = api.booking.completeJob.useMutation({
    onSuccess: () => {
      toast.success("کار با موفقیت اتمام یافت.");
      void utils.provider.listJobs.invalidate();
    },
    onError: () => {
      toast.error("خطا در اتمام کار");
    },
  });

  useEffect(() => {
    if (!providerId) {
      router.push("/auth/signin");
    }
  }, [providerId, router]);

  if (!providerId) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="safe-area-top border-b px-3 py-2">
        <h1 className="text-lg font-semibold">پنل ارائه‌دهنده</h1>
      </header>

      {/* Online/Offline Banner + Region */}
      <div className="bg-green-50 text-green-800 border border-green-200 px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">وضعیت شما: آنلاین</div>
          <Button variant="ghost" size="sm">
            تغییر وضعیت
          </Button>
        </div>
        <div className="mt-1 text-sm text-gray-600">منطقه: تهران</div>
      </div>

      {/* Active Job Card */}
      <div className="rounded-md border p-3 mx-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">سرویس تعویض روغن</div>
          <StatusBadge status="IN_PROGRESS" />
        </div>
        <div className="mt-1 text-sm text-gray-600">مشتری: محمد حسینی</div>
        <div className="mt-1 text-sm text-gray-600">آدرس: خیابان ولیعصر، پلاک ۱۲۳</div>
        <div className="mt-3 flex gap-3">
          <Button variant="primary" className="h-12 text-base flex-1">
            شروع مسیر
          </Button>
          <Button variant="secondary" className="h-12 text-base flex-1">
            تماس با مشتری
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mx-3">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "jobs" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("jobs")}
        >
          سفارش‌ها
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === "offers" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("offers")}
        >
          پیشنهادها
        </button>
      </div>

      <section className="flex-1 space-y-3 overflow-y-auto p-3 pb-4">
        {activeTab === "jobs" && (
          <>
            {jobsLoading && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-md border p-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-48" />
                  </div>
                ))}
              </div>
            )}
            {!jobsLoading && (!jobs || jobs.length === 0) && (
              <div className="text-center text-sm text-gray-500">
                در حال حاضر سفارشی فعال ندارید
              </div>
            )}
            {!jobsLoading && jobs && (
              <div className="space-y-2">
                {jobs.map((j) => (
                  <div key={j.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{j.jobType}</div>
                      <StatusBadge status={j.status} />
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {new Date(j.date).toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-gray-800">قیمت: {j.price.toFixed(0)} تومان</div>
                    <div className="mt-3 flex gap-3">
                      {j.status === "PENDING" && (
                        <>
                          <Button
                            variant="primary"
                            className="h-12 text-base flex-1"
                            onClick={() => acceptOffer.mutate({ bookingId: j.id })}
                            disabled={acceptOffer.isPending}
                          >
                            {acceptOffer.isPending ? "در حال پذیرش..." : "قبول درخواست"}
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-12 text-base flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => declineOffer.mutate({ bookingId: j.id })}
                            disabled={declineOffer.isPending}
                          >
                            {declineOffer.isPending ? "در حال رد..." : "رد درخواست"}
                          </Button>
                        </>
                      )}
                      {j.status === "CONFIRMED" && (
                        <Button
                          variant="primary"
                          className="h-12 text-base w-full"
                          onClick={() => startJob.mutate({ id: j.id })}
                          disabled={startJob.isPending}
                        >
                          {startJob.isPending ? "در حال شروع..." : "شروع مسیر"}
                        </Button>
                      )}
                      {j.status === "IN_PROGRESS" && (
                        <Button
                          variant="primary"
                          className="h-12 text-base w-full"
                          onClick={() => completeJob.mutate({ id: j.id })}
                          disabled={completeJob.isPending}
                        >
                          {completeJob.isPending ? "در حال ثبت..." : "اتمام کار"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "offers" && (
          <>
            {offersLoading && (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="rounded-md border p-3">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-48" />
                  </div>
                ))}
              </div>
            )}
            {!offersLoading && (!offers || offers.length === 0) && (
              <div className="text-center text-sm text-gray-500">
                پیشنهادی وجود ندارد.
              </div>
            )}
            {!offersLoading && offers && (
              <div className="space-y-2">
                {offers.map((o) => (
                  <div key={o.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{o.serviceName}</div>
                      <div className="text-sm text-gray-600">{Math.round(o.ttlMs / 60000)} دقیقه</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{o.problem}</div>
                    <div className="mt-1 text-sm text-gray-800">قیمت: {o.price.toFixed(0)} تومان</div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        fullWidth
                        onClick={() => acceptOffer.mutate({ bookingId: o.bookingId })}
                        disabled={acceptOffer.isPending}
                      >
                        {acceptOffer.isPending ? "در حال پذیرش..." : "قبول"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="md"
                        fullWidth
                        onClick={() => declineOffer.mutate({ bookingId: o.bookingId })}
                        disabled={declineOffer.isPending}
                      >
                        {declineOffer.isPending ? "در حال رد..." : "رد کردن"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
