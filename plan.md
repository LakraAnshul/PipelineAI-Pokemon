# Pokémon Explorer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality, beautifully designed, fully responsive Pokémon Explorer SPA that consumes the public PokéAPI and satisfies every core requirement, UI/UX requirement, code-quality requirement, and *all six* bonus features from the assignment brief.

**Architecture:** A Vite + React + TypeScript single-page app. A single typed API layer (`services/pokemonApi.ts`) owns all network access, normalization, error classification, and in-memory caching. Custom hooks (`usePokemonList`, `usePokemonDetail`, …) own data orchestration — pagination, search, filtering, sorting — so components stay presentational and reusable. Three React contexts (Theme, Favorites, Compare) own cross-cutting client state and persist to `localStorage`. All view state that a user would want to share (selected Pokémon, search query, active type, sort) lives in the URL.

**Tech Stack:** React 19 · TypeScript (strict) · Vite · React Router · Tailwind CSS v4 · Framer Motion · Lucide React · Space Grotesk / Inter / JetBrains Mono · Vitest + React Testing Library

**Spec:** `Frontend Assignment_ Public API Integration & UI.pdf` (repo root) — extracted verbatim to `out_assignment.txt`. The "Design System" and "Requirement Traceability" sections of *this* document form the derived spec; both travel with the plan.

---

## Global Constraints

Every task's requirements implicitly include this section.

**Toolchain**
- Node.js ≥ 20 (dev machine runs v24.14.1), npm ≥ 10 (dev machine runs 11.12.1).
- TypeScript `strict: true`. No `any` in committed code — use `unknown` + narrowing.
- All source under `src/`. Path alias `@/` → `src/`.
- ESLint + Prettier must pass clean before every commit.

**API**
- Base URL: `https://pokeapi.co/api/v2/` — **no API key, no auth headers, ever.**
- Endpoints used: `/pokemon?limit=&offset=`, `/pokemon/{nameOrId}`, `/type/{type}`, `/type`.
- Official artwork is derived from ID (no extra request):
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png`
- Roster is capped at the **canonical National-Dex species** (IDs 1–1025 at time of writing); the list endpoint's `count` of 1302 includes alternate-form IDs (≥ 10000), which are excluded because they lack official artwork. The cut-off is derived from the ID, never hard-coded to a species total.
- Page size is **20** (matches the brief's `limit=20`).

**Verbatim UI copy** (these exact strings, from the brief — do not paraphrase)
- App title: `Pokémon Explorer`
- Search placeholder: `Search Pokémon...`
- Search-miss: `Pokémon not found.` / `Try searching for another Pokémon.`
- Error state: `Something went wrong.` / `We couldn't load the Pokémon.` / button `Try Again`
- Empty state: `No Pokémon found.` / `Try searching for a different Pokémon.`
- Load-more button: `Load More`
- Filter "all" chip: `All`

**Responsive breakpoints** (Tailwind defaults)
- Mobile `< 640px` · Tablet `640–1023px` · Desktop `≥ 1024px`
- Card grid columns: `2` (mobile) → `3` (`md`) → `4` (`lg`) → `5` (`2xl`).
  *Deliberate improvement over the brief's single-column mobile sketch: cards are designed compact so 2-up reads better on phones. The brief labels that layout "suggested".*
- No horizontal page scroll at any width ≥ 320px.

**Accessibility (bonus requirement — treat as mandatory)**
- Every interactive element reachable by `Tab`, activatable by `Enter`/`Space`.
- `Escape` closes any modal/drawer. Modals trap focus and restore it to the trigger on close.
- Visible `focus-visible` ring on every control. `aria-label` on all icon-only buttons.
- Respect `prefers-reduced-motion: reduce` — disable transforms/transitions, keep opacity fades.
- Colour contrast ≥ 4.5:1 for body text in both themes.

**Git discipline**
- Remote: `https://github.com/LakraAnshul/PipelineAI-Pokemon.git` (already configured as `origin`).
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `style:`, `refactor:`).
- **One commit per task, `git push` after every task** — the brief is graded partly on a clean, incremental history.

**Out of scope**
- **No deployment.** The user deploys manually to Render/Vercel. Ship config files (`vercel.json`, `render.yaml`) and README instructions only — never run a deploy command.
- No backend, no auth, no state library (Redux/Zustand), no data-fetching library (TanStack Query). Loading/error/empty handling is explicitly graded, so it stays hand-rolled and visible.

---

## Design System

The single source of visual truth. Direction: **a catalog instrument, not a dashboard.**

A Pokédex is a handheld device for indexing specimens, so the design borrows that world's vernacular: numbered catalog entries set in mono, a live count readout, hairline construction lines, and the Poké Ball's own geometry as a structural device. The chrome stays near-monochrome and disciplined; the 18 type colours are the only loud thing on screen, and a single Poké Ball red carries every interactive state.

**Deliberate anti-defaults.** The accent is Poké Ball red rather than the indigo/violet that every AI-generated app reaches for. The light background is a cool `#f4f5f8` rather than the warm cream `#f4f1ea` default. The display face is Space Grotesk — technical, slightly retro-futurist — rather than Poppins/Outfit. Boldness is spent in exactly one place: the seam device below.

### Signature device — the Poké Ball seam

A Poké Ball is defined by one horizontal seam with a circular latch at its centre. Every card and the modal header reproduce that construction:

```
┌─────────────────────┐
│  #025      ♥        │   ← catalog number (mono) + favourite
│                     │
│      ( artwork )    │   ← type-tinted wash behind the artwork
│                     │
├──────────●──────────┤   ← 1px seam + type-coloured latch dot
│  Pikachu            │   ← name (Space Grotesk, bold)
│  [Electric]         │   ← type badge(s)
└─────────────────────┘
```

- The seam is a true 1px `--color-border` hairline; the latch is a 10px type-coloured disc centred on it with a 2px surface-coloured ring, so it reads as hardware.
- On hover the latch blooms to a 14px disc with a type-coloured glow, the artwork scales 1.06, and the card lifts 4px. That single moment is the app's memorable interaction — nothing else animates on hover.
- The modal repeats the seam at 2× scale, so opening a card feels like the same object enlarging.

### Colour tokens

Defined as CSS custom properties in `src/styles/index.css`, exposed to Tailwind v4 via `@theme`. Dark mode is class-based (`.dark` on `<html>`).

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg` | `#f4f5f8` | `#0b0b12` | page background (cool paper / deep ink) |
| `--color-surface` | `#ffffff` | `#15151e` | cards, modal, header |
| `--color-surface-2` | `#eceef4` | `#1e1e2a` | inputs, chips, skeletons |
| `--color-border` | `#e0e3ec` | `#2a2a3a` | hairlines, the seam |
| `--color-text` | `#12121a` | `#f4f5fa` | primary text |
| `--color-text-muted` | `#5c6172` | `#9aa0b8` | secondary text, readouts |
| `--color-brand` | `#e3252b` | `#ff4d55` | Poké Ball red — buttons, focus ring, active chip, links |
| `--color-favorite` | `#e3252b` | `#ff4d55` | favourite heart (semantic alias of brand) |
| `--color-danger` | `#b3202b` | `#ff7a80` | error iconography only |

Only one accent hue exists. Error states lean on icon + copy rather than a competing colour, and `Try Again` is a **primary** action (brand red) because it is not destructive.

### Typography

Three roles, all self-hosted via `@fontsource-variable/*` (no external requests, no CLS, works offline).

| Role | Face | Used for |
|---|---|---|
| Display | **Space Grotesk** 500/700 | wordmark, Pokémon names, section headings |
| Body | **Inter** 400/500/600 | labels, descriptions, buttons, all prose |
| Data | **JetBrains Mono** 500 | catalog numbers (`#025`), stat values, height/weight/XP readouts, counts |

- Scale: `text-xs 12` · `sm 14` · `base 16` · `lg 18` · `xl 20` · `2xl 24` · `3xl 30` · `4xl 36` · `5xl 48`.
- Display is set tight (`tracking-tight`, `leading-[1.05]`); mono is always `tabular-nums` so columns of numbers align.
- Anything that is a *measurement or an index* is mono. That rule is what makes the app read as an instrument.

### Shape, depth, motion
- Radii: cards `rounded-3xl` (24px), chips/buttons `rounded-full`, inputs `rounded-2xl`.
- Shadows: layered and soft — `shadow-[0_1px_2px_rgba(16,16,32,.04),0_8px_24px_-8px_rgba(16,16,32,.10)]`; hover lifts to a wider, type-tinted glow.
- Spacing rhythm: multiples of 4; section gutters `px-4 sm:px-6 lg:px-8`; grid gap `gap-4 sm:gap-5`.
- **No marketing hero.** This is a tool, so the thesis is a compact masthead (wordmark + live `Showing X of Y species` readout) that collapses into the sticky bar on scroll — an instrument panel whose numbers are real information.
- Motion budget — one orchestrated page-load sequence, then quiet micro-interactions (the brief says "do not overuse"):
  - Page load: masthead fade+rise (240ms) → readout (+80ms) → card stagger (28ms each, first page only).
  - Card hover: lift 4px + artwork `scale(1.06)` + latch bloom, `180ms ease-out`.
  - Modal: backdrop fade 160ms; panel `scale .96→1` + fade 220ms spring on desktop, slide-up sheet on mobile.
  - Skeleton: 1.6s shimmer sweep. Stat bars: grow from 0 over 600ms ease-out.
  - Buttons/chips: `120ms` background+transform.


### Type colours (all 18)

`src/utils/typeColors.ts` — each type maps to a base hex, a soft background tint, and a readable foreground. Follows the brief's suggested mapping (Fire red/orange, Water blue, Grass green, Electric yellow, Psychic pink, Ghost purple, Ice cyan, Dragon indigo, Dark gray, Fairy pink) and completes the rest.

| Type | Base | Type | Base |
|---|---|---|---|
| normal | `#9099a1` | ground | `#d97845` |
| fire | `#ff6b3d` | flying | `#8fa8dd` |
| water | `#3d9bff` | psychic | `#ff6b9d` |
| electric | `#f7c531` | bug | `#92bc2c` |
| grass | `#4bc46a` | rock | `#c5b78c` |
| ice | `#4fd4d4` | ghost | `#7b62a3` |
| fighting | `#e0526a` | dragon | `#5b6ee1` |
| poison | `#b563ce` | dark | `#5a5366` |
| steel | `#68a3bd` | fairy | `#ee90c4` |

