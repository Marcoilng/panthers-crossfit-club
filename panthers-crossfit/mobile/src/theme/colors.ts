// Theme colors for Panthers CrossFit Club
// "Fitness Pro" theme: Black, Green (#2ecc71), White

export const colors = {
  // Primary Colors
  primary: '#2ecc71', // Green
  primaryDark: '#27ae60',
  primaryLight: '#58d68d',
  
  // Background Colors
  background: '#000000', // Black
  backgroundLight: '#1a1a1a',
  backgroundDark: '#000000',
  surface: '#1a1a1a',
  surfaceLight: '#2d2d2d',
  
  // Text Colors
  text: '#ffffff', // White
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  
  // Status Colors
  success: '#2ecc71', // Green
  warning: '#f39c12', // Orange
  error: '#e74c3c', // Red
  info: '#3498db', // Blue
  
  // Member Status Colors
  statusActive: '#2ecc71', // Green
  statusExpiringSoon: '#f39c12', // Orange
  statusExpired: '#e74c3c', // Red
  statusSuspended: '#95a5a6', // Gray
  
  // UI Elements
  border: '#333333',
  borderLight: '#444444',
  card: '#1a1a1a',
  cardLight: '#2d2d2d',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Transparent
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Dark mode is default
export const isDarkMode = true;

