"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

type Props = {
  bookingId: string;
  providerId: string;
};

export function BookingTracker({ bookingId }: Props) {
  const [status, setStatus] = useState<string>("PENDING");

  const statusText: Record<string, string> = {
    PENDING: "در انتظار تایید درخواست شما توسط تعمیرکار.",
    CONFIRMED: "تعمیرکار تایید شد. در انتظار شروع کار.",
    IN_PROGRESS: "در حال انجام کار.",
    WAITING_PARTS: "در انتظار قطعات. پس از تامین قطعات کار ادامه خواهد یافت.",
    RESCHEDULED: "تاریخ کار تغییر کرد. جزئیات را بررسی کنید.",
    COMPLETED: "کار به اتمام رسید.",
    CANCELLED: "درخواست لغو شد.",
  };

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">پیگیری سفارش</h3>
      <div className="flex items-center gap-2">
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600"
            style={{ width: getStatusProgress(status) + "%" }}
          />
        </div>
        <span className="text-xs text-gray-600">{getStatusProgress(status)}%</span>
      </div>
      <p className="text-sm text-gray-600">{statusText[status] ?? "در حال بروزرسانی..."}</p>
      <div className="text-xs text-gray-500">
        کد سفارش: {bookingId}
      </div>
      <AlertDialog.Root>
        <AlertDialog.Trigger asChild>
          <button className="mt-2 w-full rounded-md bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50">
            لغو سفارش
          </button>
        </AlertDialog.Trigger>
        <AlertDialog.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl border bg-white p-4 shadow-lg">
          <AlertDialog.Title className="text-base font-medium">تایید لغو</AlertDialog.Title>
          <AlertDialog.Description className="mt-1 text-sm text-gray-600">
            آیا مطمئن هستید که می‌خواهید این سفارش را لغو کنید؟
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
                  setStatus("CANCELLED");
                }}
              >
                لغو کن
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </div>
  );
}

function getStatusProgress(status: string): number {
  const progress: Record<string, number> = {
    PENDING: 10,
    CONFIRMED: 30,
    IN_PROGRESS: 60,
    WAITING_PARTS: 70,
    RESCHEDULED: 40,
    COMPLETED: 100,
    CANCELLED: 0,
  };
  return progress[status] ?? 0;
}
