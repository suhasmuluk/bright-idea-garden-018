import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTION_STATUSES } from "@/lib/booking";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProductionSelect({ id, value, compact = false }: { id: string; value: string; compact?: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  async function update(production_status: string) {
    setBusy(true);
    try {
      const { error } = await supabase.from("bookings").update({ production_status }).eq("id", id).select("id").single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Production status updated");
    } catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }
  return <Select value={value} onValueChange={update} disabled={busy}><SelectTrigger aria-label="Production status" className={compact ? "h-7 min-w-24 text-[11px]" : "min-w-40"}><SelectValue /></SelectTrigger><SelectContent>{PRODUCTION_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>;
}