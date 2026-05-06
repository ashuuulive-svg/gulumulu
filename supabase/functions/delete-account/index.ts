// Hard delete: wipe all user data + auth row so the same email can re-signup.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const uid = user.id;

    // delete storage objects in user folders
    for (const bucket of ["avatars", "post-images", "stories", "chat-media"]) {
      try {
        const { data: list } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
        if (list && list.length) {
          await admin.storage.from(bucket).remove(list.map((f) => `${uid}/${f.name}`));
        }
      } catch (e) { console.warn("storage cleanup", bucket, e); }
    }

    // delete app data (FK-less but logically related)
    await admin.from("notifications").delete().or(`recipient_id.eq.${uid},actor_id.eq.${uid}`);
    await admin.from("messages").delete().eq("sender_id", uid);
    await admin.from("conversations").delete().or(`user_a.eq.${uid},user_b.eq.${uid}`);
    await admin.from("post_likes").delete().eq("user_id", uid);
    await admin.from("post_comments").delete().eq("author_id", uid);
    await admin.from("posts").delete().eq("author_id", uid);
    await admin.from("stories").delete().eq("user_id", uid);
    await admin.from("follows").delete().or(`follower_id.eq.${uid},following_id.eq.${uid}`);
    await admin.from("user_roles").delete().eq("user_id", uid);
    await admin.from("profiles").delete().eq("id", uid);

    // finally: delete auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("delete-account error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
