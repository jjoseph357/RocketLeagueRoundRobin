import React from 'react';
import { PlayerStats, Player } from '../types/tournament';
import { Trophy, Flame, HelpCircle } from 'lucide-react';

interface LeaderboardViewProps {
  stats: PlayerStats[];
  currentUser: Player;
  onOpenRules: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  stats,
  currentUser,
  onOpenRules,
}) => {
  return (
    <div className="card animate-float-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Trophy size={24} color="#FFC72C" />
          <h3 style={{ fontSize: '1.3rem', color: '#FFFFFF', fontWeight: 800 }}>
            USask Tournament Standings
          </h3>
        </div>

        <button
          onClick={onOpenRules}
          className="btn-secondary"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
        >
          <HelpCircle size={14} />
          <span>Scoring Rules Explained</span>
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Rank</th>
              <th>Player</th>
              <th style={{ textAlign: 'center' }}>Points</th>
              <th style={{ textAlign: 'center' }}>Streak</th>
              <th style={{ textAlign: 'center' }}>Best</th>
              <th style={{ textAlign: 'center' }}>W - L</th>
              <th style={{ textAlign: 'center' }}>Win %</th>
              <th style={{ textAlign: 'center' }}>Goal Diff</th>
              <th style={{ textAlign: 'center' }}>Matches</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat, idx) => {
              const rank = idx + 1;
              const isMe = stat.playerId === currentUser.id;

              return (
                <tr key={stat.playerId} className={isMe ? 'highlight-user' : ''}>
                  {/* Rank */}
                  <td style={{ fontWeight: 800 }}>
                    {rank === 1 ? (
                      <span style={{ color: '#FFC72C', fontSize: '1.1rem' }}>🥇 1</span>
                    ) : rank === 2 ? (
                      <span style={{ color: '#E2E8F0', fontSize: '1.05rem' }}>🥈 2</span>
                    ) : rank === 3 ? (
                      <span style={{ color: '#D97706', fontSize: '1rem' }}>🥉 3</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>#{rank}</span>
                    )}
                  </td>

                  {/* Player Name */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: isMe ? 800 : 600, color: '#FFFFFF', fontSize: '0.95rem' }}>
                        {stat.playerName}
                      </span>
                      {isMe && (
                        <span style={{ fontSize: '0.72rem', color: '#4ADE80', fontWeight: 700 }}>
                          (You)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Points */}
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        color: '#FFC72C',
                        fontFamily: 'Chakra Petch, monospace',
                      }}
                    >
                      {stat.points}
                    </span>
                  </td>

                  {/* Current Streak */}
                  <td style={{ textAlign: 'center' }}>
                    {stat.currentStreak > 0 ? (
                      <span className={`streak-badge ${stat.currentStreak >= 3 ? 'streak-super' : ''}`}>
                        <Flame size={13} className="fire-animated" />
                        {stat.currentStreak}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>

                  {/* Best Streak */}
                  <td style={{ textAlign: 'center' }}>
                    {stat.bestStreak > 0 ? (
                      <span style={{ color: '#FCD34D', fontSize: '0.88rem', fontWeight: 600 }}>
                        🔥 {stat.bestStreak}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>-</span>
                    )}
                  </td>

                  {/* W - L */}
                  <td style={{ textAlign: 'center', fontFamily: 'Chakra Petch, monospace', fontSize: '0.92rem' }}>
                    <span style={{ color: '#4ADE80', fontWeight: 700 }}>{stat.wins}</span>
                    <span style={{ color: 'var(--text-muted)' }}> - </span>
                    <span style={{ color: '#F87171', fontWeight: 700 }}>{stat.losses}</span>
                  </td>

                  {/* Win % */}
                  <td style={{ textAlign: 'center', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    {stat.matchesPlayed > 0 ? `${stat.winRate}%` : '-'}
                  </td>

                  {/* Goal Diff */}
                  <td style={{ textAlign: 'center', fontFamily: 'Chakra Petch, monospace', fontSize: '0.9rem' }}>
                    <span
                      style={{
                        color: stat.goalDiff > 0 ? '#4ADE80' : stat.goalDiff < 0 ? '#F87171' : 'var(--text-muted)',
                        fontWeight: 700,
                      }}
                    >
                      {stat.goalDiff > 0 ? `+${stat.goalDiff}` : stat.goalDiff}
                    </span>
                  </td>

                  {/* Matches Played */}
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    {stat.matchesPlayed}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rules Footer */}
      <div
        style={{
          marginTop: '1.5rem',
          padding: '0.85rem 1rem',
          background: 'var(--bg-card-light)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <strong style={{ color: '#FFFFFF' }}>Scoring:</strong> Win = 3 pts. Loss = 0 pts.
          Win Streak Bonus starts from 3 wins in a row (+1 pt for 3rd win, +2 pts for 4th win, +3 pts for 5th win, etc.).
        </div>
        <div style={{ color: '#FFC72C', fontWeight: 600 }}>
          🔥 Streaks activate browser favicon flame &amp; counter
        </div>
      </div>
    </div>
  );
};
