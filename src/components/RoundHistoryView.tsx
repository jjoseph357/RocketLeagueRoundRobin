import React from 'react';
import { Round, Player } from '../types/tournament';
import { History, CheckCircle, Coffee } from 'lucide-react';

interface RoundHistoryViewProps {
  rounds: Round[];
  playersMap: Map<string, Player>;
}

export const RoundHistoryView: React.FC<RoundHistoryViewProps> = ({
  rounds,
  playersMap,
}) => {
  const completedRounds = rounds.filter((r) => r.matches.some((m) => m.status === 'completed'));

  if (completedRounds.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <History size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>No completed rounds yet. Results will appear here as matches finish.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {[...completedRounds].reverse().map((round) => (
        <div key={round.roundNumber} className="card animate-float-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} color="#FFC72C" />
              <h3 style={{ fontSize: '1.2rem', color: '#FFFFFF', fontWeight: 800 }}>
                Round {round.roundNumber} Results
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#4ADE80',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
              }}
            >
              <CheckCircle size={14} /> Completed
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {round.matches.map((match) => (
              <div
                key={match.id}
                style={{
                  background: 'var(--bg-card-light)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.82rem' }}>
                  <span style={{ color: '#FFC72C', fontWeight: 700 }}>
                    Match {match.matchIndex + 1} ({match.format})
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {match.rlLobbyName}
                  </span>
                </div>

                {/* Score Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '6px',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 800, fontSize: '0.85rem' }}>BLUE</div>
                    <div style={{ fontSize: '0.78rem', color: '#D1D5DB' }}>
                      {match.blueTeam.map((id) => playersMap.get(id)?.name || 'Player').join(', ')}
                    </div>
                  </div>

                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'Chakra Petch, monospace' }}>
                    <span style={{ color: match.winner === 'blue' ? '#4ADE80' : 'inherit' }}>{match.blueScore ?? '-'}</span>
                    <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>:</span>
                    <span style={{ color: match.winner === 'orange' ? '#4ADE80' : 'inherit' }}>{match.orangeScore ?? '-'}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#FB923C', fontWeight: 800, fontSize: '0.85rem' }}>ORANGE</div>
                    <div style={{ fontSize: '0.78rem', color: '#D1D5DB' }}>
                      {match.orangeTeam.map((id) => playersMap.get(id)?.name || 'Player').join(', ')}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.78rem', textAlign: 'center', color: '#4ADE80', fontWeight: 700 }}>
                  Winner: {match.winner?.toUpperCase()} TEAM
                </div>
              </div>
            ))}
          </div>

          {/* Byes for this completed round */}
          {round.byes.length > 0 && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Coffee size={14} color="#FFC72C" />
              <span>Rest/Byes: {round.byes.map((id) => playersMap.get(id)?.name || 'Player').join(', ')}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
