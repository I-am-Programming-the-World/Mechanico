import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapContainer } from "~/components/map/map-container";
import { BookingDrawer } from "~/components/booking/booking-drawer";
import { Geocoder } from "~/components/map/geocoder";
import type { BookingFlowState } from "./booking-flow.types";
import { api } from "~/trpc/react";
import { reverseGeocode } from "~/lib/mapbox/reverse-geocode";

export default function CustomerHomeContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [state, setState] = useState<BookingFlowState>("SELECTING_SERVICE");
  const [center, setCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [pin, setPin] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [initialServiceId, setInitialServiceId] = useState<string | null>(null);
  const [initialVehicleId, setInitialVehicleId] = useState<string | null>(null);
  const [initialScheduledAt, setInitialScheduledAt] = useState<string | null>(null);
  const [addressText, setAddressText] = useState<string | null>(null);
 
  const { data: savedPlaces } = api.customer.listPlaces.useQuery();
 
  // Derived address label for top bar
  const topBarLabel = (() => {
    if (state === "CONFIRMING_LOCATION" && !addressText) {
      return "در حال تعیین موقعیت...";
    }
    if (addressText) {
      return addressText;
    }
    if (pin) {
      return "موقعیت انتخاب‌شده";
    }
    return "انتخاب آدرس";
  })();

  // Initialize to user's location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCenter(coords);
      setPin(coords);
    });
  }, []);

  // Reverse geocode when pin changes
  useEffect(() => {
    if (!pin) {
      setAddressText(null);
      return;
    }
 
    let cancelled = false;
 
    const run = async () => {
      const label = await reverseGeocode(pin.lat, pin.lng);
      if (!cancelled) {
        setAddressText(label);
      }
    };
 
    void run();
 
    return () => {
      cancelled = true;
    };
  }, [pin]);

  // Handle rebook params
  useEffect(() => {
    const rebook = params.get("rebook");
    if (rebook === "1") {
      const lat = params.get("lat");
      const lng = params.get("lng");
      const serviceId = params.get("serviceId");
      const vehicleId = params.get("vehicleId");
      const tweak = params.get("tweak") === "1";
      const scheduledAt = params.get("scheduledAt");
      const parsed = {
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
      };
      if (parsed.lat && parsed.lng) {
        const coords = { lat: parsed.lat, lng: parsed.lng };
        setCenter(coords);
        setPin(coords);
      }
      setInitialServiceId(serviceId);
      setInitialVehicleId(vehicleId);
      setInitialScheduledAt(scheduledAt);
      // Decide step based on tweak or available data
      if (tweak) {
        setState("CONFIRMING_LOCATION");
      } else if (serviceId && parsed.lat && parsed.lng) {
        if (vehicleId) {
          setState("SELECTING_PROVIDER");
        } else {
          setState("SELECTING_VEHICLE");
        }
      } else {
        setState("SELECTING_SERVICE");
      }

      // Clean up query params in history so refresh doesn't repeat
      const url = new URL(window.location.href);
      url.searchParams.delete("rebook");
      url.searchParams.delete("tweak");
      url.searchParams.delete("lat");
      url.searchParams.delete("lng");
      url.searchParams.delete("serviceId");
      url.searchParams.delete("vehicleId");
      url.searchParams.delete("scheduledAt");
      router.replace(url.pathname + url.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const markers = [{ id: "service-pin", lat: pin?.lat ?? 0, lng: pin?.lng ?? 0, color: "red" }];

  return (
    <div className="relative h-dvh w-full bg-white">
      {/* Map as background */}
      <MapContainer
        center={center}
        markers={markers}
        onMove={(viewState) => {
          // Update center as map moves
          setCenter({ lat: viewState.latitude, lng: viewState.longitude });
          // Sync pin with center when confirming location
          if (state === "CONFIRMING_LOCATION") {
            setPin({ lat: viewState.latitude, lng: viewState.longitude });
          }
        }}
        onClick={(lng, lat) => {
          // Optional: allow tap to set pin even when not in CONFIRMING_LOCATION
          setPin({ lat, lng });
          if (state === "CONFIRMING_LOCATION") {
            setCenter({ lat, lng });
          }
        }}
      />
      
      {/* Top bar overlay */}
      <div className="absolute inset-x-0 top-0 z-40 safe-area-top">
        <div className="mx-auto max-w-md flex items-center justify-between px-3 py-2">
          {/* Right (Start in RTL): User avatar */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
            aria-label="پروفایل"
          >
            م
          </button>

          {/* Center: Current address or placeholder */}
          <div className="text-center text-sm font-medium text-gray-800">
            {topBarLabel}
          </div>

          {/* Left (End in RTL): Menu/help icon */}
          <button
            className="rounded-full p-2 hover:bg-gray-100"
            aria-label="راهنما"
          >
            <span className="text-xl text-gray-600">?</span>
          </button>
        </div>
      </div>

      {/* Geocoder overlay */}
      <div className="pointer-events-none absolute right-1/2 top-20 z-40 w-full translate-x-1/2 px-3">
        <div className="mx-auto max-w-md">
          <Geocoder
            onSelect={(p) => {
              setCenter({ lat: p.lat, lng: p.lng });
              setPin({ lat: p.lat, lng: p.lng });
              if (state === "SELECTING_SERVICE") {
                setState("CONFIRMING_LOCATION");
              }
            }}
            savedPlaces={(savedPlaces ?? []).map((place) => ({
              label: place.label,
              lat: place.latitude,
              lng: place.longitude,
            }))}
          />
        </div>
      </div>

      {/* Center pin overlay */}
      <div className="pointer-events-none absolute right-1/2 top-1/2 z-30 translate-x-1/2 -translate-y-full">
        <div className="text-red-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
        <div className="mt-1 rounded-full bg-white px-2 py-1 text-xs shadow text-center">
          {topBarLabel}
        </div>
      </div>

      <BookingDrawer
        state={state}
        setState={setState}
        pin={pin}
        setPin={setPin}
        initialServiceId={initialServiceId}
        initialVehicleId={initialVehicleId}
        initialScheduledAt={initialScheduledAt}
      />
    </div>
  );
}