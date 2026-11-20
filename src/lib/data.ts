import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Booking = Tables<"bookings">;
export type Settings = Tables<"shop_settings">;

export const bookingsQuery = queryOptions({
  queryKey: ["bookings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const bookingQuery = (id: string) =>
  queryOptions({
    queryKey: ["bookings", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("shop_settings").select("*").eq("id", 1).single();
    if (error) throw error;
    return data;
  },
});

export function usePhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["photo", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("idol-photos").createSignedUrl(path!, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export async function uploadPhoto(file: File, prefix = "idols"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("idol-photos").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
