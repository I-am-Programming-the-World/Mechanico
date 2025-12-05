"use client";

import { Drawer } from "vaul";
import { useEffect, useState } from "react";
import type { BookingFlowState } from "~/app/customer/booking-flow.types";
import { api } from "~/trpc/react";
import { ServiceSelector } from "./service-selector";
import { VehicleSelector } from "./vehicle-selector";
import { ProviderList } from "./provider-list";
import { Skeleton } from "~/components/ui/skeleton";

type Props = {
  state: BookingFlowState;
  setState: (s: BookingFlowState) => void;
  pin?: { lat: number; lng: number };
  setPin: (p?: { lat: number; lng: number }) => void;
  initialServiceId?: string | null;
  initialVehicleId?: string | null;
  initialScheduledAt?: string | null;
};

const STEP_LABELS: Record<BookingFlowState, string> = {
  IDLE: "انتخاب سرویس",
  SELECTING_SERVICE: "انتخاب سرویس",
  CONFIRMING_LOCATION: "تایید موقعیت",
  ADD_DETAILS: "جزئیات مشکل",
  SELECTING_VEHICLE: "انتخاب وسیله نقلیه",
  SELECTING_PROVIDER: "انتخاب مکانیک",
  AWAITING_CONFIRMATION: "در انتظار تایید",
  TRACKING: "پیگیری",
};

const STEP_ORDER: BookingFlowState[] = [
  "SELECTING_SERVICE",
  "CONFIRMING_LOCATION",
  "ADD_DETAILS",
  "SELECTING_VEHICLE",
  "SELECTING_PROVIDER",
  "AWAITING_CONFIRMATION",
  "TRACKING",
];

function getStepIndex(state: BookingFlowState): number {
  const idx = STEP_ORDER.indexOf(state);
  return idx >= 0 ? idx : 0;
}

