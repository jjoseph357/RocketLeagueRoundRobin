import React from 'react';
import { X, Trophy, Flame, Swords, Shield, Users } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-float-in" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={24} color="#FFC72C" />
            <h2 style={{ fontSize: '1.3rem', color: '#FFFFFF', fontWeight: 700 }}>
              USask Round Robin Rules
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: 'var(--text-muted)', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.92rem', color: '#D1D5DB' }}>
          {/* Matchmaking */}
          <div style={{ background: 'var(--bg-card-light)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#008765', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Users size={18} />
              <span>Social Round Robin & Formats</span>
            </div>
            <p style={{ lineHeight: 1.45 }}>
              The matchmaking algorithm tracks partner and opponent histories to ensure <strong>everyone teams with and plays against everyone</strong>.
              Games prioritize <strong>3v3</strong>, naturally stepping down to <strong>2v2</strong> and <strong>1v1</strong> when player numbers require it.
              If an odd number of players is active, 1 player sits out (bye), rotating fairly each round.
            </p>
          </div>

          {/* Lobby Setup */}
          <div style={{ background: 'var(--bg-card-light)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Swords size={18} />
              <span>Blue Team Creates Lobby</span>
            </div>
            <p style={{ lineHeight: 1.45 }}>
              <strong>Blue team will always create the lobby</strong> in Rocket League using the auto-generated <code style={{ color: '#FFC72C' }}>SASK-</code> match name and password provided by the app.
              One player on Blue is designated as host with 1-click copy buttons.
            </p>
          </div>

          {/* Score Reporting */}
          <div style={{ background: 'var(--bg-card-light)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC72C', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Shield size={18} />
              <span>Dual-Team Score Verification</span>
            </div>
            <p style={{ lineHeight: 1.45 }}>
              <strong>One person from each team must report the scores</strong> after the game is done.
              When both reports agree, the match automatically verifies and standings update! If scores conflict, a discrepancy alert flags it for re-submission or Host override.
            </p>
          </div>

          {/* Scoring & Streaks */}
          <div style={{ background: 'var(--bg-card-light)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FF5722', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Flame size={18} className="fire-animated" />
              <span>Scoring & Win Streak Bonus</span>
            </div>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', lineHeight: 1.5 }}>
              <li><strong>Win:</strong> +3 points</li>
              <li><strong>Loss:</strong> 0 points (streak resets to 0)</li>
              <li>
                <strong>Win Streak:</strong> Starting from <strong>three wins in a row</strong>, you get <strong>+1 bonus per win streak level</strong>!
                <div style={{ fontSize: '0.82rem', color: '#FCD34D', marginTop: '4px' }}>
                  • 3 Wins in a row: 3 base + 1 streak = <strong>4 points</strong><br />
                  • 4 Wins in a row: 3 base + 2 streak = <strong>5 points</strong><br />
                  • 5 Wins in a row: 3 base + 3 streak = <strong>6 points</strong>
                </div>
              </li>
              <li>
                Active streaks trigger a dynamic <strong>fire favicon (🔥)</strong> with live counter in your browser tab!
              </li>
            </ul>
          </div>

          {/* Podium */}
          <div style={{ background: 'var(--bg-card-light)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC72C', fontWeight: 700, marginBottom: '0.25rem' }}>
              <Trophy size={18} />
              <span>Podium & Ending the Game</span>
            </div>
            <p style={{ lineHeight: 1.45 }}>
              The lobby owner can end the tournament at any time to reveal the <strong>podium celebration</strong>.
              Whoever accumulated the most points wins 1st place!
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button onClick={onClose} className="btn-gold" style={{ padding: '0.5rem 1.5rem' }}>
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
