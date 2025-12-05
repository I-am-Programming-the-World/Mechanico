import { BottomNav } from "~/components/nav/bottom-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col bg-white">
      <div className="pb-bottom-nav">{children}</div>
      <BottomNav />
    </div>
  );
}