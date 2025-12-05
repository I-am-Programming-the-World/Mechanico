"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { MapContainer } from "~/components/map/map-container";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { toast } from "sonner";
import { getDrivingDirections } from "~/lib/mapbox/directions";
import { BookingTracker } from "~/components/booking/booking-tracker";
import { StatusBadge } from "~/components/ui/status-badge";
import { useRouter, useParams } from "next/navigation";

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const { data: booking, isLoading, error } = api.booking.getById.useQuery({ id: bookingId });
  const cancelMutation = api.booking.cancel.useMutation({
    onSuccess: () => {
      toast.success("سفارش لغو شد.");
      router.push("/customer/bookings");
    },
    onError: () => {
      toast.error("خطا در لغو سفارش");
    },
  });

  const [routeCoords, setRouteCoords] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!booking?.latitude || !booking?.longitude) return;
    const fetchRoute = async () => {
      try {
        const res = await getDrivingDirections(
          { lat: booking.latitude, lng: booking.longitude },
          { lat: booking.latitude, lng: booking.longitude },
        );
        if (res?.coordinates) {
          setRouteCoords(res.coordinates);
          setRouteDuration(res.durationMinutes);
        }
      } catch {
        // ignore
      }
    };
    void fetchRoute();
  }, [booking?.latitude, booking?.longitude]);

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
        <header className="safe-area-top flex items-center justify-between border-b px-3 py-2">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200"></div>
        </header>
        <section className="flex-1 space-y-4 overflow-y-auto p-3 pb-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200"></div>
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200"></div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
        <header className="safe-area-top flex items-center justify-between border-b px-3 py-2">
          <h1 className="text-lg font-semibold">جزئیات سفارش</h1>
          <button
            onClick={() => router.push("/customer/bookings")}
            className="text-blue-600 hover:underline"
          >
            بازگشت
          </button>
        </header>
        <section className="flex-1 space-y-4 overflow-y-auto p-3 pb-4">
          <div className="text-red-600">خطا در بارگذاری سفارش</div>
          <div className="text-sm text-gray-600">متاسفانه بارگذاری اطلاعات سفارش با مشکل مواجه شد.</div>
          <Link href="/customer/bookings" className="text-blue-600 hover:underline">
            بازگشت به سفارش‌ها
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="safe-area-top flex items-center justify-between border-b px-3 py-2">
        <div className="w-8"></div>
        <h1 className="text-lg font-semibold">جزئیات سفارش</h1>
        <button
          onClick={() => router.push("/customer/bookings")}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
        >
          →
        </button>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto p-3 pb-4">
        {/* Status + Summary Card */}
        <div className="rounded-md border p-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">{booking?.service?.name ?? "سرویس"}</div>
            <StatusBadge status={booking?.status ?? "UNKNOWN"} />
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
            <div className="text-gray-600">
              زمان ثبت: {new Date(booking?.date ?? "").toLocaleString()}
            </div>
            {booking?.scheduledAt && (
              <div className="text-gray-600">
                زمان برنامه‌ریزی شده: {new Date(booking.scheduledAt).toLocaleString()}
              </div>
            )}
            <div className="text-gray-800">
              قیمت: {booking?.price?.toFixed(0) ?? "0"} تومان
            </div>
            {booking?.problemDescription && (
              <div className="text-gray-700">
                توضیحات: {booking.problemDescription}
              </div>
            )}
            {booking?.addressLabel && (
              <div className="text-gray-700">
                آدرس: {booking.addressLabel}
              </div>
            )}
          </div>
        </div>

        {/* Tracker */}
        {booking && (
          <div className="rounded-md border p-3">
            <h3 className="text-base font-medium mb-2">پیگیری سفارش</h3>
            <BookingTracker bookingId={booking.id} providerId={booking.providerId ?? ""} />
          </div>
        )}

        {/* Map Section */}
        {booking?.latitude && booking?.longitude && (
          <div className="rounded-md border p-3">
            <h2 className="text-lg font-semibold mb-2">موقعیت خودرو</h2>
            <MapContainer
              center={{ lat: booking.latitude, lng: booking.longitude }}
              markers={[{ id: "booking", lat: booking.latitude, lng: booking.longitude }]}
              route={routeCoords ?? undefined}
            />
            {routeDuration && (
              <div className="mt-2 text-sm text-gray-600">
                مدت زمان تقریبی: {Math.round(routeDuration)} دقیقه
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bottom Actions */}
      <footer className="safe-area-bottom border-t px-3 py-2">
        <div className="flex gap-2 justify-end">
          {["PENDING", "CONFIRMED", "IN_PROGRESS", "WAITING_PARTS", "RESCHEDULED"].includes(booking?.status ?? "") ? (
            <>
              <button className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
                گفتگو
              </button>
              <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                  <button className="rounded-md bg-red-600 px-4 py-2 text-sm text-white">
                    لغو سفارش
                  </button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Overlay className="fixed inset-0 bg-black/30" />
                  <AlertDialog.Content className="fixed left-1/2 top-1/2 max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md bg-white p-4 shadow-lg">
                    <AlertDialog.Title className="text-lg font-semibold">تایید لغو</AlertDialog.Title>
                    <AlertDialog.Description className="mt-2 text-sm text-gray-600">
                      آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟
                    </AlertDialog.Description>
                    <div className="mt-4 flex justify-end gap-2">
                      <AlertDialog.Cancel asChild>
                        <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                          انصراف
                        </button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <button
                          className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                          onClick={() => cancelMutation.mutate({ id: bookingId })}
                          disabled={cancelMutation.isPending}
                        >
                          {cancelMutation.isPending ? "در حال لغو..." : "لغو کن"}
                        </button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </>
          ) : booking?.status === "COMPLETED" ? (
            <>
              <button
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
                onClick={() => {
                  const url = new URL(window.location.origin + "/customer");
                  url.searchParams.set("rebook", "1");
                  url.searchParams.set("lat", String(booking.latitude));
                  url.searchParams.set("lng", String(booking.longitude));
                  url.searchParams.set("serviceId", booking.serviceId);
                  if (booking.vehicleId) url.searchParams.set("vehicleId", booking.vehicleId);
                  if (booking.scheduledAt) {
                    const scheduled =
                      booking.scheduledAt instanceof Date
                        ? booking.scheduledAt
                        : new Date(booking.scheduledAt as string);
                    url.searchParams.set("scheduledAt", scheduled.toISOString());
                  }
                  router.push(url.toString());
                }}
              >
                سفارش مجدد
              </button>
              <button className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white">
                ثبت نظر
              </button>
            </>
          ) : (
            <button className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
              بازگشت به سفارش‌ها
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

