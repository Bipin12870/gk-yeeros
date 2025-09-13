export const theme = {
  colors: {
    // Surfaces
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    // Text
    text: '#111827',
    muted: '#6B7280',
    onDark: '#E0E7FF',
    onDarkMuted: '#CBD5E1',
    // Brand
    primary: '#6366F1',
    primaryDark: '#4F46E5',
    primaryMutedBg: 'rgba(99,102,241,0.08)',
    // Semantic
    success: '#10B981',
    danger: '#EF4444',
    warning: '#F59E0B',
    // Destructive/alt chips
    destructiveBg: '#FEE2E2',
    destructiveText: '#991B1B',
  },
  gradients: {
    header: ['#0F172A', '#334155', '#64748B'], // slate elegance
    imageOverlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.25)'],
  },
  tokens: {
    radius: { sm: 8, md: 12, lg: 16, xl: 20 },
    shadow: {
      soft: { color: '#000', opacity: 0.06, offset: { width: 0, height: 3 }, radius: 10, elevation: 2 },
      card: { color: '#000', opacity: 0.1, offset: { width: 0, height: 4 }, radius: 12, elevation: 4 },
    },
  },
} as const;

export type AppTheme = typeof theme;

