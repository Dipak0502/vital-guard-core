import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { REMINDER_KINDS } from "@/lib/lifevault-helpers";
import { Bell, Check, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/reminders")({
  component: RemindersPage,
  head: () => ({ meta: [{ title: "Reminders — LifeVault" }] }),
});

function RemindersPage() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("medicine");
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");

  const { data: items } = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const { data } = await supabase.from("reminders").select("*").order("remind_at");
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { error } = await supabase.from("reminders").insert({
        owner_id: uid, subject_type: "self", subject_id: uid,
        kind, title, remind_at: new Date(when).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reminder added"); setTitle(""); setWhen(""); qc.invalidateQueries({ queryKey: ["reminders"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (r: any) => { await supabase.from("reminders").update({ completed: !r.completed }).eq("id", r.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("reminders").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
        <p className="mt-1 text-muted-foreground">Medicines, vaccinations, insurance and checkups.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">New reminder</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div><Label>Type</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REMINDER_KINDS.map(k => <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Take metformin 500mg" /></div>
          <div><Label>When</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => add.mutate()} disabled={!title || !when || add.isPending}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {items?.length === 0 && <p className="p-10 text-center text-muted-foreground">No reminders yet.</p>}
        <div className="divide-y divide-border">
          {items?.map((r: any) => (
            <div key={r.id} className={`flex items-center gap-4 p-4 ${r.completed ? "opacity-60" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><Bell className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className={`font-medium ${r.completed ? "line-through" : ""}`}>{r.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{r.kind} · {new Date(r.remind_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => toggle.mutate(r)}><Check className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}