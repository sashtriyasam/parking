const PRIMARY_GRADIENT = ['#4F46E5', '#6366F1'] as const; // Indigo Professional

export const darkTheme = {
  primary: '#6366F1',         // Indigo-500
  primaryGlow: 'rgba(99, 102, 241, 0.15)',
  secondary: '#94A3B8',       // Slate-400
  background: '#0F172A',      // Slate-900 (Professional Dark)
  surface: '#1E293B',         // Slate-800
  glass: 'rgba(30, 41, 59, 0.7)', 
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8', 
  textMuted: '#64748B',
  border: '#334155',          // Slate-700
  tertiary: '#4F46E5',
  overlay: 'rgba(0, 0, 0, 0.8)',
  tabBarBackground: '#0F172A',
};

export const lightTheme = {
  primary: '#4F46E5',         // Indigo-600
  primaryGlow: 'rgba(79, 70, 229, 0.1)',
  secondary: '#64748B',       // Slate-500
  background: '#FFFFFF',      // Pure White
  surface: '#F8FAFC',         // Slate-50
  glass: 'rgba(255, 255, 255, 0.8)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',
  textPrimary: '#0F172A',     // Slate-900
  textSecondary: '#475569',   // Slate-600
  textMuted: '#94A3B8',       // Slate-400
  border: '#E2E8F0',          // Slate-200
  tertiary: '#4338CA',
  overlay: 'rgba(15, 21, 42, 0.4)',
  tabBarBackground: '#FFFFFF',
};

export const colors = {
  ...darkTheme, // Default to dark for static usages
  premium: {
    primary: '#F59E0B',       // Amber-500
    secondary: '#D97706',     // Amber-600
  },
  success: '#10B981',         // Emerald-500
  warning: '#F59E0B',
  error: '#EF4444',           // Red-500
  danger: '#EF4444',
  dangerSurface: 'rgba(239, 68, 68, 0.1)',
  dangerBorder: 'rgba(239, 68, 68, 0.2)',
  primaryLight: 'rgba(99, 102, 241, 0.12)',
  info: '#3B82F6',            // Blue-500
  
  gradients: {
    primary: PRIMARY_GRADIENT,
    glass: ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)'],
    navy: ['#0F172A', '#1E293B'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    danger: ['#EF4444', '#DC2626'],
  },
  
  shadows: {
    glass: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 10,
    },
    primary: {
      shadowColor: '#1A73E8',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 8,
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
  maintenance: '#6B7280',
} as const;


