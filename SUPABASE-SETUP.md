# Supabase setup — birthday message pages

The two new pages (`/kata-kata` and `/ucapan`) need a free Supabase project
to store the messages and photos. This is the part you do yourself in the
Supabase dashboard. It takes about 10 minutes and needs no coding — you'll
mostly copy-paste one block of SQL.

Nothing here costs money; Supabase's free tier is plenty for a birthday.

---

## Step 0 — Create a Supabase project

1. Go to <https://supabase.com> and sign up (GitHub or email).
2. Click **New project**. Give it a name (e.g. `eddyready`), set a database
   password (save it somewhere — you won't need it for this, but Supabase
   requires one), pick the region closest to your guests (e.g. Singapore),
   and create it. Wait ~2 minutes for it to finish setting up.

---

## Step 1 — Copy your keys into the code

1. In your project, click the **gear / Project Settings** (bottom-left) →
   **API**.
2. Copy **Project URL** and the **anon public** key.
3. Open `assets/js/supabase-config.js` in this project and paste them in:

   ```js
   export const SUPABASE_URL = "https://abcd1234.supabase.co";   // your Project URL
   export const SUPABASE_ANON_KEY = "eyJhbGciOi...";              // your anon public key
   ```

> **Is the anon key safe to put in code?** Yes — it's built to be public.
> Your data is protected by the security rules in Step 2, not by hiding the
> key. Never paste the **service_role** key anywhere in this project; that
> one is a master key and must stay secret.

---

## Step 2 — Create the table, security rules, storage, and realtime

This one block of SQL sets up everything. In the dashboard:

1. Left sidebar → **SQL Editor** → **New query**.
2. Paste the whole block below and click **Run**.

```sql
-- === The messages table ===
create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null,
  message     text not null,
  photo_url   text
);

-- Row Level Security: locked by default, then we open exactly what we need.
alter table public.messages enable row level security;

-- Anyone may READ messages (the wall needs this).
create policy "Anyone can read messages"
  on public.messages for select
  to anon
  using (true);

-- Anyone may SUBMIT a message (the form needs this).
create policy "Anyone can submit a message"
  on public.messages for insert
  to anon
  with check (true);
-- (No update/delete rules → nobody with the public key can edit or delete
--  messages. Only you, from the dashboard, can.)

-- Broadcast new rows so the wall updates live.
alter publication supabase_realtime add table public.messages;

-- === The photo storage bucket ===
insert into storage.buckets (id, name, public)
values ('message-photos', 'message-photos', true)
on conflict (id) do nothing;

-- Anyone may UPLOAD a photo into that bucket (the form needs this).
create policy "Anyone can upload a message photo"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'message-photos');

-- Anyone may VIEW photos from that bucket (the wall needs this).
create policy "Anyone can view message photos"
  on storage.objects for select
  to anon
  using (bucket_id = 'message-photos');
```

You should see "Success. No rows returned." That's expected — it means it
worked.

---

## Step 3 — (Recommended) Limit photo size and type

To stop someone uploading a huge or non-image file:

1. Left sidebar → **Storage** → click the **message-photos** bucket →
   the small **settings** / three-dots → **Edit bucket**.
2. Set **File size limit** to something like `15 MB`.
3. Under **Allowed MIME types**, add `image/*` (or `image/jpeg, image/png`).
4. Save.

(The form already shrinks photos before uploading, so real uploads are
usually well under 1 MB — this is just a safety cap.)

---

## Step 4 — Test it

1. Run the site locally (or after deploying):

   ```bash
   python3 -m http.server 4173
   ```

   then open <http://localhost:4173/kata-kata/>.
2. Fill in a name and message, optionally pick a photo, and submit. You
   should see the "Ucapanmu sudah terkirim" thank-you.
3. Open <http://localhost:4173/ucapan/> in another tab — your message should
   be there. Submit another from the form tab and watch it **appear on the
   wall live**, no refresh.
4. In Supabase → **Table Editor** → `messages`, you'll see the rows; in
   **Storage** → `message-photos`, you'll see the photos.

---

## Good to know

- **This is an open submission form.** Anyone with the link can post, which
  is exactly what you want for a birthday where guests submit from their
  phones. The trade-off is there's no spam protection — for a private event
  link that's fine. After the party you can stop new submissions by opening
  the SQL editor and running:
  `drop policy "Anyone can submit a message" on public.messages;`
  (the wall keeps working; new submissions are simply refused).
- **Deleting a message:** do it from Supabase → Table Editor. The public
  pages can't delete anything by design.
- **Projecting the wall:** open `https://eddyready.id/ucapan` on the machine
  driving the projector. It defaults to the dark forest look. To force light
  mode there instead, use `https://eddyready.id/ucapan?theme=light`.
