import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QrCode, ShieldCheck, Users, HeartPulse, FileText, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "LifeVault — Emergency Medical Profile & QR" },
      { name: "description", content: "Store medical info securely. Doctors scan your QR to see blood group, allergies, medications and emergency contacts instantly." },
    ],
  }),
});

function Feature({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LifeVault</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Encrypted · Private · Emergency-first
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Life-saving medical info,<br />
            <span className="text-primary">one QR scan away.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            LifeVault stores your medical profile — blood group, allergies, medications, emergency contacts — so first responders can act fast when every second matters.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth"><Button size="lg">Create your emergency profile</Button></Link>
            <a href="#how"><Button size="lg" variant="outline">How it works</Button></a>
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Everything for the moment that matters</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">Built for real emergencies. Private by default, shareable by choice.</p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <Feature icon={QrCode} title="Emergency QR code" desc="Print it, save it, put it on your phone lock screen. Anyone can scan it to view your emergency-safe profile." />
            <Feature icon={Users} title="Family profiles" desc="Manage records for your parents, spouse, and children — all from one account." />
            <Feature icon={FileText} title="Medical documents" desc="Securely upload prescriptions, reports, insurance cards and lab results." />
            <Feature icon={Bell} title="Smart reminders" desc="Never miss medication, vaccinations, checkups or insurance renewals." />
            <Feature icon={ShieldCheck} title="You choose what to share" desc="Toggle address and insurance visibility. Revoke the QR any time." />
            <Feature icon={HeartPulse} title="SOS button" desc="One tap to call an ambulance and send your medical profile to a family member." />
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LifeVault. Emergency medical info you control.
        </div>
      </footer>
    </div>
  );
}