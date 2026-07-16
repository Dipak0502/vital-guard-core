import { createServerFn } from "@tanstack/react-start";

/**
 * Public lookup for an emergency profile by code.
 *
 * The underlying `get_emergency_profile` SQL function is SECURITY DEFINER and
 * its EXECUTE privilege is revoked from `anon` and `authenticated` — only the
 * service role can invoke it. This server function is the sole entry point:
 * it validates input shape server-side and calls the RPC with the admin
 * client. The code itself is the secret (high-entropy, see
 * generateEmergencyCode), and unknown/revoked codes simply return null.
 */
export const getEmergencyProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => {
    if (!input || typeof input.code !== "string") {
      throw new Error("Invalid code");
    }
    const code = input.code.trim();
    if (code.length < 3 || code.length > 128 || !/^[A-Za-z0-9-]+$/.test(code)) {
      throw new Error("Invalid code");
    }
    return { code };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin.rpc("get_emergency_profile", {
      _code: data.code,
    });
    if (error) throw error;
    // RPC returns JSONB (or null). Re-serialize to a plain JSON string so the
    // server-fn serializer stays happy regardless of the payload's shape.
    return { profile: profile == null ? null : JSON.parse(JSON.stringify(profile)) as unknown };
  });