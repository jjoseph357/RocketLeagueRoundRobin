const SASK_THEMES = [
  'HUSKY',
  'GREEN',
  'PRAIRIE',
  'BRIDGE',
  'RIVER',
  'BOWL',
  'CAMPUS',
  'BLIZZARD',
  'AURORA',
  'VOYAGE',
  'NOBLE',
  'FROST',
  'THUNDER',
  'NORTH',
];

/**
 * Generates a memorable, unique lobby code prefixed with SASK.
 * Example: "SASK-HUSKY-73" or "SASK-9412"
 */
export function generateLobbyCode(themeWord = true): string {
  if (themeWord) {
    const word = SASK_THEMES[Math.floor(Math.random() * SASK_THEMES.length)];
    const num = Math.floor(10 + Math.random() * 90); // 10 - 99
    return `SASK-${word}-${num}`;
  }
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `SASK-${digits}`;
}

/**
 * Normalizes user-entered lobby codes.
 * Ensures the 'SASK-' prefix is attached if omitted.
 */
export function normalizeLobbyCode(input: string): string {
  const trimmed = input.trim().toUpperCase().replace(/\s+/g, '-');
  if (!trimmed) return '';
  if (trimmed.startsWith('SASK-')) {
    return trimmed;
  }
  if (trimmed.startsWith('SASK')) {
    return `SASK-${trimmed.slice(4).replace(/^-+/, '')}`;
  }
  return `SASK-${trimmed}`;
}

/**
 * Generates Rocket League in-game private match lobby name and password.
 * Always prefixed with SASK for consistency with the prompt.
 */
export function generateRLMatchCredentials(roundNumber: number, matchIndex: number): {
  lobbyName: string;
  password: string;
} {
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return {
    lobbyName: `SASK-R${roundNumber}M${matchIndex + 1}-${randomSuffix}`,
    password: 'sask',
  };
}
