import { auth } from "~/server/auth";
import ProviderClient from "./provider.client";

export default async function ProviderPage() {
  const session = await auth();
  const providerId = session?.user?.id ?? null;

  return <ProviderClient providerId={providerId} />;
}