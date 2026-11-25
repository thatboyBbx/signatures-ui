// Values sampled from the hosted Paramount reference, version 12.
export const colors = {
  primary: '#795238', primaryPressed: '#5F3F2B', gold: '#C6A77E',
  black: '#111110', text: '#30251C', textSecondary: '#78604A',
  background: '#EAE3D6', surface: '#F4EEE3', surfaceSecondary: '#DFD5C3',
  border: '#CFC0A8', onDark: '#FFF4DF', onGold: '#24180D',
  success: '#466338', warning: '#8C5F20', error: '#A53D28',
  navigationText: '#EAD2AD', glassBorder: '#E4D2AC52',
  woodButtonText: '#35200F',
  // Solid, high-contrast primary action colour (espresso, matches the dock).
  cta: '#2B1E14', ctaPressed: '#3A2A1C', ctaBorder: '#C6A77E',
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 2, md: 4, lg: 8, xl: 10, xxl: 14, pill: 999 };
export const fonts = {
  heading: 'DMSerifDisplay', headingItalic: 'DMSerifDisplayItalic',
  body: 'DMSans', medium: 'DMSansMedium', semibold: 'DMSansSemibold',
  bold: 'DMSansBold', heavy: 'DMSansHeavy',
};
export const typography = {
  hero: { fontFamily: fonts.heading, fontSize: 34, fontWeight: '400' as const, lineHeight: 41 },
  heading: { fontFamily: fonts.heading, fontSize: 26, fontWeight: '400' as const, lineHeight: 33 },
  title: { fontFamily: fonts.semibold, fontSize: 17, fontWeight: '400' as const, lineHeight: 23 },
  body: { fontFamily: fonts.body, fontSize: 15, fontWeight: '400' as const, lineHeight: 23 },
  caption: { fontFamily: fonts.medium, fontSize: 13, fontWeight: '400' as const, lineHeight: 19 },
};
export const motion = { press: 150, transition: 300, photo: 800 };
export const theme = { colors, spacing, radius, typography, fonts, motion };
