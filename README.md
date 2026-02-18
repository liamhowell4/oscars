# Oscar Ballot 2026

Oscar Ballot app for the 98th Academy Awards. Sign in with Google, pick winners across all 23 categories, join groups, and compete on leaderboards with live scoring during the ceremony.

**Live:** https://oscar-ballot-2026.web.app

## Stack

- React 19 + Vite 7
- Tailwind CSS 4
- Firebase (Auth, Firestore, Hosting)
- React Router 7

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Firebase credentials (VITE_FIREBASE_* vars)

# Start dev server
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `firebase deploy --only hosting` | Deploy to Firebase Hosting |

## Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase project credentials:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Project Structure

```
src/
├── components/
│   ├── auth/          # Google sign-in button
│   ├── ballot/        # CategoryCard, NomineeCard, ProgressBar
│   └── layout/        # Header, Footer, ArtDecoFrame
├── contexts/
│   ├── AuthContext.jsx   # Firebase auth, user state, admin tracking
│   └── BallotContext.jsx # Picks, winners, ceremony config, scoring
├── data/
│   └── nominees2026.json # 23 categories, 5 nominees each
├── lib/
│   ├── firebase.js    # Firebase init
│   └── scoring.js     # Score calculation, utilities
├── pages/
│   ├── Home.jsx       # Landing page / authenticated dashboard
│   ├── Ballot.jsx     # Category stepper with keyboard nav
│   ├── Leaderboard.jsx # Real-time scores with rank badges
│   ├── Films.jsx      # Browse nominees by film
│   └── Admin.jsx      # Winner management, ceremony controls
└── App.jsx            # Routes and layout
```

## Features

- **Google OAuth** sign-in with automatic user profile creation
- **Ballot voting** across all 23 Oscar categories with keyboard navigation and auto-advance
- **Ballot locking** via admin toggle or scheduled lock time
- **Live scoring** with real-time Firestore listeners, recalculated as winners are announced
- **Leaderboard** with rank badges (gold/silver/bronze), avatars, and expandable per-category breakdowns
- **Admin panel** for setting winners, toggling ceremony state, and viewing ballot stats
- **Art deco theme** with gold/black/cream palette, Playfair Display + Raleway fonts, and custom animations
- **Responsive design** for mobile, tablet, and desktop
