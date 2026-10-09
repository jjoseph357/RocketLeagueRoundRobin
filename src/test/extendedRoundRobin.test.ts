import { describe, it, expect } from 'vitest';
import {
  determineMatchSizes,
  generateNextRound,
  calculateTournamentStats,
} from '../logic/roundRobin';
import { Player, Round } from '../types/tournament';

describe('Extended Round Robin & Edge Cases', () => {
  const createPlayerList = (count: number): Player[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `usr_${i + 1}`,
      name: `Player ${i + 1}`,
      status: 'active',
      isHost: i === 0,
      joinedAt: 1000 + i,
    }));

  describe('Player partition for larger tournament rosters', () => {
    it('correctly partitions 12, 14, 16, 18, 20 players maximizing 3v3s', () => {
      expect(determineMatchSizes(12)).toEqual([6, 6]);
      expect(determineMatchSizes(14)).toEqual([6, 6, 2]);
      expect(determineMatchSizes(16)).toEqual([6, 6, 4]);
      expect(determineMatchSizes(18)).toEqual([6, 6, 6]);
      expect(determineMatchSizes(20)).toEqual([6, 6, 6, 2]);
      expect(determineMatchSizes(22)).toEqual([6, 6, 6, 4]);
      expect(determineMatchSizes(24)).toEqual([6, 6, 6, 6]);
    });
  });

  describe('Fair bye rotation across multiple rounds', () => {
    it('distributes byes across different players over 3 rounds with 5 players', () => {
      const players = createPlayerList(5);
      const rounds: Round[] = [];

      // Round 1
      const r1 = generateNextRound(players, rounds, 1);
      rounds.push(r1);
      expect(r1.byes).toHaveLength(1);
      const bye1 = r1.byes[0];

      // Round 2
      const r2 = generateNextRound(players, rounds, 2);
      rounds.push(r2);
      expect(r2.byes).toHaveLength(1);
      const bye2 = r2.byes[0];

      // Round 3
      const r3 = generateNextRound(players, rounds, 3);
      rounds.push(r3);
      expect(r3.byes).toHaveLength(1);
      const bye3 = r3.byes[0];

      // Verify no player sat out twice consecutively
      expect(bye2).not.toEqual(bye1);
      expect(bye3).not.toEqual(bye2);
    });
  });

  describe('Dynamic joins and leaves midway through tournament', () => {
    it('incorporates a new player joining in round 2', () => {
      const players = createPlayerList(4); // 4 players -> 1 match of 2v2
      const r1 = generateNextRound(players, [], 1);

      // In round 2, 2 new players join (total 6 -> 1 match of 3v3)
      const newPlayer1: Player = {
        id: 'usr_new_1',
        name: 'Newcomer 1',
        status: 'active',
        isHost: false,
        joinedAt: 2000,
      };
      const newPlayer2: Player = {
        id: 'usr_new_2',
        name: 'Newcomer 2',
        status: 'active',
        isHost: false,
        joinedAt: 2001,
      };

      const updatedPlayers = [...players, newPlayer1, newPlayer2];
      const r2 = generateNextRound(updatedPlayers, [r1], 2);

      expect(r2.matches).toHaveLength(1);
      expect(r2.matches[0].format).toBe('3v3');
      const allR2Participants = [
        ...r2.matches[0].blueTeam,
        ...r2.matches[0].orangeTeam,
      ];
      expect(allR2Participants).toContain('usr_new_1');
      expect(allR2Participants).toContain('usr_new_2');
    });

    it('respects a player setting status to sitting_out', () => {
      const players = createPlayerList(6);
      players[5].status = 'sitting_out'; // 5th player wants to sit out

      const active = players.filter((p) => p.status === 'active');
      expect(active).toHaveLength(5);

      const r1 = generateNextRound(active, [], 1);
      // 5 active players -> 1 bye, 4 playing in 2v2
      expect(r1.matches).toHaveLength(1);
      expect(r1.matches[0].format).toBe('2v2');
      expect(r1.byes).toHaveLength(1);
    });
  });

  describe('Deep streak calculation verification', () => {
    it('verifies exact scoring progression through 6-win streak and post-loss recovery', () => {
      const players = createPlayerList(2);
      const rounds: Round[] = [];

      // 6 consecutive wins for player 1
      for (let r = 1; r <= 6; r++) {
        const round: Round = {
          roundNumber: r,
          matches: [
            {
              id: `r${r}-m1`,
              roundNumber: r,
              matchIndex: 0,
              format: '1v1',
              rlLobbyName: `SASK-${r}`,
              rlPassword: 'sask',
              blueTeam: ['usr_1'],
              orangeTeam: ['usr_2'],
              blueCreatorId: 'usr_1',
              blueReport: null,
              orangeReport: null,
              status: 'completed',
              winner: 'blue',
              blueScore: 3,
              orangeScore: 1,
              completedAt: 1000 + r * 10,
            },
          ],
          byes: [],
          status: 'completed',
          createdAt: 900 + r * 10,
          completedAt: 1000 + r * 10,
        };
        rounds.push(round);
      }

      let stats = calculateTournamentStats(players, rounds);
      let p1 = stats.find((s) => s.playerId === 'usr_1')!;

      // Math:
      // Win 1: 3 pts (streak 1)
      // Win 2: 3 pts (streak 2)
      // Win 3: 3 + 1 = 4 pts (streak 3 -> +1)
      // Win 4: 3 + 2 = 5 pts (streak 4 -> +2)
      // Win 5: 3 + 3 = 6 pts (streak 5 -> +3)
      // Win 6: 3 + 4 = 7 pts (streak 6 -> +4)
      // Total = 3 + 3 + 4 + 5 + 6 + 7 = 28 points
      expect(p1.points).toBe(28);
      expect(p1.currentStreak).toBe(6);
      expect(p1.bestStreak).toBe(6);

      // Round 7: Player 1 loses to Player 2
      rounds.push({
        roundNumber: 7,
        matches: [
          {
            id: 'r7-m1',
            roundNumber: 7,
            matchIndex: 0,
            format: '1v1',
            rlLobbyName: 'SASK-7',
            rlPassword: 'sask',
            blueTeam: ['usr_1'],
            orangeTeam: ['usr_2'],
            blueCreatorId: 'usr_1',
            blueReport: null,
            orangeReport: null,
            status: 'completed',
            winner: 'orange',
            blueScore: 2,
            orangeScore: 4,
            completedAt: 1100,
          },
        ],
        byes: [],
        status: 'completed',
        createdAt: 1050,
        completedAt: 1100,
      });

      stats = calculateTournamentStats(players, rounds);
      p1 = stats.find((s) => s.playerId === 'usr_1')!;
      expect(p1.points).toBe(28); // 0 points for loss
      expect(p1.currentStreak).toBe(0); // Streak reset
      expect(p1.bestStreak).toBe(6); // Best preserved

      // Round 8: Player 1 wins again
      rounds.push({
        roundNumber: 8,
        matches: [
          {
            id: 'r8-m1',
            roundNumber: 8,
            matchIndex: 0,
            format: '1v1',
            rlLobbyName: 'SASK-8',
            rlPassword: 'sask',
            blueTeam: ['usr_1'],
            orangeTeam: ['usr_2'],
            blueCreatorId: 'usr_1',
            blueReport: null,
            orangeReport: null,
            status: 'completed',
            winner: 'blue',
            blueScore: 5,
            orangeScore: 0,
            completedAt: 1200,
          },
        ],
        byes: [],
        status: 'completed',
        createdAt: 1150,
        completedAt: 1200,
      });

      stats = calculateTournamentStats(players, rounds);
      p1 = stats.find((s) => s.playerId === 'usr_1')!;
      expect(p1.points).toBe(31); // 28 + 3 = 31 (streak 1 has 0 bonus)
      expect(p1.currentStreak).toBe(1);
      expect(p1.bestStreak).toBe(6);
    });
  });

  describe('Podium Sorting Hierarchy', () => {
    it('ranks player with more points first, then streak, then goal diff', () => {
      const players: Player[] = [
        { id: 'u1', name: 'Alpha', status: 'active', isHost: true, joinedAt: 1 },
        { id: 'u2', name: 'Beta', status: 'active', isHost: false, joinedAt: 2 },
        { id: 'u3', name: 'Gamma', status: 'active', isHost: false, joinedAt: 3 },
      ];

      // Alpha: 1 win (3 pts, goalDiff +2)
      // Beta: 1 win (3 pts, goalDiff +4) -> Beta higher goal diff with equal points
      const round1: Round = {
        roundNumber: 1,
        matches: [
          {
            id: 'r1-m1',
            roundNumber: 1,
            matchIndex: 0,
            format: '1v1',
            rlLobbyName: 'SASK-1',
            rlPassword: 'sask',
            blueTeam: ['u1'],
            orangeTeam: ['u3'],
            blueCreatorId: 'u1',
            blueReport: null,
            orangeReport: null,
            status: 'completed',
            winner: 'blue',
            blueScore: 3,
            orangeScore: 1, // goalDiff +2 for u1
            completedAt: 1000,
          },
        ],
        byes: ['u2'],
        status: 'completed',
        createdAt: 900,
        completedAt: 1000,
      };

      const round2: Round = {
        roundNumber: 2,
        matches: [
          {
            id: 'r2-m1',
            roundNumber: 2,
            matchIndex: 0,
            format: '1v1',
            rlLobbyName: 'SASK-2',
            rlPassword: 'sask',
            blueTeam: ['u2'],
            orangeTeam: ['u3'],
            blueCreatorId: 'u2',
            blueReport: null,
            orangeReport: null,
            status: 'completed',
            winner: 'blue',
            blueScore: 5,
            orangeScore: 1, // goalDiff +4 for u2
            completedAt: 2000,
          },
        ],
        byes: ['u1'],
        status: 'completed',
        createdAt: 1900,
        completedAt: 2000,
      };

      const stats = calculateTournamentStats(players, [round1, round2]);
      // Beta and Alpha both have 3 points and 1 win streak
      // Beta has goal diff +4, Alpha has goal diff +2
      expect(stats[0].playerId).toBe('u2');
      expect(stats[1].playerId).toBe('u1');
      expect(stats[2].playerId).toBe('u3');
    });
  });
});
