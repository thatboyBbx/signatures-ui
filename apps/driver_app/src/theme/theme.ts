// Driver app tokens. Same family as the customer app (cream, espresso, DM Serif / DM Sans),
// tuned for glancing in sunlight: every text pair here is ≥ 4.5:1, key values ≥ 7:1.
export const colors = {
  background: '#EAE3D6',
  surface: '#F4EEE3',
  surfaceSecondary: '#DFD5C3',
  border: '#CFC0A8',

  text: '#30251C',
  textSecondary: '#78604A',

  espresso: '#2B1E14',
  espressoPressed: '#3A2A1C',
  onDark: '#FFF4DF',
  onDarkMuted: '#CDBB9C',
  // Gold only ever sits on espresso (7.1:1). On cream it fails (1.8:1).
  gold: '#C6A77E',

  success: '#466338',
  warning: '#8C5F20',
  error: '#A53D28',
  errorSurface: '#F1DCD2',
  overlay: '#1A120BB3',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
export const radius = { sm: 2, md: 4, lg: 8, xl: 10, xxl: 14, pill: 999 };

export const fonts = {
  heading: 'DMSerifDisplay',
  headingItalic: 'DMSerifDisplayItalic',
  body: 'DMSans',
  medium: 'DMSansMedium',
  semibold: 'DMSansSemibold',
  bold: 'DMSansBold',
};

export const typography = {
  amount: { fontFamily: fonts.heading, fontSize: 44, lineHeight: 50, color: colors.text },
  title: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 36, color: colors.text },
  heading: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28, color: colors.text },
  value: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.text },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
};

// Minimum hit sizes for use on a moving bike.
export const touch = { min: 48, action: 60 };

export const theme = { colors, spacing, radius, fonts, typography, touch };
