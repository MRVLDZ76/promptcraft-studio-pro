/**
 * Responsive Breakpoints & Mobile Layout Configuration
 * Week 5 - Mobile Optimization
 */

export const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export const MOBILE_STYLES = {
  // Minimum touch target size (WCAG 2.1 Level AAA)
  minTouchTarget: 44,
  
  // Toolbar sizes
  mobileToolbarHeight: 56,
  tabletToolbarHeight: 64,
  
  // Bottom sheet
  bottomSheetHeight: {
    collapsed: 60,
    peek: 200,
    expanded: '80vh',
  },
  
  // Sidebar widths
  mobileSidebarWidth: '80vw',
  tabletSidebarWidth: 320,
  desktopSidebarWidth: 280,
  
  // Spacing
  mobilePadding: 16,
  tabletPadding: 24,
  desktopPadding: 32,
} as const;

export const getMobileClassName = (isMobile: boolean, isTablet: boolean) => {
  if (isMobile) return 'mobile-layout';
  if (isTablet) return 'tablet-layout';
  return 'desktop-layout';
};

// Media queries for use in styled components or CSS-in-JS
export const mediaQueries = {
  mobile: `@media (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.desktop - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.desktop}px)`,
  touchDevice: '@media (hover: none) and (pointer: coarse)',
};

// Detect device type
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.tablet) {
        setDeviceType('mobile');
      } else if (width < BREAKPOINTS.desktop) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    deviceType,
  };
};

import { useState, useEffect } from 'react';
