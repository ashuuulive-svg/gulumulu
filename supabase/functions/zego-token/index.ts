// Zego Kit Token (Server) — generates a Test02 kit token using AppSign.
// Same algorithm Zego docs use; can be safely called from authenticated clients.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_ID = Number(Deno.env.get("ZEGO_APP_ID") ?? "280341621");
const APP_SIGN = Deno.env.get("ZEGO_APP_SIGN") ?? "7cd0481dd5eb7bdc5b9195ffad8c938bb8b858";

async function hmacSha256(keyHex: string, msg: Uint8Array): Promise<Uint8Array> {
  // keyHex is the AppSign hex string used as raw key bytes (Zego convention)
  const keyBytes = new TextEncoder().encode(keyHex);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, msg);
  return new Uint8Array(sig);
}

function b64(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s);
}

// Generate Zego Test02 token (kit token compatible)
async function generateToken04(appId: number, userId: string, secret: string, effectiveTimeInSeconds: number, payload = ""): Promise<string> {
  const createTime = Math.floor(Date.now() / 1000);
  const expireTime = createTime + effectiveTimeInSeconds;
  const nonce = Math.floor(Math.random() * 2147483647);

  const tokenInfo = {
    app_id: appId,
    user_id: userId,
    nonce,
    ctime: createTime,
    expire: expireTime,
    payload,
  };
  const plaintext = JSON.stringify(tokenInfo);

  // AES-128-CBC with random 16-byte IV; key = first 16 bytes of secret
  const keyBytes = new TextEncoder().encode(secret).slice(0, 32); // up to 32, AES-CBC supports 16/24/32
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes.slice(0, 16), { name: "AES-CBC" }, false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-CBC", iv }, cryptoKey, new TextEncoder().encode(plaintext)));

  // Pack: [expire(8)][ivLen(2)][iv][ctLen(2)][ct]
  const buf = new ArrayBuffer(8 + 2 + 16 + 2 + ct.length);
  const dv = new DataView(buf);
  // BigInt write for 8 bytes
  dv.setBigInt64(0, BigInt(expireTime), false);
  dv.setUint16(8, 16, false);
  new Uint8Array(buf, 10, 16).set(iv);
  dv.setUint16(10 + 16, ct.length, false);
  new Uint8Array(buf, 12 + 16).set(ct);

  const body = b64(new Uint8Array(buf));
  return "04" + body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const token = await generateToken04(APP_ID, user.id, APP_SIGN, 60 * 60); // 1h
    return new Response(JSON.stringify({ appId: APP_ID, token, userId: user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("zego-token error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
