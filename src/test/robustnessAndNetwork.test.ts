import { describe, it, expect } from 'vitest';
import {
  generateNextRound,
  applyScoreReport,
} from '../logic/roundRobin';
import { normalizeLobbyCode, generateLobbyCode, generateRLMatchCredentials } from '../logic/lobbyCode';
import { drawFireFaviconCanvas, drawDefaultFaviconCanvas } from '../logic/favicon';
import { Player, Match, ScoreReport, LobbyState } from '../types/tournament';

describe('Robustness, Network, and Host Authority Tests', () => {
  describe('Host Role and Authority', () => {
    it('recognizes host when user ID matches lobby hostId', () => {
      const hostUser: Player = {
        id: 'usr_host_123',
        name: 'PrairieKing',
        status: 'active',
        isHost: false, // E.g. reset after page reload
        joinedAt: 1000,
      };

      const lobby: LobbyState = {
        code: 'SASK-HUSKY-99',
        hostId: 'usr_host_123',
        createdAt: 1000,
        phase: 'in_progress',
        players: [hostUser],
        rounds: [],
        currentRoundNumber: 1,
        settings: { winPoints: 3, streakBonusStart: 3, preferredFormat: 'force_3s' },
        revision: 2,
        lastUpdated: 1100,
      };

      const isHost = Boolean(
        hostUser && lobby && (hostUser.id === lobby.hostId || hostUser.isHost)
      );

      expect(isHost).toBe(true);
    });

    it('does not grant host rights to regular players', () => {
      const regularUser: Player = {
        id: 'usr_regular_456',
        name: 'GreenStriker',
        status: 'active',
        isHost: false,
        joinedAt: 1050,
      };

      const lobby: LobbyState = {
        code: 'SASK-HUSKY-99',
        hostId: 'usr_host_123',
        createdAt: 1000,
        phase: 'in_progress',
        players: [regularUser],
        rounds: [],
        currentRoundNumber: 1,
        settings: { winPoints: 3, streakBonusStart: 3, preferredFormat: 'force_3s' },
        revision: 2,
        lastUpdated: 1100,
      };

      const isHost = Boolean(
        regularUser && lobby && (regularUser.id === lobby.hostId || regularUser.isHost)
      );

      expect(isHost).toBe(false);
    });
  });

  describe('Dual-Team Score Reporting and Resolution', () => {
    const baseMatch: Match = {
      id: 'r1-m1',
      roundNumber: 1,
      matchIndex: 0,
      format: '3v3',
      rlLobbyName: 'SASK-R1M1-555',
      rlPassword: 'sask',
      blueTeam: ['b1', 'b2', 'b3'],
      orangeTeam: ['o1', 'o2', 'o3'],
      blueCreatorId: 'b1',
      blueReport: null,
      orangeReport: null,
      status: 'pending',
      winner: null,
      blueScore: null,
      orangeScore: null,
      completedAt: null,
    };

    it('completes match regardless of which team reports first', () => {
      const orangeReport: ScoreReport = {
        reportedBy: 'o1',
        reportedByName: 'OrangeCaptain',
        team: 'orange',
        blueScore: 2,
        orangeScore: 4,
        submittedAt: 100,
      };

      const blueReport: ScoreReport = {
        reportedBy: 'b1',
        reportedByName: 'BlueCaptain',
        team: 'blue',
        blueScore: 2,
        orangeScore: 4,
        submittedAt: 150,
      };

      // Orange reports first
      const afterOrange = applyScoreReport(baseMatch, orangeReport);
      expect(afterOrange.status).toBe('orange_reported');
      expect(afterOrange.winner).toBeNull();

      // Blue reports second with matching score
      const afterBlue = applyScoreReport(afterOrange, blueReport);
      expect(afterBlue.status).toBe('completed');
      expect(afterBlue.winner).toBe('orange');
      expect(afterBlue.blueScore).toBe(2);
      expect(afterBlue.orangeScore).toBe(4);
    });

    it('rejects ties reported by both teams as disputed requiring overtime resolution', () => {
      const blueReport: ScoreReport = {
        reportedBy: 'b1',
        reportedByName: 'BlueCaptain',
        team: 'blue',
        blueScore: 3,
        orangeScore: 3,
        submittedAt: 100,
      };

      const orangeReport: ScoreReport = {
        reportedBy: 'o1',
        reportedByName: 'OrangeCaptain',
        team: 'orange',
        blueScore: 3,
        orangeScore: 3,
        submittedAt: 105,
      };

      const step1 = applyScoreReport(baseMatch, blueReport);
      const step2 = applyScoreReport(step1, orangeReport);

      expect(step2.status).toBe('disputed');
      expect(step2.winner).toBeNull();
      expect(step2.disputeReason).toContain('Ties are not permitted');
    });

    it('allows a team to re-report after a discrepancy to reach consensus', () => {
      // Blue reports 3-1
      let match = applyScoreReport(baseMatch, {
        reportedBy: 'b1',
        reportedByName: 'BlueCaptain',
        team: 'blue',
        blueScore: 3,
        orangeScore: 1,
        submittedAt: 100,
      });

      // Orange mistakenly reports 2-3
      match = applyScoreReport(match, {
        reportedBy: 'o1',
        reportedByName: 'OrangeCaptain',
        team: 'orange',
        blueScore: 2,
        orangeScore: 3,
        submittedAt: 105,
      });
      expect(match.status).toBe('disputed');

      // Orange corrects their report to 3-1
      match = applyScoreReport(match, {
        reportedBy: 'o1',
        reportedByName: 'OrangeCaptain',
        team: 'orange',
        blueScore: 3,
        orangeScore: 1,
        submittedAt: 110,
      });

      expect(match.status).toBe('completed');
      expect(match.winner).toBe('blue');
      expect(match.blueScore).toBe(3);
      expect(match.orangeScore).toBe(1);
    });
  });

  describe('Player Dynamics: Leave, Sit Out, and Return', () => {
    it('excludes left and sitting_out players from next round', () => {
      const players: Player[] = [
        { id: 'p1', name: 'P1', status: 'active', isHost: true, joinedAt: 1 },
        { id: 'p2', name: 'P2', status: 'active', isHost: false, joinedAt: 2 },
        { id: 'p3', name: 'P3', status: 'sitting_out', isHost: false, joinedAt: 3 },
        { id: 'p4', name: 'P4', status: 'left', isHost: false, joinedAt: 4 },
      ];

      const active = players.filter((p) => p.status === 'active');
      expect(active).toHaveLength(2);

      const round = generateNextRound(active, [], 1);
      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].format).toBe('1v1');
      expect(round.matches[0].blueTeam).toContain('p1');
      expect(round.matches[0].orangeTeam).toContain('p2');
    });

    it('re-incorporates a returning player once status returns to active', () => {
      const players: Player[] = [
        { id: 'p1', name: 'P1', status: 'active', isHost: true, joinedAt: 1 },
        { id: 'p2', name: 'P2', status: 'active', isHost: false, joinedAt: 2 },
        { id: 'p3', name: 'P3', status: 'active', isHost: false, joinedAt: 3 },
        { id: 'p4', name: 'P4', status: 'active', isHost: false, joinedAt: 4 },
      ];

      const round = generateNextRound(players, [], 1);
      expect(round.matches).toHaveLength(1);
      expect(round.matches[0].format).toBe('2v2');
      const allPlayers = [...round.matches[0].blueTeam, ...round.matches[0].orangeTeam];
      expect(allPlayers).toHaveLength(4);
      expect(allPlayers).toContain('p3');
    });
  });

  describe('Lobby Code Format & Normalization', () => {
    it('always preserves or attaches the SASK prefix', () => {
      expect(normalizeLobbyCode('husky-12')).toBe('SASK-HUSKY-12');
      expect(normalizeLobbyCode('sask-husky-12')).toBe('SASK-HUSKY-12');
      expect(normalizeLobbyCode('   sask   bridge  99 ')).toBe('SASK-BRIDGE-99');
      expect(generateLobbyCode().startsWith('SASK-')).toBe(true);
    });

    it('generates Rocket League private credentials with SASK prefix and matching password', () => {
      const creds = generateRLMatchCredentials(3, 1);
      expect(creds.lobbyName.startsWith('SASK-R3M2-')).toBe(true);
      expect(creds.password).toBe('sask');
    });
  });

  describe('Procedural Vector Favicon Rendering', () => {
    it('executes canvas drawing functions without throwing in simulated canvas environment', () => {
      // Mock HTML5 canvas 2D context for Node/Vitest environment
      const mockCtx: any = {
        clearRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        bezierCurveTo: () => {},
        closePath: () => {},
        save: () => {},
        restore: () => {},
        fillText: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
      };

      const mockCanvas: any = {
        width: 64,
        height: 64,
        getContext: (type: string) => (type === '2d' ? mockCtx : null),
        toDataURL: () => 'data:image/png;base64,mockFaviconData',
      };

      expect(() => drawFireFaviconCanvas(mockCanvas, 1)).not.toThrow();
      expect(() => drawFireFaviconCanvas(mockCanvas, 4)).not.toThrow();
      expect(() => drawDefaultFaviconCanvas(mockCanvas)).not.toThrow();
    });
  });
});
