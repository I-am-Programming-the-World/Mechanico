"use client";

type Service = {
  id: string;
  name: string;
  basePrice: number;
  description: string | null;
};

type Category = {
  name: string;
  services: Service[];
};

type Props = {
  categories: Category[];
  onSelect: (serviceId: string) => void;
};

export function ServiceSelector({ categories, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 p-2">
      {categories.flatMap((cat) =>
        cat.services.map((s) => (
          <button
            key={s.id}
            className="rounded-md border p-3 text-right hover:bg-gray-50"
            onClick={() => onSelect(s.id)}
          >
            <div className="text-sm text-gray-500">{cat.name}</div>
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-gray-500">از {s.basePrice.toFixed(0)} تومان</div>
          </button>
        )),
      )}
    </div>
  );
}