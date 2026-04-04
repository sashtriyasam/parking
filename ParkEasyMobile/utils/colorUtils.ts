/**
 * Applies an alpha transparency level to a HEX color string.
 * Supports #RGB, #RRGGBB, and #RRGGBBAA formats.
 * @param hex The color string (e.g., #FF5733)
 * @param alpha The alpha value (0 to 1)
 * @returns A hex string with the applied alpha
 */
export const applyAlpha = (hex: string, alpha: number): string => {
  if (!hex || hex.indexOf('#') !== 0) return hex;
  
  // Remove hash
  let color = hex.slice(1);
  
  // Normalize to RRGGBB
  if (color.length === 3) {
    color = color.split('').map(char => char + char).join('');
  }
  
  // If it already has alpha, remove it
  if (color.length === 8) {
    color = color.slice(0, 6);
  }
  
  // Convert alpha to 2-digit hex
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
  
  return `#${color}${alphaHex}`;
};
