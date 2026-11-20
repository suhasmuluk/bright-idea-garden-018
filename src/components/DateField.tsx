import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DateField({ value, onChange, label, clearable = true }: { value: string; onChange: (value: string) => void; label: string; clearable?: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="flex min-w-0 gap-1">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button type="button" variant="outline" aria-label={label} className="h-11 min-w-0 flex-1 justify-start font-normal"><CalendarIcon className="shrink-0" /><span className="truncate">{value ? format(parseISO(value), "dd MMM yyyy") : label}</span></Button></PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={value ? parseISO(value) : undefined} onSelect={(date) => { onChange(date ? format(date, "yyyy-MM-dd") : ""); setOpen(false); }} captionLayout="dropdown" className="pointer-events-auto" /></PopoverContent>
    </Popover>
    {clearable && value && <Button type="button" variant="ghost" size="icon" className="h-11 shrink-0" aria-label={`Clear ${label}`} title={`Clear ${label}`} onClick={() => onChange("")}><X /></Button>}
  </div>;
}