/** Only values resolved from inspected Figma nodes; not a complete token taxonomy. */
export const colors = {
  'Primary/0': '#FFFFFF',
  'Primary/100': '#E7DEFE',
  'Primary/200': '#CEBEFE',
  'Primary/500': '#7C5CFC',
  'Primary/600': '#5E43D8',
  'Primary/700': '#432EB5',
  'Secondary/200': '#C3D4E9',
  'Secondary/300': '#90A3BF',
  'Secondary/400': '#596780',
  'Secondary/500': '#1A202C',
  'Secondary/700': '#0D121F',
  'Secondary/900': '#040815',
  'Success/500': '#9CD323',
  'Success/600': '#7FB519',
  'Success/700': '#659711',
  'Warning/600': '#DBA32A',
  'Error/600': '#DB2719',
} as const;
export const conflictingColors = {
  'Secondary/100': { paletteBoard: '#E0E9F4', pricingCard: '#F3F5F7' },
  'Primary/Neutral/500': { paletteBoard: '#101010', selectionDefinitions: '#111111' },
  'Primary/Neutral/900': { paletteBoard: '#070304', selectionDefinitions: '#192252' },
} as const;
// Exact inspected text styles, rather than every size/weight combination.
export const textStyles = {
  'Regular/Type@14': { fontSize: 14, fontWeight: 400, lineHeight: 1.5, letterSpacing: '-0.02em' },
  'Regular/Type@16': { fontSize: 16, fontWeight: 400, lineHeight: 1.5, letterSpacing: '-0.02em' },
  'Medium/Type@18': { fontSize: 18, fontWeight: 500, lineHeight: 1.5, letterSpacing: '-0.02em' },
  'Semibold/Type@16': { fontSize: 16, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.02em' },
  'Semibold/Type@32': { fontSize: 32, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.03em' },
  'Semibold/Type@40': { fontSize: 40, fontWeight: 600, lineHeight: 1.5, letterSpacing: '-0.03em' },
} as const;
export const observed = {
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  pricingCard: {
    padding: 32,
    radius: 12,
    featureGap: 24,
    iconGap: 12,
    background: conflictingColors['Secondary/100'].pricingCard,
  },
  button: {
    paddingX: 24,
    paddingY: 13,
    mainHeight: 52,
    stateHeight: 50,
    mainRadius: 30,
    stateRadius: 60,
  },
  iconButtonShadow: '4px 8px 24px 0 #246BFD40',
} as const;