Usage: badge fill, card gradient wash (primary type at 12% → 4%), card hover glow, modal header gradient, stat-bar fill.

---

## File Structure

Extends the brief's suggested structure. Each file has one responsibility; files that change together live together.

```
├── plan.md                         ← this document
├── README.md                       ← deliverable (Task 18)
├── screenshots/                    ← deliverable (Task 19)
├── vercel.json  render.yaml        ← SPA-rewrite config, NOT deployed
├── index.html  vite.config.ts  tsconfig.json
├── eslint.config.js  .prettierrc  .gitignore
└── src/
    ├── main.tsx                    App bootstrap, Router, providers
    ├── App.tsx                     Route table + layout shell
    ├── vite-env.d.ts
    ├── styles/
    │   └── index.css               Tailwind v4 import, @theme tokens, keyframes
    ├── types/
    │   └── pokemon.ts              Raw API + normalized app types, PokemonType union
    ├── services/
    │   └── pokemonApi.ts           fetch wrapper, ApiError taxonomy, cache, endpoints
    ├── utils/
    │   ├── typeColors.ts           18-type colour map + helpers
    │   ├── formatters.ts           id padding, name casing, height/weight, stat labels
    │   └── sorting.ts              sortRefs / sortDetails by id|name|hp|attack|speed
    ├── hooks/
    │   ├── useDebounce.ts
    │   ├── usePokemonList.ts       source list → filter → sort → paginate → fetch page
    │   ├── usePokemonDetail.ts     single Pokémon by name/id, for the modal
    │   ├── useLocalStorage.ts
    │   ├── useFocusTrap.ts
    │   ├── useLockBodyScroll.ts
    │   └── useOnlineStatus.ts
    ├── context/
    │   ├── ThemeContext.tsx        light/dark + system, persisted
    │   ├── FavoritesContext.tsx    Set<number>, persisted
    │   └── CompareContext.tsx      max-2 selection
    ├── components/
    │   ├── ui/                     Button, IconButton, Chip, Skeleton, Select, Tooltip
    │   ├── layout/                 Header, Footer, Container, ThemeToggle, SkipLink
    │   ├── pokemon/                PokemonCard, PokemonGrid, PokemonModal,
    │   │                           StatBar, TypeBadge, FavoriteButton, MoveList
    │   ├── search/                 SearchBar
    │   ├── filters/                TypeFilter, SortSelect, FavoritesFilter, Toolbar
    │   ├── compare/                CompareTray, CompareModal
    │   └── states/                 LoadingSkeleton, ErrorState, EmptyState, ErrorBoundary
    ├── pages/
    │   ├── HomePage.tsx            grid + toolbar + modal outlet
    │   └── NotFoundPage.tsx
    └── test/
        ├── setup.ts
        └── *.test.ts(x)            colocated-by-concern unit tests
```

---

## Requirement Traceability

Proof that nothing in the brief is unimplemented. Every row must be checkable at review time.

| # | Brief requirement | Task |
|---|---|---|
| C1 | Card layout: image, name, ID, type(s), type-based styling | 8 |
| C2 | Search by name + not-found handling | 9 |
| C3 | Load More (preferred option) | 8, 5 |
| C4 | Detail view: art, name, ID, types, height, weight, abilities, base stats, moves | 11 |
| C5 | Filter by type | 9 |
| C6 | Responsive desktop / tablet / mobile | 15 (verified), all |
| C7 | Skeleton / shimmer loading — never "Loading..." | 8, 10 |
| C8 | Error handling incl. retry, network fail, bad response | 4, 10, 17 |
| C9 | Empty state | 10 |
| U1 | Modern design: typography, spacing, rounded cards, shadows, hover, contrast, hierarchy | Design System, 6–11 |
| U2 | Subtle animations: card hover, buttons, modal, skeleton, page transitions | 8, 11, 15 |
| U3 | Type-based colours | 3 |
| T1 | React + TypeScript (preferred stack) | 1 |
| T2 | Tailwind CSS | 1 |
| T3 | Lucide icons | 1 |
| Q1–Q9 | Reusable components, folders, naming, no duplication, API errors, loading, responsive CSS, architecture, TS types | all |
| B1 | Favorites + localStorage | 13 |
| B2 | Dark mode | 14 |
| B3 | Sort by ID / Name / Attack / Speed / HP | 9 |
| B4 | Compare two Pokémon | 12 |
| B5 | Keyboard accessibility (Enter/Escape/Tab) | 16 |
| B6 | URL-based search `/pokemon/pikachu` | 11 |
| D1 | GitHub repository + clean history | every task |
| D2 | Live deployed app | **user deploys**; config + docs in 18 |
| D3 | README with all 8 required sections | 18 |
| D4 | Screenshots | 19 |

---

## Task 1: Project scaffold, tooling, and design tokens

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/styles/index.css`, `src/test/setup.ts`
- Delete: `out.txt`, `out_assignment.txt` (scratch extraction artifacts)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: working `npm run dev` / `build` / `lint` / `test`; Tailwind v4 with `.dark` variant and all design tokens; `@/` alias.

- [ ] **Step 1: Scaffold Vite React-TS in place**

```bash
cd "C:/Users/anshu/OneDrive/Documents/GitHub/PipelineAI"
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install react-router-dom framer-motion lucide-react \
  @fontsource-variable/inter @fontsource-variable/space-grotesk \
  @fontsource-variable/jetbrains-mono
npm install -D tailwindcss @tailwindcss/vite prettier \
  vitest @vitest/coverage-v8 jsdom @testing-library/react \
  @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 3: Configure Vite (Tailwind plugin, `@/` alias, Vitest)**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

Add to `tsconfig.json` `compilerOptions`: `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`, `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, `"types": ["vitest/globals", "@testing-library/jest-dom"]`.

- [ ] **Step 4: Write `src/styles/index.css` with tokens, dark variant, keyframes**

```css
@import 'tailwindcss';
@import '@fontsource-variable/inter';
@import '@fontsource-variable/space-grotesk';
@import '@fontsource-variable/jetbrains-mono';

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Space Grotesk Variable', 'Inter Variable', sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;

  --color-bg: #f4f5f8;
  --color-surface: #ffffff;
  --color-surface-2: #eceef4;
  --color-border: #e0e3ec;
  --color-text: #12121a;
  --color-text-muted: #5c6172;
  --color-brand: #e3252b;
  --color-favorite: #e3252b;
  --color-danger: #b3202b;

  --animate-shimmer: shimmer 1.6s infinite linear;
  --animate-rise: rise 0.4s ease-out both;
}

.dark {
  --color-bg: #0b0b12;
  --color-surface: #15151e;
  --color-surface-2: #1e1e2a;
  --color-border: #2a2a3a;
  --color-text: #f4f5fa;
  --color-text-muted: #9aa0b8;
  --color-brand: #ff4d55;
  --color-favorite: #ff4d55;
  --color-danger: #ff7a80;
}

@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
@keyframes rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }

