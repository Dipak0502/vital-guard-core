import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HeartPulse, ShieldAlert, PhoneCall, Droplet, Pill, AlertTriangle, User } from "lucide-react";

export const Route = createFileRoute("/e/$code")({
  component: EmergencyView,
  head: ({ params }) => ({
    meta: [
      { title: `Emergency profile ${params.code} — LifeVault` },
      { name: "description", content: "Emergency medical profile — for first responders." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function EmergencyView() {
  const { code } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["emergency", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_emergency_profile", { _code: code });
      if (error) throw error;
      return data as any;
    },
  });

  if (isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  if (!data) return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-3 text-xl font-bold">Emergency profile unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">This LifeVault code is invalid or has been revoked.</p>
      </div>
    </div>
  );

  const s = data.subject ?? {};

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="bg-destructive text-destructive-foreground">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <ShieldAlert className="h-6 w-6" />
          <div>
            <p className="text-sm uppercase tracking-wide opacity-90">Emergency Medical Profile</p>
            <p className="text-xs opacity-80">LifeVault · {data.code}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
              <User className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{s.full_name ?? "—"}</h1>
              <p className="text-sm text-muted-foreground">
                {[s.gender, s.date_of_birth && `DOB ${s.date_of_birth}`, s.relation].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard icon={Droplet} label="Blood group" value={data.blood_group ?? "Unknown"} emphasis />
          <InfoCard icon={HeartPulse} label="Organ donor" value={data.organ_donor ? "Yes" : "No"} />
        </div>

        <InfoBlock icon={AlertTriangle} title="Allergies" body={data.allergies || "None reported"} urgent={!!data.allergies} />
        <InfoBlock icon={HeartPulse} title="Medical conditions" body={data.conditions || "None reported"} />
        <InfoBlock icon={Pill} title="Current medications" body={data.current_medications || "None reported"} />

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 font-semibold">Emergency contacts</h3>
          {(!data.emergency_contacts || data.emergency_contacts.length === 0) && <p className="text-sm text-muted-foreground">None listed.</p>}
          <div className="space-y-2">
            {data.emergency_contacts?.map((c: any, i: number) => (
              <a key={i} href={`tel:${c.phone}`} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary">
                <PhoneCall className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{c.name} {c.is_primary && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Primary</span>}</p>
                  <p className="text-sm text-muted-foreground">{c.relation} · {c.phone}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {data.insurance && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 font-semibold">Insurance</h3>
            <p className="text-sm">{data.insurance.provider} · {data.insurance.policy}</p>
            {data.insurance.expiry && <p className="text-xs text-muted-foreground">Expires {data.insurance.expiry}</p>}
          </div>
        )}

        {s.address && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-2 font-semibold">Home address</h3>
            <p className="text-sm whitespace-pre-line">{s.address}</p>
          </div>
        )}

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Powered by LifeVault. Info shown per the profile owner's privacy settings.
        </p>
      </main>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, emphasis }: { icon: any; label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${emphasis ? "border-destructive/30 bg-destructive/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className={`h-4 w-4 ${emphasis ? "text-destructive" : "text-primary"}`} /> {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${emphasis ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, body, urgent }: { icon: any; title: string; body: string; urgent?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 ${urgent ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${urgent ? "text-destructive" : "text-primary"}`} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm whitespace-pre-line">{body}</p>
    </div>
  );
}