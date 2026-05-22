const PRIMARY_GRADIENT = ['#007AFF', '#0055D3'] as const; // Apple System Blue gradient

export const darkTheme = {
  primary: '#007AFF',         // System Blue
  primaryGlow: 'rgba(0, 122, 255, 0.15)',
  secondary: 'rgba(235, 235, 245, 0.60)', // Label Secondary
  background: '#000000',      // Pure Black
  surface: '#1C1C1E',         // Dark Surface
  surfaceElevated: '#2C2C2E', // Elevated Surface
  glass: 'rgba(28, 28, 30, 0.85)', 
  glassBorder: '#38383A',     // Separator
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(235, 235, 245, 0.60)', 
  textMuted: 'rgba(235, 235, 245, 0.30)',
  border: '#38383A',          // Separator
  tertiary: '#007AFF',
  overlay: 'rgba(0, 0, 0, 0.7)',
  tabBarBackground: 'rgba(28, 28, 30, 0.85)',
};

export const lightTheme = {
  primary: '#007AFF',         // System Blue
  primaryGlow: 'rgba(0, 122, 255, 0.1)',
  secondary: 'rgba(60, 60, 67, 0.60)',   // Label Secondary
  background: '#FFFFFF',      // Pure White
  surface: '#F2F2F7',         // Light Surface
  surfaceElevated: '#FFFFFF', // Elevated Surface
  glass: 'rgba(242, 242, 247, 0.85)',
  glassBorder: '#C6C6C8',     // Separator
  textPrimary: '#000000',     // Pure Black text
  textSecondary: 'rgba(60, 60, 67, 0.60)',
  textMuted: 'rgba(60, 60, 67, 0.30)',
  border: '#C6C6C8',          // Separator
  tertiary: '#007AFF',
  overlay: 'rgba(0, 0, 0, 0.4)',
  tabBarBackground: 'rgba(255, 255, 255, 0.85)',
};

export const colors = {
  ...darkTheme, // Default to dark for static usages
  premium: {
    primary: '#FF9F0A',       // System Orange
    secondary: '#FF9F0A',
  },
  success: '#34C759',         // System Green
  warning: '#FF9F0A',         // System Orange
  error: '#FF3B30',           // System Red
  danger: '#FF3B30',
  dangerSurface: 'rgba(255, 59, 48, 0.1)',
  dangerBorder: 'rgba(255, 59, 48, 0.2)',
  primaryLight: 'rgba(0, 122, 255, 0.12)',
  info: '#007AFF',
  
  gradients: {
    primary: PRIMARY_GRADIENT,
    glass: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)'],
    navy: ['#000000', '#1C1C1E'],
    success: ['#34C759', '#30B34F'],
    warning: ['#FF9F0A', '#E08A00'],
    danger: ['#FF3B30', '#D32F2F'],
  },
  
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 2,
    },
    primary: {
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
  }
} as const;

export const VEHICLE_TYPE_COLORS = {
  bike: colors.primary,
  scooter: colors.primary,
  car: colors.warning,
  truck: colors.secondary,
} as const;

export const SLOT_STATUS_COLORS = {
  free: colors.success,
  occupied: colors.error,
  reserved: colors.warning,
  maintenance: '#8E8E93', // System Gray
} as const;