@layer base {
  html { scroll-behavior: smooth; }
  body {
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }
  /* Every measurement and index reads as instrument data. */
  .tabular { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  :focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

- [ ] **Step 5: Minimal `App.tsx` smoke render + `src/test/setup.ts`**

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest'
```

`App.tsx` renders an `<h1 className="font-display">Pokémon Explorer</h1>` placeholder so the toolchain is provably wired.

- [ ] **Step 6: Verify the whole toolchain**

Run: `npx tsc --noEmit && npm run lint && npm run build && npm run dev`
Expected: typecheck clean, lint clean, build emits `dist/`, dev server serves the heading with Inter/Outfit applied and the correct background colour.

- [ ] **Step 7: Update `package.json` scripts**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 8: Commit and push (first commit on `main`)**

```bash
git add -A && git rm --cached out.txt out_assignment.txt 2>/dev/null || true
git commit -m "chore: scaffold Vite + React + TypeScript app with Tailwind v4 design tokens"
git push -u origin main
```

---

## Task 2: Domain types

**Files:**
- Create: `src/types/pokemon.ts`

**Interfaces:**
- Produces: `PokemonType` (union of 18), `POKEMON_TYPES`, `RawPokemonListResponse`, `RawPokemon`, `RawTypeResponse`, `PokemonRef`, `Pokemon`, `PokemonStats`, `StatKey`, `SortKey`, `SORT_OPTIONS`.

- [ ] **Step 1: Write the raw API types (mirroring PokéAPI shapes exactly)**

```ts
export interface NamedApiResource { name: string; url: string }
export interface RawPokemonListResponse {
  count: number; next: string | null; previous: string | null
  results: NamedApiResource[]
}
export interface RawPokemon {
  id: number; name: string; height: number; weight: number
  base_experience: number | null
  sprites: {
    front_default: string | null
    other?: { ['official-artwork']?: { front_default: string | null } }
  }
  types: { slot: number; type: NamedApiResource }[]
  abilities: { is_hidden: boolean; slot: number; ability: NamedApiResource }[]
  stats: { base_stat: number; effort: number; stat: NamedApiResource }[]
  moves: { move: NamedApiResource }[]
}
export interface RawTypeResponse {
  name: string
  pokemon: { slot: number; pokemon: NamedApiResource }[]
}
```

- [ ] **Step 2: Write the normalized app types**

```ts
export const POKEMON_TYPES = [
  'normal','fire','water','electric','grass','ice','fighting','poison','ground',
  'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
] as const
export type PokemonType = (typeof POKEMON_TYPES)[number]

/** Lightweight identity known before details are fetched. */
export interface PokemonRef { id: number; name: string }

export type StatKey = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed'
export type PokemonStats = Record<StatKey, number>

export interface Pokemon extends PokemonRef {
  types: PokemonType[]
  imageUrl: string
  spriteUrl: string | null
  height: number   // decimetres (raw)
  weight: number   // hectograms (raw)
  baseExperience: number | null
  abilities: { name: string; isHidden: boolean }[]
  stats: PokemonStats
  totalStats: number
  moves: string[]
  moveCount: number
}

export type SortKey = 'id-asc' | 'id-desc' | 'name-asc' | 'name-desc'
  | 'attack-desc' | 'speed-desc' | 'hp-desc'
export const SORT_OPTIONS: { value: SortKey; label: string; needsDetails: boolean }[] = [
  { value: 'id-asc',     label: 'Lowest number',  needsDetails: false },
  { value: 'id-desc',    label: 'Highest number', needsDetails: false },
  { value: 'name-asc',   label: 'A → Z',          needsDetails: false },
  { value: 'name-desc',  label: 'Z → A',          needsDetails: false },
  { value: 'attack-desc',label: 'Attack',         needsDetails: true  },
  { value: 'speed-desc', label: 'Speed',          needsDetails: true  },
  { value: 'hp-desc',    label: 'HP',             needsDetails: true  },
]
```

- [ ] **Step 3: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: PASS, no unused-export errors.

- [ ] **Step 4: Commit and push**

```bash
git add src/types/pokemon.ts
git commit -m "feat: add PokéAPI raw and normalized domain types"
git push
```

---

## Task 3: Type colours and formatters (TDD)

**Files:**
- Create: `src/utils/typeColors.ts`, `src/utils/formatters.ts`
- Test: `src/utils/typeColors.test.ts`, `src/utils/formatters.test.ts`

**Interfaces:**
- Consumes: `PokemonType`, `POKEMON_TYPES`, `StatKey` from Task 2.
- Produces: `getTypeColor(type): TypeColor` where `TypeColor = { base: string; soft: string; onBase: string }`; `getTypeGradient(types): string`; `formatPokemonId(3) => '#003'`; `formatPokemonName('mr-mime') => 'Mr. Mime'`; `formatHeight(4) => '0.4 m'`; `formatWeight(60) => '6.0 kg'`; `STAT_LABELS: Record<StatKey, string>`; `STAT_MAX = 255`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/typeColors.test.ts
import { describe, expect, it } from 'vitest'
import { POKEMON_TYPES } from '@/types/pokemon'
import { getTypeColor, getTypeGradient } from './typeColors'

describe('getTypeColor', () => {
  it('returns a colour set for every one of the 18 types', () => {
    for (const type of POKEMON_TYPES) {
      const c = getTypeColor(type)
      expect(c.base).toMatch(/^#[0-9a-f]{6}$/i)
      expect(c.soft).toBeTruthy()
      expect(c.onBase).toBeTruthy()
    }
  })
  it('falls back to normal for an unknown type', () => {
    expect(getTypeColor('mystery' as never)).toEqual(getTypeColor('normal'))
  })
  it('maps the brief\'s suggested colours to the right hue family', () => {
    expect(getTypeColor('fire').base.toLowerCase()).toBe('#ff6b3d')
    expect(getTypeColor('water').base.toLowerCase()).toBe('#3d9bff')
    expect(getTypeColor('grass').base.toLowerCase()).toBe('#4bc46a')
    expect(getTypeColor('electric').base.toLowerCase()).toBe('#f7c531')
  })
})

describe('getTypeGradient', () => {
  it('blends two types when a Pokémon is dual-typed', () => {
    const g = getTypeGradient(['grass', 'poison'])
    expect(g).toContain('#4bc46a')
    expect(g).toContain('#b563ce')
  })
  it('uses a single hue for mono-typed Pokémon', () => {
    expect(getTypeGradient(['fire'])).toContain('#ff6b3d')
  })
})
```

```ts
// src/utils/formatters.test.ts
import { describe, expect, it } from 'vitest'
import { formatHeight, formatPokemonId, formatPokemonName, formatWeight } from './formatters'

it('pads IDs to three digits with a hash', () => {
  expect(formatPokemonId(25)).toBe('#025')
  expect(formatPokemonId(1)).toBe('#001')
  expect(formatPokemonId(1302)).toBe('#1302')
})
it('humanises hyphenated API names', () => {
  expect(formatPokemonName('pikachu')).toBe('Pikachu')
  expect(formatPokemonName('mr-mime')).toBe('Mr. Mime')
  expect(formatPokemonName('porygon-z')).toBe('Porygon-Z')
  expect(formatPokemonName('nidoran-f')).toBe('Nidoran ♀')
})
it('converts decimetres to metres and hectograms to kilograms', () => {
  expect(formatHeight(4)).toBe('0.4 m')
  expect(formatHeight(17)).toBe('1.7 m')
  expect(formatWeight(60)).toBe('6.0 kg')
  expect(formatWeight(905)).toBe('90.5 kg')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils`
Expected: FAIL — "Failed to resolve import './typeColors'".

- [ ] **Step 3: Implement `typeColors.ts`**

```ts
import type { PokemonType } from '@/types/pokemon'

export interface TypeColor { base: string; soft: string; onBase: string }

const DARK_TEXT = '#1a1a24'
const LIGHT_TEXT = '#ffffff'

const TYPE_COLORS: Record<PokemonType, TypeColor> = {
  normal:   { base: '#9099a1', soft: 'rgba(144,153,161,.14)', onBase: LIGHT_TEXT },
  fire:     { base: '#ff6b3d', soft: 'rgba(255,107,61,.14)',  onBase: LIGHT_TEXT },
  water:    { base: '#3d9bff', soft: 'rgba(61,155,255,.14)',  onBase: LIGHT_TEXT },
  electric: { base: '#f7c531', soft: 'rgba(247,197,49,.16)',  onBase: DARK_TEXT  },
  grass:    { base: '#4bc46a', soft: 'rgba(75,196,106,.14)',  onBase: LIGHT_TEXT },
  ice:      { base: '#4fd4d4', soft: 'rgba(79,212,212,.16)',  onBase: DARK_TEXT  },
  fighting: { base: '#e0526a', soft: 'rgba(224,82,106,.14)',  onBase: LIGHT_TEXT },
  poison:   { base: '#b563ce', soft: 'rgba(181,99,206,.14)',  onBase: LIGHT_TEXT },
  ground:   { base: '#d97845', soft: 'rgba(217,120,69,.14)',  onBase: LIGHT_TEXT },
  flying:   { base: '#8fa8dd', soft: 'rgba(143,168,221,.16)', onBase: DARK_TEXT  },
  psychic:  { base: '#ff6b9d', soft: 'rgba(255,107,157,.14)', onBase: LIGHT_TEXT },
  bug:      { base: '#92bc2c', soft: 'rgba(146,188,44,.14)',  onBase: LIGHT_TEXT },
  rock:     { base: '#c5b78c', soft: 'rgba(197,183,140,.18)', onBase: DARK_TEXT  },
  ghost:    { base: '#7b62a3', soft: 'rgba(123,98,163,.14)',  onBase: LIGHT_TEXT },
  dragon:   { base: '#5b6ee1', soft: 'rgba(91,110,225,.14)',  onBase: LIGHT_TEXT },
  dark:     { base: '#5a5366', soft: 'rgba(90,83,102,.14)',   onBase: LIGHT_TEXT },
  steel:    { base: '#68a3bd', soft: 'rgba(104,163,189,.16)', onBase: LIGHT_TEXT },
  fairy:    { base: '#ee90c4', soft: 'rgba(238,144,196,.16)', onBase: DARK_TEXT  },
}

export function getTypeColor(type: PokemonType): TypeColor {
  return TYPE_COLORS[type] ?? TYPE_COLORS.normal
}

/** Radial wash used behind card artwork and in the modal header. */
export function getTypeGradient(types: PokemonType[]): string {
  const primary = getTypeColor(types[0] ?? 'normal').base
  const secondary = types[1] ? getTypeColor(types[1]).base : primary
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
}
```

- [ ] **Step 4: Implement `formatters.ts`**

```ts
import type { StatKey } from '@/types/pokemon'

export const STAT_MAX = 255

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

const NAME_OVERRIDES: Record<string, string> = {
  'mr-mime': 'Mr. Mime', 'mr-rime': 'Mr. Rime', 'mime-jr': 'Mime Jr.',
  'porygon-z': 'Porygon-Z', 'nidoran-f': 'Nidoran ♀', 'nidoran-m': 'Nidoran ♂',
  'ho-oh': 'Ho-Oh', 'jangmo-o': 'Jangmo-o', 'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o', 'type-null': 'Type: Null', 'tapu-koko': 'Tapu Koko',
}

export function formatPokemonId(id: number): string {
  return `#${String(id).padStart(3, '0')}`
}

export function formatPokemonName(name: string): string {
  const override = NAME_OVERRIDES[name.toLowerCase()]
  if (override) return override
  return name.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function formatHeight(decimetres: number): string {
  return `${(decimetres / 10).toFixed(1)} m`
}

export function formatWeight(hectograms: number): string {
  return `${(hectograms / 10).toFixed(1)} kg`
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/utils`
Expected: PASS (all cases in both files).

- [ ] **Step 6: Commit and push**

```bash
git add src/utils
git commit -m "feat: add 18-type colour system and display formatters with tests"
git push
```

---

## Task 4: API service layer (TDD)

**Files:**
- Create: `src/services/pokemonApi.ts`
- Test: `src/services/pokemonApi.test.ts`

**Interfaces:**
- Consumes: types from Task 2.
- Produces:
  - `class ApiError extends Error { kind: 'network' | 'http' | 'notFound' | 'malformed'; status?: number }`
  - `getPokemonPage(offset, limit): Promise<{ refs: PokemonRef[]; total: number }>`
  - `getPokemonDetail(nameOrId: string | number): Promise<Pokemon>`
  - `getPokemonDetails(refs: PokemonRef[]): Promise<Pokemon[]>` (concurrency-limited, order-preserving)
  - `getPokemonRefsByType(type: PokemonType): Promise<PokemonRef[]>`
  - `getAllPokemonRefs(): Promise<PokemonRef[]>` (cached name index for search)
  - `getArtworkUrl(id: number): string`
  - `clearApiCache(): void` (test hygiene)

- [ ] **Step 1: Write the failing tests**

```ts
// src/services/pokemonApi.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, clearApiCache, getPokemonDetail, getPokemonPage } from './pokemonApi'

const RAW_PIKACHU = {
  id: 25, name: 'pikachu', height: 4, weight: 60, base_experience: 112,
  sprites: { front_default: 's.png', other: { 'official-artwork': { front_default: 'art.png' } } },
  types: [{ slot: 1, type: { name: 'electric', url: '' } }],
  abilities: [{ is_hidden: false, slot: 1, ability: { name: 'static', url: '' } }],
  stats: [
    { base_stat: 35, effort: 0, stat: { name: 'hp', url: '' } },
    { base_stat: 55, effort: 0, stat: { name: 'attack', url: '' } },
    { base_stat: 40, effort: 0, stat: { name: 'defense', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-attack', url: '' } },
    { base_stat: 50, effort: 0, stat: { name: 'special-defense', url: '' } },
    { base_stat: 90, effort: 0, stat: { name: 'speed', url: '' } },
  ],
  moves: [{ move: { name: 'thunder-shock', url: '' } }, { move: { name: 'quick-attack', url: '' } }],
}

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as Response

beforeEach(() => { clearApiCache(); vi.restoreAllMocks() })
afterEach(() => { vi.unstubAllGlobals() })

describe('getPokemonPage', () => {
  it('derives numeric IDs from result URLs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({
      count: 1302, next: null, previous: null,
      results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
    })))
    const { refs, total } = await getPokemonPage(0, 20)
    expect(refs).toEqual([{ id: 1, name: 'bulbasaur' }])
    expect(total).toBe(1302)
  })

  it('throws a malformed ApiError when results is not an array', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({ count: 0, results: null })))
    await expect(getPokemonPage(0, 20)).rejects.toMatchObject({ kind: 'malformed' })
  })
})