export function BookingDrawer({
  state,
  setState,
  pin,
  initialServiceId,
  initialVehicleId,
  initialScheduledAt,
}: Props) {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = selectedProviderId;
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const [description, setDescription] = useState<string>("");
  const [addressLabel, setAddressLabel] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  const [snap, setSnap] = useState<"collapsed" | "medium" | "full">("collapsed");
  const stepIndex = getStepIndex(state);
  const stepLabel = STEP_LABELS[state] ?? "انتخاب سرویس";

  // Data Fetching
  const { data: categories, isLoading: loadingServices } = api.service.getCategories.useQuery();
  const { data: vehicles, isLoading: loadingVehicles } = api.customer.listVehicles.useQuery();
  const { data: providers, isLoading: loadingProviders } = api.provider.getNearby.useQuery(
    {
      serviceId: selectedServiceId ?? "",
      lat: pin?.lat ?? 0,
      lng: pin?.lng ?? 0,
    },
    { enabled: !!selectedServiceId && !!pin && state === "SELECTING_PROVIDER" },
  );

  const createBooking = api.booking.create.useMutation({
    onSuccess: (data) => {
      setBookingId(data.id);
      setState("AWAITING_CONFIRMATION");
    },
  });

  // Seed initial selections when provided
  useEffect(() => {
    if (initialServiceId) setSelectedServiceId(initialServiceId);
  }, [initialServiceId]);

  useEffect(() => {
    if (initialVehicleId) setVehicleId(initialVehicleId);
  }, [initialVehicleId]);

  useEffect(() => {
    if (initialScheduledAt) {
      const d = new Date(initialScheduledAt);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      setScheduledAt(`${yyyy}-${mm}-${dd}T${hh}:${min}`);
      setIsScheduled(true);
    }
  }, [initialScheduledAt]);

  // Manage snap state based on flow
  useEffect(() => {
    if (state === "IDLE") {
      setSnap("collapsed");
    } else if (state === "AWAITING_CONFIRMATION" || state === "TRACKING") {
      setSnap("full");
    } else {
      setSnap("medium");
    }
  }, [state]);

  const handleCreateBooking = () => {
    if (!selectedServiceId || !vehicleId || !pin) return;
    createBooking.mutate({
      serviceId: selectedServiceId,
      vehicleId,
      lat: pin.lat,
      lng: pin.lng,
      description,
      addressLabel,
      scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    });
  };

  return (
    <Drawer.Root open modal={false} shouldScaleBackground>
      <Drawer.Content
        className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md rounded-t-2xl border bg-white pt-2 pb-3 safe-area-bottom shadow-lg"
        style={{
          height: snap === "collapsed" ? "120px" : snap === "medium" ? "60vh" : "90vh",
        }}
      >
        <Drawer.Handle className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-gray-300" />
        <Drawer.Title className="sr-only">فرآیند ثبت سفارش</Drawer.Title>
        <Drawer.Description className="sr-only">
          مراحل انتخاب سرویس، موقعیت، جزئیات و مکانیک
        </Drawer.Description>

        {/* Collapsed peek header */}
        {snap === "collapsed" && (
          <div className="flex items-center justify-between px-3">
            <div className="text-sm text-gray-600">انتخاب سرویس</div>
            <button
              className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white"
              onClick={() => setSnap("medium")}
            >
              باز کردن
            </button>
          </div>
        )}

        {/* Step indicator */}
        {snap !== "collapsed" && (
          <div className="mb-4 flex items-center justify-between px-3 border-b pb-2">
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={() => {
                    const prev = STEP_ORDER[stepIndex - 1];
                    if (prev) setState(prev);
                  }}
                  className="rounded-full p-1 hover:bg-gray-100 text-gray-600"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
              <div className="text-base font-semibold text-gray-800">{stepLabel}</div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              مرحله {stepIndex + 1} از {STEP_ORDER.length}
            </div>
          </div>
        )}

        {state === "SELECTING_SERVICE" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-3">
            <h3 className="text-lg font-semibold">انتخاب سرویس</h3>
            <p className="text-sm text-gray-600">نوع مشکل یا سرویس مورد نیاز را انتخاب کنید</p>
            {loadingServices ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <ServiceSelector
                categories={categories ?? []}
                onSelect={(id) => {
                  setSelectedServiceId(id);
                  setState("CONFIRMING_LOCATION");
                }}
              />
            )}
          </div>
        )}

        {state === "CONFIRMING_LOCATION" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-3">
            <h3 className="text-lg font-semibold">تایید موقعیت</h3>
            <p className="text-sm text-gray-600">
              نقشه را جابه‌جا کنید تا سوزن روی موقعیت دقیق خودرو قرار بگیرد
            </p>
            <div className="text-xs text-gray-500">
              در صورت نیاز می‌توانید آدرس را از بالای صفحه جستجو کنید
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={!pin}
                onClick={() => setState("ADD_DETAILS")}
              >
                تایید موقعیت
              </button>
            </div>
          </div>
        )}

        {state === "ADD_DETAILS" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-3">
            <h3 className="text-lg font-semibold">جزئیات مشکل</h3>
            <label className="block text-sm text-gray-700">
              توضیح مشکل (اختیاری)
            </label>
            <textarea
              className="w-full rounded-md border p-2 text-sm"
              placeholder="مثلاً ماشین روشن نمی‌شود، احتمالاً باتری ضعیف شده"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="block text-sm text-gray-700">
              آدرس یا نشانی نزدیک (اختیاری)
            </label>
            <input
              className="w-full rounded-md border p-2 text-sm"
              placeholder="مثلاً نزدیک درِ قرمز، بلوک ب"
              value={addressLabel}
              onChange={(e) => setAddressLabel(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <input
                id="schedule"
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
              <label htmlFor="schedule" className="text-sm">
                زمان‌بندی برای بعداً
              </label>
            </div>
            {isScheduled && (
              <>
                <label className="block text-sm text-gray-700">
                  انتخاب تاریخ و ساعت
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border p-2 text-sm"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </>
            )}
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-md bg-blue-600 px-4 py-2 text-white"
                onClick={() => setState("SELECTING_VEHICLE")}
              >
                ادامه
              </button>
            </div>
          </div>
        )}

        {state === "SELECTING_VEHICLE" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-3">
            <h3 className="text-lg font-semibold">انتخاب وسیله نقلیه</h3>
            <p className="text-sm text-gray-600">خودرویی که نیاز به سرویس دارد را انتخاب کنید</p>
            {loadingVehicles ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <VehicleSelector
                vehicles={vehicles ?? []}
                onSelect={(id) => {
                  setVehicleId(id);
                  setState("SELECTING_PROVIDER");
                }}
              />
            )}
            {(!vehicles || vehicles.length === 0) && !loadingVehicles && (
              <div className="text-center text-sm text-gray-500">
                شما هنوز خودرویی ثبت نکرده‌اید.
                <br />
                <a href="/customer/profile" className="text-blue-600 underline">
                  افزودن خودرو
                </a>
              </div>
            )}
          </div>
        )}

        {state === "SELECTING_PROVIDER" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-3">
            <h3 className="text-lg font-semibold">انتخاب مکانیک</h3>
            <p className="text-sm text-gray-600">یکی از مکانیک‌های پیشنهادی را انتخاب کنید</p>
            {loadingProviders ? (
              <div className="space-y-2">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <ProviderList
                providers={providers ?? []}
                onSelect={(p) => {
                  setSelectedProviderId(p.providerId);
                  handleCreateBooking();
                }}
              />
            )}
            {createBooking.isPending && (
              <div className="text-center text-sm text-blue-600">
                در حال ثبت سفارش...
              </div>
            )}
          </div>
        )}

        {state === "AWAITING_CONFIRMATION" && (
          <div className="max-h-[60vh] overflow-y-auto px-3 space-y-2">
            <h3 className="text-lg font-semibold">در انتظار تایید</h3>
            <p className="text-sm text-gray-600">درخواست شما برای مکانیک ارسال شده است</p>
            {bookingId && (
              <div className="text-sm text-gray-800">
                کد سفارش: {bookingId}
              </div>
            )}
            <div className="text-xs text-gray-500">
              به محض تایید، از طریق نوتیفیکیشن به شما اطلاع می‌دهیم
            </div>
          </div>
        )}
      </Drawer.Content>
    </Drawer.Root>
  );
}
