export type PlayerStatus = 'active' | 'sitting_out' | 'left';

export interface Player {
  id: string;
  name: string;
  status: PlayerStatus;
  isHost: boolean;
  joinedAt: number;
}

export type MatchTeam = 'blue' | 'orange';
export type MatchFormat = '3v3' | '2v2' | '1v1';
export type MatchStatus = 'pending' | 'blue_reported' | 'orange_reported' | 'disputed' | 'completed';

export interface ScoreReport {
  reportedBy: string; // Player ID
  reportedByName: string;
  team: MatchTeam;
  blueScore: number;
  orangeScore: number;
  submittedAt: number;
}

export interface Match {
  id: string;
  roundNumber: number;
  matchIndex: number;
  format: MatchFormat;
  rlLobbyName: string;
  rlPassword: string;
  blueTeam: string[]; // Player IDs
  orangeTeam: string[]; // Player IDs
  blueCreatorId: string; // Designated player on Blue who creates the lobby
  blueReport: ScoreReport | null;
  orangeReport: ScoreReport | null;
  status: MatchStatus;
  winner: MatchTeam | null;
  blueScore: number | null;
  orangeScore: number | null;
  completedAt: number | null;
  disputeReason?: string;
}

export interface Round {
  roundNumber: number;
  matches: Match[];
  byes: string[]; // Player IDs sitting out
  status: 'in_progress' | 'completed';
  createdAt: number;
  completedAt: number | null;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  points: number;
  currentStreak: number;
  bestStreak: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  winRate: number;
  byesCount: number;
}

export type TournamentPhase = 'setup' | 'in_progress' | 'podium';

export interface LobbySettings {
  winPoints: number; // Default 3
  streakBonusStart: number; // Default 3 (starts at 3 wins)
  preferredFormat: 'force_3s' | 'balanced'; // Default 'force_3s'
}

export interface LobbyState {
  code: string;
  hostId: string;
  createdAt: number;
  phase: TournamentPhase;
  players: Player[];
  rounds: Round[];
  currentRoundNumber: number;
  settings: LobbySettings;
  revision: number;
  lastUpdated: number;
}
