/* ==========================================================================
   SUPABASE-CONFIG.JS — YOUR project's connection details
   ==========================================================================

   👉 THIS IS THE ONLY FILE YOU NEED TO EDIT to connect the pages to your
      own Supabase project. Replace the two placeholder values below with
      the ones from your Supabase dashboard, then save.

   WHERE TO FIND THESE (takes ~1 minute):
     1. Go to https://supabase.com and open your project (or create one —
        see SUPABASE-SETUP.md in the project root for the full walkthrough).
     2. In the left sidebar: Project Settings (the gear) → "API".
     3. Copy "Project URL" into SUPABASE_URL below.
     4. Under "Project API keys", copy the "anon / public" key into
        SUPABASE_ANON_KEY below.

   IS IT SAFE TO PUT THE KEY IN CODE LIKE THIS?
     Yes. The "anon" (anonymous / public) key is DESIGNED to be shipped in
     browser code — it's how the public form talks to your database. Your
     data is protected instead by "Row Level Security" rules you set up in
     the dashboard (SUPABASE-SETUP.md walks you through those). What you
     must NEVER put here is the "service_role" key — that one is a master
     key and must stay secret on a server. We only ever use the anon key.
   ========================================================================== */

// ⬇️ SUPABASE_URL is set. The anon key still needs to go in below.
export const SUPABASE_URL = "https://gsgxbzcyfeniqwhhhenv.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZ3hiemN5ZmVuaXF3aGhoZW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwNjcwNTQsImV4cCI6MjEwMjY0MzA1NH0.dgPT4KFk6wqbGJKwkN5l8BhQt2dFAeCfamN7Fat5HjQ";

// The name of the Storage "bucket" your photos are uploaded into, and the
// database table the messages go into. The bucket name here must match the
// bucket you created in the Supabase dashboard exactly (spaces and capitals
// included). The code URL-encodes it where needed, so spaces are fine.
export const PHOTO_BUCKET = "Birthday Eddy Sadeli";
export const MESSAGES_TABLE = "messages";

/* A tiny helper the pages use to check you've actually filled the values in
   above — so that if you forget, you get a clear on-screen message instead
   of a confusing silent failure. */
export function isConfigured() {
  return (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_URL.includes("YOUR-PROJECT-REF") &&
    SUPABASE_ANON_KEY.length > 20 &&
    !SUPABASE_ANON_KEY.includes("YOUR-ANON")
  );
}
