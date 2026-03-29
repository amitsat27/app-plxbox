// constants/breakpoints.ts
import { useWindowDimensions } from 'react-native';
import { Breakpoints as TokensBreakpoints, Grid as TokensGrid } from './designTokens';

/**
 * Breakpoint definitions for responsive design
 */
export const Breakpoints = {
  ...TokensBreakpoints,

  // Convenience boolean helpers
  isMobile: (width: number) => width < TokensBreakpoints.tablet,
  isTablet: (width: number) =>
    width >= TokensBreakpoints.tablet && width < TokensBreakpoints.desktop,
  isDesktop: (width: number) =>
    width >= TokensBreakpoints.desktop && width < TokensBreakpoints.wide,
  isWide: (width: number) => width >= TokensBreakpoints.wide,
};

/**
 * Hook to determine current screen size category
 */
export const useBreakpoint = () => {
  const { width } = useWindowDimensions();

  const isMobile = width < TokensBreakpoints.tablet;
  const isTablet =
    width >= TokensBreakpoints.tablet && width < TokensBreakpoints.desktop;
  const isDesktop =
    width >= TokensBreakpoints.desktop && width < TokensBreakpoints.wide;
  const isWide = width >= TokensBreakpoints.wide;

  return {
    width,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    breakpoint: isWide
      ? 'wide'
      : isDesktop
      ? 'desktop'
      : isTablet
      ? 'tablet'
      : 'mobile',
  };
};

/**
 * Get number of columns for grid layout based on screen width
 */
export const getGridColumns = (width: number): number => {
  if (width >= TokensBreakpoints.wide) return TokensGrid.columns.wide;
  if (width >= TokensBreakpoints.desktop)
    return TokensGrid.columns.desktop;
  if (width >= TokensBreakpoints.tablet)
    return TokensGrid.columns.tablet;
  return TokensGrid.columns.mobile;
};