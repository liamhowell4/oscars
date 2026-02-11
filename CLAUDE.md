# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oscar Ballot Prediction App for the 98th Academy Awards (2026). Users sign in with Google, pick winners across 23 categories, join groups, and compete on leaderboards with live scoring. Art deco themed (gold/black/cream).

**Live URL:** https://oscar-ballot-2026.web.app
**Firebase Project:** oscar-ballot-2026

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production build to dist/
npm run lint      # ESLint check
npm run preview   # Preview production build locally
firebase deploy --only hosting  # Deploy to Firebase Hosting
```

No test runner is configured yet.

## Architecture

**Stack:** React 19 + Vite 7 + Tailwind CSS 4 + Firebase (Auth, Firestore, Hosting) + React Router 7

**State management** uses React Context (no Redux):
- `AuthContext` (`src/contexts/AuthContext.jsx`) — Firebase Google OAuth, user document creation on first sign-in, admin status tracking. Exposes `useAuth()` with `user`, `userData`, `loading`, `signInWithGoogle()`, `logout()`, `isAdmin`.
- `BallotContext` (`src/contexts/BallotContext.jsx`) — User picks, real-time Firestore listeners for ceremony config and winners, ballot locking logic, score calculation. Exposes `useBallot()` with `picks`, `winners`, `config`, `nominees`, `categories`, `score`, `savePick()`, `calculateScore()`, `isLocked()`.

**Data flow:** Nominee data is static JSON (`src/data/nominees2026.json`, 23 categories, 5 nominees each). User picks are persisted to Firestore `ballots` collection. Ceremony config and winners come from Firestore `config/ceremony` and `config/winners` documents via real-time `onSnapshot` listeners.

**Firestore collections:**
- `users/{uid}` — email, displayName, photoURL, `isAdmin` flag, createdAt
- `ballots/{uid}` — userId, `picks` (categoryId→nomineeId map), updatedAt
- `config/ceremony` — `lockTime` (Timestamp), `isLocked`, `ceremonyStarted`
- `config/winners` — categoryId→nomineeId map

## Routing

Defined in `src/App.jsx` with route guards:

| Path | Component | Auth | Notes |
|------|-----------|------|-------|
| `/` | Home | No | Landing page (unauth) / Dashboard (auth) |
| `/ballot` | Ballot | ProtectedRoute | Category stepper + review mode |
| `/leaderboard` | Leaderboard | ProtectedRoute | Real-time scores, expandable breakdown |
| `/groups` | Inline placeholder | ProtectedRoute | "Coming soon" stub |
| `/admin` | Admin | AdminRoute | isAdmin-only, winner management |
| `*` | Redirect to `/` | — | Catch-all |

- `ProtectedRoute` — requires auth, redirects to `/` if not signed in
- `AdminRoute` — requires auth + `isAdmin` flag

## Pages

- **Home** (`src/pages/Home.jsx`) — Dual-mode: unauthenticated landing with hero/features/sign-in; authenticated dashboard with ballot progress, score, countdown timer, quick actions.
- **Ballot** (`src/pages/Ballot.jsx`) — Full ballot with category stepper, keyboard navigation (arrow keys), auto-advance on selection, progress bar, review mode with grid view, score breakdown post-ceremony.
- **Leaderboard** (`src/pages/Leaderboard.jsx`) — Real-time leaderboard with rank badges (gold/silver/bronze), avatars, expandable per-category score breakdown. Tabs for "Everyone" (active) and "Groups" (stub).
- **Admin** (`src/pages/Admin.jsx`) — Ceremony controls (toggle lock, toggle ceremony started, set lock time), per-category winner management with set/clear, ballot count stats.

## Components

- `src/components/layout/Header.jsx` — Sticky nav, responsive (desktop + mobile hamburger), active route highlighting, conditional admin link
- `src/components/layout/Footer.jsx` — Ceremony date, disclaimer
- `src/components/layout/ArtDecoFrame.jsx` — Decorative corner brackets wrapper
- `src/components/auth/GoogleSignIn.jsx` — Google OAuth button with loading state
- `src/components/ballot/CategoryCard.jsx` — Single category with 5 nominee buttons, lock indicator
- `src/components/ballot/NomineeCard.jsx` — Nominee button with selected/winner/disabled visual states
- `src/components/ballot/ProgressBar.jsx` — Segmented progress bar showing picks per category

## Styling

Art deco theme defined in `src/index.css` using Tailwind `@theme` directive:
- **Colors:** `--color-gold` (#D4AF37), `--color-gold-light` (#FFD700), `--color-gold-dark` (#B8960C), `--color-black` (#0D0D0D), `--color-cream` (#F5F5DC)
- **Fonts:** Playfair Display (headings via `--font-display`), Raleway (body via `--font-body`)
- **Custom classes:** `.btn-gold`, `.btn-outline`, `.card-deco`, `.nominee-selected`, `.text-gold-gradient`, `.text-gold-shimmer`, `.deco-divider`, `.art-deco-border`
- **Animations:** `.animate-fade-in-up`, `.animate-scale-in`, `.animate-slide-down` with stagger delays
- **Custom scrollbar:** Gold-themed

## Key Files

- `src/lib/firebase.js` — Firebase app init, exports `auth`, `db`, `googleProvider` (null if env vars missing)
- `src/lib/scoring.js` — `calculateScore()`, `getScoreBreakdown()`, `generateJoinCode()`, `formatTimeRemaining()`
- `src/data/nominees2026.json` — All 23 categories with 5 nominees each (source of truth)
- `firebase.json` — Hosting config (serves from `dist/`, SPA rewrites)
- `firestore.rules` — Firestore security rules
- `docs/implementation-plan.md` — Detailed feature roadmap and data models

## Environment Setup

Copy `.env.example` to `.env` and fill in Firebase credentials. All env vars use the `VITE_` prefix and are accessed via `import.meta.env` in `src/lib/firebase.js`.

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth | Done | Sign-in, user doc creation, isAdmin tracking |
| Ballot Voting | Done | All 23 categories, Firestore persistence, keyboard nav |
| Ballot Locking | Done | Admin toggle + timestamp-based, prevents picks after lock |
| Live Scoring | Done | Real-time via onSnapshot, recalculates on winner updates |
| Leaderboard | Done | Sorted by score then time, expandable breakdown, rank badges |
| Admin Panel | Done | Winner management, ceremony controls, ballot stats |
| Responsive Design | Done | Mobile/tablet/desktop layouts |
| Art Deco Theme | Done | Full theme with animations and custom components |
| Groups | Not started | Route stub exists, join code util exists, no UI/Firestore |
| Group Leaderboards | Not started | Leaderboard has "Groups" tab with "Soon" badge |
| Testing | Not started | No test runner configured |
| Notifications | Not started | — |
