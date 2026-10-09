import React, { useState } from 'react';
import { Users, UserPlus, Play, LogOut, Coffee, Shield, Sparkles } from 'lucide-react';
import { Player, LobbyState } from '../types/tournament';
import { determineMatchSizes } from '../logic/roundRobin';

interface SetupViewProps {
  lobby: LobbyState | null;
  currentUser: Player | null;
  onCreateLobby: (playerName: string) => void;
  onJoinLobby: (code: string, playerName: string) => void;
  onToggleStatus: (status: 'active' | 'sitting_out') => void;
  onLeaveLobby: () => void;
  onStartTournament: () => void;
  onAddDemoPlayers: (count: number) => void;
  onRemovePlayer: (playerId: string) => void;
  initialCode?: string;
}

export const SetupView: React.FC<SetupViewProps> = ({
  lobby,
  currentUser,
  onCreateLobby,
  onJoinLobby,
  onToggleStatus,
  onLeaveLobby,
  onStartTournament,
  onAddDemoPlayers,
  onRemovePlayer,
  initialCode = '',
}) => {
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState(initialCode);
  const [mode, setMode] = useState<'create' | 'join'>(initialCode ? 'join' : 'create');

  React.useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode);
      setMode('join');
    }
  }, [initialCode]);

  // If not joined to a lobby yet, show Join/Create Card
  if (!lobby || !currentUser) {
    return (
      <div className="container" style={{ padding: '3rem 1.25rem', maxWidth: '540px' }}>
        <div className="card animate-float-in" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.25rem',
              background: 'linear-gradient(135deg, #006A4E, #004D38)',
              border: '2px solid #FFC72C',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 199, 44, 0.3)',
            }}
          >
            <Shield size={36} color="#FFC72C" />
          </div>

          <span className="card-header-badge" style={{ marginBottom: '0.75rem' }}>
            University of Saskatchewan
          </span>

          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Rocket League Round Robin
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Organize dynamic round robins. Everyone teams and plays against everyone, prioritizing 3v3s!
          </p>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '1.5rem',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              onClick={() => setMode('create')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: mode === 'create' ? 'var(--usask-green-primary)' : 'transparent',
                color: mode === 'create' ? '#FFFFFF' : 'var(--text-muted)',
              }}
            >
              Create New Lobby
            </button>
            <button
              onClick={() => setMode('join')}
              style={{
                flex: 1,
                padding: '0.6rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                background: mode === 'join' ? 'var(--usask-green-primary)' : 'transparent',
                color: mode === 'join' ? '#FFFFFF' : 'var(--text-muted)',
              }}
            >
              Join with Code
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!playerName.trim()) return;
              if (mode === 'create') {
                onCreateLobby(playerName.trim());
              } else {
                onJoinLobby(joinCode.trim(), playerName.trim());
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Your Player Name:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. HuskieStriker, PrairieAce..."
                required
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'var(--bg-card-light)',
                  border: '1px solid var(--border-light)',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Lobby Code (with SASK prefix):
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SASK-HUSKY-42"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card-light)',
                    border: '1px solid var(--border-light)',
                    color: '#FFC72C',
                    fontFamily: 'Chakra Petch, monospace',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-gold"
              style={{ width: '100%', padding: '0.8rem', fontSize: '1.05rem', marginTop: '0.5rem' }}
            >
              {mode === 'create' ? 'Create USask Lobby' : 'Join Lobby'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Already in Lobby: Show Lobby Roster & Match Projection
  const isHost = currentUser.isHost;
  const activePlayers = lobby.players.filter((p) => p.status === 'active');
  const sittingOutPlayers = lobby.players.filter((p) => p.status === 'sitting_out');
  const matchSizes = determineMatchSizes(activePlayers.length);

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Left Column: Player Roster */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={22} color="#008765" />
              <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF' }}>
                Lobby Roster ({lobby.players.length})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => onToggleStatus(currentUser.status === 'active' ? 'sitting_out' : 'active')}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                title="Toggle Sit Out status"
              >
                <Coffee size={14} color={currentUser.status === 'sitting_out' ? '#FFC72C' : 'currentColor'} />
                <span>{currentUser.status === 'sitting_out' ? 'I am Ready' : 'Sit Out'}</span>
              </button>

              <button
                onClick={onLeaveLobby}
                className="btn-danger"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                title="Leave Lobby"
              >
                <LogOut size={14} />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Player List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '420px', overflowY: 'auto' }}>
            {lobby.players.map((player) => {
              const isMe = player.id === currentUser.id;
              const isSitting = player.status === 'sitting_out';

              return (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: isMe ? 'rgba(0, 106, 78, 0.25)' : 'var(--bg-card-light)',
                    border: `1px solid ${isMe ? 'var(--usask-green-light)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #004D38, #006A4E)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFC72C',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: '1px solid #FFC72C',
                      }}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
                          {player.name}
                        </strong>
                        {isMe && (
                          <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>
                            (You)
                          </span>
                        )}
                        {player.isHost && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: 'rgba(255, 199, 44, 0.2)',
                              color: '#FFC72C',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            👑 HOST
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 600,
                        background: isSitting ? 'rgba(234, 88, 12, 0.2)' : 'rgba(0, 135, 101, 0.2)',
                        color: isSitting ? '#FB923C' : '#4ADE80',
                        border: `1px solid ${isSitting ? 'rgba(234, 88, 12, 0.4)' : 'rgba(0, 135, 101, 0.4)'}`,
                      }}
                    >
                      {isSitting ? 'Sitting Out' : 'Active'}
                    </span>

                    {isHost && !isMe && (
                      <button
                        onClick={() => onRemovePlayer(player.id)}
                        title="Remove Player"
                        style={{
                          background: 'transparent',
                          color: '#EF4444',
                          padding: '2px 6px',
                          fontSize: '0.8rem',
                          borderRadius: '4px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Fill Buttons */}
          {isHost && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                <Sparkles size={14} color="#FFC72C" />
                <span>Solo Testing & Demonstration Tools:</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => onAddDemoPlayers(5)}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <UserPlus size={14} />
                  <span>+5 Demo Players (6 Total = 3v3)</span>
                </button>
                <button
                  onClick={() => onAddDemoPlayers(7)}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <UserPlus size={14} />
                  <span>+7 Demo Players (8 Total = 3v3 + 1v1)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Matchmaking Projection & Host Launch */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="card-header-badge" style={{ marginBottom: '0.75rem' }}>
              Matchmaking Forecast
            </span>
            <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
              Round 1 Formation
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              "Try to force the games to be threes but go to twos and ones if necessary."
            </p>

            {/* Projection Details */}
            <div
              style={{
                background: 'var(--bg-card-light)',
                borderRadius: '10px',
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Players:</span>
                <strong style={{ color: '#FFFFFF' }}>{activePlayers.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sitting Out (Byes / Break):</span>
                <strong style={{ color: sittingOutPlayers.length > 0 ? '#FB923C' : '#FFFFFF' }}>
                  {sittingOutPlayers.length + (activePlayers.length % 2 === 1 ? 1 : 0)}
                </strong>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Projected Matches:
                </span>

                {activePlayers.length < 2 ? (
                  <p style={{ color: '#F87171', fontSize: '0.9rem' }}>
                    ⚠️ Need at least 2 active players to start.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {matchSizes.map((size, idx) => {
                      const format = size === 6 ? '3v3' : size === 4 ? '2v2' : '1v1';
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(0, 106, 78, 0.2)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '6px',
                            fontSize: '0.88rem',
                          }}
                        >
                          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>Match {idx + 1}</span>
                          <span style={{ color: '#FFC72C', fontWeight: 700, fontFamily: 'Chakra Petch, monospace' }}>
                            {format} ({size} players)
                          </span>
                        </div>
                      );
                    })}

                    {activePlayers.length % 2 === 1 && (
                      <div
                        style={{
                          padding: '0.45rem 0.75rem',
                          background: 'rgba(234, 88, 12, 0.15)',
                          border: '1px solid rgba(234, 88, 12, 0.3)',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          color: '#FB923C',
                        }}
                      >
                        1 player will receive a rotating bye this round.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Host Launch Controls */}
          <div>
            {isHost ? (
              <button
                onClick={onStartTournament}
                disabled={activePlayers.length < 2}
                className="btn-gold"
                style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem' }}
              >
                <Play size={20} />
                <span>Start USask Round Robin!</span>
              </button>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontSize: '0.92rem',
                }}
              >
                Waiting for the Lobby Host to launch the tournament...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
