import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Medal, Flame, RotateCcw, Play, Download, Award, Shield } from 'lucide-react';
import { PlayerStats, Player } from '../types/tournament';

interface PodiumViewProps {
  stats: PlayerStats[];
  currentUser: Player;
  onRestart: () => void;
  onResume: () => void;
  onExport: () => void;
}

export const PodiumView: React.FC<PodiumViewProps> = ({
  stats,
  currentUser,
  onRestart,
  onResume,
  onExport,
}) => {
  // Fire celebratory confetti on mount
  useEffect(() => {
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#006A4E', '#FFC72C', '#FFFFFF', '#008765'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#006A4E', '#FFC72C', '#FFFFFF', '#008765'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const first = stats[0] || null;
  const second = stats[1] || null;
  const third = stats[2] || null;

  // Accolades
  const longestStreakPlayer = [...stats].sort((a, b) => b.bestStreak - a.bestStreak)[0];
  const topScorerPlayer = [...stats].sort((a, b) => b.goalsFor - a.goalsFor)[0];

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      {/* Title Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }} className="animate-float-in">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '0.5rem' }}>
          <Shield size={20} color="#FFC72C" />
          <span className="card-header-badge">University of Saskatchewan</span>
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '1px' }}>
          TOURNAMENT <span style={{ color: '#FFC72C' }}>CHAMPIONSHIP</span> PODIUM
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Congratulations to all competitors! Final standings and tournament awards are officially recorded.
        </p>
      </div>

      {/* 3D Olympic/Collegiate Podium */}
      {first && (
        <div className="podium-container animate-float-in">
          {/* 2nd Place (Silver) */}
          {second && (
            <div className="podium-step podium-2nd">
              <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                <Medal size={36} color="#E2E8F0" />
                <h4 style={{ fontSize: '1.15rem', color: '#FFFFFF', fontWeight: 800, marginTop: '4px' }}>
                  {second.playerName}
                </h4>
                <div style={{ color: '#E2E8F0', fontSize: '0.9rem', fontWeight: 700 }}>
                  {second.points} Points
                </div>
                {second.bestStreak > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#FCD34D' }}>
                    🔥 Best {second.bestStreak}
                  </div>
                )}
              </div>
              <div className="podium-block">
                <span style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'Chakra Petch, monospace' }}>2</span>
                <span style={{ fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>SILVER</span>
              </div>
            </div>
          )}

          {/* 1st Place (Gold) */}
          <div className="podium-step podium-1st">
            <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  padding: '8px',
                  borderRadius: '50%',
                  background: 'rgba(255, 199, 44, 0.25)',
                  boxShadow: '0 0 25px rgba(255, 199, 44, 0.7)',
                }}
              >
                <Trophy size={48} color="#FFC72C" />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#FFC72C', fontWeight: 900, marginTop: '6px' }}>
                {first.playerName}
              </h3>
              <div style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Chakra Petch, monospace' }}>
                {first.points} Points
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem', color: '#FCD34D', marginTop: '2px' }}>
                <Flame size={14} className="fire-animated" /> {first.wins}W - {first.losses}L
              </div>
            </div>
            <div className="podium-block">
              <span style={{ fontSize: '3.5rem', fontWeight: 900, fontFamily: 'Chakra Petch, monospace' }}>1</span>
              <span style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>CHAMPION</span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          {third && (
            <div className="podium-step podium-3rd">
              <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                <Medal size={32} color="#D97706" />
                <h4 style={{ fontSize: '1.1rem', color: '#FFFFFF', fontWeight: 800, marginTop: '4px' }}>
                  {third.playerName}
                </h4>
                <div style={{ color: '#FCD34D', fontSize: '0.9rem', fontWeight: 700 }}>
                  {third.points} Points
                </div>
                {third.bestStreak > 0 && (
                  <div style={{ fontSize: '0.78rem', color: '#FCD34D' }}>
                    🔥 Best {third.bestStreak}
                  </div>
                )}
              </div>
              <div className="podium-block">
                <span style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Chakra Petch, monospace' }}>3</span>
                <span style={{ fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>BRONZE</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tournament Accolades Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <Trophy size={28} color="#FFC72C" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tournament Champion
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {first ? first.playerName : '-'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#FFC72C', fontWeight: 700 }}>
            {first ? `${first.points} Points` : ''}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <Flame size={28} color="#FF5722" className="fire-animated" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Firestorm MVP
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {longestStreakPlayer ? longestStreakPlayer.playerName : '-'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#FF5722', fontWeight: 700 }}>
            {longestStreakPlayer ? `🔥 ${longestStreakPlayer.bestStreak} Win Streak` : ''}
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
          <Award size={28} color="#38BDF8" style={{ margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Golden Boot Striker
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>
            {topScorerPlayer ? topScorerPlayer.playerName : '-'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#38BDF8', fontWeight: 700 }}>
            {topScorerPlayer ? `${topScorerPlayer.goalsFor} Goals Scored` : ''}
          </div>
        </div>
      </div>

      {/* Complete Final Standings Table */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 800, marginBottom: '1rem' }}>
          Official Final Standings
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="standings-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Rank</th>
                <th>Player</th>
                <th style={{ textAlign: 'center' }}>Points</th>
                <th style={{ textAlign: 'center' }}>Best Streak</th>
                <th style={{ textAlign: 'center' }}>Record (W-L)</th>
                <th style={{ textAlign: 'center' }}>Win %</th>
                <th style={{ textAlign: 'center' }}>Goals For</th>
                <th style={{ textAlign: 'center' }}>Goal Diff</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, idx) => (
                <tr key={s.playerId}>
                  <td style={{ fontWeight: 800 }}>#{idx + 1}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{s.playerName}</span>
                    {s.playerId === currentUser.id && (
                      <span style={{ fontSize: '0.72rem', color: '#4ADE80', marginLeft: '6px' }}>(You)</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', color: '#FFC72C', fontWeight: 800, fontFamily: 'Chakra Petch, monospace', fontSize: '1.1rem' }}>
                    {s.points}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {s.bestStreak > 0 ? `🔥 ${s.bestStreak}` : '-'}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'Chakra Petch, monospace' }}>
                    <span style={{ color: '#4ADE80' }}>{s.wins}</span> - <span style={{ color: '#F87171' }}>{s.losses}</span>
                  </td>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    {s.winRate}%
                  </td>
                  <td style={{ textAlign: 'center', color: '#38BDF8' }}>
                    {s.goalsFor}
                  </td>
                  <td style={{ textAlign: 'center', color: s.goalDiff > 0 ? '#4ADE80' : s.goalDiff < 0 ? '#F87171' : 'inherit' }}>
                    {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Host Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={onExport} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
          <Download size={18} />
          <span>Export Results (JSON)</span>
        </button>

        {currentUser.isHost && (
          <>
            <button onClick={onResume} className="btn-secondary" style={{ padding: '0.75rem 1.25rem' }}>
              <Play size={18} />
              <span>Resume Tournament</span>
            </button>
            <button onClick={onRestart} className="btn-gold" style={{ padding: '0.75rem 1.5rem' }}>
              <RotateCcw size={18} />
              <span>Start New Tournament</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