describe('getPokemonDetail', () => {
  it('normalizes the raw payload into a Pokemon', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok(RAW_PIKACHU)))
    const p = await getPokemonDetail('pikachu')
    expect(p.id).toBe(25)
    expect(p.types).toEqual(['electric'])
    expect(p.stats.speed).toBe(90)
    expect(p.totalStats).toBe(320)
    expect(p.abilities[0]).toEqual({ name: 'static', isHidden: false })
    expect(p.moveCount).toBe(2)
    expect(p.imageUrl).toContain('official-artwork')
  })

  it('classifies a 404 as notFound', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 }) as Response))
    await expect(getPokemonDetail('missingmon')).rejects.toMatchObject({ kind: 'notFound' })
  })

  it('classifies a 500 as http', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 }) as Response))
    await expect(getPokemonDetail('pikachu')).rejects.toMatchObject({ kind: 'http', status: 500 })
  })

  it('classifies a thrown fetch as network', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const err = await getPokemonDetail('pikachu').catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.kind).toBe('network')
  })

  it('serves the second identical request from cache (one fetch only)', async () => {
    const spy = vi.fn(async () => ok(RAW_PIKACHU))
    vi.stubGlobal('fetch', spy)
    await getPokemonDetail('pikachu')
    await getPokemonDetail('pikachu')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/services`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

Key implementation notes the engineer must follow:
- `BASE_URL = 'https://pokeapi.co/api/v2'`; `MAX_DEX_ID = 1302`.
- `request<T>(path)`: `try { const res = await fetch(...) } catch → ApiError('network')`; `!res.ok` → `404 ? 'notFound' : 'http'`; `res.json()` failure → `'malformed'`.
- Cache is a `Map<string, Promise<unknown>>` keyed by path so concurrent identical calls dedupe. Delete the entry on rejection so failures are retryable.
- `idFromUrl(url)`: `Number(url.replace(/\/$/, '').split('/').pop())`; throw `malformed` if `NaN`.
- Normalizer validates shape defensively (`Array.isArray(raw.types)` etc.) and throws `malformed` otherwise — this satisfies the brief's "unexpected API response" case.
- `stats` reduce into a `PokemonStats` record, defaulting every `StatKey` to `0`.
- `imageUrl`: prefer `sprites.other['official-artwork'].front_default`, else `getArtworkUrl(id)`, else `spriteUrl`.
- `moves`: keep all names in `moves`, expose `moveCount = moves.length`; the UI slices.
- `getPokemonDetails(refs)`: pool with concurrency **12**; `Promise.allSettled`; drop rejects but preserve input order for the resolved ones.
- `getPokemonRefsByType(type)`: map `pokemon[].pokemon` through `idFromUrl`, filter `id <= MAX_DEX_ID`, sort by id.
- `getAllPokemonRefs()`: single `?limit=1302&offset=0` call, cached for the session — powers substring search and name/id sorting over the full dex.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/services`
Expected: PASS (all 8 cases).

- [ ] **Step 5: Commit and push**

```bash
git add src/services
git commit -m "feat: add typed PokéAPI service with error taxonomy, caching, and tests"
git push
```

---

## Task 5: Hooks and contexts

**Files:**
- Create: `src/hooks/useDebounce.ts`, `useLocalStorage.ts`, `useFocusTrap.ts`, `useLockBodyScroll.ts`, `useOnlineStatus.ts`, `usePokemonList.ts`, `usePokemonDetail.ts`; `src/utils/sorting.ts`; `src/context/ThemeContext.tsx`, `FavoritesContext.tsx`, `CompareContext.tsx`
- Test: `src/hooks/useDebounce.test.ts`, `src/utils/sorting.test.ts`, `src/context/FavoritesContext.test.tsx`

**Interfaces:**
- Consumes: Task 4 service, Task 2 types.
- Produces:
  - `useDebounce<T>(value, delay=350): T`
  - `useLocalStorage<T>(key, initial): [T, (v: T | ((p: T) => T)) => void]`
  - `sortRefs(refs, sort): PokemonRef[]` · `sortDetails(list, sort): Pokemon[]`
  - `usePokemonList({ query, type, sort, favoritesOnly }) → { items, isLoading, isLoadingMore, error, hasMore, loadMore, retry, total, isSearchMiss }`
  - `usePokemonDetail(nameOrId | null) → { pokemon, isLoading, error, retry }`
  - `useTheme() → { theme: 'light'|'dark', toggleTheme }`
  - `useFavorites() → { favorites: number[], isFavorite(id), toggleFavorite(id), count }`
  - `useCompare() → { selection: Pokemon[], isSelected(id), toggle(p), clear, isFull }`

- [ ] **Step 1: Write the failing tests**

```ts
// src/hooks/useDebounce.test.ts
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDebounce } from './useDebounce'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('returns the initial value immediately and the latest value after the delay', () => {
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
    initialProps: { v: 'pika' },
  })
  expect(result.current).toBe('pika')
  rerender({ v: 'chu' })
  expect(result.current).toBe('pika')
  act(() => { vi.advanceTimersByTime(300) })
  expect(result.current).toBe('chu')
})
```

```ts
// src/utils/sorting.test.ts
import { expect, it } from 'vitest'
import { sortRefs } from './sorting'

const refs = [{ id: 3, name: 'venusaur' }, { id: 1, name: 'bulbasaur' }, { id: 2, name: 'ivysaur' }]

it('sorts by ascending and descending id', () => {
  expect(sortRefs(refs, 'id-asc').map((r) => r.id)).toEqual([1, 2, 3])
  expect(sortRefs(refs, 'id-desc').map((r) => r.id)).toEqual([3, 2, 1])
})
it('sorts alphabetically both ways', () => {
  expect(sortRefs(refs, 'name-asc')[0].name).toBe('bulbasaur')
  expect(sortRefs(refs, 'name-desc')[0].name).toBe('venusaur')
})
it('does not mutate the input array', () => {
  const copy = [...refs]
  sortRefs(refs, 'id-asc')
  expect(refs).toEqual(copy)
})
```

```tsx
// src/context/FavoritesContext.test.tsx
import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { FavoritesProvider, useFavorites } from './FavoritesContext'

beforeEach(() => localStorage.clear())

const wrap = ({ children }: { children: React.ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
)

it('toggles a favourite on and off and persists to localStorage', () => {
  const { result } = renderHook(() => useFavorites(), { wrapper: wrap })
  expect(result.current.isFavorite(25)).toBe(false)
  act(() => result.current.toggleFavorite(25))
  expect(result.current.isFavorite(25)).toBe(true)
  expect(localStorage.getItem('pokemon-explorer:favorites')).toContain('25')
  act(() => result.current.toggleFavorite(25))
  expect(result.current.isFavorite(25)).toBe(false)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/hooks src/utils/sorting.test.ts src/context`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the small hooks and `sorting.ts`**

- `useDebounce`: `useState` + `useEffect` with `setTimeout`/`clearTimeout`.
- `useLocalStorage`: lazy `useState` initializer reading `localStorage` inside `try/catch` (private-mode safe); write on change in `useEffect`.
- `useLockBodyScroll(active)`: save/restore `document.body.style.overflow`.
- `useFocusTrap(ref, active)`: query focusables (`a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])`), cycle on `Tab`/`Shift+Tab`, focus first on activate, restore `document.activeElement` on deactivate.
- `useOnlineStatus`: `navigator.onLine` + `online`/`offline` listeners.
- `sorting.ts`: `sortRefs` handles `id-*`/`name-*` (`localeCompare` for names); `sortDetails` additionally handles `attack-desc`/`speed-desc`/`hp-desc` reading `p.stats`, with `id-asc` as the stable tiebreaker.

- [ ] **Step 4: Implement `usePokemonList` — the orchestration core**

Explicit algorithm (the engineer must not improvise here):

1. **Resolve the source list** (`PokemonRef[]`) in a `useEffect` keyed on `[type, favoritesOnly]`:
   - `favoritesOnly` → refs built from the favourites ID list via `getAllPokemonRefs()`.
   - `type !== 'all'` → `getPokemonRefsByType(type)`.
   - otherwise → `null`, meaning "stream pages straight from `/pokemon`".
2. **Search** (`query` non-empty, already debounced by the caller): filter the cached `getAllPokemonRefs()` index by `name.includes(q)`, plus an exact `getPokemonDetail(q)` attempt so an exact match is always first. Zero matches → `isSearchMiss: true`.
3. **Sort**: `sortRefs(source, sort)` when a source list exists. For a `null` source with a `name-*`/`id-desc` sort, materialise the full index first (it is one cached request) so ordering is global rather than per-page.
4. **Paginate**: keep `page` state; visible refs are `sorted.slice(0, (page + 1) * 20)`; `hasMore = visible.length < sorted.length` (or `offset < total` in the streaming case).
5. **Fetch details** for newly visible refs via `getPokemonDetails`, appending to `items`. Guard against out-of-order responses with a `requestId` ref.
6. **Stat sorts** (`needsDetails`): apply `sortDetails` to the loaded `items`. When a type filter or favourites filter is active the full set is already loaded, so the ordering is complete; for the unfiltered dex it orders the loaded subset — the UI must state this (Task 9, Step 4).
7. **Errors**: store the `ApiError`; `retry()` clears it and re-runs the last effect. First-page failure → full-page `ErrorState`; `loadMore` failure → inline retry beneath the grid, grid preserved.
8. `isLoading` = first page in flight; `isLoadingMore` = subsequent page in flight.

- [ ] **Step 5: Implement `usePokemonDetail`**

Fetch on `nameOrId` change, `AbortController`-guard against races, expose `{ pokemon, isLoading, error, retry }`. A `notFound` error surfaces distinctly so the modal can render the search-miss copy.

- [ ] **Step 6: Implement the three contexts**

- `ThemeContext`: initial value = stored preference, else `matchMedia('(prefers-color-scheme: dark)')`. Applies/removes `.dark` on `document.documentElement` in an effect. Key `pokemon-explorer:theme`.
- `FavoritesContext`: `number[]` behind `useLocalStorage` at key `pokemon-explorer:favorites`; memoised `Set` for O(1) `isFavorite`.
- `CompareContext`: `Pokemon[]` capped at 2; `toggle` removes if present, appends if room, replaces the oldest when full; `isFull = selection.length === 2`.
- Each exports a provider plus a hook that throws a clear error when used outside its provider.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run`
Expected: PASS — all Task 3/4/5 suites green.

- [ ] **Step 8: Commit and push**

```bash
git add src/hooks src/context src/utils/sorting.ts src/utils/sorting.test.ts
git commit -m "feat: add data-orchestration hooks and theme/favorites/compare contexts"
git push
```

---

## Task 6: Reusable UI primitives

**Files:**
- Create: `src/components/ui/Button.tsx`, `IconButton.tsx`, `Chip.tsx`, `Skeleton.tsx`, `Select.tsx`, `index.ts`
- Test: `src/components/ui/Button.test.tsx`

**Interfaces:**
- Produces: `Button({ variant: 'primary'|'secondary'|'ghost'|'danger', size: 'sm'|'md'|'lg', isLoading?, leftIcon?, ...ButtonHTMLAttributes })`; `IconButton({ label, icon, ...})` (renders `aria-label={label}`); `Chip({ isActive, color?, ...})`; `Skeleton({ className })`; `Select<T>({ value, options, onChange, label })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { Button } from './Button'

it('fires onClick when clicked and when activated with Enter', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Load More</Button>)
  const btn = screen.getByRole('button', { name: 'Load More' })
  await userEvent.click(btn)
  btn.focus()
  await userEvent.keyboard('{Enter}')
  expect(onClick).toHaveBeenCalledTimes(2)
})

