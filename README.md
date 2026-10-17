# O(sus) — Algorithms, Alibis & Bad Hints

A multiplayer real-time social deduction game for coders. Everyone gets the same DSA problem—except the imposter. Give hints, read the room, and identify the bug in your friend group before time runs out.

---

## 🚀 What Works Right Now

### 1. Anonymous Authentication
- **Zero friction onboarding**: Automatically signs each visitor in via Firebase Anonymous Auth upon opening the web app.
- **Connection status monitoring**: Shows real-time connection state (`SETUP REQUIRED`, `CONNECTING`, `AUTH READY`, or `CONNECTION ERROR`) in the top-right header with color-coded status badges.
- **Graceful error reporting**: Displays actionable error messages (e.g., if Anonymous sign-in is disabled, invalid keys, or network disconnects) with a one-click retry button.

### 2. Room Creation
- **Unique 5-letter code generator**: Generates readable 5-character alphanumeric room codes (e.g. `ABCDE`, `XKZPR`) excluding ambiguous characters.
- **Atomic transaction**: Uses Firebase Realtime Database transactions (`runTransaction`) with retry loops to guarantee collision-free room creation.
- **Host designation**: Automatically establishes the room creator as the host (`hostUid`).

### 3. Room Joining
- **Join validation**: Sanitizes and validates 5-character room codes in real time (auto-uppercasing, non-alphabetic filtering).
- **Codename validation**: Requires a 2–20 character codename before creating or joining.
- **Interactive validation state**: Both the **Create a Room** and **Join** buttons intelligently enable only when all necessary inputs and auth requirements are satisfied.
- **Error handling**: Displays friendly alerts if a room is full, code does not exist, or game has already started.

### 4. Real-time Live Lobby
- **Live synchronization**: Listens to Realtime Database changes via `onValue` subscriptions so all players see roster changes instantly with zero page reloads.
- **Dynamic player roster**:
  - Distinguishes the host with a dedicated **HOST** badge.
  - Highlights your own entry with a **(YOU)** indicator.
  - Generates distinct color-coded player avatars (`avatar-0` through `avatar-4`).
  - Displays real-time green connection pings next to active players.
- **Configurable minimum players**: Configured for **2 minimum players** for quick local testing (supports up to 10 players).
- **Dynamic placeholder slots**: Automatically calculates open slots and displays waiting indicators until the minimum required players join.
- **One-click room code copying**: Quick copy button with feedback (`COPIED ✓`) for sharing with friends or other browser tabs.
- **Leave room**: Cleanly exits the lobby and resets state back to the landing screen.

### 5. Security & Database Rules
- **Optimized Realtime Database security**: [`database.rules.json`](./database.rules.json) enforces:
  - Valid 5-letter room codes (`^[A-Z]{5}$`).
  - Read/write access strictly scoped to authenticated users.
  - Only hosts can initialize the room.
  - Users can only register their own player node (`auth.uid === $uid`).
  - Prepared for secret distribution: [`roomSecrets/{code}/{uid}`](./database.rules.json#L39-L46) isolated so players can only read their own assigned problem/role.

---

## 🧪 How to Test Locally (Two Players)

Because Firebase Authentication persists credentials in browser storage, opening two regular tabs in the same browser window will share the same user session.

To simulate two distinct players:

1. **Player 1 (Host):**
   - Open [http://localhost:5173](http://localhost:5173).
   - Enter your codename (e.g., `HostCoder`) and click **CREATE A ROOM**.
   - Click **COPY CODE** to copy the 5-letter room code.

2. **Player 2 (Joiner):**
   - Open an **Incognito / InPrivate** window (<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>).
   - Go to [http://localhost:5173](http://localhost:5173).
   - Enter a different codename (e.g., `BugFinder`).
   - Enter the 5-letter room code in the **FIVE-LETTER ROOM CODE** box and click **JOIN**.

Both players will immediately appear in the lobby!

---

## 📁 Project Structure

```
dsa-imposter/
├── .env.local             # Local Firebase API keys and URLs
├── database.rules.json    # Realtime Database security rules
├── firebase.json          # Firebase deployment config
├── src/
│   ├── App.tsx            # Main app: Auth status, landing screen, and live lobby
│   ├── App.css            # Dark terminal-style UI, glowing neon accents, responsive layout
│   ├── index.css          # Base tokens, fonts, and background grid texture
│   ├── firebase.ts         # Firebase initialization, Anonymous auth, RTDB room operations
│   └── main.tsx           # React entry point
└── package.json           # Dependencies and scripts (React 19, Vite, Firebase)
```

---

## 🔮 What's Coming Next (Roadmap)

- [ ] **Problem Library**: Curated bank of classic DSA problems (Two Sum, Valid Anagram, LRU Cache, Binary Search, etc.).
- [ ] **Secret Role Distribution**: Secure assignment of Imposter vs. Coders stored in `/roomSecrets`.
- [ ] **Hint & Discussion Phase**: Turn-based or open timer where players type their DSA hints without giving away the exact solution to the imposter.
- [ ] **Voting & Deduction Phase**: Accuse suspects, review hints, and vote out the suspected imposter.
- [ ] **Scoreboard & Game Over**: Reveal the imposter and award points.
