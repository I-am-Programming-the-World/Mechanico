"use client";

import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui/skeleton";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Geocoder } from "~/components/map/geocoder";

export default function CustomerProfilePage() {
  const { data: vehicles, isLoading, refetch } = api.customer.listVehicles.useQuery();
  const places = api.customer.listPlaces.useQuery();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <header className="safe-area-top flex items-center justify-between border-b px-3 py-2">
        <h1 className="text-lg font-semibold">پروفایل</h1>
      </header>

      <section className="flex-1 space-y-4 overflow-y-auto p-3 pb-4">
        <section className="space-y-2">
          <h2 className="text-base font-medium">وسایل نقلیه شما</h2>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border p-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && (!vehicles || vehicles.length === 0) && (
            <div className="text-sm text-gray-500">وسیله نقلیه‌ای ثبت نشده است.</div>
          )}
          {!isLoading && vehicles && (
            <div className="space-y-2">
              {vehicles.map((v) => (
                <div key={v.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {v.make} {v.model} ({v.year})
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          // Edit vehicle
                        }}
                      >
                        ویرایش
                      </button>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger asChild>
                          <button className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                            حذف
                          </button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border bg-white p-4 shadow-lg">
                          <AlertDialog.Title className="text-base font-medium">حذف وسیله نقلیه؟</AlertDialog.Title>
                          <AlertDialog.Description className="mt-1 text-sm text-gray-600">
                            این عمل قابل بازگشت نیست.
                          </AlertDialog.Description>
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                              <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                                انصراف
                              </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button
                                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                                onClick={() => {
                                  // Delete vehicle
                                  toast.success("وسیله نقلیه حذف شد");
                                }}
                              >
                                حذف
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{v.licensePlate}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium">افزودن وسیله نقلیه</h2>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("وسیله نقلیه اضافه شد");
              void refetch();
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="نام سازنده"
                required
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="مدل"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="سال"
                inputMode="numeric"
                required
              />
              <input
                className="rounded-md border px-3 py-2 text-sm"
                placeholder="شماره پلاک"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white"
            >
              افزودن وسیله نقلیه
            </button>
          </form>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium">مکان‌های ذخیره شده</h2>
          {places.isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-md border p-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-24" />
                </div>
              ))}
            </div>
          )}
          {!places.isLoading && (!places.data || places.data.length === 0) && (
            <div className="text-sm text-gray-500">مکانی ذخیره نشده است.</div>
          )}
          {!places.isLoading && places.data && (
            <div className="space-y-2">
              {places.data.map((p) => (
                <div key={p.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{p.label}</div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                        onClick={() => {
                          // Edit place
                        }}
                      >
                        ویرایش
                      </button>
                      <AlertDialog.Root>
                        <AlertDialog.Trigger asChild>
                          <button className="rounded-md border px-2 py-1 text-xs text-red-600 hover:bg-red-50">
                            حذف
                          </button>
                        </AlertDialog.Trigger>
                        <AlertDialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border bg-white p-4 shadow-lg">
                          <AlertDialog.Title className="text-base font-medium">حذف مکان؟</AlertDialog.Title>
                          <AlertDialog.Description className="mt-1 text-sm text-gray-600">
                            این عمل قابل بازگشت نیست.
                          </AlertDialog.Description>
                          <div className="mt-3 flex items-center justify-end gap-2">
                            <AlertDialog.Cancel asChild>
                              <button className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
                                انصراف
                              </button>
                            </AlertDialog.Cancel>
                            <AlertDialog.Action asChild>
                              <button
                                className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
                                onClick={() => {
                                  // Delete place
                                  toast.success("مکان حذف شد");
                                }}
                              >
                                حذف
                              </button>
                            </AlertDialog.Action>
                          </div>
                        </AlertDialog.Content>
                      </AlertDialog.Root>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-medium">افزودن مکان</h2>
          <Geocoder
            onSelect={(_p) => {
              toast.success("مکان ذخیره شد");
            }}
          />
        </section>
      </section>
    </main>
  );
}