import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, Users, FileText, Bell, Siren, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — LifeVault" }] }),
});

function Dashboard() {
  const { data: profile } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user!.id;
      const [p, fam, docs, rem, med] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("family_members").select("id").eq("owner_id", uid),
        supabase.from("medical_documents").select("id").eq("owner_id", uid),
        supabase.from("reminders").select("id").eq("owner_id", uid).eq("completed", false),
        supabase.from("medical_info").select("blood_group").eq("subject_type", "self").eq("subject_id", uid).maybeSingle(),
      ]);
      return {
        profile: p.data,
        family: fam.data?.length ?? 0,
        docs: docs.data?.length ?? 0,
        reminders: rem.data?.length ?? 0,
        bloodGroup: med.data?.blood_group ?? "—",
      };
    },
  });

  const stats = [
    { label: "Blood group", value: profile?.bloodGroup ?? "—", icon: HeartPulse },
    { label: "Family members", value: profile?.family ?? 0, icon: Users },
    { label: "Documents", value: profile?.docs ?? 0, icon: FileText },
    { label: "Active reminders", value: profile?.reminders ?? 0, icon: Bell },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back{profile?.profile?.full_name ? `, ${profile.profile.full_name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-muted-foreground">Your medical vault at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to={"/app/qr" as any} className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary">
          <QrCode className="h-6 w-6 text-primary" />
          <h3 className="mt-3 text-lg font-semibold">Your emergency QR</h3>
          <p className="mt-1 text-sm text-muted-foreground">Generate and share a QR that opens your emergency profile.</p>
        </Link>
        <Link to={"/app/sos" as any} className="group rounded-xl border border-destructive/40 bg-destructive/5 p-6 shadow-sm transition hover:border-destructive">
          <Siren className="h-6 w-6 text-destructive" />
          <h3 className="mt-3 text-lg font-semibold text-destructive">SOS</h3>
          <p className="mt-1 text-sm text-muted-foreground">Call an ambulance, share your location, and notify family.</p>
        </Link>
      </div>
    </div>
  );
}