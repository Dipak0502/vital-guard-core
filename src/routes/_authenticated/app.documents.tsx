import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Trash2, Upload, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/documents")({
  component: DocsPage,
  head: () => ({ meta: [{ title: "Documents — LifeVault" }] }),
});

function DocsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Report");

  const { data: docs } = useQuery({
    queryKey: ["docs"],
    queryFn: async () => {
      const { data } = await supabase.from("medical_documents").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const path = `${uid}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("medical-documents").upload(path, file);
      if (error) throw error;
      const { error: dbErr } = await supabase.from("medical_documents").insert({
        owner_id: uid, subject_type: "self", subject_id: uid,
        title: title || file.name, category, storage_path: path,
        mime_type: file.type, size_bytes: file.size,
      });
      if (dbErr) throw dbErr;
    },
    onSuccess: () => { toast.success("Uploaded"); setTitle(""); qc.invalidateQueries({ queryKey: ["docs"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (doc: any) => {
      await supabase.storage.from("medical-documents").remove([doc.storage_path]);
      await supabase.from("medical_documents").delete().eq("id", doc.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docs"] }),
  });

  const download = async (doc: any) => {
    const { data } = await supabase.storage.from("medical-documents").createSignedUrl(doc.storage_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medical Documents</h1>
        <p className="mt-1 text-muted-foreground">Prescriptions, reports, lab results, insurance cards.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Upload document</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Blood test — Oct 2026" /></div>
          <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div className="flex items-end">
            <input ref={fileRef} type="file" accept="application/pdf,image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0]; if (f) upload.mutate(f);
            }} />
            <Button className="w-full" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              <Upload className="mr-2 h-4 w-4" /> {upload.isPending ? "Uploading…" : "Choose file"}
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {docs?.length === 0 && <p className="p-10 text-center text-muted-foreground">No documents uploaded yet.</p>}
        <div className="divide-y divide-border">
          {docs?.map((d: any) => (
            <div key={d.id} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary"><FileText className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.category} · {new Date(d.created_at).toLocaleDateString()}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => download(d)}><Download className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => del.mutate(d)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}