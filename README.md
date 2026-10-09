# University of Saskatchewan (USask) Rocket League Round Robin

A static web application deployed on GitHub Pages for organizing and hosting dynamic **Rocket League Round Robin** tournaments.

Built for **Huskie Esports** and the **University of Saskatchewan (`usask.ca`)** community.

---

## 🏆 Key Features

### 1. Dynamic Social Round Robin Matchmaking
- **Everyone Teams with and Plays Against Everyone:** An optimization algorithm tracks historical teammate and opponent pairings across all rounds, minimizing repeat matchups.
- **Priority on 3v3 Matches:** Automatically forces games into **3v3** format, gracefully stepping down to **2v2** and **1v1** when the player count necessitates it:
  - 6 players → 1 match of 3v3
  - 8 players → 1 match of 3v3 + 1 match of 1v1
  - 10 players → 1 match of 3v3 + 1 match of 2v2
  - 12 players → 2 matches of 3v3
  - 14 players → 2 matches of 3v3 + 1 match of 1v1
- **Fair Rotating Byes:** If an odd number of players is active, 1 player receives a rotating bye. The system ensures no player sits out twice consecutively.
- **Flexible Roster:** Players can join mid-tournament, leave, or toggle "Sit Out" / "Ready" at any time.

### 2. Auto-Generated Lobby Codes with `SASK-` Prefix
- Lobbies automatically receive memorable USask-themed codes (e.g. `SASK-HUSKY-42`, `SASK-PRAIRIE-88`, `SASK-GREEN-19`).
- Shareable invitation links (e.g. `?lobby=SASK-HUSKY-42`) auto-fill codes for incoming players.

### 3. Rocket League In-Game Hosting & Blue Team Priority
- **Blue Team Always Creates the Lobby:** Each match card designates the Blue Team Captain with one-click copy buttons for:
  - **Match Name:** `SASK-R<round>M<match>-<suffix>`
  - **Password:** `sask`
- Clear instructions guide players into Rocket League (*Play > Custom Games > Private Match > Create/Join*).

### 4. Dual-Team Score Verification
- **One person from each team must report the scores** after each game concludes.
- When Blue and Orange reports match, the game automatically completes, winners are crowned, and standings update.
- If reports disagree, a **Discrepancy Warning** is flagged, allowing players to correct their entry or the Lobby Host to issue an authoritative score override.

### 5. Scoring & Fire Favicon Win Streaks
- **Base Win:** +3 points
- **Loss:** 0 points (win streak resets to 0)
- **Win Streak Bonus:** Starting at **3 wins in a row**, players receive **+1 bonus point per win streak tier**:
  - 3 Wins in a row: 3 base + 1 streak = **4 points**
  - 4 Wins in a row: 3 base + 2 streak = **5 points**
  - 5 Wins in a row: 3 base + 3 streak = **6 points**
  - *N* Wins in a row ($N \ge 3$): $3 + (N - 2)$ points
- **Dynamic Fire Favicon (🔥) & Counter:** When a player is on a win streak, the browser tab's favicon dynamically switches to an animated flame badge with their live streak count, and the document title updates in real-time.

### 6. Multi-View Dashboard
- **🎮 My Match:** Focused interface showing your assigned game, teammates, opponents, Rocket League lobby credentials, host instructions, and score submission.
- **📋 All Current Games:** Grid overview of all concurrent matches across the round.
- **🏆 Standings & Leaderboard:** Live standings ranking players by Points, Current Streak, Best Streak, Record, Win %, and Goal Differential.
- **📜 Round History:** Archive of completed rounds, scores, and winners.
- **👥 Players & Roster:** Real-time lobby management, sit-out toggles, and host controls.

### 7. Championship Podium & Awards
- The Lobby Owner can end the tournament at any time to reveal the **3D Olympic/Collegiate Podium**:
  - 🥇 1st Place (Gold Champion Pedestal & Trophy)
  - 🥈 2nd Place (Silver Pedestal & Medal)
  - 🥉 3rd Place (Bronze Pedestal & Medal)
- Interactive confetti celebration (`canvas-confetti`).
- Tournament Accolades:
  - 👑 *Tournament Champion* (Highest Points)
  - 🔥 *Firestorm MVP* (Longest Win Streak)
  - ⚽ *Golden Boot Striker* (Most Goals Scored)
- One-click JSON results export for records.

### 8. Real-Time Networking
- **Hybrid Synchronization Architecture:**
  - `BroadcastChannel` provides instant 0-latency synchronization across browser tabs and windows on the same machine.
  - Public MQTT over WebSockets provides cross-device global sync for remote players on phones and PCs without requiring external server hosting.
  - LocalStorage caching guarantees player sessions and match states survive browser reloads.
  - Includes **Solo Testing Demo Tools** (`+5 Demo Players` and `Simulate Scores`) so organizers can test round-robins immediately without waiting for a full lobby.

---

## 🎨 Theme & Aesthetic

Designed to match the **University of Saskatchewan (`usask.ca`)** athletic identity:
- **USask Green:** `#006A4E` (Official Saskatchewan Green)
- **Huskie Pine:** `#004D38`
- **Huskie Athletic Gold:** `#FFC72C`
- Collegiate athletic typography featuring `Chakra Petch` and `Inter`.

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npm test

# 3. Start development server
npm run dev

# 4. Build for production (GitHub Pages)
npm run build
```

---

## 🌐 Deploying to GitHub Pages

This repository includes a GitHub Actions workflow in `.github/workflows/deploy.yml`.

1. Go to repository **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Push changes to `main`. The workflow will automatically test, build, and deploy the app to `https://<username>.github.io/RocketLeagueRoundRobin/`.
