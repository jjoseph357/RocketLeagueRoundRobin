import React, { useState } from 'react';
import { Round, Match, Player, PlayerStats } from '../types/tournament';
import { CheckCircle, AlertTriangle, Clock, Flame, Coffee } from 'lucide-react';

interface AllMatchesViewProps {
  currentRound: Round | null;
  playersMap: Map<string, Player>;
  statsMap: Map<string, PlayerStats>;
  currentUser: Player;
  onHostOverride: (matchId: string, blueScore: number, orangeScore: number) => void;
}

export const AllMatchesView: React.FC<AllMatchesViewProps> = ({
  currentRound,
  playersMap,
  statsMap,
  currentUser,
  onHostOverride,
}) => {
  const [activeOverrideMatchId, setActiveOverrideMatchId] = useState<string | null>(null);
  const [overrideBlue, setOverrideBlue] = useState(0);
  const [overrideOrange, setOverrideOrange] = useState(0);

  if (!currentRound || currentRound.matches.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No matches active in the current round.</p>
      </div>
    );
  }

  const handleOverride = (match: Match) => {
    if (overrideBlue === overrideOrange) {
      alert('Rocket League matches cannot end in ties.');
      return;
    }
    onHostOverride(match.id, overrideBlue, overrideOrange);
    setActiveOverrideMatchId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Matches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {currentRound.matches.map((match) => {
          const isUserInMatch =
            match.blueTeam.includes(currentUser.id) ||
            match.orangeTeam.includes(currentUser.id);
          const blueCreator = playersMap.get(match.blueCreatorId);

          return (
            <div
              key={match.id}
              className="card animate-float-in"
              style={{
                border: isUserInMatch ? '1px solid var(--usask-gold)' : '1px solid var(--border-color)',
                background: isUserInMatch ? 'rgba(19, 34, 30, 0.95)' : 'var(--bg-card)',
              }}
            >
              {/* Match Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontWeight: 800,
                      color: '#FFC72C',
                      fontFamily: 'Chakra Petch, monospace',
                      fontSize: '0.95rem',
                    }}
                  >
                    MATCH {match.matchIndex + 1}
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    {match.format}
                  </span>
                  {isUserInMatch && (
                    <span
                      style={{
                        background: 'rgba(255, 199, 44, 0.2)',
                        color: '#FFC72C',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      YOUR MATCH
                    </span>
                  )}
                </div>

                {/* Status Pill */}
                <div>
                  {match.status === 'completed' && (
                    <span
                      style={{
                        color: '#4ADE80',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <CheckCircle size={14} /> Completed
                    </span>
                  )}
                  {match.status === 'disputed' && (
                    <span
                      style={{
                        color: '#F87171',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <AlertTriangle size={14} /> Disputed
                    </span>
                  )}
                  {match.status !== 'completed' && match.status !== 'disputed' && (
                    <span
                      style={{
                        color: '#FFC72C',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Clock size={14} /> In Progress
                    </span>
                  )}
                </div>
              </div>

              {/* Private Match Credentials */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Lobby: </span>
                  <strong style={{ color: '#FFC72C', fontFamily: 'Chakra Petch, monospace' }}>
                    {match.rlLobbyName}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Pass: </span>
                  <strong style={{ color: '#FFFFFF', fontFamily: 'Chakra Petch, monospace' }}>
                    {match.rlPassword}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Host: </span>
                  <strong style={{ color: '#38BDF8' }}>
                    {blueCreator?.name || 'Blue'}
                  </strong>
                </div>
              </div>

              {/* Score Display (If Completed or Reported) */}
              {match.status === 'completed' && (
                <div
                  style={{
                    background: 'rgba(0, 106, 78, 0.25)',
                    border: '1px solid var(--usask-green-light)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    textAlign: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: '#4ADE80', fontWeight: 700 }}>
                    WINNER: {match.winner?.toUpperCase()} TEAM ({match.blueScore} - {match.orangeScore})
                  </span>
                </div>
              )}

              {/* Teams Side-by-Side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                {/* Blue Team */}
                <div
                  style={{
                    background: 'rgba(2, 132, 199, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#38BDF8', fontSize: '0.8rem', fontWeight: 800 }}>BLUE</span>
                    {match.status === 'completed' && (
                      <strong style={{ color: '#38BDF8', fontSize: '1.1rem', fontFamily: 'Chakra Petch, monospace' }}>
                        {match.blueScore}
                      </strong>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {match.blueTeam.map((id) => {
                      const p = playersMap.get(id);
                      const stats = statsMap.get(id);
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: '#FFFFFF', fontWeight: id === currentUser.id ? 800 : 500 }}>
                            {p?.name || 'Player'}
                          </span>
                          {stats && stats.currentStreak > 0 && (
                            <span className={`streak-badge ${stats.currentStreak >= 3 ? 'streak-super' : ''}`} style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                              <Flame size={10} className="fire-animated" /> {stats.currentStreak}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Reporting status */}
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: match.blueReport ? '#4ADE80' : 'var(--text-muted)' }}>
                    {match.blueReport ? `Reported: ${match.blueReport.blueScore}-${match.blueReport.orangeScore}` : 'Report pending'}
                  </div>
                </div>

                {/* Orange Team */}
                <div
                  style={{
                    background: 'rgba(234, 88, 12, 0.12)',
                    border: '1px solid rgba(251, 146, 60, 0.3)',
                    borderRadius: '8px',
                    padding: '0.65rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ color: '#FB923C', fontSize: '0.8rem', fontWeight: 800 }}>ORANGE</span>
                    {match.status === 'completed' && (
                      <strong style={{ color: '#FB923C', fontSize: '1.1rem', fontFamily: 'Chakra Petch, monospace' }}>
                        {match.orangeScore}
                      </strong>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {match.orangeTeam.map((id) => {
                      const p = playersMap.get(id);
                      const stats = statsMap.get(id);
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ color: '#FFFFFF', fontWeight: id === currentUser.id ? 800 : 500 }}>
                            {p?.name || 'Player'}
                          </span>
                          {stats && stats.currentStreak > 0 && (
                            <span className={`streak-badge ${stats.currentStreak >= 3 ? 'streak-super' : ''}`} style={{ fontSize: '0.7rem', padding: '1px 5px' }}>
                              <Flame size={10} className="fire-animated" /> {stats.currentStreak}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Reporting status */}
                  <div style={{ marginTop: '0.4rem', fontSize: '0.72rem', color: match.orangeReport ? '#4ADE80' : 'var(--text-muted)' }}>
                    {match.orangeReport ? `Reported: ${match.orangeReport.blueScore}-${match.orangeReport.orangeScore}` : 'Report pending'}
                  </div>
                </div>
              </div>

              {/* Host Override Controls */}
              {currentUser.isHost && (
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                  {activeOverrideMatchId !== match.id ? (
                    <button
                      onClick={() => {
                        setActiveOverrideMatchId(match.id);
                        setOverrideBlue(match.blueScore || 0);
                        setOverrideOrange(match.orangeScore || 0);
                      }}
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', width: '100%' }}
                    >
                      👑 Host Override Score
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.75rem', color: '#38BDF8' }}>B:</label>
                      <input
                        type="number"
                        min={0}
                        value={overrideBlue}
                        onChange={(e) => setOverrideBlue(parseInt(e.target.value) || 0)}
                        style={{ width: '40px', padding: '2px', background: 'var(--bg-main)', color: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.8rem' }}
                      />
                      <label style={{ fontSize: '0.75rem', color: '#FB923C' }}>O:</label>
                      <input
                        type="number"
                        min={0}
                        value={overrideOrange}
                        onChange={(e) => setOverrideOrange(parseInt(e.target.value) || 0)}
                        style={{ width: '40px', padding: '2px', background: 'var(--bg-main)', color: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.8rem' }}
                      />
                      <button
                        onClick={() => handleOverride(match)}
                        className="btn-gold"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setActiveOverrideMatchId(null)}
                        className="btn-secondary"
                        style={{ padding: '0.25rem 0.4rem', fontSize: '0.75rem' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Byes Card if any */}
      {currentRound.byes.length > 0 && (
        <div className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Coffee size={18} color="#FFC72C" />
            <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>Rotating Rest / Byes This Round</h4>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {currentRound.byes.map((id) => {
              const p = playersMap.get(id);
              return (
                <span
                  key={id}
                  style={{
                    background: 'rgba(255, 199, 44, 0.1)',
                    border: '1px solid rgba(255, 199, 44, 0.3)',
                    color: '#FFC72C',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  {p?.name || 'Player'}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
