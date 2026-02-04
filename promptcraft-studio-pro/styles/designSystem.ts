/**
 * PromptCraft Studio Pro - Design System
 * ======================================
 * 
 * Single source of truth for all UI styling.
 * All components should reference these constants for consistency.
 * 
 * NAMING CONVENTION:
 * - ds.{element}.{variant} - e.g., ds.card.primary
 * - All classes include both light and dark mode variants
 */

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const colors = {
  // Primary brand colors
  primary: {
    light: 'text-purple-600',
    dark: 'dark:text-purple-400',
    bg: 'bg-purple-600 dark:bg-purple-500',
    bgHover: 'hover:bg-purple-700 dark:hover:bg-purple-600',
    border: 'border-purple-500 dark:border-purple-400',
  },
  
  // Semantic colors
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
} as const;

// =============================================================================
// LAYOUT - PAGES & CONTAINERS
// =============================================================================

export const layout = {
  // Main page wrapper
  page: 'min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100',
  
  // Content containers
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerNarrow: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  containerWide: 'max-w-full mx-auto px-4 sm:px-6 lg:px-8',
  
  // Sidebar
  sidebar: 'bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800',
  
  // Header
  header: 'bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800',
  
  // Main content area
  main: 'flex-1 bg-neutral-50 dark:bg-neutral-950 overflow-y-auto',
} as const;

// =============================================================================
// CARDS & PANELS
// =============================================================================

