# Dollars to Yum Yums 😋💲

Plot every restaurant on a graph: **yum yums (0–10) across**, **dollars (0–10) up**.
The dashed diagonal is the fair-price line: dots below it were worth it, dots above it were overpriced.
Add friends, overlay their graph, see your **taste match**, and get **try next** suggestions.

- **Next.js 16** (App Router) on **Vercel**
- **Supabase** for email sign-in, Postgres with row-level security, and photo storage
- **Google Places API (New)** for Autocomplete and Place Details, called only from the server

---

## Part 1: Create the accounts (about 30 minutes)

Do these in order. You'll collect five values along the way. Paste them into a scratch note as you go:

| Value | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase (step 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (step 1) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (step 1), **secret** |
| `GOOGLE_PLACES_API_KEY` | Google Cloud (step 2), **secret** |
| Your Vercel URL | Vercel (step 3) |

### 1. Supabase (database, sign-in, photo storage)

1. Go to **https://supabase.com** → **Start your project** → sign up with GitHub (easiest, since Vercel will use GitHub too).
2. **New project**:
   - Organization: accept the default personal org, on the **Free** plan.
   - Name: `dollars-to-yum-yums`
   - Database password: click **Generate**, then save it in a password manager. The app never needs it, but you'll want it later.
   - Region: the one closest to you.
   - Click **Create new project** and wait about 2 minutes.
3. **Create the tables.** Left sidebar → **SQL Editor** → **New query**. Paste the whole of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), then click **Run**. You should see "Success. No rows returned."
   - To check: **Table Editor** should list `profiles`, `places`, `ratings`, `friendships`, and **Storage** should show a `place-photos` bucket.
4. **Copy the keys.** Click **Connect** at the top, or go to **Project Settings → API Keys**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / publishable** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This key is safe in the browser because RLS protects the data.
   - **service_role / secret** key → `SUPABASE_SERVICE_ROLE_KEY`. Never share this key or put it in client code.
5. **Let sign-in emails include a code.** Go to **Authentication → Emails → Templates → Magic Link**. Replace the body with:
   ```html
   <h2>Sign in to Dollars to Yum Yums</h2>
   <p><a href="{{ .ConfirmationURL }}">Tap here to sign in</a></p>
   <p>Or enter this code: <strong>{{ .Token }}</strong></p>
   ```
   Do the same for the **Confirm signup** template. The code matters on phones, where a link in the Mail app can open in a different browser than the one you're signing in from (common with home-screen web apps).
6. **Redirect URLs.** You'll finish this after step 3, once you have the Vercel URL.

> **Free-tier notes.** Supabase's built-in email sender only allows a few emails per hour. That's fine for you and a few friends. If people start hitting "rate limit exceeded", add a free SMTP provider (such as Resend) under **Authentication → Emails → SMTP Settings**. Free projects also **pause after 7 days with no activity**. Restoring one takes one click in the dashboard.

### 2. Google Cloud (restaurant search)

1. Go to **https://console.cloud.google.com** and sign in with your Google account. Accept the terms.
2. **Create a project.** Use the project picker at the top → **New Project** → name it `dollars-to-yum-yums` → **Create**. Make sure it's selected afterwards.
3. **Set up billing.** Google requires a billing account even for free usage. Go to **☰ → Billing → Link a billing account → Create billing account** and add a card. The quota caps in step 6 keep you inside the free usage.
4. **Enable the API.** Go to **☰ → APIs & Services → Library**, search **"Places API (New)"**, open it, and click **Enable**.
   (Use the one with **(New)** in the name. The legacy "Places API" is a different product.)
5. **Create a restricted key.** Go to **APIs & Services → Credentials → + Create credentials → API key**, then open the new key to edit it:
   - Name: `places-server`
   - **Application restrictions: None.** The key is only ever used from Vercel's servers, which have no fixed IP, and never reaches a browser.
   - **API restrictions: Restrict key** → tick only **Places API (New)** → **Save**.
   - Copy the key → `GOOGLE_PLACES_API_KEY`.
6. **Cap daily usage so you stay free.** Go to **APIs & Services → Enabled APIs → Places API (New) → Quotas & System Limits**. Filter for the per-day quotas. Google's labels shift a bit, but they are per method, roughly *"Autocomplete… per day"*, *"GetPlace… per day"* and *"GetPhotoMedia… per day"*. Tick each one → **Edit quota** and enter:

   | Quota (per day) | Cap | Why |
   |---|---|---|
   | Autocomplete requests | **300** | ≈ 9,000/month, under the 10,000 free Essentials calls. Searches that end in a pick are billed as a free session anyway. |
   | GetPlace (Place Details) | **150** | ≈ 4,500/month, under the 5,000 free Pro calls. Only the *first* person to add a place triggers this call. |
   | GetPhotoMedia (Place Photos) | **30** | ≈ 900/month, under the 1,000 free Enterprise calls. One photo per place, cached forever. |

   When a cap is hit, Google returns HTTP 429 and the app shows *"Today's restaurant search limit has been reached. Try again tomorrow."* Nobody gets charged.

