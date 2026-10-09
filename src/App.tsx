import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { MyMatchView } from './components/MyMatchView';
import { AllMatchesView } from './components/AllMatchesView';
import { LeaderboardView } from './components/LeaderboardView';
import { RoundHistoryView } from './components/RoundHistoryView';
import { PodiumView } from './components/PodiumView';
import { RulesModal } from './components/RulesModal';
import {
  LobbyState,
  Player,
  ScoreReport,
} from './types/tournament';
import {
  generateNextRound,
  applyScoreReport,
  hostOverrideMatchScore,
  calculateTournamentStats,
} from './logic/roundRobin';
import { generateLobbyCode, normalizeLobbyCode } from './logic/lobbyCode';
import { LobbyNetwork, NetworkMessage } from './logic/network';
import { updateStreakFavicon } from './logic/favicon';
import {
  Gamepad2,
  LayoutGrid,
  Trophy,
  History,
  Users,
  ChevronRight,
  Award,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY_USER_ID = 'rlrr_user_id';
const STORAGE_KEY_USER_NAME = 'rlrr_user_name';
const STORAGE_KEY_LOBBY = 'rlrr_last_lobby';

const DEMO_NAMES = [
  'SaskStriker',
  'PrairieAce',
  'BridgeFlyer',
  'BroadwayDrifter',
  'Diefenbaker',
  'MeewasinSpeed',
  'Wanuskewin',
  'NutanaStar',
  'RiverLanding',
  'BorealBoost',
  'AuroraFlick',
];

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Player | null>(() => {
    const id = localStorage.getItem(STORAGE_KEY_USER_ID);
    const name = localStorage.getItem(STORAGE_KEY_USER_NAME);
    if (id && name) {
      return { id, name, status: 'active', isHost: false, joinedAt: Date.now() };
    }
    return null;
  });

  const [lobby, setLobby] = useState<LobbyState | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOBBY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [currentTab, setCurrentTab] = useState<
    'my_match' | 'all_matches' | 'leaderboard' | 'history' | 'players'
  >('my_match');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [networkStatus, setNetworkStatus] = useState({
    mqttConnected: false,
    localConnected: false,
  });

  const networkRef = useRef<LobbyNetwork | null>(null);

  // Check URL search params for lobby invitation
  const queryLobbyCode = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('lobby') || '';
  }, []);

  // Save lobby state to localStorage on updates
  useEffect(() => {
    if (lobby) {
      localStorage.setItem(STORAGE_KEY_LOBBY, JSON.stringify(lobby));
    }
  }, [lobby]);

  // Handle incoming network messages
  const handleNetworkMessage = useCallback(
    (msg: NetworkMessage) => {
      if (msg.type === 'STATE_SYNC') {
        setLobby((prev) => {
          if (!prev || msg.state.revision >= prev.revision) {
            return msg.state;
          }
          return prev;
        });
      } else if (msg.type === 'REQUEST_STATE') {
        // If we are host, broadcast current state
        setLobby((currentLobby) => {
          if (currentLobby && currentUser?.isHost && networkRef.current) {
            networkRef.current.send({
              type: 'STATE_SYNC',
              state: currentLobby,
              senderId: currentUser.id,
            });
          }
          return currentLobby;
        });
      } else if (msg.type === 'PLAYER_JOIN') {
        setLobby((prev) => {
          if (!prev) return null;
          const exists = prev.players.some((p) => p.id === msg.player.id);
          if (exists) return prev;

          const newPlayer: Player = {
            id: msg.player.id,
            name: msg.player.name,
            status: 'active',
            isHost: false,
            joinedAt: Date.now(),
          };

          const updated: LobbyState = {
            ...prev,
            players: [...prev.players, newPlayer],
            revision: prev.revision + 1,
            lastUpdated: Date.now(),
          };

          if (currentUser?.isHost && networkRef.current) {
            networkRef.current.send({
              type: 'STATE_SYNC',
              state: updated,
              senderId: currentUser.id,
            });
          }
          return updated;
        });
      } else if (msg.type === 'SCORE_REPORT') {
        setLobby((prev) => {
          if (!prev) return null;
          const currentRound = prev.rounds[prev.rounds.length - 1];
          if (!currentRound) return prev;

          const updatedMatches = currentRound.matches.map((m) =>
            m.id === msg.matchId ? applyScoreReport(m, msg.report) : m
          );

          const updatedRound = { ...currentRound, matches: updatedMatches };
          const updatedRounds = [...prev.rounds.slice(0, -1), updatedRound];

          const updated: LobbyState = {
            ...prev,
            rounds: updatedRounds,
            revision: prev.revision + 1,
            lastUpdated: Date.now(),
          };

          if (currentUser?.isHost && networkRef.current) {
            networkRef.current.send({
              type: 'STATE_SYNC',
              state: updated,
              senderId: currentUser.id,
            });
          }
          return updated;
        });
      } else if (msg.type === 'PLAYER_STATUS_CHANGE') {
        setLobby((prev) => {
          if (!prev) return null;
          const updatedPlayers = prev.players.map((p) =>
            p.id === msg.playerId ? { ...p, status: msg.status } : p
          );
          const updated: LobbyState = {
            ...prev,
            players: updatedPlayers,
            revision: prev.revision + 1,
            lastUpdated: Date.now(),
          };
          if (currentUser?.isHost && networkRef.current) {
            networkRef.current.send({
              type: 'STATE_SYNC',
              state: updated,
              senderId: currentUser.id,
            });
          }
          return updated;
        });
      }
    },
    [currentUser]
  );

  // Initialize network connection when lobby code & user change
  useEffect(() => {
    if (!lobby || !currentUser) return;

    if (networkRef.current) {
      networkRef.current.destroy();
    }

    const net = new LobbyNetwork({
      lobbyCode: lobby.code,
      myPlayerId: currentUser.id,
      onMessage: handleNetworkMessage,
      onConnectionChange: setNetworkStatus,
    });
    networkRef.current = net;

    return () => {
      net.destroy();
    };
  }, [lobby?.code, currentUser?.id, handleNetworkMessage]);

  // Calculate tournament standings
  const stats = useMemo(() => {
    if (!lobby) return [];
    return calculateTournamentStats(lobby.players, lobby.rounds, lobby.settings);
  }, [lobby]);

  const statsMap = useMemo(() => {
    const map = new Map<string, (typeof stats)[0]>();
    stats.forEach((s) => map.set(s.playerId, s));
    return map;
  }, [stats]);

  const playersMap = useMemo(() => {
    const map = new Map<string, Player>();
    if (lobby) {
      lobby.players.forEach((p) => map.set(p.id, p));
    }
    return map;
  }, [lobby]);

  // Current user's win streak
  const userStreak = useMemo(() => {
    if (!currentUser) return 0;
    return statsMap.get(currentUser.id)?.currentStreak || 0;
  }, [currentUser, statsMap]);

  // Sync Fire Favicon and Document Title
  useEffect(() => {
    updateStreakFavicon(userStreak, currentUser?.name);
  }, [userStreak, currentUser?.name]);

  // Current round and current user's match
  const currentRound = useMemo(() => {
    if (!lobby || lobby.rounds.length === 0) return null;
    return lobby.rounds[lobby.rounds.length - 1];
  }, [lobby]);

  const myMatch = useMemo(() => {
    if (!currentRound || !currentUser) return null;
    return (
      currentRound.matches.find(
        (m) =>
          m.blueTeam.includes(currentUser.id) ||
          m.orangeTeam.includes(currentUser.id)
      ) || null
    );
  }, [currentRound, currentUser]);

  const hasBye = useMemo(() => {
    if (!currentRound || !currentUser) return false;
    return currentRound.byes.includes(currentUser.id);
  }, [currentRound, currentUser]);

  // Check if all matches in current round are completed
  const allCurrentMatchesCompleted = useMemo(() => {
    if (!currentRound || currentRound.matches.length === 0) return false;
    return currentRound.matches.every((m) => m.status === 'completed');
  }, [currentRound]);

  // --- Handlers ---

  const broadcastState = (newState: LobbyState) => {
    setLobby(newState);
    if (networkRef.current && currentUser) {
      networkRef.current.send({
        type: 'STATE_SYNC',
        state: newState,
        senderId: currentUser.id,
      });
    }
  };

  const handleCreateLobby = (playerName: string) => {
    const userId = `usr_${Math.random().toString(36).slice(2, 9)}`;
    const user: Player = {
      id: userId,
      name: playerName,
      status: 'active',
      isHost: true,
      joinedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_USER_ID, userId);
    localStorage.setItem(STORAGE_KEY_USER_NAME, playerName);
    setCurrentUser(user);

    const code = generateLobbyCode(true);

    const newLobby: LobbyState = {
      code,
      hostId: userId,
      createdAt: Date.now(),
      phase: 'setup',
      players: [user],
      rounds: [],
      currentRoundNumber: 0,
      settings: {
        winPoints: 3,
        streakBonusStart: 3,
        preferredFormat: 'force_3s',
      },
      revision: 1,
      lastUpdated: Date.now(),
    };

    broadcastState(newLobby);
  };

  const handleJoinLobby = (inputCode: string, playerName: string) => {
    const normalized = normalizeLobbyCode(inputCode);
    const userId = `usr_${Math.random().toString(36).slice(2, 9)}`;
    const user: Player = {
      id: userId,
      name: playerName,
      status: 'active',
      isHost: false,
      joinedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_USER_ID, userId);
    localStorage.setItem(STORAGE_KEY_USER_NAME, playerName);
    setCurrentUser(user);

    const placeholderLobby: LobbyState = {
      code: normalized,
      hostId: '',
      createdAt: Date.now(),
      phase: 'setup',
      players: [user],
      rounds: [],
      currentRoundNumber: 0,
      settings: {
        winPoints: 3,
        streakBonusStart: 3,
        preferredFormat: 'force_3s',
      },
      revision: 1,
      lastUpdated: Date.now(),
    };

    setLobby(placeholderLobby);

    // Announce join over network
    setTimeout(() => {
      if (networkRef.current) {
        networkRef.current.send({
          type: 'PLAYER_JOIN',
          player: { id: user.id, name: user.name },
          senderId: user.id,
        });
      }
    }, 300);
  };

  const handleToggleStatus = (status: 'active' | 'sitting_out') => {
    if (!currentUser || !lobby) return;
    const updatedPlayers = lobby.players.map((p) =>
      p.id === currentUser.id ? { ...p, status } : p
    );
    const updated: LobbyState = {
      ...lobby,
      players: updatedPlayers,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleLeaveLobby = () => {
    if (networkRef.current && currentUser) {
      networkRef.current.send({
        type: 'PLAYER_LEAVE',
        playerId: currentUser.id,
        senderId: currentUser.id,
      });
    }
    setLobby(null);
    localStorage.removeItem(STORAGE_KEY_LOBBY);
  };

  const handleRemovePlayer = (playerId: string) => {
    if (!lobby || !currentUser?.isHost) return;
    const updated: LobbyState = {
      ...lobby,
      players: lobby.players.filter((p) => p.id !== playerId),
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleAddDemoPlayers = (count: number) => {
    if (!lobby || !currentUser?.isHost) return;
    const existingNames = new Set(lobby.players.map((p) => p.name));
    const available = DEMO_NAMES.filter((n) => !existingNames.has(n));

    const newPlayers: Player[] = [];
    for (let i = 0; i < count; i++) {
      const name = available[i] || `Huskie_${Math.floor(10 + Math.random() * 90)}`;
      newPlayers.push({
        id: `demo_${Math.random().toString(36).slice(2, 8)}`,
        name,
        status: 'active',
        isHost: false,
        joinedAt: Date.now() + i * 10,
      });
    }

    const updated: LobbyState = {
      ...lobby,
      players: [...lobby.players, ...newPlayers],
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleStartTournament = () => {
    if (!lobby || !currentUser?.isHost) return;
    const active = lobby.players.filter((p) => p.status === 'active');
    if (active.length < 2) return;

    const round1 = generateNextRound(active, [], 1);
    const updated: LobbyState = {
      ...lobby,
      phase: 'in_progress',
      rounds: [round1],
      currentRoundNumber: 1,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
    setCurrentTab('my_match');
  };

  const handleAdvanceRound = () => {
    if (!lobby || !currentUser?.isHost) return;
    const active = lobby.players.filter((p) => p.status === 'active');
    const nextRoundNumber = lobby.currentRoundNumber + 1;

    // Mark previous round completed
    const updatedPastRounds = lobby.rounds.map((r, idx) =>
      idx === lobby.rounds.length - 1
        ? { ...r, status: 'completed' as const, completedAt: Date.now() }
        : r
    );

    const nextRound = generateNextRound(active, updatedPastRounds, nextRoundNumber);

    const updated: LobbyState = {
      ...lobby,
      rounds: [...updatedPastRounds, nextRound],
      currentRoundNumber: nextRoundNumber,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
    setCurrentTab('my_match');
  };

  const handleSubmitScore = (matchId: string, report: ScoreReport) => {
    if (!lobby) return;
    const currentR = lobby.rounds[lobby.rounds.length - 1];
    if (!currentR) return;

    const updatedMatches = currentR.matches.map((m) =>
      m.id === matchId ? applyScoreReport(m, report) : m
    );

    const updatedRound = { ...currentR, matches: updatedMatches };
    const updatedRounds = [...lobby.rounds.slice(0, -1), updatedRound];

    const updated: LobbyState = {
      ...lobby,
      rounds: updatedRounds,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };

    broadcastState(updated);
  };

  const handleHostOverride = (matchId: string, blueScore: number, orangeScore: number) => {
    if (!lobby || !currentUser?.isHost) return;
    const currentR = lobby.rounds[lobby.rounds.length - 1];
    if (!currentR) return;

    const updatedMatches = currentR.matches.map((m) =>
      m.id === matchId ? hostOverrideMatchScore(m, blueScore, orangeScore) : m
    );

    const updatedRound = { ...currentR, matches: updatedMatches };
    const updatedRounds = [...lobby.rounds.slice(0, -1), updatedRound];

    const updated: LobbyState = {
      ...lobby,
      rounds: updatedRounds,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };

    broadcastState(updated);
  };

  const handleEndTournament = () => {
    if (!lobby || !currentUser?.isHost) return;
    const updated: LobbyState = {
      ...lobby,
      phase: 'podium',
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleResumeTournament = () => {
    if (!lobby || !currentUser?.isHost) return;
    const updated: LobbyState = {
      ...lobby,
      phase: 'in_progress',
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleRestartTournament = () => {
    if (!lobby || !currentUser?.isHost) return;
    const updated: LobbyState = {
      ...lobby,
      phase: 'setup',
      rounds: [],
      currentRoundNumber: 0,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleSimulatePendingMatches = () => {
    if (!lobby || !currentUser?.isHost || !currentRound) return;

    const updatedMatches = currentRound.matches.map((m) => {
      if (m.status === 'completed') return m;
      // Generate realistic score (e.g., 3-1, 4-2, 2-1)
      const bScore = Math.floor(1 + Math.random() * 5);
      let oScore = Math.floor(1 + Math.random() * 5);
      if (bScore === oScore) {
        oScore = bScore + (Math.random() > 0.5 ? 1 : -1);
      }
      return hostOverrideMatchScore(m, Math.max(0, bScore), Math.max(0, oScore));
    });

    const updatedRound = { ...currentRound, matches: updatedMatches };
    const updatedRounds = [...lobby.rounds.slice(0, -1), updatedRound];

    const updated: LobbyState = {
      ...lobby,
      rounds: updatedRounds,
      revision: lobby.revision + 1,
      lastUpdated: Date.now(),
    };
    broadcastState(updated);
  };

  const handleExportResults = () => {
    if (!lobby) return;
    const data = {
      lobbyCode: lobby.code,
      totalRounds: lobby.rounds.length,
      finalStandings: stats,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lobby.code}-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Header
        lobbyCode={lobby?.code || null}
        currentUser={currentUser}
        userStreak={userStreak}
        networkStatus={networkStatus}
        onOpenRules={() => setRulesOpen(true)}
      />

      {/* Main Content Body */}
      <main style={{ flex: 1, paddingBottom: '5rem' }}>
        {/* Setup Phase */}
        {(!lobby || lobby.phase === 'setup') && (
          <SetupView
            lobby={lobby}
            currentUser={currentUser}
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            onToggleStatus={handleToggleStatus}
            onLeaveLobby={handleLeaveLobby}
            onStartTournament={handleStartTournament}
            onAddDemoPlayers={handleAddDemoPlayers}
            onRemovePlayer={handleRemovePlayer}
            initialCode={queryLobbyCode}
          />
        )}

        {/* Podium Phase */}
        {lobby && lobby.phase === 'podium' && currentUser && (
          <PodiumView
            stats={stats}
            currentUser={currentUser}
            onRestart={handleRestartTournament}
            onResume={handleResumeTournament}
            onExport={handleExportResults}
          />
        )}

        {/* In-Progress Phase */}
        {lobby && lobby.phase === 'in_progress' && currentUser && (
          <div className="container" style={{ padding: '1.5rem 1.25rem' }}>
            {/* View Selector Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '2px solid var(--border-color)',
                marginBottom: '1.5rem',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              <button
                onClick={() => setCurrentTab('my_match')}
                className={`tab-btn ${currentTab === 'my_match' ? 'active' : ''}`}
              >
                <Gamepad2 size={18} />
                <span>My Match</span>
                {myMatch && myMatch.status !== 'completed' && (
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#FFC72C',
                      display: 'inline-block',
                    }}
                  />
                )}
              </button>

              <button
                onClick={() => setCurrentTab('all_matches')}
                className={`tab-btn ${currentTab === 'all_matches' ? 'active' : ''}`}
              >
                <LayoutGrid size={18} />
                <span>All Games ({currentRound?.matches.length || 0})</span>
              </button>

              <button
                onClick={() => setCurrentTab('leaderboard')}
                className={`tab-btn ${currentTab === 'leaderboard' ? 'active' : ''}`}
              >
                <Trophy size={18} />
                <span>Standings</span>
              </button>

              <button
                onClick={() => setCurrentTab('history')}
                className={`tab-btn ${currentTab === 'history' ? 'active' : ''}`}
              >
                <History size={18} />
                <span>History</span>
              </button>

              <button
                onClick={() => setCurrentTab('players')}
                className={`tab-btn ${currentTab === 'players' ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Players ({lobby.players.length})</span>
              </button>
            </div>

            {/* Tab Views */}
            {currentTab === 'my_match' && (
              <MyMatchView
                match={myMatch}
                hasBye={hasBye}
                currentUser={currentUser}
                playersMap={playersMap}
                statsMap={statsMap}
                onSubmitScore={handleSubmitScore}
                onHostOverride={handleHostOverride}
              />
            )}

            {currentTab === 'all_matches' && (
              <AllMatchesView
                currentRound={currentRound}
                playersMap={playersMap}
                statsMap={statsMap}
                currentUser={currentUser}
                onHostOverride={handleHostOverride}
              />
            )}

            {currentTab === 'leaderboard' && (
              <LeaderboardView
                stats={stats}
                currentUser={currentUser}
                onOpenRules={() => setRulesOpen(true)}
              />
            )}

            {currentTab === 'history' && (
              <RoundHistoryView
                rounds={lobby.rounds}
                playersMap={playersMap}
              />
            )}

            {currentTab === 'players' && (
              <SetupView
                lobby={lobby}
                currentUser={currentUser}
                onCreateLobby={handleCreateLobby}
                onJoinLobby={handleJoinLobby}
                onToggleStatus={handleToggleStatus}
                onLeaveLobby={handleLeaveLobby}
                onStartTournament={handleStartTournament}
                onAddDemoPlayers={handleAddDemoPlayers}
                onRemovePlayer={handleRemovePlayer}
              />
            )}
          </div>
        )}
      </main>

      {/* Host Floating Control Bar (when in progress) */}
      {lobby && lobby.phase === 'in_progress' && currentUser?.isHost && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(180deg, rgba(11, 19, 17, 0.95), rgba(0, 54, 39, 0.98))',
            borderTop: '2px solid var(--usask-green-light)',
            backdropFilter: 'blur(10px)',
            padding: '0.75rem 1.25rem',
            zIndex: 40,
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  color: '#FFC72C',
                  fontFamily: 'Chakra Petch, monospace',
                }}
              >
                ROUND {lobby.currentRoundNumber} IN PROGRESS
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({currentRound?.matches.filter((m) => m.status === 'completed').length || 0} /{' '}
                {currentRound?.matches.length || 0} Games Verified)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Simulate button for testing */}
              {!allCurrentMatchesCompleted && (
                <button
                  onClick={handleSimulatePendingMatches}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  title="Auto-fill random scores for pending matches"
                >
                  <Sparkles size={14} color="#FFC72C" />
                  <span>Simulate Scores</span>
                </button>
              )}

              {/* Next Round Button */}
              <button
                onClick={handleAdvanceRound}
                className="btn-green"
                style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
                title="Generate next round pairing"
              >
                <span>Next Round</span>
                <ChevronRight size={16} />
              </button>

              {/* End Tournament Button */}
              <button
                onClick={handleEndTournament}
                className="btn-gold"
                style={{ padding: '0.45rem 1.15rem', fontSize: '0.88rem' }}
                title="The owner can choose when to end the game and show the podium"
              >
                <Award size={16} />
                <span>End Game &amp; Show Podium</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
};

export default App;