export const card = {
  // Primary card - main content containers
  primary: `
    bg-white dark:bg-neutral-900 
    border border-neutral-200 dark:border-neutral-800 
    rounded-2xl shadow-sm
  `.trim().replace(/\s+/g, ' '),
  
  // Secondary card - nested/subtle containers
  secondary: `
    bg-neutral-50 dark:bg-neutral-800/50 
    border border-neutral-100 dark:border-neutral-700 
    rounded-xl
  `.trim().replace(/\s+/g, ' '),
  
  // Elevated card - modals, dropdowns
  elevated: `
    bg-white dark:bg-neutral-900 
    border border-neutral-200 dark:border-neutral-700 
    rounded-xl shadow-lg
  `.trim().replace(/\s+/g, ' '),
  
  // Interactive card - hoverable items
  interactive: `
    bg-white dark:bg-neutral-900 
    border border-neutral-200 dark:border-neutral-800 
    rounded-xl 
    hover:border-neutral-300 dark:hover:border-neutral-600 
    hover:shadow-md 
    transition-all cursor-pointer
  `.trim().replace(/\s+/g, ' '),
  
  // Muted card - info panels, subtle sections
  muted: `
    bg-neutral-100/50 dark:bg-neutral-800/30 
    border border-neutral-100 dark:border-neutral-700/50 
    rounded-xl
  `.trim().replace(/\s+/g, ' '),
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const text = {
  // Headings
  h1: 'text-3xl font-bold text-neutral-900 dark:text-white tracking-tight',
  h2: 'text-2xl font-bold text-neutral-900 dark:text-white tracking-tight',
  h3: 'text-xl font-semibold text-neutral-900 dark:text-white',
  h4: 'text-lg font-semibold text-neutral-800 dark:text-neutral-100',
  
  // Body text
  body: 'text-base text-neutral-700 dark:text-neutral-300',
  bodySmall: 'text-sm text-neutral-600 dark:text-neutral-400',
  
  // Labels & captions
  label: 'text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide',
  labelBold: 'text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest',
  caption: 'text-[10px] text-neutral-500 dark:text-neutral-500',
  
  // Muted/secondary text
  muted: 'text-neutral-500 dark:text-neutral-500',
  subtle: 'text-neutral-400 dark:text-neutral-600',
  
  // Links
  link: 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors',
} as const;

// =============================================================================
// FORM ELEMENTS
// =============================================================================

export const input = {
  // Standard text input
  base: `
    w-full px-4 py-3 
    bg-white dark:bg-neutral-800 
    border border-neutral-300 dark:border-neutral-700 
    rounded-lg 
    text-neutral-900 dark:text-white 
    placeholder-neutral-400 dark:placeholder-neutral-500 
    focus:ring-2 focus:ring-purple-500 focus:border-transparent 
    outline-none transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Compact input
  compact: `
    w-full px-3 py-2 
    bg-white dark:bg-neutral-800 
    border border-neutral-300 dark:border-neutral-700 
    rounded-lg 
    text-sm text-neutral-900 dark:text-white 
    placeholder-neutral-400 dark:placeholder-neutral-500 
    focus:ring-2 focus:ring-purple-500 focus:border-transparent 
    outline-none transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Minimal input - for inline editing
  minimal: `
    w-full px-3 py-2 
    bg-neutral-50 dark:bg-neutral-900 
    border border-neutral-200 dark:border-neutral-700 
    rounded-md 
    text-sm text-neutral-800 dark:text-neutral-200 
    placeholder-neutral-400 dark:placeholder-neutral-600 
    focus:bg-white dark:focus:bg-neutral-800 
    focus:border-purple-500 
    outline-none transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Textarea
  textarea: `
    w-full px-4 py-3 
    bg-white dark:bg-neutral-800 
    border border-neutral-300 dark:border-neutral-700 
    rounded-lg 
    text-neutral-900 dark:text-white 
    placeholder-neutral-400 dark:placeholder-neutral-500 
    focus:ring-2 focus:ring-purple-500 focus:border-transparent 
    outline-none transition-all resize-none
  `.trim().replace(/\s+/g, ' '),
  
  // Select dropdown
  select: `
    w-full px-3 py-2.5 
    bg-white dark:bg-neutral-800 
    border border-neutral-300 dark:border-neutral-700 
    rounded-lg 
    text-sm text-neutral-900 dark:text-white 
    focus:ring-2 focus:ring-purple-500 focus:border-transparent 
    outline-none transition-all cursor-pointer
  `.trim().replace(/\s+/g, ' '),
} as const;

// =============================================================================
// BUTTONS
// =============================================================================

export const button = {
  // Primary action button
  primary: `
    px-4 py-2.5 
    bg-purple-600 hover:bg-purple-700 
    dark:bg-purple-500 dark:hover:bg-purple-600 
    text-white font-medium 
    rounded-lg 
    transition-all 
    shadow-sm hover:shadow-md 
    active:scale-[0.98]
  `.trim().replace(/\s+/g, ' '),
  
  // Secondary button
  secondary: `
    px-4 py-2.5 
    bg-neutral-900 hover:bg-neutral-800 
    dark:bg-neutral-100 dark:hover:bg-neutral-200 
    text-white dark:text-neutral-900 
    font-medium rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Outline button
  outline: `
    px-4 py-2.5 
    bg-transparent 
    border border-neutral-300 dark:border-neutral-600 
    hover:border-neutral-400 dark:hover:border-neutral-500 
    text-neutral-700 dark:text-neutral-300 
    hover:bg-neutral-50 dark:hover:bg-neutral-800 
    font-medium rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Ghost button - minimal styling
  ghost: `
    px-3 py-2 
    text-neutral-600 dark:text-neutral-400 
    hover:text-neutral-900 dark:hover:text-white 
    hover:bg-neutral-100 dark:hover:bg-neutral-800 
    rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Icon button
  icon: `
    p-2 
    text-neutral-500 dark:text-neutral-400 
    hover:text-neutral-700 dark:hover:text-neutral-200 
    hover:bg-neutral-100 dark:hover:bg-neutral-800 
    rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Danger button
  danger: `
    px-4 py-2.5 
    bg-red-600 hover:bg-red-700 
    dark:bg-red-500 dark:hover:bg-red-600 
    text-white font-medium 
    rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Success button
  success: `
    px-4 py-2.5 
    bg-emerald-600 hover:bg-emerald-700 
    dark:bg-emerald-500 dark:hover:bg-emerald-600 
    text-white font-medium 
    rounded-lg 
    transition-all
  `.trim().replace(/\s+/g, ' '),
  
  // Disabled state (append to any button)
  disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
} as const;

// =============================================================================
// CHIPS & TAGS
// =============================================================================

export const chip = {
  // Default chip
  base: `
    px-3 py-1.5 
    bg-neutral-100 dark:bg-neutral-800 
    text-neutral-700 dark:text-neutral-300 
    text-xs font-medium 
    rounded-lg 
    border border-neutral-200 dark:border-neutral-700
  `.trim().replace(/\s+/g, ' '),
  
  // Selected chip
  selected: `
    px-3 py-1.5 
    bg-purple-100 dark:bg-purple-900/40 
    text-purple-700 dark:text-purple-300 
    text-xs font-medium 
    rounded-lg 
    border border-purple-300 dark:border-purple-700
  `.trim().replace(/\s+/g, ' '),
  
  // Interactive chip (toggleable)
  interactive: (isSelected: boolean) => isSelected 
    ? `px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white text-xs font-medium rounded-lg border border-purple-600 dark:border-purple-500 transition-all cursor-pointer`
    : `px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-600 dark:hover:text-purple-400 transition-all cursor-pointer`,
  
  // Negative/avoid chip
  negative: (isSelected: boolean) => isSelected
    ? `px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg shadow-md transition-all cursor-pointer`
    : `px-3 py-1.5 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-red-400 hover:text-red-600 dark:hover:border-red-500 dark:hover:text-red-400 transition-all cursor-pointer`,
} as const;

// =============================================================================
// SECTION HEADERS
// =============================================================================

export const section = {
  // Major section header
  header: `
    flex items-center gap-3 
    pb-4 mb-6 
    border-b border-neutral-200 dark:border-neutral-800
  `.trim().replace(/\s+/g, ' '),
  
  // Section title with icon
  title: 'text-xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3',
  
  // Subsection header
  subheader: 'flex items-center gap-2 mb-3',
  
  // Subsection title
  subtitle: 'text-sm font-semibold text-neutral-700 dark:text-neutral-200 uppercase tracking-wide',
  
  // Section description
  description: 'text-sm text-neutral-600 dark:text-neutral-400 mt-1',
  
  // Icon container (rounded background)
  iconContainer: 'p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg',
  
  // Section icon styling
  icon: 'w-5 h-5 text-neutral-500 dark:text-neutral-400',
} as const;

// =============================================================================
// AI CREATION STUDIO LAYOUT (Unified for all AI tools)
// =============================================================================

export const studio = {
  // Main container for AI studio pages
  container: 'max-w-5xl mx-auto space-y-6 pb-20',
  
  // Main panel wrapper
  panel: `
    bg-white dark:bg-neutral-900 
    rounded-3xl 
    border border-neutral-200 dark:border-neutral-800 
    p-8 
    shadow-sm 
    relative overflow-hidden
  `.trim().replace(/\s+/g, ' '),
  
  // Panel with accent bar at top
  panelAccent: `
    bg-white dark:bg-neutral-900 
    rounded-3xl 
    border border-neutral-200 dark:border-neutral-800 
    p-8 
    shadow-sm 
    relative overflow-hidden
    before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-purple-500 before:to-purple-600 before:opacity-20
  `.trim().replace(/\s+/g, ' '),
  
  // Title with icon
  title: `
    text-xl font-black 
    flex items-center gap-3 
    text-neutral-900 dark:text-white 
    uppercase tracking-tighter
  `.trim().replace(/\s+/g, ' '),
  
  // Title icon background
  titleIcon: 'p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg',
  
  // Two column grid layout
  grid2: 'grid lg:grid-cols-2 gap-8',
  
  // Three column grid layout  
  grid3: 'grid lg:grid-cols-3 gap-6',
  
  // Preview/output area
  preview: `
    aspect-video 
    bg-neutral-100 dark:bg-neutral-800 
    rounded-2xl 
    border-2 border-dashed border-neutral-200 dark:border-neutral-700 
    flex flex-col items-center justify-center 
    overflow-hidden
  `.trim().replace(/\s+/g, ' '),
  
  // Control label
  controlLabel: 'text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2',
  
  // Control group
  controlGroup: 'space-y-4',
  
  // Info box
  infoBox: `
    p-4 
    bg-neutral-100/50 dark:bg-neutral-800/30 
    border border-neutral-100 dark:border-neutral-700/50 
    rounded-xl
  `.trim().replace(/\s+/g, ' '),
  
  // Info text
  infoText: 'text-[10px] font-medium text-neutral-600 dark:text-neutral-400 leading-relaxed',
} as const;

// =============================================================================
// TOGGLE / SWITCH BUTTONS
// =============================================================================

export const toggle = {
  // Toggle group container
  group: `
    flex 
    bg-neutral-100 dark:bg-neutral-800 
    rounded-xl p-1.5 
    border border-neutral-200 dark:border-neutral-700
  `.trim().replace(/\s+/g, ' '),
  
  // Toggle button
  button: (isActive: boolean) => isActive
    ? 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-md transition-all'
    : 'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all',
  
  // Tab-style toggle
  tab: (isActive: boolean) => isActive
    ? 'px-4 py-2 border-b-2 border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium transition-all'
    : 'px-4 py-2 border-b-2 border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium transition-all',
} as const;

// =============================================================================
// DIVIDERS & SEPARATORS
// =============================================================================

export const divider = {
  horizontal: 'w-full h-px bg-neutral-200 dark:bg-neutral-800',
  vertical: 'w-px h-full bg-neutral-200 dark:bg-neutral-800',
  accent: 'w-full h-0.5 bg-gradient-to-r from-purple-500 to-purple-600 opacity-20',
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animation = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;

// =============================================================================
// UTILITY COMPOSITIONS
// =============================================================================

// Quick access to common combinations
export const ds = {
  layout,
  card,
  text,
  input,
  button,
  chip,
  section,
  studio,
  toggle,
  divider,
  animation,
  colors,
} as const;

export default ds;