7. **Add a budget alert** as a safety net. Go to **☰ → Billing → Budgets & alerts → Create budget**, set **$1**, and keep the email alerts at 50/90/100%.

> Free allowances are per SKU, per month, under Google's March 2025 pricing. Double-check the current numbers at **Google Maps Platform → Pricing** before relying on them.

### 3. Vercel (hosting)

1. This code needs to be on GitHub, in `nina-mucciolo/nina-mucciolo`. Merge the `claude/dollars-yum-yums-app-cxhqk0` branch into your default branch, or deploy from the branch directly.
2. Go to **https://vercel.com** → **Sign Up** → **Continue with GitHub** → choose the **Hobby** (free) plan.
3. **Add New… → Project** → import `nina-mucciolo/nina-mucciolo`. If it's missing, click **Adjust GitHub App Permissions** and grant access to the repo.
4. Framework preset: **Next.js** (auto-detected). Leave the build settings at their defaults.
5. Open **Environment Variables** and add all four:
   ```
   NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  = eyJ... or sb_publishable_...
   SUPABASE_SERVICE_ROLE_KEY      = eyJ... or sb_secret_...
   GOOGLE_PLACES_API_KEY          = AIza...
   ```
6. Click **Deploy**. When it finishes, copy your URL, e.g. `https://dollars-to-yum-yums.vercel.app`.

### 4. Connect Supabase sign-in to your Vercel URL

In Supabase, go to **Authentication → URL Configuration**:
- **Site URL**: `https://<your-app>.vercel.app`
- **Redirect URLs**: add
  - `https://<your-app>.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback` (for local development)
  - Optionally `https://*-<your-vercel-team>.vercel.app/auth/callback` so preview deployments work

### 5. Try it

1. Open the Vercel URL on your phone → enter your email → tap the link, or type the code.
2. Pick a username.
3. Tap **＋ Add** → search for a restaurant → pick it → drag the sliders → **Add to my graph**.
4. Ask a friend to sign up, then go to **Friends** → type their `@username` → **Add**. Once they accept, tap their name to overlay your graphs.
5. On iPhone: Share → **Add to Home Screen**, and it opens like an app.

---

## Part 2: Run locally

```bash
cp .env.example .env.local   # fill in the four values
npm install
npm run dev                  # http://localhost:3000
npm test                     # taste-match / try-next logic
npm run typecheck
```

---

## How it works

### Data model (`supabase/migrations/0001_init.sql`)

| Table | What | Who can read / write |
|---|---|---|
| `profiles` | username and display name, created automatically on sign-up | All signed-in users can read (to find friends). Each user can update their own. |
| `places` | Shared cache keyed by **Google place ID**: name, address, location, cached photo path, photo credit | All signed-in users can read. **Only the server** (service role) writes. |
| `ratings` | `(user_id, place_id)` → yum, dollars, note | Each user writes their own. Readable by the owner and **accepted friends**. |
| `friendships` | requester → addressee, `pending` / `accepted` | Only the two people involved |

Friends' graphs line up because both people's ratings point at the same `places.place_id`.

### Google Places flow (key stays on the server)

1. `/add` sends keystrokes, debounced 350 ms and only from 3 characters, to **`POST /api/places/autocomplete`**, along with a **session token** and optionally your location. The route requires sign-in, so strangers can't spend your quota.
2. Picking a result calls **`POST /api/places`**. If the place is already in `places`, Google isn't called at all. Otherwise the route makes one **Place Details** call (field mask `id,displayName,formattedAddress,location,photos`, which also closes the autocomplete session). It then downloads **one photo** at 600 px wide, uploads it to the `place-photos` bucket, and inserts the row.
3. Pages show the cached photo straight from Supabase Storage, with its required author credit. The search results show "Powered by Google".

### Taste match and Try next (`lib/compare.ts`)

- **Taste match** uses the places you've both rated. For each one, the distance is `0.75·|Δyum| + 0.25·|Δdollars|`, and `score = 100 × (1 − mean distance / 10)`.
- **Try next** lists places your friend rated that you haven't. Their yum scores are adjusted for whether they rate high or low compared to you (the average gap on shared places, shrunk toward 0 when you share only a few). Places predicted below 5 are dropped. The rest are ranked by predicted yum plus a small bonus for good value.

### Pages

| Route | |
|---|---|
| `/login` | Email link or 6-digit code |
| `/onboarding` | Pick or edit username |
| `/` | My graph: tap a dot or a list row; toggle names |
| `/add` | Restaurant search |
| `/rate/[placeId]` | Sliders with live preview on your graph, note, delete |
| `/friends` | Add by username, accept requests |
| `/compare/[friendId]` | Overlaid graphs with lines between shared places, taste match, try next |

---

## ⚠️ A note on Google's terms

Google Maps Platform terms generally **do not allow caching Places content** (names, addresses, photos) long-term. Place IDs are the main exception and may be stored indefinitely. This app stores the name, address and one photo per place permanently, as requested, which goes beyond that. For a small app shared among friends this is a personal judgment call. To be strictly compliant, keep only `place_id` and fetch the details and photo when they're needed, which would use more of your free quota.
