/* ==========================================================================
   SUPABASE-CLIENT.JS — creates the one shared Supabase connection
   ==========================================================================

   Both pages import `supabase` from here. We load the official Supabase
   library straight from a CDN as an ES module — no npm / build step needed,
   which keeps this site as simple static files.

   You should not need to edit this file. Your keys live in
   supabase-config.js next door.
   ========================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

// One client, shared by whichever page imports it. Used for reading and
// writing rows in the "messages" table and for the realtime subscription on
// the wall. (Photo UPLOADS don't go through this client — they use a small
// hand-written uploader in form.js so we can show real upload progress,
// which this library doesn't expose.)
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // This is an anonymous public form — nobody logs in — so we don't want
    // the library trying to persist or refresh any user session.
    persistSession: false,
    autoRefreshToken: false,
  },
});
