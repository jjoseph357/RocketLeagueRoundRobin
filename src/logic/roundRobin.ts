import {
  Player,
  Round,
  Match,
  MatchFormat,
  PlayerStats,
  ScoreReport,
} from '../types/tournament';
import { generateRLMatchCredentials } from './lobbyCode';

/**
 * Determines match sizes to maximize 3v3s, falling back to 2v2s and 1v1s.
 * Requirement: "Try to force the games to be threes but go to twos and ones if necessary."
 */
export function determineMatchSizes(playingCount: number): number[] {
  if (playingCount < 2) return [];
  // Must be even; if odd, 1 player sits out beforehand
  const count = playingCount % 2 === 0 ? playingCount : playingCount - 1;
  if (count < 2) return [];

  const numThrees = Math.floor(count / 6);
  const rem = count % 6;

  const sizes: number[] = [];
  for (let i = 0; i < numThrees; i++) {
    sizes.push(6);
  }

  if (rem === 4) {
    sizes.push(4);
  } else if (rem === 2) {
    sizes.push(2);
  }

  return sizes;
}

/**
 * Formats match size into Rocket League format.
 */
export function getFormatFromSize(size: number): MatchFormat {
  if (size === 6) return '3v3';
  if (size === 4) return '2v2';
  return '1v1';
}

/**
 * Selects which players sit out if total active players is odd.
 * Fairly rotates byes so players with fewer byes sit out first,
 * and no player sits out two rounds in a row unless necessary.
 */
export function selectByes(
  activePlayers: Player[],
  pastRounds: Round[]
): { playing: Player[]; byes: Player[] } {
  if (activePlayers.length === 0) {
    return { playing: [], byes: [] };
  }

  // If even number of players, everyone plays!
  if (activePlayers.length % 2 === 0) {
    return { playing: [...activePlayers], byes: [] };
  }

  // 1 player must sit out
  const lastRound = pastRounds.length > 0 ? pastRounds[pastRounds.length - 1] : null;
  const lastRoundByes = new Set(lastRound?.byes || []);

  // Count total historical byes per player
  const byeCounts = new Map<string, number>();
  activePlayers.forEach((p) => byeCounts.set(p.id, 0));

  pastRounds.forEach((round) => {
    round.byes.forEach((id) => {
      if (byeCounts.has(id)) {
        byeCounts.set(id, (byeCounts.get(id) || 0) + 1);
      }
    });
  });

  // Sort candidates:
  // 1. Didn't sit out last round (false before true)
  // 2. Fewest total byes
  // 3. Random/stable tie-break
  const candidates = [...activePlayers].sort((a, b) => {
    const aSatLast = lastRoundByes.has(a.id) ? 1 : 0;
    const bSatLast = lastRoundByes.has(b.id) ? 1 : 0;
    if (aSatLast !== bSatLast) return aSatLast - bSatLast;

    const aByes = byeCounts.get(a.id) || 0;
    const bByes = byeCounts.get(b.id) || 0;
    if (aByes !== bByes) return aByes - bByes;

    return a.joinedAt - b.joinedAt;
  });

  const byePlayer = candidates[0];
  const playing = activePlayers.filter((p) => p.id !== byePlayer.id);

  return {
    playing,
    byes: [byePlayer],
  };
}

/**
 * Calculates historical teammate and opponent interaction counts.
 */
export function buildInteractionMatrices(pastRounds: Round[]): {
  teammateCounts: Map<string, number>;
  opponentCounts: Map<string, number>;
  lobbyCreatorCounts: Map<string, number>;
} {
  const teammateCounts = new Map<string, number>();
  const opponentCounts = new Map<string, number>();
  const lobbyCreatorCounts = new Map<string, number>();

  const pairKey = (id1: string, id2: string) =>
    id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;

  pastRounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.blueCreatorId) {
        lobbyCreatorCounts.set(
          match.blueCreatorId,
          (lobbyCreatorCounts.get(match.blueCreatorId) || 0) + 1
        );
      }

      // Teammates in Blue
      for (let i = 0; i < match.blueTeam.length; i++) {
        for (let j = i + 1; j < match.blueTeam.length; j++) {
          const key = pairKey(match.blueTeam[i], match.blueTeam[j]);
          teammateCounts.set(key, (teammateCounts.get(key) || 0) + 1);
        }
      }

      // Teammates in Orange
      for (let i = 0; i < match.orangeTeam.length; i++) {
        for (let j = i + 1; j < match.orangeTeam.length; j++) {
          const key = pairKey(match.orangeTeam[i], match.orangeTeam[j]);
          teammateCounts.set(key, (teammateCounts.get(key) || 0) + 1);
        }
      }

      // Opponents (Blue vs Orange)
      for (const b of match.blueTeam) {
        for (const o of match.orangeTeam) {
          const key = pairKey(b, o);
          opponentCounts.set(key, (opponentCounts.get(key) || 0) + 1);
        }
      }
    });
  });

  return { teammateCounts, opponentCounts, lobbyCreatorCounts };
}