it('is disabled and shows a spinner while loading', () => {
  render(<Button isLoading>Load More</Button>)
  expect(screen.getByRole('button')).toBeDisabled()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/ui`
Expected: FAIL — `./Button` not found.

- [ ] **Step 3: Implement the primitives**

- All primitives are `forwardRef` and spread `...rest` so they compose.
- `Button` base classes: `inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background-color,box-shadow] duration-150 active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2`.
  - `primary`: `bg-brand text-white shadow-lg shadow-brand/25 hover:brightness-110`
  - `secondary`: `bg-surface-2 text-text border border-border hover:border-brand/40`
  - `ghost`: `text-text-muted hover:bg-surface-2 hover:text-text`
  - `danger`: `bg-danger text-white hover:brightness-110`
- `isLoading` renders a `Loader2` from lucide with `animate-spin` and sets `disabled`.
- `Skeleton`: `bg-surface-2 rounded-2xl relative overflow-hidden` + shimmer pseudo-element via a `.shimmer` utility class defined in `index.css`.
- `Select`: native `<select>` styled to match (native = free keyboard/mobile accessibility), with a `ChevronDown` overlay and an associated `<label>`.
- `index.ts` barrel re-exports all five.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/ui`
Expected: PASS (both cases).

- [ ] **Step 5: Commit and push**

```bash
git add src/components/ui
git commit -m "feat: add reusable UI primitives (Button, IconButton, Chip, Skeleton, Select)"
git push
```

---

## Task 7: App shell, routing, and layout

**Files:**
- Create: `src/components/layout/Header.tsx`, `Container.tsx`, `Footer.tsx`, `ThemeToggle.tsx`, `SkipLink.tsx`; `src/pages/HomePage.tsx`, `src/pages/NotFoundPage.tsx`
- Modify: `src/main.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: Task 6 primitives, Task 5 contexts.
- Produces: routes `/` and `/pokemon/:name` (both render `HomePage`; the param drives the modal) plus `*` → `NotFoundPage`. `Header` is sticky and hosts brand, search slot, theme toggle, favourites toggle.

- [ ] **Step 1: Wire providers and router in `main.tsx`**

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 2: Define routes in `App.tsx`**

```tsx
<ErrorBoundary>
  <SkipLink />
  <Header />
  <main id="main" className="min-h-screen">
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pokemon/:name" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </main>
  <Footer />
  <CompareTray />
</ErrorBoundary>
```

- [ ] **Step 3: Build `Header`**

Sticky (`sticky top-0 z-40`), `bg-surface/80 backdrop-blur-xl border-b border-border`. Row 1: brand mark (a Poké-ball SVG in brand colour + `Pokémon Explorer` in `font-display font-bold`), spacer, favourites count pill, `ThemeToggle`. On `lg+` the `SearchBar` sits inline in the header; below `lg` it drops into the page toolbar. `aria-label="Primary"` on the nav.

- [ ] **Step 4: Build `ThemeToggle`, `Container`, `Footer`, `SkipLink`**

- `ThemeToggle`: `IconButton` swapping `Sun`/`Moon` with a 200ms rotate+fade cross-dissolve; `aria-label` reflects the *action* ("Switch to dark theme").
- `Container`: `mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8`.
- `Footer`: attribution — "Data from PokéAPI" (external link, `rel="noreferrer"`) — muted, small.
- `SkipLink`: visually hidden until focused, jumps to `#main`.

- [ ] **Step 5: Verify in the browser at three widths**

Run: `npm run dev`
Expected: header sticks on scroll, theme toggle flips instantly and survives reload, no horizontal scroll at 320/768/1440px.

- [ ] **Step 6: Commit and push**

```bash
git add src/main.tsx src/App.tsx src/components/layout src/pages
git commit -m "feat: add app shell with sticky header, routing, theme toggle, and skip link"
git push
```

---

## Task 8: Pokémon card, grid, skeletons, and Load More

**Files:**
- Create: `src/components/pokemon/PokemonCard.tsx`, `TypeBadge.tsx`, `PokemonGrid.tsx`; `src/components/states/LoadingSkeleton.tsx`
- Modify: `src/pages/HomePage.tsx`
- Test: `src/components/pokemon/PokemonCard.test.tsx`

**Interfaces:**
- Consumes: `Pokemon`, `getTypeColor`, `getTypeGradient`, formatters, `useFavorites`.
- Produces: `PokemonCard({ pokemon, onSelect, index })`; `TypeBadge({ type, size })`; `PokemonGrid({ items, isLoading, isLoadingMore, onSelect })`; `LoadingSkeleton({ count })`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/pokemon/PokemonCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { PokemonCard } from './PokemonCard'
import type { Pokemon } from '@/types/pokemon'

const pikachu: Pokemon = {
  id: 25, name: 'pikachu', types: ['electric'], imageUrl: 'art.png', spriteUrl: 's.png',
  height: 4, weight: 60, baseExperience: 112,
  abilities: [{ name: 'static', isHidden: false }],
  stats: { hp: 35, attack: 55, defense: 40, 'special-attack': 50, 'special-defense': 50, speed: 90 },
  totalStats: 320, moves: ['thunder-shock'], moveCount: 1,
}

const renderCard = (onSelect = vi.fn()) => {
  render(<FavoritesProvider><PokemonCard pokemon={pikachu} onSelect={onSelect} index={0} /></FavoritesProvider>)
  return onSelect
}

it('renders name, padded id, type, and accessible artwork', () => {
  renderCard()
  expect(screen.getByText('Pikachu')).toBeInTheDocument()
  expect(screen.getByText('#025')).toBeInTheDocument()
  expect(screen.getByText('Electric')).toBeInTheDocument()
  expect(screen.getByRole('img', { name: /pikachu/i })).toBeInTheDocument()
})

it('selects on click and on Enter, and is keyboard reachable', async () => {
  const onSelect = renderCard()
  const card = screen.getByRole('button', { name: /pikachu/i })
  await userEvent.click(card)
  card.focus()
  await userEvent.keyboard('{Enter}')
  expect(onSelect).toHaveBeenCalledTimes(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/pokemon`
Expected: FAIL — `./PokemonCard` not found.

- [ ] **Step 3: Implement `TypeBadge`**

Pill with `background: color.base`, `color: color.onBase`, `text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full`. Label via `formatPokemonName(type)`. `size="sm"` variant for cards, `"md"` for the modal.

- [ ] **Step 4: Implement `PokemonCard` (the signature seam device)**

- Root is a real `<button type="button">` (free keyboard + `role=button` + Enter/Space) with `aria-label={`${formatPokemonName(name)}, number ${id}`}`, `text-left w-full group`.
- Structure follows the Design System's seam diagram exactly — an **upper artwork chamber** and a **lower data chamber**, divided by a 1px seam carrying a type-coloured latch:
  1. Root: `relative overflow-hidden rounded-3xl border border-border bg-surface`.
  2. Upper chamber (`relative px-4 pt-4 pb-6`): type wash via `getTypeGradient` at `opacity-[.10]` (`dark:opacity-[.14]`), rising to `.18` on hover; a large faint Poké-ball watermark bottom-right (`aria-hidden`).
  3. Seam: `h-px w-full bg-border` with the latch absolutely centred on it — a `10px` disc (`background: color.base`) inside a `2px` `bg-surface` ring, growing to `14px` with a `0 0 12px` type-coloured glow on `group-hover`.
  4. Lower chamber (`px-4 pt-5 pb-4 bg-surface`): name, then type badges.
- Artwork: `<img loading="lazy" decoding="async" width={200} height={200}>` with `drop-shadow-xl`, `transition-transform duration-200 group-hover:scale-[1.06]`; `onError` swaps to `spriteUrl` then to a local placeholder.
- Catalog number top-left in the mono `.tabular` class (`text-xs text-text-muted`) — it is an index, so it is mono. `FavoriteButton` top-right.
- Name: `font-display text-lg font-bold tracking-tight`.
- Hover: `group-hover:-translate-y-1` + type-tinted shadow, `transition duration-200`. Entrance: Framer `motion.div` fade+rise with `delay: Math.min(index, 19) * 0.028`.
- Favourite and compare buttons `stopPropagation` so they never open the modal.

- [ ] **Step 5: Implement `LoadingSkeleton` and `PokemonGrid`**

- `LoadingSkeleton({ count = 20 })`: same card geometry — rounded square artwork block, two text bars, one badge pill — animated by the shimmer utility. **Never renders the text "Loading".**
- `PokemonGrid`: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5`. First load → skeletons; `isLoadingMore` → grid plus 10 trailing skeletons. `role="list"` with `role="listitem"` wrappers.

- [ ] **Step 6: Wire `HomePage` with Load More**

`usePokemonList` output → `PokemonGrid`; below it a centred `Button variant="primary" size="lg"` labelled exactly `Load More`, shown only when `hasMore`, with `isLoading={isLoadingMore}`. Also render `total` as a muted "Showing X of Y Pokémon" line for hierarchy.

- [ ] **Step 7: Run test + browser check**

Run: `npx vitest run src/components/pokemon && npm run dev`
Expected: tests PASS; 20 cards render, skeletons flash on first paint, Load More appends the next 20 without layout jump.

- [ ] **Step 8: Commit and push**

```bash
git add src/components/pokemon src/components/states src/pages/HomePage.tsx
git commit -m "feat: add Pokémon card grid with type theming, skeletons, and Load More"
git push
```

---

## Task 9: Search, type filter, and sort (URL-synced)

**Files:**
- Create: `src/components/search/SearchBar.tsx`; `src/components/filters/TypeFilter.tsx`, `SortSelect.tsx`, `FavoritesFilter.tsx`, `Toolbar.tsx`
- Modify: `src/pages/HomePage.tsx`, `src/components/layout/Header.tsx`
- Test: `src/components/search/SearchBar.test.tsx`, `src/components/filters/TypeFilter.test.tsx`

**Interfaces:**
- Consumes: `useDebounce`, `POKEMON_TYPES`, `SORT_OPTIONS`, `getTypeColor`, primitives.
- Produces: `SearchBar({ value, onChange })`; `TypeFilter({ value, onChange })`; `SortSelect({ value, onChange })`; `Toolbar` composing all three + favourites toggle. `HomePage` reads/writes `?q=`, `?type=`, `?sort=`, `?favorites=` via `useSearchParams`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/search/SearchBar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SearchBar } from './SearchBar'

it('renders the exact placeholder from the brief', () => {
  render(<SearchBar value="" onChange={vi.fn()} />)
  expect(screen.getByPlaceholderText('Search Pokémon...')).toBeInTheDocument()
})

it('reports every keystroke to onChange', async () => {
  const onChange = vi.fn()
  render(<SearchBar value="" onChange={onChange} />)
  await userEvent.type(screen.getByRole('searchbox'), 'pika')
  expect(onChange).toHaveBeenCalled()
})

it('clears the query with the clear button and with Escape', async () => {
  const onChange = vi.fn()
  render(<SearchBar value="pika" onChange={onChange} />)
  await userEvent.click(screen.getByRole('button', { name: /clear/i }))
  expect(onChange).toHaveBeenCalledWith('')
  await userEvent.type(screen.getByRole('searchbox'), '{Escape}')
  expect(onChange).toHaveBeenCalledWith('')
})
```

```tsx
// src/components/filters/TypeFilter.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { TypeFilter } from './TypeFilter'

it('offers All plus all 18 types and marks the active one', () => {
  render(<TypeFilter value="fire" onChange={vi.fn()} />)
  expect(screen.getByRole('radio', { name: 'All' })).toBeInTheDocument()
  expect(screen.getAllByRole('radio')).toHaveLength(19)
  expect(screen.getByRole('radio', { name: 'Fire' })).toHaveAttribute('aria-checked', 'true')
})

it('emits the selected type', async () => {
  const onChange = vi.fn()
  render(<TypeFilter value="all" onChange={onChange} />)
  await userEvent.click(screen.getByRole('radio', { name: 'Water' }))
  expect(onChange).toHaveBeenCalledWith('water')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/search src/components/filters`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `SearchBar`**

`<input type="search" role="searchbox">` with `Search` lucide icon left, animated `X` clear button right (only when non-empty), placeholder exactly `Search Pokémon...`. Classes: `w-full rounded-2xl bg-surface-2 border border-border pl-11 pr-10 py-3 placeholder:text-text-muted focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition`. `Escape` clears; `aria-label="Search Pokémon by name"`; `autoComplete="off"`.

- [ ] **Step 4: Implement `TypeFilter`, `SortSelect`, `FavoritesFilter`, `Toolbar`**

- `TypeFilter`: `role="radiogroup" aria-label="Filter by type"`; each chip `role="radio" aria-checked`. Active chip fills with its type colour (`All` uses brand); inactive uses `soft` tint with a coloured dot. Mobile: `flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x [scrollbar-width:none]` with edge fade masks. `lg+`: wraps to a single flex-wrap row.
- `SortSelect`: labelled `Sort by`, options from `SORT_OPTIONS`.
- `FavoritesFilter`: toggle `Chip` with a `Heart` icon and the favourites count; `aria-pressed`.
- `Toolbar`: sticky under the header on mobile; grid layout — search full-width (mobile only), then a row of `SortSelect` + `FavoritesFilter`, then the type chip row.

- [ ] **Step 5: Wire URL sync + the stat-sort disclosure in `HomePage`**

- `useSearchParams` is the single source of truth: `q`, `type`, `sort`, `favorites`. Writes use `{ replace: true }` for keystrokes so the back button isn't polluted.
- Local input state mirrors `q` immediately for responsiveness; `useDebounce(input, 350)` drives both the URL write and the fetch.
- When the active sort has `needsDetails: true` **and** no type/favourites filter is active, render a muted note beneath the toolbar: `Sorting applies to the Pokémon loaded so far.` (Honest about the PokéAPI constraint — reused verbatim in the README's Challenges section.)

- [ ] **Step 6: Run tests + browser check**

Run: `npx vitest run && npm run dev`
Expected: all PASS. Typing `pika` narrows results; `?q=pika&type=electric&sort=attack-desc` restores exactly that view on reload; the chip row scrolls smoothly on a 375px viewport.

- [ ] **Step 7: Commit and push**

```bash
git add src/components/search src/components/filters src/pages/HomePage.tsx src/components/layout/Header.tsx
git commit -m "feat: add URL-synced search, type filter, and sort controls"
git push
```

---

## Task 10: Loading, error, and empty states

**Files:**
- Create: `src/components/states/ErrorState.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`
- Modify: `src/pages/HomePage.tsx`, `src/pages/NotFoundPage.tsx`
- Test: `src/components/states/ErrorState.test.tsx`, `EmptyState.test.tsx`

**Interfaces:**
- Consumes: `ApiError`, primitives.
- Produces: `ErrorState({ error, onRetry, variant: 'page'|'inline' })`; `EmptyState({ variant: 'search'|'filter'|'favorites', query?, onReset })`; `ErrorBoundary` class component.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/states/ErrorState.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { ApiError } from '@/services/pokemonApi'
import { ErrorState } from './ErrorState'

it('shows the brief\'s exact error copy and retries on click', async () => {
  const onRetry = vi.fn()
  render(<ErrorState error={new ApiError('boom', 'http', 500)} onRetry={onRetry} />)
  expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  expect(screen.getByText("We couldn't load the Pokémon.")).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Try Again' }))
  expect(onRetry).toHaveBeenCalledTimes(1)
})

it('uses network-specific copy when offline', () => {
  render(<ErrorState error={new ApiError('offline', 'network')} onRetry={vi.fn()} />)
  expect(screen.getByText(/connection/i)).toBeInTheDocument()
})
```

```tsx
// src/components/states/EmptyState.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { EmptyState } from './EmptyState'

it('uses the search-miss copy from the brief', () => {
  render(<EmptyState variant="search" query="zzzz" onReset={vi.fn()} />)
  expect(screen.getByText('Pokémon not found.')).toBeInTheDocument()
  expect(screen.getByText('Try searching for another Pokémon.')).toBeInTheDocument()
})

it('uses the generic empty copy for a filter with no results', () => {
  render(<EmptyState variant="filter" onReset={vi.fn()} />)
  expect(screen.getByText('No Pokémon found.')).toBeInTheDocument()
  expect(screen.getByText('Try searching for a different Pokémon.')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/states`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `ErrorState`**

Centred card: `CloudOff` icon (network) or `AlertTriangle` (otherwise) in a `bg-danger/10` circle, heading `Something went wrong.` (`font-display text-2xl font-bold`), body `We couldn't load the Pokémon.`, plus a `kind`-specific hint line — network → `Check your internet connection and try again.`, http → `The Pokémon API is not responding right now.`, malformed → `We received an unexpected response from the API.` Then `Button variant="primary"` labelled `Try Again` with a `RotateCw` icon. `variant="inline"` renders the same content compactly for Load-More failures. `role="alert"`.

- [ ] **Step 4: Implement `EmptyState` and `ErrorBoundary`**

- `EmptyState`: large muted magnifier/Poké-ball illustration; `search` variant uses the not-found copy (and echoes the query in a muted line), `filter`/`favorites` use the generic copy; secondary `Button` — `Clear search` / `Show all Pokémon` / `Browse Pokémon` — calls `onReset`.
- `ErrorBoundary`: `getDerivedStateFromError` → renders `ErrorState variant="page"` whose retry does `window.location.reload()`; logs to `console.error` in dev.
- `NotFoundPage`: 404 layout reusing `EmptyState` with a `Back to all Pokémon` link.

- [ ] **Step 5: Wire the state machine into `HomePage`**

Strict precedence, no overlap: `error && items.length === 0` → page `ErrorState` · `isLoading` → skeletons · `isSearchMiss` → `EmptyState variant="search"` · `items.length === 0` → `EmptyState` (filter/favorites) · else grid (+ inline `ErrorState` when `error && items.length > 0`).

- [ ] **Step 6: Verify by simulating failures**

Run: `npm run dev`, then in DevTools set Network → Offline and reload; also search `zzzz`; also filter to a type then clear favourites.
Expected: offline shows network `ErrorState` with a working `Try Again`; `zzzz` shows the not-found empty state; no blank screens anywhere.

- [ ] **Step 7: Run tests, commit, push**

```bash
npx vitest run src/components/states
git add src/components/states src/pages
git commit -m "feat: add polished error, empty, and boundary states with retry"
git push
```

---

## Task 11: Detail modal with URL routing

**Files:**
- Create: `src/components/pokemon/PokemonModal.tsx`, `StatBar.tsx`, `MoveList.tsx`, `FavoriteButton.tsx`
- Modify: `src/pages/HomePage.tsx`
- Test: `src/components/pokemon/PokemonModal.test.tsx`, `StatBar.test.tsx`

**Interfaces:**
- Consumes: `usePokemonDetail`, `useFocusTrap`, `useLockBodyScroll`, `getTypeGradient`, formatters, `STAT_LABELS`, `STAT_MAX`.
- Produces: `PokemonModal({ nameOrId, onClose, onNavigate })`; `StatBar({ statKey, value, color })`; `MoveList({ moves, total })`; `FavoriteButton({ pokemonId, size })`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/components/pokemon/StatBar.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { StatBar } from './StatBar'

it('renders the stat label, value, and a correctly-scaled accessible meter', () => {
  render(<StatBar statKey="hp" value={70} color="#4bc46a" />)
  expect(screen.getByText('HP')).toBeInTheDocument()
  expect(screen.getByText('70')).toBeInTheDocument()
  const meter = screen.getByRole('progressbar')
  expect(meter).toHaveAttribute('aria-valuenow', '70')
  expect(meter).toHaveAttribute('aria-valuemax', '255')
})
```

```tsx
// src/components/pokemon/PokemonModal.test.tsx — behaviour contract
// 1. renders name, #id, types, height, weight, abilities, all six stats, and moves
// 2. calls onClose when Escape is pressed
// 3. calls onClose when the backdrop is clicked but NOT when the panel is clicked
// 4. has role="dialog" aria-modal="true" and an accessible name
// Mock '@/hooks/usePokemonDetail' to return the pikachu fixture from Task 8.
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/pokemon`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `StatBar` and `MoveList`**

- `StatBar`: label (`w-20 text-sm text-text-muted`), value (`font-mono tabular-nums font-semibold w-10 text-right`), track (`h-2 flex-1 rounded-full bg-surface-2`), fill (`h-full rounded-full` with `background: color`, `width: (value/STAT_MAX)*100%`, animated from 0 with a 600ms ease-out on mount). `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`.
- `MoveList`: first 12 moves as `Chip`s via `formatPokemonName`; if `total > 12`, a muted `+{total - 12} more moves` line. Heading `Moves`.

- [ ] **Step 4: Implement `PokemonModal`**

- Portal to `document.body`. Backdrop: `fixed inset-0 z-50 bg-black/50 backdrop-blur-sm` (Framer fade 160ms), click closes.
- Panel: `role="dialog" aria-modal="true" aria-labelledby="pokemon-modal-title"`, `relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-surface shadow-2xl`. Desktop: centred, `scale .96→1` + fade, 220ms spring. Mobile (`< 640px`): bottom sheet — `rounded-t-3xl` full-width, slides up from `y: '100%'`, with a grab handle.
- Header band: `getTypeGradient(types)` wash, faint Poké-ball watermark, large artwork (`w-48 sm:w-56`, `drop-shadow-2xl`, gentle float animation), `#025` in mono, name in `font-display text-3xl sm:text-4xl font-extrabold`, type badges, `FavoriteButton` and a `Compare` button, and a close `IconButton` (`X`, `aria-label="Close details"`, top-right).
- Body sections: **About** — a 3-up stat grid of Height / Weight / Base XP using formatters; **Abilities** — chips, hidden ones marked `(hidden)`; **Base Stats** — six `StatBar`s in canonical order plus a `Total` row using `totalStats`; **Moves** — `MoveList`.
- States inside the panel: `isLoading` → skeleton in the same geometry (no layout jump); `error.kind === 'notFound'` → the brief's not-found copy + `Back to all Pokémon`; other errors → inline `ErrorState` with retry.
- Behaviour: `useFocusTrap` + `useLockBodyScroll`; `Escape` closes; focus returns to the originating card; `←`/`→` call `onNavigate(-1 | 1)` to move between loaded Pokémon.

- [ ] **Step 5: Wire URL ↔ modal in `HomePage`**

- `useParams().name` presence opens the modal — so `/pokemon/pikachu` deep-links and is shareable (bonus B6).
- Card select → `navigate(`/pokemon/${name}${location.search}`)`, preserving query params so closing returns to the same filtered view.
- Close → `navigate(`/${location.search}`)`; back/forward buttons open/close the modal naturally.
- Set `document.title` to `` `${formatPokemonName(name)} · Pokémon Explorer` `` while open; restore on close.

- [ ] **Step 6: Run tests + manual keyboard/deep-link check**

Run: `npx vitest run src/components/pokemon && npm run dev`
Expected: tests PASS. Loading `/pokemon/charizard` directly opens the modal over the grid; `Tab` cycles only inside the panel; `Escape` closes and refocuses the card; mobile shows a sheet.

- [ ] **Step 7: Commit and push**

```bash
git add src/components/pokemon src/pages/HomePage.tsx
git commit -m "feat: add URL-routed detail modal with stats, abilities, moves, and focus trap"
git push
```

---

## Task 12: Compare two Pokémon (bonus B4)

**Files:**
- Create: `src/components/compare/CompareTray.tsx`, `CompareModal.tsx`
- Modify: `src/components/pokemon/PokemonCard.tsx`, `PokemonModal.tsx`, `src/App.tsx`
- Test: `src/components/compare/CompareModal.test.tsx`

**Interfaces:**
- Consumes: `useCompare`, `STAT_LABELS`, `getTypeColor`, primitives.
- Produces: `CompareTray()` (fixed bottom bar) and `CompareModal({ a, b, onClose })`. Card/modal gain a compare affordance.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/compare/CompareModal.test.tsx
// Renders two fixtures (pikachu 35/55/40/90, charizard 78/84/78/100) and asserts:
// 1. both names appear as column headers
// 2. every stat row shows both values
// 3. the higher value in each row carries the winner marker (data-winner="true")
// 4. Escape / close button call onClose
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/compare`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `CompareTray`**

`fixed bottom-4 inset-x-4 z-40 mx-auto max-w-lg`, `bg-surface/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3`. Slides up (Framer) only when `selection.length > 0`. Shows up to two slots (sprite + name, or a dashed "Select a Pokémon" placeholder), a `Compare` primary button enabled only when `isFull`, and a `Clear` ghost button. Announces state via `aria-live="polite"`.

- [ ] **Step 4: Implement `CompareModal`**

Same portal/backdrop/focus-trap/`Escape` mechanics as `PokemonModal` (reuse the hooks — no duplication). Layout: two headers with artwork on their type gradients, then a stat table — label column centred between two value columns — rendering the six stats plus `Total`. Each side's bar grows from the centre outward; the winning side gets `data-winner="true"`, a bolder weight, and a small `ChevronUp`; ties are marked neutral. Mobile: columns stay side-by-side (the point of the feature) but artwork shrinks and the table switches to `text-sm`.

- [ ] **Step 5: Add the compare affordance**

`PokemonCard` gains a small `Scale`-icon `IconButton` (revealed on hover, always visible on touch) with `aria-label="Add Pikachu to comparison"` / `"Remove …"` and `aria-pressed`; it `stopPropagation`s. `PokemonModal` gains a full `Compare` button. Selected cards get a brand-coloured ring.

- [ ] **Step 6: Run test + manual check**

Run: `npx vitest run src/components/compare && npm run dev`
Expected: PASS; selecting two Pokémon enables `Compare`; the modal highlights the correct winners; selecting a third replaces the oldest.

- [ ] **Step 7: Commit and push**

```bash
git add src/components/compare src/components/pokemon src/App.tsx
git commit -m "feat: add two-Pokémon comparison tray and stat comparison modal"
git push
```

---

## Task 13: Favourites (bonus B1)

**Files:**
- Create: `src/components/pokemon/FavoriteButton.tsx` (if not already created in Task 11)
- Modify: `src/components/layout/Header.tsx`, `src/components/filters/FavoritesFilter.tsx`, `src/hooks/usePokemonList.ts`
- Test: `src/components/pokemon/FavoriteButton.test.tsx`

**Interfaces:**
- Consumes: `useFavorites`.
- Produces: `FavoriteButton({ pokemonId, size })` — a pressed-state `IconButton` wrapping a `Heart`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/pokemon/FavoriteButton.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { FavoritesProvider } from '@/context/FavoritesContext'
import { FavoriteButton } from './FavoriteButton'

beforeEach(() => localStorage.clear())

it('toggles aria-pressed and persists across remounts', async () => {
  const { unmount } = render(
    <FavoritesProvider><FavoriteButton pokemonId={25} /></FavoritesProvider>,
  )
  const btn = screen.getByRole('button', { name: /favourite/i })
  expect(btn).toHaveAttribute('aria-pressed', 'false')
  await userEvent.click(btn)
  expect(btn).toHaveAttribute('aria-pressed', 'true')
  unmount()
  render(<FavoritesProvider><FavoriteButton pokemonId={25} /></FavoritesProvider>)
  expect(screen.getByRole('button', { name: /favourite/i })).toHaveAttribute('aria-pressed', 'true')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/pokemon/FavoriteButton.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement `FavoriteButton`**

`Heart` icon, `fill-favorite text-favorite` when active else `text-text-muted`; `aria-pressed` and `aria-label` = `Add Pikachu to favourites` / `Remove Pikachu from favourites` (accepts an optional `name`). Tap animation: `scale 1 → 1.25 → 1` over 260ms plus a one-shot radial pulse; skipped under reduced motion. `stopPropagation` on click.

- [ ] **Step 4: Complete the favourites surfaces**

- `Header`: `Heart` pill showing the count, linking to `?favorites=1`; hidden when count is 0.
- `FavoritesFilter`: drives `?favorites=1`.
- `usePokemonList`: when `favoritesOnly`, source = favourite IDs mapped to refs (from the cached full index), fully fetched so sorting is complete; zero favourites → `EmptyState variant="favorites"`.

- [ ] **Step 5: Run test + manual check**

Run: `npx vitest run && npm run dev`
Expected: PASS; hearts persist across a hard reload; the favourites view lists exactly the hearted Pokémon.

- [ ] **Step 6: Commit and push**

```bash
git add src/components src/hooks/usePokemonList.ts
git commit -m "feat: add persistent favourites with header count and favourites-only view"
git push
```

---

## Task 14: Dark mode polish (bonus B2)

**Files:**
- Modify: `src/styles/index.css`, `src/context/ThemeContext.tsx`, `src/components/layout/ThemeToggle.tsx`, `index.html`
- Test: `src/context/ThemeContext.test.tsx`

**Interfaces:**
- Produces: verified `.dark` behaviour across every component; no-flash first paint.

- [ ] **Step 1: Write the failing test**

```tsx
// src/context/ThemeContext.test.tsx
// 1. defaults to the system preference when nothing is stored (mock matchMedia → dark)
// 2. toggleTheme adds/removes the `dark` class on document.documentElement
// 3. the choice persists to localStorage key 'pokemon-explorer:theme'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/context/ThemeContext.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Eliminate the theme flash**

Add a tiny blocking script in `index.html` `<head>` that reads the stored theme (or `matchMedia`) and sets `document.documentElement.className` **before** first paint. Also set `<meta name="color-scheme" content="light dark">` and a `theme-color` meta per scheme.

- [ ] **Step 4: Audit every surface in dark mode**

Walk header, toolbar, chips, cards, skeletons, modal, sheet, tray, error/empty states, focus rings. Fix any hard-coded light-mode colour by routing it through a token. Type colours keep their hue in dark mode but card washes drop to `opacity-[.14]` so text contrast holds.

- [ ] **Step 5: Verify contrast and persistence**

Run: `npm run dev`
Expected: no white flash on reload in dark mode; body text ≥ 4.5:1 in both themes (spot-check with DevTools); toggle animates smoothly.

- [ ] **Step 6: Commit and push**

```bash
git add index.html src/styles src/context src/components
git commit -m "feat: polish dark mode with no-flash first paint and full-surface audit"
git push
```

---

## Task 15: Responsive and animation pass

**Files:**
- Modify: `src/components/**` as needed
- Create: `src/hooks/useMediaQuery.ts`

**Interfaces:**
- Produces: `useMediaQuery(query): boolean` (drives the modal's centred-dialog ↔ bottom-sheet switch).

- [ ] **Step 1: Implement `useMediaQuery`**

`matchMedia` + `change` listener, SSR-safe default `false`, used as `useMediaQuery('(min-width: 640px)')`.

- [ ] **Step 2: Audit five viewports**

Check 320, 375, 768, 1024, 1440px:
- No horizontal overflow anywhere; no text clipping; tap targets ≥ 44px.
- Grid columns follow the Global Constraints ladder.
- Header: brand + icons only on mobile (search moves to the toolbar), inline search from `lg`.
- Type chips scroll horizontally on mobile with edge fades; wrap on desktop.
- Modal: bottom sheet `< 640px`, centred dialog above; artwork scales down; stat labels never wrap.
- Compare tray: sits above the mobile browser chrome (`bottom-4` + `env(safe-area-inset-bottom)`).

- [ ] **Step 3: Add the page-transition polish**

Wrap route content in a Framer `AnimatePresence` fade (140ms) so navigations feel intentional. Keep the grid mounted when the modal opens (no re-fetch, no flicker). Verify the motion budget from the Design System is respected — nothing longer than 260ms except stat bars.

- [ ] **Step 4: Verify reduced motion**

In DevTools → Rendering → emulate `prefers-reduced-motion: reduce`.
Expected: no transforms or slides; opacity-only changes; app remains fully usable.

- [ ] **Step 5: Commit and push**

```bash
git add src
git commit -m "style: responsive audit across five viewports and motion refinement"
git push
```

---

## Task 16: Accessibility pass (bonus B5)

**Files:**
- Modify: `src/components/**`
- Test: `src/test/a11y.test.tsx`

- [ ] **Step 1: Write the keyboard-journey test**

```tsx
// src/test/a11y.test.tsx
// Renders the app with a mocked API and asserts, with userEvent.tab() only:
// 1. the first Tab reaches the skip link
// 2. Tab order is: skip → brand → search → theme → sort → type chips → cards
// 3. Enter on a focused card opens the dialog; focus moves inside it
// 4. Escape closes the dialog and focus returns to that same card
```

- [ ] **Step 2: Run it and fix what fails**

Run: `npx vitest run src/test/a11y.test.tsx`
Expected: initially FAIL; iterate on `tabIndex`, focus management, and ordering until PASS.

- [ ] **Step 3: Sweep semantics**

- Landmarks: `header`, `main#main`, `footer`; `nav` labelled.
- One `h1` (`Pokémon Explorer`), section headings in order.
- Every icon-only control has an `aria-label`; every image has meaningful `alt` (decorative watermarks get `alt=""` / `aria-hidden`).
- Live regions: `aria-live="polite"` for "Showing X of Y", search-result counts, and compare-tray changes.
- `aria-busy` on the grid while loading.
- Loading buttons announce state (`aria-live` on the label, not just a spinner).

- [ ] **Step 4: Manual screen-reader spot check**

Tab through the whole app with Windows Narrator (or NVDA) once.
Expected: every stop is announced meaningfully; nothing reads as "button" with no name.

- [ ] **Step 5: Commit and push**

```bash
git add src
git commit -m "feat: complete keyboard and screen-reader accessibility pass"
git push
```

---

## Task 17: Resilience and edge cases

**Files:**
- Modify: `src/services/pokemonApi.ts`, `src/hooks/usePokemonList.ts`, `src/components/pokemon/PokemonCard.tsx`, `src/App.tsx`
- Create: `src/components/states/OfflineBanner.tsx`, `public/pokeball-placeholder.svg`

- [ ] **Step 1: Add request timeout and single retry**

`AbortSignal.timeout(10_000)` on every request; one automatic retry with 600ms backoff for `network`/`5xx` only — never for `404`. `notFound` must stay fast so search feels instant.

- [ ] **Step 2: Add the offline banner**

`useOnlineStatus` → a slide-down banner (`role="status"`): `You're offline. Some Pokémon may not load.` Auto-dismisses on reconnect and triggers `retry()` for any errored state.

- [ ] **Step 3: Harden image loading**

`onError` chain: official artwork → `spriteUrl` → `/pokeball-placeholder.svg`. Reserve space with fixed `width`/`height` to prevent CLS. Add a low-cost blurred colour placeholder behind the artwork while it decodes.

- [ ] **Step 4: Verify the edge cases**

Manually confirm: rapid typing (`p` → `pi` → `pik`) never renders a stale result; toggling filters mid-fetch doesn't mix data sets; `/pokemon/notarealmon` shows the not-found modal state; DevTools offline → banner + retry works; a throttled "Slow 3G" first load shows skeletons, never a blank screen.

- [ ] **Step 5: Run the full suite**

Run: `npx tsc --noEmit && npm run lint && npx vitest run && npm run build`
Expected: all clean, build succeeds.

- [ ] **Step 6: Commit and push**

```bash
git add src public
git commit -m "fix: add request timeouts, offline banner, image fallbacks, and race guards"
git push
```

---

## Task 18: README and deployment configuration (no deploy)

**Files:**
- Create: `README.md`, `vercel.json`, `render.yaml`, `.env.example`
- Modify: `package.json` (engines, name, description)

- [ ] **Step 1: Write `README.md` with all eight required sections**

Exactly the headings the brief requires, in order: `# Pokémon Explorer`, `## Features`, `## Tech Stack`, `## API Used`, `## Installation`, `## Running Locally`, `## Project Structure`, `## Challenges Faced`, `## Future Improvements`. Add a screenshot block near the top (filled in Task 19), a live-demo placeholder line for the user's own URL, and a short "Deployment" subsection covering both Vercel and Render.

Content notes:
- **Features** — grouped as Core (the nine requirements) and Bonus (the six), each one line, each stating how it works.
- **Challenges Faced** — real, specific: (1) the list endpoint returns only `{name, url}` so card types/stats require a per-Pokémon batch fetch — solved with a concurrency-12 pool plus promise-level caching; (2) PokéAPI cannot sort by stat, so full-dex stat sorting is bounded to loaded Pokémon while filtered sets sort completely; (3) type filtering needs a different endpoint shape and client-side pagination; (4) keeping modal state, search, filter, and sort all in the URL without polluting browser history; (5) alternate-form IDs ≥ 10000 lack official artwork.
- **Future Improvements** — evolution chains, generation filter, virtualised grid, service-worker offline cache, Playwright E2E, i18n.

- [ ] **Step 2: Add SPA rewrite configs (config only — do not deploy)**

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

```yaml
# render.yaml
services:
  - type: web
    name: pokemon-explorer
    runtime: static
    buildCommand: npm ci && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

Both are required for deep links like `/pokemon/pikachu` to work on a static host.

- [ ] **Step 3: Verify the documented commands actually work**

Run: `npm ci && npm run build && npm run preview`
Expected: a clean install builds and previews; visiting `/pokemon/pikachu` in preview opens the modal.

- [ ] **Step 4: Commit and push**

```bash
git add README.md vercel.json render.yaml .env.example package.json
git commit -m "docs: add README with all required sections and static-host SPA configs"
git push
```

---

## Task 19: Screenshots and final verification

**Files:**
- Create: `screenshots/*.png`
- Modify: `README.md` (embed the screenshots)

- [ ] **Step 1: Capture the screenshot set**

With `npm run dev` running, capture: `home-desktop-light.png`, `home-desktop-dark.png`, `detail-modal.png`, `compare.png`, `type-filter.png`, `search-empty-state.png`, `error-state.png`, `loading-skeletons.png`, `home-tablet.png` (768px), `home-mobile.png` (375px), `detail-mobile-sheet.png`. Use the `run` skill / browser tooling at exact viewport sizes.

- [ ] **Step 2: Embed them in the README**

A hero image directly under the title, then a compact markdown table of the rest (two columns, `<img width="400">` each) so the README renders well on GitHub.

- [ ] **Step 3: Run the complete verification gate**

Run: `npx tsc --noEmit && npm run lint && npx vitest run --coverage && npm run build`
Expected: zero type errors, zero lint errors, all tests pass, production build succeeds.

- [ ] **Step 4: Walk the Requirement Traceability table**

Re-read the table in this document and confirm every row against the running app. Any row that fails becomes a fix commit before proceeding.

- [ ] **Step 5: Confirm the git history is clean and complete**

Run: `git log --oneline` and `git status`
Expected: one focused, conventionally-named commit per task in order; working tree clean; `main` fully pushed to `origin`.

- [ ] **Step 6: Final commit and push**

```bash
git add screenshots README.md
git commit -m "docs: add application screenshots across themes and breakpoints"
git push
```

---

## Definition of Done

- [ ] All nine core requirements implemented and manually verified.
- [ ] All six bonus features implemented (favourites, dark mode, sort, compare, keyboard a11y, URL-based search).
- [ ] Zero TypeScript errors, zero ESLint errors, all Vitest suites green, `npm run build` succeeds.
- [ ] Verified at 320 / 375 / 768 / 1024 / 1440px with no horizontal scroll.
- [ ] Full keyboard operability; `Escape` closes every overlay; focus is always visible and restored.
- [ ] Loading (skeletons), error (with retry), and empty states reachable and correct — the string "Loading..." appears nowhere.
- [ ] README contains all eight required sections; screenshots embedded.
- [ ] Deployment configs present for Vercel and Render — **nothing deployed by the agent.**
- [ ] `main` pushed to `origin` with one clean commit per task.
