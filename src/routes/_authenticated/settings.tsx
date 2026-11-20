import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { settingsQuery, uploadPhoto, usePhotoUrl } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – Idol Bookings" }, { name: "description", content: "Shop details, logo and booking rules." }, { property: "og:title", content: "Shop Settings" }, { property: "og:description", content: "Shop details and booking rules." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: s } = useSuspenseQuery(settingsQuery);
  const qc = useQueryClient();
  const [name, setName] = useState(s.shop_name);
  const [address, setAddress] = useState(s.shop_address);
  const [phone, setPhone] = useState(s.shop_phone);
  const [logo, setLogo] = useState(s.logo_url);
  const [rules, setRules] = useState<string[]>(s.rules);
  const [busy, setBusy] = useState(false);
  const { data: logoUrl } = usePhotoUrl(logo);

  async function save() {
    if (!name.trim()) { toast.error("Shop name is required"); return; }
    setBusy(true);
    const { error } = await supabase.from("shop_settings").update({
      shop_name: name.trim().slice(0, 120), shop_address: address.trim().slice(0, 300), shop_phone: phone.trim().slice(0, 30),
      logo_url: logo, rules: rules.map((r) => r.trim()).filter(Boolean),
    }).eq("id", 1);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["settings"] });
    toast.success("Settings saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl text-maroon">Settings</h1>
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <h2 className="text-xl">Shop Details</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-saffron font-display text-3xl text-primary-foreground">ॐ</div>}
          <Button variant="outline" asChild>
            <label className="cursor-pointer"><ImagePlus />Upload logo
              <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                try { setLogo(await uploadPhoto(f, "logo")); } catch (err) { toast.error((err as Error).message); }
              }} />
            </label>
          </Button>
        </div>
        <div className="space-y-1.5"><Label htmlFor="sn">Shop Name</Label><Input id="sn" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="sa">Address</Label><Input id="sa" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="sp">Phone</Label><Input id="sp" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      </section>
      <section className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 className="text-xl">Booking Rules & Terms</h2>
        {rules.map((r, i) => (
          <div key={i} className="flex gap-2">
            <span className="pt-2 text-sm text-muted-foreground">{i + 1}.</span>
            <Textarea rows={2} value={r} onChange={(e) => setRules(rules.map((x, j) => (j === i ? e.target.value : x)))} />
            <Button variant="ghost" size="icon" aria-label="Remove rule" onClick={() => setRules(rules.filter((_, j) => j !== i))}><Trash2 /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => setRules([...rules, ""])}><Plus />Add rule</Button>
      </section>
      <Button variant="hero" size="xl" className="w-full" onClick={save} disabled={busy}>Save Settings</Button>
    </div>
  );
}
