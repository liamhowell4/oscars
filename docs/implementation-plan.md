# Oscar Ballot App - Implementation Plan

## Overview
A React-based Oscar ballot prediction app with art deco styling, Google authentication, group competitions, and live scoring.

---

## Architecture

### Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS + custom art deco theme
- **Auth:** Firebase Authentication (Google provider)
- **Database:** Cloud Firestore
- **Hosting:** Firebase Hosting

### Project Structure
```
oscars/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── GoogleSignIn.jsx
│   │   ├── ballot/
│   │   │   ├── BallotFlow.jsx        # Main stepper component
│   │   │   ├── CategoryCard.jsx      # Single category view
│   │   │   ├── NomineeCard.jsx       # Clickable nominee
│   │   │   └── ProgressBar.jsx       # Category progress indicator
│   │   ├── leaderboard/
│   │   │   ├── GlobalLeaderboard.jsx
│   │   │   ├── GroupLeaderboard.jsx
│   │   │   └── ScoreCard.jsx
│   │   ├── groups/
│   │   │   ├── CreateGroup.jsx
│   │   │   ├── JoinGroup.jsx
│   │   │   └── GroupList.jsx
│   │   ├── admin/
│   │   │   ├── AdminPanel.jsx        # Mark winners
│   │   │   └── LockControl.jsx       # Manual lock override
│   │   └── layout/
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       └── ArtDecoFrame.jsx      # Decorative wrapper
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── BallotContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useBallot.js
│   │   ├── useGroups.js
│   │   └── useLeaderboard.js
│   ├── data/
│   │   └── nominees2026.json         # Hardcoded Oscar data (98th Academy Awards)
│   ├── lib/
│   │   ├── firebase.js               # Firebase config
│   │   └── scoring.js                # Score calculation logic
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Ballot.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Groups.jsx
│   │   ├── Admin.jsx
│   │   └── Profile.jsx
│   ├── styles/
│   │   └── artdeco.css               # Custom art deco styles
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── assets/                       # Art deco SVG patterns
├── .env                              # Firebase config
├── firebase.json
├── firestore.rules
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Data Models (Firestore)

### Collection: `users`
```javascript
{
  id: "uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  isAdmin: false,
  createdAt: Timestamp
}
```

### Collection: `ballots`
```javascript
{
  id: "auto-generated",
  userId: "uid",
  picks: {
    "best-picture": "nomineeId",
    "best-director": "nomineeId",
    // ... all 23 categories
  },
  score: 0,               // Calculated after winners announced
  updatedAt: Timestamp,
  lockedAt: Timestamp     // Set when ceremony starts
}
```

### Collection: `groups`
```javascript
{
  id: "auto-generated",
  name: "Oscar Watch Party",
  createdBy: "uid",
  joinCode: "ABC123",     // 6-char code
  inviteLink: "uuid",     // For shareable URLs
  members: ["uid1", "uid2"],
  createdAt: Timestamp
}
```

### Collection: `config`
```javascript
// Document: "ceremony"
{
  lockTime: Timestamp,    // When ballots lock
  isLocked: false,        // Manual override
  ceremonyStarted: false  // Controls pick visibility
}

