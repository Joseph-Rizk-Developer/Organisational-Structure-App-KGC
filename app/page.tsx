import { OrganisationApp } from "@/components/organisation/organisation-app";

export default function Page() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabasePublishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "";

  return (
    <OrganisationApp
      supabaseUrl={supabaseUrl}
      supabasePublishableKey={supabasePublishableKey}
    />
  );
}
