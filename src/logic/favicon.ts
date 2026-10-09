/**
 * Dynamically updates the browser favicon and document title
 * based on the user's current win streak or tournament status.
 * Requirement: "Streaks should have a nice fire favicon and counter."
 */

let originalFaviconHref: string | null = null;
let currentStreakRendered: number | null = null;

/**
 * Procedurally draws a vibrant vector fire flame on a 64x64 canvas.
 * Completely immune to missing OS emoji fonts and monochrome canvas bugs.
 */
export function drawFireFaviconCanvas(canvas: HTMLCanvasElement, streak: number): void {
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, 64, 64);

  const isSuperStreak = streak >= 3;

  // Background glow & aura circle
  const grad = ctx.createRadialGradient(32, 32, 6, 32, 32, 31);
  if (isSuperStreak) {
    grad.addColorStop(0, '#FF4500'); // Hot blazing orange-red
    grad.addColorStop(0.6, '#B91C1C'); // Crimson
    grad.addColorStop(0.9, '#004D38'); // USask Pine
    grad.addColorStop(1, '#003627');
  } else {
    grad.addColorStop(0, '#E65100'); // Warm amber
    grad.addColorStop(0.5, '#78350F');
    grad.addColorStop(0.85, '#004D38');
    grad.addColorStop(1, '#003627');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  // Outer gold ring
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = isSuperStreak ? '#FFD54F' : '#FFC72C';
  ctx.stroke();

  // Blazing flame aura (for streaks >= 3)
  if (isSuperStreak) {
    ctx.save();
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(32, 28, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';
    ctx.fill();
    ctx.restore();
  }

  // --- Outer Flame Tongue (Vector Bezier Curves) ---
  const outerFlameGrad = ctx.createLinearGradient(32, 6, 32, 50);
  outerFlameGrad.addColorStop(0, '#FFF59D'); // Golden light top
  outerFlameGrad.addColorStop(0.25, '#FFB300'); // Vivid amber
  outerFlameGrad.addColorStop(0.65, '#FF3D00'); // Blazing red-orange
  outerFlameGrad.addColorStop(1, '#C62828'); // Deep fiery base

  ctx.save();
  ctx.beginPath();
  // Bottom center anchor
  ctx.moveTo(32, 50);
  // Left side rising flame curves
  ctx.bezierCurveTo(20, 50, 13, 38, 13, 29);
  ctx.bezierCurveTo(13, 20, 20, 16, 25, 10);
  ctx.bezierCurveTo(26, 17, 29, 21, 31, 18);
  // Main highest flickering tongue
  ctx.bezierCurveTo(32, 13, 34, 7, 31, 5);
  ctx.bezierCurveTo(36, 8, 42, 14, 44, 21);
  // Right side flame tongues
  ctx.bezierCurveTo(46, 18, 48, 16, 49, 13);
  ctx.bezierCurveTo(51, 23, 49, 33, 45, 40);
  ctx.bezierCurveTo(42, 46, 37, 50, 32, 50);
  ctx.closePath();
  ctx.fillStyle = outerFlameGrad;
  ctx.fill();

  // --- Inner White-Hot Core ---
  const innerFlameGrad = ctx.createLinearGradient(32, 16, 32, 47);
  innerFlameGrad.addColorStop(0, '#FFFFFF'); // White-hot core
  innerFlameGrad.addColorStop(0.35, '#FFF9C4'); // Cream yellow
  innerFlameGrad.addColorStop(0.75, '#FFCA28'); // Yellow-orange
  innerFlameGrad.addColorStop(1, '#FF5722');

  ctx.beginPath();
  ctx.moveTo(32, 47);
  ctx.bezierCurveTo(24, 47, 20, 39, 21, 31);
  ctx.bezierCurveTo(22, 24, 27, 20, 31, 15);
  ctx.bezierCurveTo(34, 20, 39, 24, 40, 31);
  ctx.bezierCurveTo(42, 39, 38, 47, 32, 47);
  ctx.closePath();
  ctx.fillStyle = innerFlameGrad;
  ctx.fill();
  ctx.restore();

  // --- Counter Badge (Bottom-Right) ---
  const badgeRadius = 13.5;
  const badgeX = 47;
  const badgeY = 47;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#004D38'; // USask Pine
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = isSuperStreak ? '#FFD54F' : '#FFFFFF';
  ctx.stroke();

  // Counter text
  ctx.fillStyle = '#FFFFFF';
  const text = streak.toString();
  ctx.font = text.length >= 2
    ? 'bold 12px "Inter", "Segoe UI", sans-serif'
    : 'bold 15px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, badgeX, badgeY + 1);
}

/**
 * Procedurally draws the default USask collegiate badge on canvas.
 */
export function drawDefaultFaviconCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, 64, 64);

  // USask Green Circle
  const grad = ctx.createRadialGradient(32, 32, 5, 32, 32, 30);
  grad.addColorStop(0, '#008765');
  grad.addColorStop(1, '#004D38');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  // Gold Huskie Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFC72C';
  ctx.stroke();

  // Text "RL" in collegiate bold font
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px "Chakra Petch", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RL', 32, 32);
}

export function updateStreakFavicon(streak: number, playerName?: string): void {
  if (typeof document === 'undefined') return;

  // Find or create favicon element
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }

  if (!originalFaviconHref && link.href) {
    originalFaviconHref = link.href;
  }

  if (streak === currentStreakRendered) {
    return;
  }
  currentStreakRendered = streak;

  const canvas = document.createElement('canvas');

  if (streak <= 0) {
    // Render standard USask Huskie green badge
    drawDefaultFaviconCanvas(canvas);
    link.href = canvas.toDataURL('image/png');
    document.title = playerName
      ? `USask RL Round Robin (${playerName})`
      : 'Rocket League Round Robin | USask';
    return;
  }

  // Render procedural fire favicon with streak counter badge
  drawFireFaviconCanvas(canvas, streak);
  link.href = canvas.toDataURL('image/png');

  const titlePrefix = streak >= 3 ? `🔥${streak} STREAK!` : `🔥${streak}`;
  document.title = `${titlePrefix} ${playerName ? `(${playerName}) - ` : ''}USask RL Round Robin`;
}