// Document: "winners"
{
  "best-picture": "nomineeId",
  "best-director": "nomineeId",
  // ... filled in as announced
}
```

---

## Key Features Implementation

### 1. Art Deco Theme
- **Colors:** Gold (#D4AF37, #FFD700), Black (#0D0D0D), Cream (#F5F5DC)
- **Typography:** Playfair Display (headings), Raleway (body)
- **Patterns:** Geometric SVG borders, sunburst motifs, chevron accents
- **Effects:** Gold gradients, subtle shadows, metallic sheen on hover

### 2. Ballot Flow
- Single category displayed at a time
- Horizontal progress bar showing completed/remaining categories
- Click nominee to select (gold highlight animation)
- Auto-save to Firestore on selection
- Previous/Next navigation + keyboard shortcuts (←/→)
- "Review All Picks" summary screen at end

### 3. Scoring System
- 1 point per correct pick (simple, fair)
- Total possible: 23 points
- Real-time score updates as winners are marked
- Tie-breaker: Earlier submission time

### 4. Auto-Lock Mechanism
- `config/ceremony.lockTime` stores lock timestamp
- Client checks on load and disables editing if past lock time
- Visual countdown timer on ballot page
- "Locked" badge replaces edit buttons after deadline

### 5. Pick Visibility
- Before `ceremonyStarted`: Users see only their own picks
- After `ceremonyStarted`: All picks become visible
- Leaderboard shows scores but hides specific picks until ceremony

### 6. Admin Panel
- Protected route (check `users/{uid}.isAdmin`)
- Grid of all categories with nominee options
- Click to mark winner (gold star indicator)
- "Start Ceremony" button sets `ceremonyStarted: true`
- Real-time: all connected clients see updates

---

## Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Ballots: own read/write, others read only after ceremony
    match /ballots/{ballotId} {
      allow read: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/config/ceremony).data.ceremonyStarted == true
      );
      allow write: if request.auth.uid == resource.data.userId &&
        get(/databases/$(database)/documents/config/ceremony).data.isLocked != true;
    }

    // Groups: members can read, creator can write
    match /groups/{groupId} {
      allow read: if request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.createdBy ||
        request.auth.uid in resource.data.members;
    }

    // Config: anyone can read, only admins write
    match /config/{doc} {
      allow read: if true;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Project Setup & Auth
1. Initialize Vite + React project
2. Configure Firebase (Auth, Firestore, Hosting)
3. Set up Tailwind + art deco base styles
4. Implement Google sign-in flow
5. Create auth context and protected routes

### Phase 2: Core Ballot
1. Create nominees JSON data file (all 23 categories)
2. Build BallotFlow stepper component
3. Implement CategoryCard and NomineeCard
4. Wire up Firestore save on selection
5. Add progress indicator and navigation

### Phase 3: Groups & Leaderboard
1. Create/join group functionality
2. Generate join codes and invite links
3. Build global leaderboard component
4. Build group leaderboard component
5. Implement score calculation logic

### Phase 4: Admin & Locking
1. Build admin panel for marking winners
2. Implement auto-lock based on ceremony time
3. Add "Start Ceremony" visibility toggle
4. Real-time score updates when winners marked

### Phase 5: Polish & Deploy
1. Add art deco decorative elements (borders, patterns)
2. Responsive design pass
3. Loading states and error handling
4. Deploy to Firebase Hosting
5. Test end-to-end flow

---

## Environment Variables (.env)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Verification Plan
1. **Auth:** Sign in with Google, verify user document created in Firestore
2. **Ballot:** Complete all 23 categories, verify picks saved
3. **Edit:** Return to ballot, change picks, verify updates
4. **Lock:** Set lock time in past, verify editing disabled
5. **Groups:** Create group, join via code and link, verify member list
6. **Admin:** Mark winners, verify scores calculate correctly
7. **Leaderboard:** Compare multiple user scores, verify ranking
8. **Visibility:** Before ceremony start, verify can't see others' picks
9. **Deploy:** `firebase deploy`, test production URL

---

## Confirmed Details
- **Firebase:** Will walk through creating a new Firebase project during implementation
- **Nominees:** Pre-populate with 2026 Oscar nominees (98th Academy Awards, honoring 2025 films)
  - Ceremony date: March 2, 2026
  - Need to fetch the current nominee list and populate all 23 categories

---

## Commands to Resume

When resuming implementation, run:
```bash
# Initialize Vite project
npm create vite@latest . -- --template react

# Install dependencies
npm install firebase react-router-dom tailwindcss postcss autoprefixer

# Initialize Tailwind
npx tailwindcss init -p

# Initialize Firebase
firebase init
```
