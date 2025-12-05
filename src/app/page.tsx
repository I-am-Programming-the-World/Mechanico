import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white text-gray-900">
      <h1 className="text-4xl font-bold">Mechanico</h1>
      <p className="text-center text-gray-600">
        Map-centric on-demand auto mechanics platform.
      </p>
      <div className="flex gap-4">
        <Link
          href="/customer"
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Customer
        </Link>
        <Link
          href="/provider"
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Provider
        </Link>
        <Link
          href="/admin"
          className="rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          Admin
        </Link>
      </div>
      <div className="mt-8">
        <Link
          href="/api/auth/signin"
          className="text-sm text-blue-600 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}