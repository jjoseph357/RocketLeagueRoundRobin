/**
 * Dynamically updates the browser favicon and document title
 * based on the user's current win streak or tournament status.
 * Requirement: "Streaks should have a nice fire favicon and counter."
 */

let originalFaviconHref: string | null = null;
let currentStreakRendered: number | null = null;

export function updateStreakFavicon(streak: number, playerName?: string): void {
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

  if (streak <= 0) {
    // Render standard USask Huskie green badge
    renderDefaultFavicon(link);
    document.title = 'Rocket League Round Robin | USask';
    return;
  }

  // Render fire favicon with streak counter badge
  renderFireFavicon(link, streak);

  const titlePrefix = streak >= 3 ? `🔥${streak} STREAK!` : `🔥${streak}`;
  document.title = `${titlePrefix} ${playerName ? `(${playerName}) - ` : ''}USask RL Round Robin`;
}

function renderFireFavicon(link: HTMLLinkElement, streak: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background glow circle
  const grad = ctx.createRadialGradient(32, 32, 10, 32, 32, 30);
  grad.addColorStop(0, '#FF4500'); // Orange-red
  grad.addColorStop(0.6, '#FF8C00'); // Dark orange
  grad.addColorStop(1, '#006A4E'); // USask Green border
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring in USask Gold
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFC72C';
  ctx.stroke();

  // Fire emoji or icon
  ctx.font = '32px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔥', 32, 28);

  // Counter badge in bottom right
  const badgeRadius = 14;
  const badgeX = 46;
  const badgeY = 46;

  ctx.beginPath();
  ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#004D38'; // Dark USask Pine
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Counter text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px "Segoe UI", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(streak.toString(), badgeX, badgeY + 1);

  link.href = canvas.toDataURL('image/png');
}

function renderDefaultFavicon(link: HTMLLinkElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // USask Green Circle
  ctx.fillStyle = '#006A4E';
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  // Gold Huskie Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFC72C';
  ctx.stroke();

  // Rocket car / ball emoji or text "SK"
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px "Segoe UI", Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RL', 32, 32);

  link.href = canvas.toDataURL('image/png');
}
