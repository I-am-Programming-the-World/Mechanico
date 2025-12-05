import React from "react";
import { clsx } from "clsx";

type Status = string;

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    QUOTED: "bg-sky-100 text-sky-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    DECLINED: "bg-red-100 text-red-700",
  };
 
  const labelMap: Record<string, string> = {
    PENDING: "در انتظار",
    QUOTED: "پیشنهاد قیمت",
    CONFIRMED: "تایید شده",
    IN_PROGRESS: "در حال انجام",
    COMPLETED: "تکمیل شده",
    CANCELLED: "لغو شده",
    DECLINED: "رد شده",
  };

  const cls = styles[status] ?? "bg-gray-100 text-gray-700";
  const label = labelMap[status] ?? status;

  return (
    <span className={clsx("rounded-full px-2 py-0.5 text-xs font-medium", cls, className)}>
      {label}
    </span>
  );
}