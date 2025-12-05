"use client";

import dynamic from "next/dynamic";

const CustomerHomeContent = dynamic(() => import("./customer-home-content"), {
  ssr: false,
});

export type BookingFlowState =
  | "IDLE"
  | "SELECTING_SERVICE"
  | "CONFIRMING_LOCATION"
  | "ADD_DETAILS"
  | "SELECTING_VEHICLE"
  | "SELECTING_PROVIDER"
  | "AWAITING_CONFIRMATION"
  | "TRACKING";

export default function CustomerHome() {
  return <CustomerHomeContent />;
}