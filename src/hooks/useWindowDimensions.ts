import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface DimensionsInfo {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Hook for responsive design with iOS 18+ breakpoints
 * Provides current dimensions and breakpoint classification
 */
export const useWindowDimensions = (): DimensionsInfo => {
  const [dimensions, setDimensions] = useState<DimensionsInfo>(() => {
    const { width, height } = Dimensions.get('window');
    return getDimensionsInfo(width, height);
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(getDimensionsInfo(window.width, window.height));
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
};

const getDimensionsInfo = (width: number, height: number): DimensionsInfo => {
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const breakpoint: Breakpoint = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
};

export default useWindowDimensions;
