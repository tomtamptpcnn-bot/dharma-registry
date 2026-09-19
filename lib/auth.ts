import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/config";
// Deduplicate only within one server render, never across users or requests.
export const requireUser = cache(async function requireUser() {
  if (!isConfigured()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || user.is_anonymous) redirect("/login");
  return { supabase, user };
});