/**
 * Evaluates the penalty score of an assignment of players to matches and teams.
 * Lower score = better social round-robin balance (everyone teams and plays against everyone).
 */
function evaluateAssignment(
  assignment: string[],
  matchSizes: number[],
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
): number {
  let penalty = 0;
  let cursor = 0;

  const pairKey = (id1: string, id2: string) =>
    id1 < id2 ? `${id1}:${id2}` : `${id2}:${id1}`;

  for (const size of matchSizes) {
    const half = size / 2;
    const blue = assignment.slice(cursor, cursor + half);
    const orange = assignment.slice(cursor + half, cursor + size);
    cursor += size;

    // Teammate penalties (quadratic to heavily penalize duplicate pairings)
    for (let i = 0; i < blue.length; i++) {
      for (let j = i + 1; j < blue.length; j++) {
        const count = teammateCounts.get(pairKey(blue[i], blue[j])) || 0;
        penalty += count * count * 2.0 + count * 1.0;
      }
    }
    for (let i = 0; i < orange.length; i++) {
      for (let j = i + 1; j < orange.length; j++) {
        const count = teammateCounts.get(pairKey(orange[i], orange[j])) || 0;
        penalty += count * count * 2.0 + count * 1.0;
      }
    }

    // Opponent penalties
    for (const b of blue) {
      for (const o of orange) {
        const count = opponentCounts.get(pairKey(b, o)) || 0;
        penalty += count * count * 1.5 + count * 0.8;
      }
    }
  }

  return penalty;
}

/**
 * Optimizes team and match allocation using simulated annealing / local search.
 * Ensures everyone teams with and plays against everyone as evenly as possible.
 */
export function optimizeAssignments(
  playerIds: string[],
  matchSizes: number[],
  teammateCounts: Map<string, number>,
  opponentCounts: Map<string, number>
): string[] {
  if (playerIds.length <= 2) return [...playerIds];

  let bestAssignment = [...playerIds];
  let bestScore = evaluateAssignment(
    bestAssignment,
    matchSizes,
    teammateCounts,
    opponentCounts
  );

  const numRestarts = 5;
  const iterationsPerRestart = 300;

  for (let r = 0; r < numRestarts; r++) {
    // Random shuffle for restart
    const current = [...playerIds].sort(() => Math.random() - 0.5);
    let currentScore = evaluateAssignment(
      current,
      matchSizes,
      teammateCounts,
      opponentCounts
    );

    for (let iter = 0; iter < iterationsPerRestart; iter++) {
      // Pick two random indices to swap
      const i = Math.floor(Math.random() * current.length);
      const j = Math.floor(Math.random() * current.length);
      if (i === j) continue;

      // Swap
      const temp = current[i];
      current[i] = current[j];
      current[j] = temp;

      const newScore = evaluateAssignment(
        current,
        matchSizes,
        teammateCounts,
        opponentCounts
      );

      // Temperature decay for simulated annealing
      const tempFactor = 1 - iter / iterationsPerRestart;
      const acceptThreshold = Math.exp(
        -(newScore - currentScore) / (tempFactor * 2 + 0.1)
      );

      if (newScore < currentScore || Math.random() < acceptThreshold) {
        currentScore = newScore;
      } else {
        // Revert swap
        current[j] = current[i];
        current[i] = temp;
      }

      if (currentScore < bestScore) {
        bestScore = currentScore;
        bestAssignment = [...current];
      }
    }
  }

  return bestAssignment;
}

/**
 * Generates the next round of matches.
 * - Forces 3v3s, falling back to 2v2s and 1v1s.
 * - Rotates byes fairly if player count is odd.
 * - Optimizes teammate and opponent variety.
 * - Designates Blue team captain as lobby creator.
 * - Creates Rocket League private lobby names prefixed with SASK-.
 */
