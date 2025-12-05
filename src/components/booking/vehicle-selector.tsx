"use client";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  licensePlate: string | null;
};

type Props = {
  vehicles: Vehicle[];
  onSelect: (vehicleId: string) => void;
};

export function VehicleSelector({ vehicles, onSelect }: Props) {
  return (
    <div className="space-y-3 p-2">
      <h3 className="text-lg font-semibold">انتخاب وسیله نقلیه</h3>
      <div className="space-y-2">
        {vehicles.map((v) => (
          <button
            key={v.id}
            className="w-full rounded-md border p-3 text-right hover:bg-gray-50"
            onClick={() => onSelect(v.id)}
          >
            <div className="font-medium">
              {v.make} {v.model} {v.year ? `(${v.year})` : ""}
            </div>
            <div className="text-xs text-gray-500">{v.licensePlate ?? "بدون پلاک"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}