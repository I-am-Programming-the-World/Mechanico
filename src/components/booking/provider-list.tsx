"use client";

type Provider = {
  providerId: string;
  name: string;
  etaMinutes: number;
  rating: number | null;
  basePrice: number | null;
  serviceName: string | null;
};

type Props = {
  providers: Provider[];
  onSelect: (provider: Provider) => void;
};

export function ProviderList({ providers, onSelect }: Props) {
  return (
    <div className="space-y-3 p-2">
      <h3 className="text-lg font-semibold">مکانیک‌های اطراف</h3>
      <p className="text-sm text-gray-600">یک مکانیک را برای انجام سرویس انتخاب کنید</p>
      <div className="space-y-2">
        {providers.map((provider) => (
          <button
            key={provider.providerId}
            className="w-full rounded-md border p-3 text-right hover:bg-gray-50"
            onClick={() => onSelect(provider)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{provider.name}</div>
                <div className="text-xs text-gray-500">
                  {provider.rating ? `${provider.rating} ★` : "بدون امتیاز"} • {provider.etaMinutes} دقیقه فاصله
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">{provider.basePrice ? `${provider.basePrice.toFixed(0)} تومان` : "توافقی"}</div>
                <div className="text-xs text-gray-500">{provider.serviceName}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}