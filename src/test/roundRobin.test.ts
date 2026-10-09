import { describe, it, expect } from 'vitest';
import {
  determineMatchSizes,
  selectByes,
  generateNextRound,
  applyScoreReport,
  hostOverrideMatchScore,
  calculateTournamentStats,
} from '../logic/roundRobin';
import { generateLobbyCode, normalizeLobbyCode, generateRLMatchCredentials } from '../logic/lobbyCode';
import { Player, Round, Match } from '../types/tournament';

describe('Round Robin Logic Tests', () => {
  describe('determineMatchSizes', () => {
    it('returns empty array for fewer than 2 players', () => {
      expect(determineMatchSizes(0)).toEqual([]);
      expect(determineMatchSizes(1)).toEqual([]);
    });

    it('forces 3s where possible, falling back to 2s and 1s', () => {
      // 2 players: 1v1
      expect(determineMatchSizes(2)).toEqual([2]);
      // 4 players: 2v2
      expect(determineMatchSizes(4)).toEqual([4]);
      // 6 players: 3v3
      expect(determineMatchSizes(6)).toEqual([6]);
      // 8 players: 3v3 + 1v1
      expect(determineMatchSizes(8)).toEqual([6, 2]);
      // 10 players: 3v3 + 2v2
      expect(determineMatchSizes(10)).toEqual([6, 4]);
      // 12 players: two 3v3s
      expect(determineMatchSizes(12)).toEqual([6, 6]);
      // 14 players: two 3v3s + one 1v1
      expect(determineMatchSizes(14)).toEqual([6, 6, 2]);
      // 16 players: two 3v3s + one 2v2
      expect(determineMatchSizes(16)).toEqual([6, 6, 4]);
      // 18 players: three 3v3s
      expect(determineMatchSizes(18)).toEqual([6, 6, 6]);
    });

    it('handles odd player counts by leaving 1 player for bye and partitioning remaining even count', () => {
      expect(determineMatchSizes(3)).toEqual([2]);
      expect(determineMatchSizes(5)).toEqual([4]);
      expect(determineMatchSizes(7)).toEqual([6]);
      expect(determineMatchSizes(9)).toEqual([6, 2]);
    });
  });

  describe('selectByes', () => {
    const createPlayers = (count: number): Player[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active',
        isHost: i === 0,
        joinedAt: 1000 + i,
      }));

    it('returns no byes when player count is even', () => {
      const players = createPlayers(6);
      const result = selectByes(players, []);
      expect(result.byes).toHaveLength(0);
      expect(result.playing).toHaveLength(6);
    });

    it('selects exactly 1 bye when player count is odd', () => {
      const players = createPlayers(5);
      const result = selectByes(players, []);
      expect(result.byes).toHaveLength(1);
      expect(result.playing).toHaveLength(4);
    });

    it('rotates byes fairly so the same player does not sit out consecutively', () => {
      const players = createPlayers(5);
      // Round 1
      const r1Result = selectByes(players, []);
      const bye1 = r1Result.byes[0].id;

      const round1: Round = {
        roundNumber: 1,
        matches: [],
        byes: [bye1],
        status: 'completed',
        createdAt: 1000,
        completedAt: 2000,
      };

      // Round 2
      const r2Result = selectByes(players, [round1]);
      const bye2 = r2Result.byes[0].id;

      expect(bye2).not.toEqual(bye1);
    });
  });

  describe('generateNextRound', () => {
    const createPlayers = (count: number): Player[] =>
      Array.from({ length: count }, (_, i) => ({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        status: 'active',
        isHost: i === 0,
        joinedAt: 1000 + i,
      }));

    it('generates 3v3 match for 6 players with blue captain as creator', () => {
      const players = createPlayers(6);
      const round = generateNextRound(players, [], 1);

      expect(round.roundNumber).toBe(1);
      expect(round.matches).toHaveLength(1);
      expect(round.byes).toHaveLength(0);

      const m = round.matches[0];
      expect(m.format).toBe('3v3');
      expect(m.blueTeam).toHaveLength(3);
      expect(m.orangeTeam).toHaveLength(3);
      expect(m.blueTeam).toContain(m.blueCreatorId); // Creator must be on blue team
      expect(m.rlLobbyName.startsWith('SASK-')).toBe(true);
      expect(m.rlPassword).toBe('sask');
    });

    it('creates multiple matches with 3v3 priority for 8 players', () => {
      const players = createPlayers(8);
      const round = generateNextRound(players, [], 1);

      expect(round.matches).toHaveLength(2);
      expect(round.matches[0].format).toBe('3v3');
      expect(round.matches[1].format).toBe('1v1');
    });
  });

  describe('Score Reporting and Discrepancy Handling', () => {
    const mockMatch: Match = {
      id: 'r1-m1',
      roundNumber: 1,
      matchIndex: 0,
      format: '3v3',
      rlLobbyName: 'SASK-R1M1-123',
      rlPassword: 'sask',
      blueTeam: ['p1', 'p2', 'p3'],
      orangeTeam: ['p4', 'p5', 'p6'],
      blueCreatorId: 'p1',
      blueReport: null,
      orangeReport: null,
      status: 'pending',
      winner: null,
      blueScore: null,
      orangeScore: null,
      completedAt: null,
    };

    it('updates status to blue_reported when Blue reports first', () => {
      const updated = applyScoreReport(mockMatch, {
        reportedBy: 'p1',
        reportedByName: 'Player 1',
        team: 'blue',
        blueScore: 3,
        orangeScore: 2,
        submittedAt: 1000,
      });

      expect(updated.status).toBe('blue_reported');
      expect(updated.blueReport?.blueScore).toBe(3);
      expect(updated.orangeReport).toBeNull();
    });

    it('completes the match and awards winner when both teams agree', () => {
      let match = applyScoreReport(mockMatch, {
        reportedBy: 'p1',
        reportedByName: 'Player 1',
        team: 'blue',
        blueScore: 4,
        orangeScore: 1,
        submittedAt: 1000,
      });

      match = applyScoreReport(match, {
        reportedBy: 'p4',
        reportedByName: 'Player 4',
        team: 'orange',
        blueScore: 4,
        orangeScore: 1,
        submittedAt: 1001,
      });

      expect(match.status).toBe('completed');
      expect(match.blueScore).toBe(4);
      expect(match.orangeScore).toBe(1);
      expect(match.winner).toBe('blue');
      expect(match.completedAt).toBeGreaterThan(0);
      expect(match.disputeReason).toBeUndefined();
    });

    it('detects discrepancies when teams report conflicting scores', () => {
      let match = applyScoreReport(mockMatch, {
        reportedBy: 'p1',
        reportedByName: 'Player 1',
        team: 'blue',
        blueScore: 3,
        orangeScore: 2,
        submittedAt: 1000,
      });

      match = applyScoreReport(match, {
        reportedBy: 'p4',
        reportedByName: 'Player 4',
        team: 'orange',
        blueScore: 2,
        orangeScore: 3,
        submittedAt: 1001,
      });

      expect(match.status).toBe('disputed');
      expect(match.winner).toBeNull();
      expect(match.disputeReason).toBeDefined();
    });

    it('allows host override to resolve dispute', () => {
      const overridden = hostOverrideMatchScore(mockMatch, 5, 2);
      expect(overridden.status).toBe('completed');
      expect(overridden.blueScore).toBe(5);
      expect(overridden.orangeScore).toBe(2);
      expect(overridden.winner).toBe('blue');
    });

    it('rejects ties since Rocket League has overtime', () => {
      expect(() => hostOverrideMatchScore(mockMatch, 2, 2)).toThrow();
    });
  });

  describe('calculateTournamentStats and Win Streak Bonus', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', status: 'active', isHost: true, joinedAt: 1 },
      { id: 'p2', name: 'Bob', status: 'active', isHost: false, joinedAt: 2 },
    ];

    it('calculates 3 points for single win', () => {
      const match1: Match = {
        id: 'r1-m1',
        roundNumber: 1,
        matchIndex: 0,
        format: '1v1',
        rlLobbyName: 'SASK-1',
        rlPassword: 'sask',
        blueTeam: ['p1'],
        orangeTeam: ['p2'],
        blueCreatorId: 'p1',
        blueReport: null,
        orangeReport: null,
        status: 'completed',
        winner: 'blue',
        blueScore: 3,
        orangeScore: 1,
        completedAt: 1000,
      };

      const round1: Round = {
        roundNumber: 1,
        matches: [match1],
        byes: [],
        status: 'completed',
        createdAt: 900,
        completedAt: 1000,
      };

      const stats = calculateTournamentStats(players, [round1]);
      const alice = stats.find((s) => s.playerId === 'p1')!;
      const bob = stats.find((s) => s.playerId === 'p2')!;

      expect(alice.points).toBe(3);
      expect(alice.currentStreak).toBe(1);
      expect(alice.wins).toBe(1);
      expect(alice.losses).toBe(0);

      expect(bob.points).toBe(0);
      expect(bob.currentStreak).toBe(0);
      expect(bob.wins).toBe(0);
      expect(bob.losses).toBe(1);
    });

    it('applies +1 per win streak starting from three wins in a row', () => {
      // Alice wins 4 games in a row:
      // Game 1: win -> 3 pts (streak 1)
      // Game 2: win -> 3 pts (streak 2)
      // Game 3: win -> 3 + 1 = 4 pts (streak 3 -> +1 bonus)
      // Game 4: win -> 3 + 2 = 5 pts (streak 4 -> +2 bonus)
      // Total points for 4 wins = 3 + 3 + 4 + 5 = 15 points!
      const rounds: Round[] = [];

      for (let r = 1; r <= 4; r++) {
        rounds.push({
          roundNumber: r,
          matches: [
            {
              id: `r${r}-m1`,
              roundNumber: r,
              matchIndex: 0,
              format: '1v1',
              rlLobbyName: `SASK-${r}`,
              rlPassword: 'sask',
              blueTeam: ['p1'],
              orangeTeam: ['p2'],
              blueCreatorId: 'p1',
              blueReport: null,
              orangeReport: null,
              status: 'completed',
              winner: 'blue',
              blueScore: 2,
              orangeScore: 0,
              completedAt: 1000 + r * 100,
            },
          ],
          byes: [],
          status: 'completed',
          createdAt: 900 + r * 100,
          completedAt: 1000 + r * 100,
        });
      }

      const stats = calculateTournamentStats(players, rounds);
      const alice = stats.find((s) => s.playerId === 'p1')!;

      expect(alice.wins).toBe(4);
      expect(alice.currentStreak).toBe(4);
      expect(alice.bestStreak).toBe(4);
      expect(alice.points).toBe(15); // 3 + 3 + 4 + 5
    });

    it('resets streak to 0 on a loss', () => {
      // Alice wins 3 games, then loses game 4
      const rounds: Round[] = [];
      for (let r = 1; r <= 3; r++) {
        rounds.push({
          roundNumber: r,
          matches: [
            {
              id: `r${r}-m1`,
              roundNumber: r,
              matchIndex: 0,
              format: '1v1',
              rlLobbyName: `SASK-${r}`,
              rlPassword: 'sask',
              blueTeam: ['p1'],
              orangeTeam: ['p2'],
              blueCreatorId: 'p1',
              blueReport: null,
              orangeReport: null,
              status: 'completed',
              winner: 'blue',
              blueScore: 2,
              orangeScore: 0,
              completedAt: 1000 + r * 100,
            },
          ],
          byes: [],
          status: 'completed',
          createdAt: 900 + r * 100,
          completedAt: 1000 + r * 100,
        });
      }

      // Round 4: Alice loses
      rounds.push({
        roundNumber: 4,
        matches: [
          {
            id: 'r4-m1',
            roundNumber: 4,
            matchIndex: 0,
            format: '1v1',
            rlLobbyName: 'SASK-4',
            rlPassword: 'sask',
            blueTeam: ['p1'],
            orangeTeam: ['p2'],
            blueCreatorId: 'p1',
            blueReport: null,
            orangeReport: null,
            status: 'completed',
            winner: 'orange',
            blueScore: 1,
            orangeScore: 3,
            completedAt: 1400,
          },
        ],
        byes: [],
        status: 'completed',
        createdAt: 1300,
        completedAt: 1400,
      });

      const stats = calculateTournamentStats(players, rounds);
      const alice = stats.find((s) => s.playerId === 'p1')!;

      expect(alice.wins).toBe(3);
      expect(alice.losses).toBe(1);
      expect(alice.currentStreak).toBe(0); // Reset
      expect(alice.bestStreak).toBe(3); // Best preserved
      expect(alice.points).toBe(10); // 3 + 3 + 4 + 0
    });
  });

  describe('lobbyCode utilities', () => {
    it('generates lobby code prefixed with SASK-', () => {
      const code = generateLobbyCode(true);
      expect(code.startsWith('SASK-')).toBe(true);
      expect(code.length).toBeGreaterThan(6);
    });

    it('normalizes user-entered lobby codes', () => {
      expect(normalizeLobbyCode('husky-42')).toBe('SASK-HUSKY-42');
      expect(normalizeLobbyCode('sask-husky-42')).toBe('SASK-HUSKY-42');
      expect(normalizeLobbyCode('SASK99')).toBe('SASK-99');
    });

    it('generates RL match credentials with SASK prefix', () => {
      const creds = generateRLMatchCredentials(2, 0);
      expect(creds.lobbyName.startsWith('SASK-R2M1-')).toBe(true);
      expect(creds.password).toBe('sask');
    });
  });
});
