/**
 * Safely adds alpha/opacity to a color string (Hex, RGB, or RGBA).
 * @param color Hex string (#abc, #aabbcc), RGB, or RGBA string
 * @param opacity Number between 0 and 1
 */
export const addAlpha = (color: string, opacity: number): string => {
  // Clamp opacity and handle NaN to ensure it stays in [0, 1] range
  const clampedOpacity = isNaN(opacity) ? 0 : Math.min(Math.max(opacity, 0), 1);

  const lowerColor = color.toLowerCase();

  // If it's already an RGBA string, try to replace the alpha
  if (lowerColor.startsWith('rgba')) {
    return color.replace(/[\d\.]+\)$/g, `${clampedOpacity})`);
  }

  // If it's an RGB string, convert to RGBA
  if (lowerColor.startsWith('rgb')) {
    return color.replace(')', `, ${clampedOpacity})`).replace(/rgb/i, 'rgba');
  }

  // Handle Hex
  let hex = color.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // Validate expanded hex length and characters to prevent NaN from parseInt
  const isValidHex = hex.length === 6 && /^[0-9A-Fa-f]{6}$/.test(hex);
  const r = isValidHex ? parseInt(hex.substring(0, 2), 16) : 0;
  const g = isValidHex ? parseInt(hex.substring(2, 4), 16) : 0;
  const b = isValidHex ? parseInt(hex.substring(4, 6), 16) : 0;

  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
};
