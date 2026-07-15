import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Siren, PhoneCall, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/sos")({
  component: SosPage,
  head: () => ({ meta: [{ title: "SOS — LifeVault" }] }),
});

function SosPage() {
  const { data } = useQuery({
    queryKey: ["sos"],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const [contacts, code] = await Promise.all([
        supabase.from("emergency_contacts").select("*").eq("subject_type", "self").eq("subject_id", uid).order("is_primary", { ascending: false }),
        supabase.from("emergency_codes").select("code").eq("subject_type", "self").eq("subject_id", uid).maybeSingle(),
      ]);
      return { contacts: contacts.data ?? [], code: code.data?.code };
    },
  });

  const shareLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition((pos) => {
      const url = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
      navigator.clipboard.writeText(url);
      toast.success("Location link copied to clipboard");
    });
  };

  const shareProfile = async () => {
    if (!data?.code) return toast.error("Generate an emergency QR first");
    const url = `${window.location.origin}/e/${data.code}`;
    if (navigator.share) await navigator.share({ title: "My medical profile", url });
    else { await navigator.clipboard.writeText(url); toast.success("Emergency link copied"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-destructive">Emergency SOS</h1>
        <p className="mt-1 text-muted-foreground">One-tap actions for a real emergency.</p>
      </div>

      <div className="rounded-2xl border-2 border-destructive bg-destructive/5 p-8 text-center">
        <a href="tel:112" className="inline-flex h-32 w-32 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition hover:scale-105">
          <Siren className="h-16 w-16" />
        </a>
        <p className="mt-4 text-lg font-semibold text-destructive">Call emergency services (112)</p>
        <p className="text-sm text-muted-foreground">On mobile, this dials your local emergency number.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button size="lg" variant="outline" className="justify-start" onClick={shareLocation}>
          <MapPin className="mr-2 h-5 w-5 text-primary" /> Share my location
        </Button>
        <Button size="lg" variant="outline" className="justify-start" onClick={shareProfile}>
          <Share2 className="mr-2 h-5 w-5 text-primary" /> Share medical profile
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold">Call an emergency contact</h3>
        {data?.contacts?.length === 0 && <p className="text-sm text-muted-foreground">Add emergency contacts in your profile.</p>}
        <div className="space-y-2">
          {data?.contacts?.map((c: any) => (
            <a key={c.id} href={`tel:${c.phone}`} className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary">
              <PhoneCall className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">{c.name} {c.is_primary && <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Primary</span>}</p>
                <p className="text-sm text-muted-foreground">{c.relation} · {c.phone}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}