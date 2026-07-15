import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BLOOD_GROUPS } from "@/lib/lifevault-helpers";
import { Plus, Trash2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/family")({
  component: FamilyPage,
  head: () => ({ meta: [{ title: "Family — LifeVault" }] }),
});

function FamilyPage() {
  const qc = useQueryClient();
  const { data: members } = useQuery({
    queryKey: ["family"],
    queryFn: async () => {
      const { data } = await supabase.from("family_members").select("*").order("created_at");
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("family_members").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["family"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family</h1>
          <p className="mt-1 text-muted-foreground">Manage medical profiles for the people you care for.</p>
        </div>
        <AddMember />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {members?.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No family members yet. Add one to get started.
          </div>
        )}
        {members?.map((m: any) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{m.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{m.relation}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(m.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <EditMemberMedical member={m} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AddMember() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");

  const add = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { error } = await supabase.from("family_members").insert({ owner_id: uid, full_name: name, relation });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Family member added");
      qc.invalidateQueries({ queryKey: ["family"] });
      setOpen(false); setName(""); setRelation("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add member</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add family member</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Relation</Label>
            <Select value={relation} onValueChange={setRelation}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {["Father","Mother","Spouse","Son","Daughter","Grandfather","Grandmother","Sibling","Other"].map(r =>
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => add.mutate()} disabled={!name || !relation || add.isPending}>Add</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberMedical({ member }: { member: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: med } = useQuery({
    queryKey: ["med", member.id],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("medical_info").select("*").eq("subject_type", "family").eq("subject_id", member.id).maybeSingle();
      return data ?? {};
    },
  });
  const [m, setM] = useState<any>({});
  const save = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const payload = { ...m, owner_id: uid, subject_type: "family", subject_id: member.id };
      const { error } = await supabase.from("medical_info").upsert(payload, { onConflict: "subject_type,subject_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["med", member.id] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v && med) setM(med); }}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="mt-4 w-full">Edit medical info</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader><DialogTitle>{member.full_name} — Medical info</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Blood group</Label>
            <Select value={m.blood_group ?? ""} onValueChange={(v) => setM({ ...m, blood_group: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Allergies</Label><Input value={m.allergies ?? ""} onChange={(e) => setM({ ...m, allergies: e.target.value })} /></div>
          <div><Label>Conditions</Label><Input value={m.conditions ?? ""} onChange={(e) => setM({ ...m, conditions: e.target.value })} /></div>
          <div><Label>Current medications</Label><Textarea value={m.current_medications ?? ""} onChange={(e) => setM({ ...m, current_medications: e.target.value })} /></div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}