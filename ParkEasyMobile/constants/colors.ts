const PRIMARY_GRADIENT = ['#1C74E9', '#5D2EEF'] as const;

const baseColors = {
  primary: '#1C74E9',
  secondary: '#5D2EEF',
  tertiary: '#00E5FF',
  background: '#0b0e14',
  surface: '#161a21',
  textPrimary: '#ecedf6',
  textSecondary: '#a9abb3',
} as const;

export const colors = {
  ...baseColors,
  
  // Kinetic Ether Premium Palette
  premium: {
    background: baseColors.background,
    primary: baseColors.primary,
    secondary: baseColors.secondary,
    tertiary: baseColors.tertiary,
    surface: baseColors.surface,
    surfaceLight: '#1c2028',
    surfaceBright: '#282c36',
    onSurface: baseColors.textPrimary,
    onSurfaceVariant: baseColors.textSecondary,
    glass: 'rgba(22, 26, 33, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    neonPulse: PRIMARY_GRADIENT,
    glow: 'rgba(28, 116, 233, 0.15)',
    quaternary: '#EC4899',
    quinary: '#FF3B30',
  },

  // Vibrant Palette Additions
  primaryDark: '#005bc1',
  primaryLight: '#84adff',
  success: '#10B981',         // Emerald Green
  danger: '#ff716c',          // Soft Red
  error: '#ff716c',           
  warning: '#F59E0B',         
  info: '#1C74E9',            
  
  // Neon Accents
  // tertiary inherited from baseColors
  
  // Neutral Refinement
  border: 'rgba(255, 255, 255, 0.1)',
  textMuted: '#73757d',
  
  // Glassmorphism & Effects
  glassSurface: 'rgba(22, 26, 33, 0.7)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Tab Bar Theme
  tabBarBg: 'rgba(15, 18, 25, 0.75)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  tabBarInactive: 'rgba(255, 255, 255, 0.4)',
  
  gradients: {
    primary: PRIMARY_GRADIENT,
    premium: PRIMARY_GRADIENT,
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#FBBF24'],
    danger: ['#ff716c', '#d7383b'],
    glass: ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)'],
    dark: ['#0b0e14', '#161a21'],
  },
  
  shadows: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 3 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 },
    premium: { shadowColor: '#1C74E9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  }
} as const;

export const VEHICLE_TYPE_COLORS = {
  bike: colors.primary,
  scooter: colors.success,
  car: colors.warning,
  truck: colors.secondary,
};

export const SLOT_STATUS_COLORS = {
  free: colors.success,
  occupied: colors.danger,
  reserved: colors.warning,
  maintenance: colors.textMuted,
};
