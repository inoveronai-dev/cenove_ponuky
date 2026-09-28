# Cenové ponuky — TOP Okno Trenčín

Profesionálne webové cenové ponuky pre **okná, dvere, tienenie a garážové brány**.

Aplikácia umožňuje firme TOP Okno Trenčín (a podobným firmám):

1. **Vytvoriť** webovú cenovú ponuku za 20–60 sekúnd (položky, rozmery, montáž)
2. **Odoslať** zákazníkovi unikátny odkaz (`/ponuka/7K4X2P`)
3. **Sledovať**, či a koľkokrát zákazník ponuku otvoril — vrátane e-mailovej notifikácie

Toto **nie je** PDF generátor. Výstupom je prémiová customer-facing webová stránka.

---

## Architektúra

| Vrstva | Technológia |
|--------|-------------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS |
| Auth / DB | Supabase Auth + PostgreSQL + RLS |
| AI | OpenAI (text, rýchle zadanie, hlasový Whisper) s deterministickým fallbackom |
| E-mail | Resend (voliteľné) |
| Deploy | Vercel |

### Princípy

- **Cenu počíta len deterministický engine** (`src/lib/pricing/`) — AI nikdy nevymýšľa ceny
- **AI text sa generuje raz** pri vytvorení/úprave a uloží sa do DB
- **Verejná stránka** číta len sanitizované DTO cez service role na serveri
- **Multi-tenant** od začiatku: `companies` + `company_members`

```
Dashboard (auth)
  → create quote → pricing engine + AI copy → quotes row + public_id
Public /ponuka/[publicId] (SSR)
  → POST /api/quotes/.../view → quote_views + notifications (+ Resend)
```

---

## Inštalácia

### Rýchle demo bez Supabase

Ak nevyplníte Supabase kľúče, aplikácia sa automaticky spustí v **demo režime**:

```bash
cd movequote
npm install
npm run dev
```

