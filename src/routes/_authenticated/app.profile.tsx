import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOOD_GROUPS } from "@/lib/lifevault-helpers";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "My Profile — LifeVault" }] }),
});

function ProfilePage() {
  const qc = useQueryClient();
  const { data: uid } = useQuery<string>({
    queryKey: ["uid"],
    queryFn: async () => (await supabase.auth.getUser()).data.user!.id,
  });

  const { data } = useQuery({
    queryKey: ["profile-full", uid],
    enabled: !!uid,
    queryFn: async () => {
      const [p, m, c] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid!).maybeSingle(),
        supabase.from("medical_info").select("*").eq("subject_type", "self").eq("subject_id", uid!).maybeSingle(),
        supabase.from("emergency_contacts").select("*").eq("subject_type", "self").eq("subject_id", uid!).order("is_primary", { ascending: false }),
      ]);
      return { profile: p.data, medical: m.data, contacts: c.data ?? [] };
    },
  });

  const [p, setP] = useState<any>({});
  const [m, setM] = useState<any>({});
  useEffect(() => {
    if (data?.profile) setP(data.profile);
    if (data?.medical) setM(data.medical);
  }, [data]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({
        full_name: p.full_name, date_of_birth: p.date_of_birth || null, gender: p.gender,
        height_cm: p.height_cm || null, weight_kg: p.weight_kg || null, phone: p.phone, address: p.address,
      }).eq("id", uid!);
      if (error) throw error;
      const payload: any = {
        owner_id: uid, subject_type: "self", subject_id: uid,
        blood_group: m.blood_group, allergies: m.allergies, conditions: m.conditions,
        current_medications: m.current_medications, past_surgeries: m.past_surgeries,
        vaccinations: m.vaccinations, disabilities: m.disabilities,
        organ_donor: !!m.organ_donor, smoking: !!m.smoking, alcohol: !!m.alcohol, pregnancy: !!m.pregnancy,
        insurance_provider: m.insurance_provider, insurance_policy: m.insurance_policy,
        insurance_expiry: m.insurance_expiry || null, notes: m.notes,
      };
      const { error: e2 } = await supabase.from("medical_info").upsert(payload, { onConflict: "subject_type,subject_id" });
      if (e2) throw e2;
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile-full"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_contacts").insert({
        owner_id: uid, subject_type: "self", subject_id: uid,
        name: "New contact", relation: "", phone: "",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-full"] }),
  });

  const updateContact = useMutation({
    mutationFn: async (c: any) => {
      const { error } = await supabase.from("emergency_contacts").update({
        name: c.name, relation: c.relation, phone: c.phone, is_primary: c.is_primary,
      }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-full"] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("emergency_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-full"] }),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Medical Profile</h1>
        <p className="mt-1 text-muted-foreground">This info powers your emergency QR.</p>
      </div>

      <Section title="Personal">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input value={p.full_name ?? ""} onChange={(e) => setP({ ...p, full_name: e.target.value })} /></Field>
          <Field label="Date of birth"><Input type="date" value={p.date_of_birth ?? ""} onChange={(e) => setP({ ...p, date_of_birth: e.target.value })} /></Field>
          <Field label="Gender">
            <Select value={p.gender ?? ""} onValueChange={(v) => setP({ ...p, gender: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone"><Input value={p.phone ?? ""} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <Field label="Height (cm)"><Input type="number" value={p.height_cm ?? ""} onChange={(e) => setP({ ...p, height_cm: e.target.value })} /></Field>
          <Field label="Weight (kg)"><Input type="number" value={p.weight_kg ?? ""} onChange={(e) => setP({ ...p, weight_kg: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Address"><Textarea value={p.address ?? ""} onChange={(e) => setP({ ...p, address: e.target.value })} /></Field></div>
        </div>
      </Section>

      <Section title="Medical">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Blood group">
            <Select value={m.blood_group ?? ""} onValueChange={(v) => setM({ ...m, blood_group: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Allergies"><Input placeholder="e.g. Penicillin, peanuts" value={m.allergies ?? ""} onChange={(e) => setM({ ...m, allergies: e.target.value })} /></Field>
          <Field label="Chronic conditions"><Input value={m.conditions ?? ""} onChange={(e) => setM({ ...m, conditions: e.target.value })} /></Field>
          <Field label="Disabilities"><Input value={m.disabilities ?? ""} onChange={(e) => setM({ ...m, disabilities: e.target.value })} /></Field>
          <div className="md:col-span-2"><Field label="Current medications"><Textarea placeholder="Medicine · dosage · frequency" value={m.current_medications ?? ""} onChange={(e) => setM({ ...m, current_medications: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Past surgeries / hospitalizations"><Textarea value={m.past_surgeries ?? ""} onChange={(e) => setM({ ...m, past_surgeries: e.target.value })} /></Field></div>
          <div className="md:col-span-2"><Field label="Vaccinations"><Textarea value={m.vaccinations ?? ""} onChange={(e) => setM({ ...m, vaccinations: e.target.value })} /></Field></div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { k: "organ_donor", l: "Organ donor" },
            { k: "smoking", l: "Smokes" },
            { k: "alcohol", l: "Drinks alcohol" },
            { k: "pregnancy", l: "Pregnant" },
          ].map((x) => (
            <label key={x.k} className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
              <span className="text-sm">{x.l}</span>
              <Switch checked={!!m[x.k]} onCheckedChange={(v) => setM({ ...m, [x.k]: v })} />
            </label>
          ))}
        </div>
      </Section>

      <Section title="Insurance">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Provider"><Input value={m.insurance_provider ?? ""} onChange={(e) => setM({ ...m, insurance_provider: e.target.value })} /></Field>
          <Field label="Policy number"><Input value={m.insurance_policy ?? ""} onChange={(e) => setM({ ...m, insurance_policy: e.target.value })} /></Field>
          <Field label="Expiry"><Input type="date" value={m.insurance_expiry ?? ""} onChange={(e) => setM({ ...m, insurance_expiry: e.target.value })} /></Field>
        </div>
      </Section>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>Save profile</Button>
      </div>

      <Section title="Emergency contacts" action={<Button size="sm" variant="outline" onClick={() => addContact.mutate()}><Plus className="mr-1 h-4 w-4" /> Add</Button>}>
        <div className="space-y-3">
          {data?.contacts?.length === 0 && <p className="text-sm text-muted-foreground">No emergency contacts yet.</p>}
          {data?.contacts?.map((c: any) => (
            <ContactRow key={c.id} contact={c} onSave={(x) => updateContact.mutate(x)} onDelete={() => deleteContact.mutate(c.id)} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ContactRow({ contact, onSave, onDelete }: { contact: any; onSave: (c: any) => void; onDelete: () => void }) {
  const [c, setC] = useState(contact);
  useEffect(() => setC(contact), [contact]);
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-secondary/30 p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
      <Input placeholder="Name" value={c.name ?? ""} onChange={(e) => setC({ ...c, name: e.target.value })} />
      <Input placeholder="Relation" value={c.relation ?? ""} onChange={(e) => setC({ ...c, relation: e.target.value })} />
      <Input placeholder="Phone" value={c.phone ?? ""} onChange={(e) => setC({ ...c, phone: e.target.value })} />
      <label className="flex items-center gap-2 px-2 text-sm">
        <Switch checked={!!c.is_primary} onCheckedChange={(v) => setC({ ...c, is_primary: v })} /> Primary
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(c)}>Save</Button>
        <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}