import React, { useState } from 'react';
import { Copy, Check, Share2, HelpCircle, Flame, Shield, Radio } from 'lucide-react';
import { Player } from '../types/tournament';

interface HeaderProps {
  lobbyCode: string | null;
  currentUser: Player | null;
  userStreak: number;
  networkStatus: { mqttConnected: boolean; localConnected: boolean };
  onOpenRules: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lobbyCode,
  currentUser,
  userStreak,
  networkStatus,
  onOpenRules,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyCode = () => {
    if (!lobbyCode) return;
    navigator.clipboard.writeText(lobbyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyShareLink = () => {
    if (!lobbyCode) return;
    const url = `${window.location.origin}${window.location.pathname}?lobby=${encodeURIComponent(lobbyCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="navbar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        {/* Brand / Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              background: 'linear-gradient(135deg, #006A4E, #004D38)',
              border: '2px solid #FFC72C',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(255, 199, 44, 0.3)',
            }}
          >
            <Shield size={24} color="#FFC72C" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#FFC72C', fontWeight: 800 }}>
                USask Huskie Athletics
              </span>
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1 }}>
              Rocket League <span style={{ color: '#008765' }}>Round Robin</span>
            </h1>
          </div>
        </div>

        {/* Lobby Code & Actions */}
        {lobbyCode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lobby:</span>
              <strong style={{ color: '#FFC72C', fontFamily: 'Chakra Petch, monospace', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                {lobbyCode}
              </strong>
              <button
                onClick={copyCode}
                title="Copy Lobby Code"
                style={{
                  background: 'transparent',
                  color: copiedCode ? '#4ADE80' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button
                onClick={copyShareLink}
                title="Copy Invite Link"
                style={{
                  background: 'transparent',
                  color: copiedLink ? '#4ADE80' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
              </button>
            </div>

            {/* Sync Indicator */}
            <div
              title={
                networkStatus.mqttConnected
                  ? 'Cloud Synced (MQTT Online) & Local Multi-Tab Active'
                  : networkStatus.localConnected
                  ? 'Local Multi-Tab Active (Reconnecting Cloud...)'
                  : 'Offline Mode'
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: networkStatus.mqttConnected ? '#4ADE80' : '#FBBF24',
                padding: '0.35rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Radio size={14} className={networkStatus.mqttConnected ? '' : 'fire-animated'} />
              <span>{networkStatus.mqttConnected ? 'Live' : 'Local'}</span>
            </div>
          </div>
        )}

        {/* User Pill & Rules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {currentUser && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--bg-card-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.35rem 0.75rem',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF' }}>{currentUser.name}</span>
              {currentUser.isHost && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(255, 199, 44, 0.2)',
                    color: '#FFC72C',
                    border: '1px solid rgba(255, 199, 44, 0.4)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                  }}
                >
                  HOST
                </span>
              )}
              {userStreak > 0 && (
                <span className={`streak-badge ${userStreak >= 3 ? 'streak-super' : ''}`}>
                  <Flame size={13} className="fire-animated" />
                  {userStreak}
                </span>
              )}
            </div>
          )}

          <button
            onClick={onOpenRules}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.85rem' }}
            title="Tournament Rules"
          >
            <HelpCircle size={16} />
            <span>Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};