export function generateNextRound(
  activePlayers: Player[],
  pastRounds: Round[],
  roundNumber: number
): Round {
  const { playing, byes } = selectByes(activePlayers, pastRounds);
  const matchSizes = determineMatchSizes(playing.length);

  const { teammateCounts, opponentCounts, lobbyCreatorCounts } =
    buildInteractionMatrices(pastRounds);

  const playingIds = playing.map((p) => p.id);
  const optimizedOrder = optimizeAssignments(
    playingIds,
    matchSizes,
    teammateCounts,
    opponentCounts
  );

  const matches: Match[] = [];
  let cursor = 0;

  matchSizes.forEach((size, idx) => {
    const half = size / 2;
    const blueTeam = optimizedOrder.slice(cursor, cursor + half);
    const orangeTeam = optimizedOrder.slice(cursor + half, cursor + size);
    cursor += size;

    // Select Blue team creator:
    // "Blue team will always create the lobby."
    // Select the player on Blue who has created lobbies least often
    const sortedBlue = [...blueTeam].sort((a, b) => {
      const aCount = lobbyCreatorCounts.get(a) || 0;
      const bCount = lobbyCreatorCounts.get(b) || 0;
      return aCount - bCount;
    });
    const blueCreatorId = sortedBlue[0] || blueTeam[0];

    const creds = generateRLMatchCredentials(roundNumber, idx);

    matches.push({
      id: `r${roundNumber}-m${idx + 1}`,
      roundNumber,
      matchIndex: idx,
      format: getFormatFromSize(size),
      rlLobbyName: creds.lobbyName,
      rlPassword: creds.password,
      blueTeam,
      orangeTeam,
      blueCreatorId,
      blueReport: null,
      orangeReport: null,
      status: 'pending',
      winner: null,
      blueScore: null,
      orangeScore: null,
      completedAt: null,
    });
  });

  return {
    roundNumber,
    matches,
    byes: byes.map((p) => p.id),
    status: 'in_progress',
    createdAt: Date.now(),
    completedAt: null,
  };
}

/**
 * Processes a score report for a match.
 * Requirement: "One person from each team must report the scores after the game is done."
 * If both reports match, the game automatically completes.
 * If reports conflict, it marks the match as disputed.
 */
export function applyScoreReport(
  match: Match,
  report: ScoreReport
): Match {
  const updated: Match = { ...match };

  if (report.team === 'blue') {
    updated.blueReport = report;
  } else {
    updated.orangeReport = report;
  }

  // Check state
  const b = updated.blueReport;
  const o = updated.orangeReport;

  if (b && !o) {
    updated.status = 'blue_reported';
  } else if (!b && o) {
    updated.status = 'orange_reported';
  } else if (b && o) {
    // Both teams have reported! Check for consensus:
    if (b.blueScore === o.blueScore && b.orangeScore === o.orangeScore) {
      if (b.blueScore === b.orangeScore) {
        // Rocket League has overtime, no ties
        updated.status = 'disputed';
        updated.disputeReason = 'Ties are not permitted in Rocket League (overtime). Please report the final score.';
      } else {
        updated.status = 'completed';
        updated.blueScore = b.blueScore;
        updated.orangeScore = b.orangeScore;
        updated.winner = b.blueScore > b.orangeScore ? 'blue' : 'orange';
        updated.completedAt = Date.now();
        updated.disputeReason = undefined;
      }
    } else {
      updated.status = 'disputed';
      updated.disputeReason = `Score mismatch: Blue reported ${b.blueScore} - ${b.orangeScore}, Orange reported ${o.blueScore} - ${o.orangeScore}.`;
    }
  }

  return updated;
}

/**
 * Allows the Lobby Owner/Host to override and set the final score.
 */
export function hostOverrideMatchScore(
  match: Match,
  blueScore: number,
  orangeScore: number
): Match {
  if (blueScore === orangeScore) {
    throw new Error('Ties are not allowed in Rocket League.');
  }

  return {
    ...match,
    status: 'completed',
    blueScore,
    orangeScore,
    winner: blueScore > orangeScore ? 'blue' : 'orange',
    completedAt: Date.now(),
    disputeReason: undefined,
  };
}