1. Otvorte [http://localhost:3000](http://localhost:3000)
2. Kliknite **Vyskúšať demo**
3. Máte firmu **TOP Okno Trenčín s.r.o.** + ponuku **Ján Novák** (`/ponuka/7K4X2P`)
4. Vytvárajte / upravujte ponuky, otvárajte verejný link, sledujte otvorenia

Dáta sa ukladajú do lokálneho súboru `.data/demo-store.json` (nie do produkčnej DB).  
Obnovenie: Nastavenia → **Obnoviť demo od nuly**.

Voliteľne môžete vynútiť demo aj so Supabase kľúčmi: `DEMO_MODE=true`.

### Plná inštalácia so Supabase

```bash
cd movequote
cp .env.example .env.local
npm install
npm run dev
```

---

## Premenné prostredia

Pozrite `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENAI_API_KEY=

RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MoveQuote
```

- Bez **OpenAI**: aplikácia funguje s slovenskými template textami
- Bez **Resend**: ponuky a tracking fungujú; e-mail notifikácie sa logujú ako `failed` / `skipped`
- Bez **Supabase**: dashboard zobrazí inštrukcie — **nepoužívame localStorage** namiesto DB

---

## Nastavenie Supabase

1. Vytvorte projekt na [supabase.com](https://supabase.com)
2. Authentication → Providers → Email zapnite
3. SQL Editor → spustite:
   - [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)
4. Skopírujte URL, anon key a service role key do `.env.local`
5. (Voliteľné) demo seed: po registrácii v aplikácii kliknite **Načítať demo údaje** v Nastaveniach, alebo použite komentovaný SQL v `002_demo_seed.sql`

### Čo migrácia vytvorí

- Tabuľky: `profiles`, `companies`, `company_members`, `pricing_settings`, `quotes`, `quote_versions`, `quote_views`, `notifications`
- Trigger `handle_new_user` — po registrácii vytvorí firmu + predvolený cenník
- RLS: členovia firmy vidia len svoje dáta; verejnosť **nemá** priamy prístup k tabuľkám
- Storage bucket `company-logos`

### RLS (skrátene)

- Authenticated používateľ cez `is_company_member(company_id)`
- Verejná ponuka: server používa **service role**, vráti len `PublicQuoteDto` (bez interných poznámok, sadzieb, notification emailu)

---

## OpenAI

Používa sa len na:

1. personalizovaný úvod / súhrn / poznámku k rozsahu
2. štruktúrované „Rýchle zadanie“ (Zod validácia)

Model default: `gpt-5.4` (dopĺňanie polí + text ponuky). Pri chybe alebo chýbajúcom kľúči → fallback templates / heuristiky.

---

## Resend

Pri prvom otvorení ponuky (a voliteľne po cooldown-e) sa:

1. vytvorí záznam v `notifications`
2. pokúsi sa odoslať e-mail (ak sú credentials)

Default cooldown: **3 hodiny** (nastaviteľné v Nastaveniach). Refresh počíta views vždy.

---

## Ako funguje výpočet ceny

```ts
areaM2 = Σ (widthMm/1000 × heightMm/1000 × count)
products = Σ (areaM2 × €/m² podľa kategórie)
montaz = montaz ? totalAreaM2 × montazPerM2 : 0
extras = demontáž×ks + likvidácia + parapety×ks + siete×ks + iné
base = products + montaz + extras + fixedFee (zameranie)
base = max(base, minimumJobPrice)
priceMin = round10(base × bufferMin)
priceMax = round10(base × bufferMax)
```

Kategórie: plastové okná/dvere, hliník, interiérové dvere, tieniaca technika, garážové brány.

Modul: `src/lib/pricing/calculateQuoteEstimate.ts`  
Testy: `npm test`

---

## Ako funguje tracking

1. SSR stránka `/ponuka/[publicId]` sa vyrenderuje zo uložených dát
2. Client beacon `QuoteViewTracker` zavolá `POST /api/quotes/[publicId]/view`
3. Uloží sa `quote_views` (+ voliteľný `ip_hash` — nikdy v dashboarde)
4. Aktualizuje sa `view_count`, `first_viewed_at`, `last_viewed_at`, status `opened`
5. Spustí sa notification logika s cooldownom

---

## Demo firma

V Nastaveniach → **Načítať demo údaje**:

- Firma: **TOP Okno Trenčín s.r.o.** (Zlatovská 22, Trenčín)
- Ponuka: **Ján Novák** — plastové okná + vchodové dvere + vonkajšie rolety, montáž a demontáž na adrese v Trenčíne

---

## Skripty

```bash
npm run dev      # development
npm run build    # production build
npm run lint     # ESLint
npm test         # Vitest (pricing engine)
```

---

## Deploy na Vercel

1. Pushnite repo na GitHub
2. Importujte projekt do Vercel
3. Nastavte rovnaké env variables
4. `NEXT_PUBLIC_APP_URL` = produkčná doména
5. Deploy

---

## Známe limity (V1)

- Vzdialenosť sa zadáva manuálne (adapter pripravený na Maps/Mapbox)
- Bez WebSocket realtime (polling 30 s pre notifikácie)
- Jedna firma na používateľa (multi-member pripravené v schéme)
- Bez PDF, podpisov, platieb, CRM

---

## Budúce rozšírenia

PDF export, acceptance, Stripe deposit, Google Maps distance, SMS/WhatsApp, viac šablón, n8n webhook, realtime Supabase channels, password-protect quotes.

---

## Štruktúra kódu

```
src/
  app/                 # routes (dashboard, ponuka, api)
  components/          # UI + dashboard + quotes + public
  lib/
    pricing/           # deterministický engine
    ai/                # OpenAI + fallback
    tracking/          # view recording
    notifications/     # cooldown + Resend
    quotes/            # public id, DTO, schemas
    supabase/          # clients + middleware helpers
supabase/migrations/   # SQL schema + RLS
```
