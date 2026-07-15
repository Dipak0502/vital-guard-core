import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateEmergencyCode } from "@/lib/lifevault-helpers";
import { QrCode, Download, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/app/qr")({
  component: QrPage,
  head: () => ({ meta: [{ title: "Emergency QR — LifeVault" }] }),
});

function QrPage() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState<{ type: "self" | "family"; id: string; label: string } | null>(null);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const user = (await supabase.auth.getUser()).data.user!;
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const { data: fam } = await supabase.from("family_members").select("id,full_name,relation");
      return [
        { type: "self" as const, id: user.id, label: `${profile?.full_name || "Me"} (Me)` },
        ...(fam ?? []).map(f => ({ type: "family" as const, id: f.id, label: `${f.full_name} (${f.relation})` })),
      ];
    },
  });

  const active = subject ?? subjects?.[0];

  const { data: code } = useQuery({
    queryKey: ["code", active?.type, active?.id],
    enabled: !!active,
    queryFn: async () => {
      const { data } = await supabase.from("emergency_codes").select("*").eq("subject_type", active!.type).eq("subject_id", active!.id).maybeSingle();
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const c = generateEmergencyCode();
      const { error } = await supabase.from("emergency_codes").insert({
        code: c, owner_id: uid, subject_type: active!.type, subject_id: active!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Emergency code generated"); qc.invalidateQueries({ queryKey: ["code"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateFlags = useMutation({
    mutationFn: async (patch: any) => {
      await supabase.from("emergency_codes").update(patch).eq("code", code!.code);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["code"] }),
  });

  const url = useMemo(() => code ? `${window.location.origin}/e/${code.code}` : "", [code]);

  const download = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `lifevault-${code?.code}.png`;
    link.href = (canvas as HTMLCanvasElement).toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Emergency QR Code</h1>
        <p className="mt-1 text-muted-foreground">Print, save or lock-screen this QR. Anyone can scan it to see the emergency-safe info you choose.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <label className="text-sm font-medium">Profile</label>
        <Select value={active ? `${active.type}:${active.id}` : ""} onValueChange={(v) => {
          const [type, id] = v.split(":") as ["self" | "family", string];
          const s = subjects?.find(x => x.type === type && x.id === id);
          if (s) setSubject(s);
        }}>
          <SelectTrigger className="mt-2"><SelectValue placeholder="Choose profile" /></SelectTrigger>
          <SelectContent>
            {subjects?.map(s => <SelectItem key={`${s.type}:${s.id}`} value={`${s.type}:${s.id}`}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!code && active && (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <QrCode className="mx-auto h-10 w-10 text-primary" />
          <p className="mt-3 text-muted-foreground">No emergency code yet for this profile.</p>
          <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending}>Generate QR</Button>
        </div>
      )}

      {code && (
        <div className="grid gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6">
            <QRCodeCanvas value={url} size={220} level="H" />
            <p className="mt-4 font-mono text-sm text-muted-foreground">{code.code}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={download}><Download className="mr-1 h-4 w-4" /> PNG</Button>
              <Button size="sm" variant="outline" onClick={() => window.open(url, "_blank")}><ExternalLink className="mr-1 h-4 w-4" /> Preview</Button>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div>
              <h3 className="font-semibold">Privacy controls</h3>
              <p className="text-sm text-muted-foreground">Choose what scanners see. Blood group, allergies, conditions, medications and emergency contacts are always shown.</p>
            </div>
            <label className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
              <span>Show insurance</span>
              <Switch checked={code.show_insurance} onCheckedChange={(v) => updateFlags.mutate({ show_insurance: v })} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
              <span>Show home address</span>
              <Switch checked={code.show_address} onCheckedChange={(v) => updateFlags.mutate({ show_address: v })} />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
              <span>QR is active</span>
              <Switch checked={code.active} onCheckedChange={(v) => updateFlags.mutate({ active: v })} />
            </label>
            <Button variant="outline" onClick={async () => {
              await supabase.from("emergency_codes").delete().eq("code", code.code);
              qc.invalidateQueries({ queryKey: ["code"] });
              toast.success("QR revoked");
            }}>
              <RefreshCw className="mr-2 h-4 w-4" /> Revoke and regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}