/**
 * Calculates standings, points, and win streaks.
 * Rule: "Whoever has the most points wins. Probably winning grants 3 points.
 * If the player is on a win streak, they get +1 per win streak starting from three wins in a row."
 *
 * Scoring breakdown:
 * - Win: +3 points
 * - Loss: 0 points, streak resets to 0
 * - Streak bonus:
 *   Streak 1: 0 bonus (3 total)
 *   Streak 2: 0 bonus (3 total)
 *   Streak 3: +1 bonus (3 + 1 = 4 total)
 *   Streak 4: +2 bonus (3 + 2 = 5 total)
 *   Streak 5: +3 bonus (3 + 3 = 6 total)
 *   Streak N (N >= 3): +(N - 2) bonus
 */
export function calculateTournamentStats(
  players: Player[],
  rounds: Round[],
  settings = { winPoints: 3, streakBonusStart: 3 }
): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();

  players.forEach((p) => {
    statsMap.set(p.id, {
      playerId: p.id,
      playerName: p.name,
      points: 0,
      currentStreak: 0,
      bestStreak: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      winRate: 0,
      byesCount: 0,
    });
  });

  // Track byes
  rounds.forEach((round) => {
    round.byes.forEach((byeId) => {
      const stat = statsMap.get(byeId);
      if (stat) {
        stat.byesCount += 1;
      }
    });
  });

  // Gather all completed matches in chronological order
  const completedMatches: { match: Match; roundNumber: number }[] = [];
  rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (match.status === 'completed' && match.winner !== null) {
        completedMatches.push({ match, roundNumber: round.roundNumber });
      }
    });
  });

  completedMatches.sort(
    (a, b) =>
      a.roundNumber - b.roundNumber ||
      (a.match.completedAt || 0) - (b.match.completedAt || 0)
  );

  // Process each match for all participants
  completedMatches.forEach(({ match }) => {
    const isBlueWin = match.winner === 'blue';
    const blueGoals = match.blueScore || 0;
    const orangeGoals = match.orangeScore || 0;

    // Process Blue Team
    match.blueTeam.forEach((id) => {
      const stat = statsMap.get(id);
      if (!stat) return;

      stat.matchesPlayed += 1;
      stat.goalsFor += blueGoals;
      stat.goalsAgainst += orangeGoals;

      if (isBlueWin) {
        stat.wins += 1;
        stat.currentStreak += 1;
        if (stat.currentStreak > stat.bestStreak) {
          stat.bestStreak = stat.currentStreak;
        }

        let matchPoints = settings.winPoints;
        if (stat.currentStreak >= settings.streakBonusStart) {
          // +1 per win streak starting from three wins in a row
          const bonus = stat.currentStreak - settings.streakBonusStart + 1;
          matchPoints += bonus;
        }
        stat.points += matchPoints;
      } else {
        stat.losses += 1;
        stat.currentStreak = 0; // Streak broken
      }
    });

    // Process Orange Team
    match.orangeTeam.forEach((id) => {
      const stat = statsMap.get(id);
      if (!stat) return;

      stat.matchesPlayed += 1;
      stat.goalsFor += orangeGoals;
      stat.goalsAgainst += blueGoals;

      if (!isBlueWin) {
        stat.wins += 1;
        stat.currentStreak += 1;
        if (stat.currentStreak > stat.bestStreak) {
          stat.bestStreak = stat.currentStreak;
        }

        let matchPoints = settings.winPoints;
        if (stat.currentStreak >= settings.streakBonusStart) {
          const bonus = stat.currentStreak - settings.streakBonusStart + 1;
          matchPoints += bonus;
        }
        stat.points += matchPoints;
      } else {
        stat.losses += 1;
        stat.currentStreak = 0; // Streak broken
      }
    });
  });

  // Calculate final derived stats (goalDiff, winRate)
  const results = Array.from(statsMap.values()).map((stat) => {
    stat.goalDiff = stat.goalsFor - stat.goalsAgainst;
    stat.winRate =
      stat.matchesPlayed > 0
        ? Math.round((stat.wins / stat.matchesPlayed) * 100)
        : 0;
    return stat;
  });

  // Sort leaderboard: Points (desc) -> Current Streak (desc) -> Best Streak (desc) -> Goal Diff (desc)
  results.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.currentStreak !== a.currentStreak)
      return b.currentStreak - a.currentStreak;
    if (b.bestStreak !== a.bestStreak) return b.bestStreak - a.bestStreak;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.playerName.localeCompare(b.playerName);
  });

  return results;
}
