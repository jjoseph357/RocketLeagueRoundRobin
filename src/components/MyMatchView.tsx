import React, { useState } from 'react';
import { Copy, Check, Shield, AlertTriangle, CheckCircle, Flame, Send, Award, Coffee } from 'lucide-react';
import { Match, Player, ScoreReport, PlayerStats } from '../types/tournament';

interface MyMatchViewProps {
  match: Match | null;
  hasBye: boolean;
  currentUser: Player;
  playersMap: Map<string, Player>;
  statsMap: Map<string, PlayerStats>;
  onSubmitScore: (matchId: string, report: ScoreReport) => void;
  onHostOverride: (matchId: string, blueScore: number, orangeScore: number) => void;
}

export const MyMatchView: React.FC<MyMatchViewProps> = ({
  match,
  hasBye,
  currentUser,
  playersMap,
  statsMap,
  onSubmitScore,
  onHostOverride,
}) => {
  const [copiedLobby, setCopiedLobby] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Score reporting inputs
  const [inputBlueScore, setInputBlueScore] = useState<number>(0);
  const [inputOrangeScore, setInputOrangeScore] = useState<number>(0);

  // Host override inputs
  const [showOverride, setShowOverride] = useState(false);
  const [overrideBlue, setOverrideBlue] = useState<number>(0);
  const [overrideOrange, setOverrideOrange] = useState<number>(0);

  if (hasBye || !match) {
    return (
      <div className="card animate-float-in" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.25rem',
            background: 'rgba(255, 199, 44, 0.15)',
            border: '2px solid #FFC72C',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Coffee size={32} color="#FFC72C" />
        </div>
        <h3 style={{ fontSize: '1.5rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
          You Have a Bye This Round!
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.95rem' }}>
          Take a quick breather, hydrate, and watch the other games. Byes rotate fairly so everyone plays equal amounts. You will be scheduled to play in the next round!
        </p>
        <span className="card-header-badge">Rotating Rest Period</span>
      </div>
    );
  }

  const isUserOnBlue = match.blueTeam.includes(currentUser.id);
  const isUserOnOrange = match.orangeTeam.includes(currentUser.id);
  const userTeam = isUserOnBlue ? 'blue' : isUserOnOrange ? 'orange' : null;
  const isBlueCreator = match.blueCreatorId === currentUser.id;
  const blueCreatorName = playersMap.get(match.blueCreatorId)?.name || 'Blue Captain';

  const copyLobbyName = () => {
    navigator.clipboard.writeText(match.rlLobbyName);
    setCopiedLobby(true);
    setTimeout(() => setCopiedLobby(false), 2000);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(match.rlPassword);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userTeam) return;

    if (inputBlueScore === inputOrangeScore) {
      alert('Rocket League has overtime and does not end in ties. Please enter the final winner score.');
      return;
    }

    const report: ScoreReport = {
      reportedBy: currentUser.id,
      reportedByName: currentUser.name,
      team: userTeam,
      blueScore: inputBlueScore,
      orangeScore: inputOrangeScore,
      submittedAt: Date.now(),
    };

    onSubmitScore(match.id, report);
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (overrideBlue === overrideOrange) {
      alert('Rocket League matches cannot end in ties.');
      return;
    }
    onHostOverride(match.id, overrideBlue, overrideOrange);
    setShowOverride(false);
  };

  return (
    <div className="card animate-float-in" style={{ padding: '1.75rem' }}>
      {/* Header Badge & Match Format */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span
            style={{
              background: 'linear-gradient(135deg, #006A4E, #004D38)',
              border: '1px solid #FFC72C',
              color: '#FFC72C',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.9rem',
              fontFamily: 'Chakra Petch, monospace',
            }}
          >
            ROUND {match.roundNumber} • MATCH {match.matchIndex + 1}
          </span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#FFFFFF',
            }}
          >
            Format: {match.format}
          </span>
        </div>

        {/* Status indicator */}
        <div>
          {match.status === 'completed' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(74, 222, 128, 0.15)',
                color: '#4ADE80',
                border: '1px solid rgba(74, 222, 128, 0.4)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              <CheckCircle size={15} /> MATCH VERIFIED
            </span>
          )}
          {match.status === 'disputed' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              <AlertTriangle size={15} /> SCORE DISCREPANCY
            </span>
          )}
          {(match.status === 'pending' || match.status === 'blue_reported' || match.status === 'orange_reported') && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(255, 199, 44, 0.15)',
                color: '#FFC72C',
                border: '1px solid rgba(255, 199, 44, 0.4)',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.82rem',
              }}
            >
              {match.status === 'pending'
                ? 'IN PROGRESS'
                : match.status === 'blue_reported'
                ? 'WAITING FOR ORANGE REPORT'
                : 'WAITING FOR BLUE REPORT'}
            </span>
          )}
        </div>
      </div>

      {/* Rocket League In-Game Lobby Details */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 106, 78, 0.25), rgba(11, 19, 17, 0.7))',
          border: '1px solid var(--border-light)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Rocket League Private Match Name:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
              <code style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFC72C', fontFamily: 'Chakra Petch, monospace' }}>
                {match.rlLobbyName}
              </code>
              <button
                onClick={copyLobbyName}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                title="Copy Match Name"
              >
                {copiedLobby ? <Check size={14} color="#4ADE80" /> : <Copy size={14} />}
                <span>{copiedLobby ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
              Password:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
              <code style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', fontFamily: 'Chakra Petch, monospace' }}>
                {match.rlPassword}
              </code>
              <button
                onClick={copyPassword}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                title="Copy Password"
              >
                {copiedPass ? <Check size={14} color="#4ADE80" /> : <Copy size={14} />}
                <span>{copiedPass ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Blue Team Host Banner: Prompt Requirement */}
        <div
          style={{
            background: isBlueCreator
              ? 'rgba(2, 132, 199, 0.25)'
              : 'rgba(0, 0, 0, 0.35)',
            border: `1px solid ${isBlueCreator ? 'var(--rl-blue-light)' : 'var(--border-color)'}`,
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <Shield size={20} color="#38BDF8" style={{ flexShrink: 0 }} />
          <div>
            {isBlueCreator ? (
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>
                ⭐ You are the Blue Team Host! In Rocket League, select: Play &gt; Custom Games &gt; Private Match &gt; Create Match with the Name & Password above.
              </span>
            ) : (
              <span style={{ color: 'var(--text-main)' }}>
                <strong>Blue team always creates the lobby:</strong>{' '}
                <strong style={{ color: '#38BDF8' }}>{blueCreatorName}</strong> is creating the match. In Rocket League, join via Private Match with Name & Password above!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {/* Blue Team Card */}
        <div className="team-blue-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ color: '#38BDF8', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>BLUE TEAM</span>
              {isUserOnBlue && <span style={{ fontSize: '0.75rem', color: '#4ADE80' }}>(Your Team)</span>}
            </h4>
            {match.status === 'completed' && (
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38BDF8', fontFamily: 'Chakra Petch, monospace' }}>
                {match.blueScore}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.blueTeam.map((id) => {
              const p = playersMap.get(id);
              const stats = statsMap.get(id);
              const isMe = id === currentUser.id;
              const isCaptain = id === match.blueCreatorId;

              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: isMe ? 'rgba(56, 189, 248, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '6px',
                    border: isMe ? '1px solid #38BDF8' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: isMe ? 800 : 600, color: '#FFFFFF', fontSize: '0.9rem' }}>
                      {p?.name || 'Player'}
                    </span>
                    {isMe && <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 700 }}>YOU</span>}
                    {isCaptain && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          background: 'rgba(56, 189, 248, 0.3)',
                          color: '#38BDF8',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700,
                        }}
                      >
                        HOST
                      </span>
                    )}
                  </div>

                  {stats && stats.currentStreak > 0 && (
                    <span className={`streak-badge ${stats.currentStreak >= 3 ? 'streak-super' : ''}`}>
                      <Flame size={12} className="fire-animated" />
                      {stats.currentStreak}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blue Report Status */}
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '0.8rem' }}>
            {match.blueReport ? (
              <span style={{ color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Reported by {match.blueReport.reportedByName}: Blue {match.blueReport.blueScore} - Orange {match.blueReport.orangeScore}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                Waiting for Blue team score report...
              </span>
            )}
          </div>
        </div>

        {/* Orange Team Card */}
        <div className="team-orange-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h4 style={{ color: '#FB923C', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>ORANGE TEAM</span>
              {isUserOnOrange && <span style={{ fontSize: '0.75rem', color: '#4ADE80' }}>(Your Team)</span>}
            </h4>
            {match.status === 'completed' && (
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FB923C', fontFamily: 'Chakra Petch, monospace' }}>
                {match.orangeScore}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.orangeTeam.map((id) => {
              const p = playersMap.get(id);
              const stats = statsMap.get(id);
              const isMe = id === currentUser.id;

              return (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: isMe ? 'rgba(251, 146, 60, 0.2)' : 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '6px',
                    border: isMe ? '1px solid #FB923C' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: isMe ? 800 : 600, color: '#FFFFFF', fontSize: '0.9rem' }}>
                      {p?.name || 'Player'}
                    </span>
                    {isMe && <span style={{ fontSize: '0.7rem', color: '#FB923C', fontWeight: 700 }}>YOU</span>}
                  </div>

                  {stats && stats.currentStreak > 0 && (
                    <span className={`streak-badge ${stats.currentStreak >= 3 ? 'streak-super' : ''}`}>
                      <Flame size={12} className="fire-animated" />
                      {stats.currentStreak}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Orange Report Status */}
          <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid rgba(251, 146, 60, 0.2)', fontSize: '0.8rem' }}>
            {match.orangeReport ? (
              <span style={{ color: '#4ADE80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Reported by {match.orangeReport.reportedByName}: Blue {match.orangeReport.blueScore} - Orange {match.orangeReport.orangeScore}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                Waiting for Orange team score report...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancy Alert */}
      {match.status === 'disputed' && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid #EF4444',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={24} color="#F87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: '#F87171', fontWeight: 800, fontSize: '1rem', marginBottom: '0.25rem' }}>
              Score Discrepancy Detected!
            </h4>
            <p style={{ color: '#FCA5A5', fontSize: '0.88rem', lineHeight: 1.4 }}>
              {match.disputeReason || 'Blue and Orange reported conflicting final scores.'} Both teams must report matching scores, or the Lobby Host can resolve with host override.
            </p>
          </div>
        </div>
      )}

      {/* Completed Banner */}
      {match.status === 'completed' && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 106, 78, 0.35), rgba(0, 77, 56, 0.2))',
            border: '2px solid #008765',
            borderRadius: '10px',
            padding: '1.25rem',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Award size={24} color="#FFC72C" />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 800 }}>
              Match Completed: {match.winner?.toUpperCase()} TEAM WINS!
            </h3>
          </div>
          <p style={{ color: '#FFC72C', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Chakra Petch, monospace' }}>
            Final Score: Blue {match.blueScore} - {match.orangeScore} Orange
          </p>
        </div>
      )}

      {/* Score Reporting Form */}
      {match.status !== 'completed' && userTeam && (
        <div
          style={{
            background: 'var(--bg-card-light)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Send size={18} color="#FFC72C" />
            <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700 }}>
              Report Score for {userTeam.toUpperCase()} Team
            </h4>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            "One person from each team must report the scores after the game is done."
          </p>

          <form onSubmit={handleScoreSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: '1rem 0 1.5rem' }}>
              {/* Blue Score */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#38BDF8', marginBottom: '0.4rem' }}>
                  BLUE GOALS
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setInputBlueScore((s) => Math.max(0, s - 1))}
                    className="btn-secondary"
                    style={{ width: '36px', height: '36px', padding: 0 }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={inputBlueScore}
                    onChange={(e) => setInputBlueScore(parseInt(e.target.value) || 0)}
                    style={{
                      width: '60px',
                      height: '48px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: 'rgba(2, 132, 199, 0.2)',
                      border: '2px solid #38BDF8',
                      color: '#FFFFFF',
                      fontFamily: 'Chakra Petch, monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setInputBlueScore((s) => s + 1)}
                    className="btn-secondary"
                    style={{ width: '36px', height: '36px', padding: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '1.25rem' }}>
                VS
              </div>

              {/* Orange Score */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#FB923C', marginBottom: '0.4rem' }}>
                  ORANGE GOALS
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => setInputOrangeScore((s) => Math.max(0, s - 1))}
                    className="btn-secondary"
                    style={{ width: '36px', height: '36px', padding: 0 }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={inputOrangeScore}
                    onChange={(e) => setInputOrangeScore(parseInt(e.target.value) || 0)}
                    style={{
                      width: '60px',
                      height: '48px',
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 800,
                      borderRadius: '8px',
                      background: 'rgba(234, 88, 12, 0.2)',
                      border: '2px solid #FB923C',
                      color: '#FFFFFF',
                      fontFamily: 'Chakra Petch, monospace',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setInputOrangeScore((s) => s + 1)}
                    className="btn-secondary"
                    style={{ width: '36px', height: '36px', padding: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                className="btn-gold"
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                Submit Official Score Report ({userTeam.toUpperCase()})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Host Score Override Button (Host Only) */}
      {currentUser.isHost && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'right' }}>
          {!showOverride ? (
            <button
              onClick={() => setShowOverride(true)}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
            >
              👑 Host Override Score
            </button>
          ) : (
            <form
              onSubmit={handleOverrideSubmit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(0,0,0,0.4)',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--usask-gold)',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: '#FFC72C', fontWeight: 700 }}>Host Override:</span>
              <label style={{ fontSize: '0.8rem', color: '#38BDF8' }}>Blue:</label>
              <input
                type="number"
                min={0}
                value={overrideBlue}
                onChange={(e) => setOverrideBlue(parseInt(e.target.value) || 0)}
                style={{ width: '45px', padding: '3px', background: 'var(--bg-main)', color: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '4px' }}
              />
              <label style={{ fontSize: '0.8rem', color: '#FB923C' }}>Orange:</label>
              <input
                type="number"
                min={0}
                value={overrideOrange}
                onChange={(e) => setOverrideOrange(parseInt(e.target.value) || 0)}
                style={{ width: '45px', padding: '3px', background: 'var(--bg-main)', color: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '4px' }}
              />
              <button type="submit" className="btn-gold" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
                Force Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowOverride(false)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
