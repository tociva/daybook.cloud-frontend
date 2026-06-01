export const outputDirectory = 'public/assets/logo';

export const fonts = {
  lobster: {
    family: 'Lobster',
    path: 'fonts/lobster-regular.ttf',
  },
  roboto: {
    family: 'Roboto',
    path: 'fonts/roboto-regular.ttf',
  },
};

export const cssClasses = {
  logo: 'daybook-logo',
  variantPrefix: 'daybook-logo--',
  markBackground: 'daybook-logo__mark-bg',
  markText: 'daybook-logo__mark-text',
  title: 'daybook-logo__title',
  caption: 'daybook-logo__caption',
  shadow: 'daybook-logo__shadow',
};

export const theme = {
  variables: {
    markBackground: '--daybook-logo-mark-bg',
    markText: '--daybook-logo-mark-text',
    title: '--daybook-logo-title',
    caption: '--daybook-logo-caption',
    shadow: '--daybook-logo-shadow',
    shadowOpacity: '--daybook-logo-shadow-opacity',
  },
  light: {
    markBackground: 'var(--tng-semantic-accent-brand, #2563eb)',
    markText: 'var(--tng-semantic-foreground-inverse, #ffffff)',
    title: 'var(--tng-semantic-foreground-primary, #111827)',
    caption: 'var(--tng-semantic-foreground-muted, #6b7280)',
    shadow: 'var(--tng-semantic-accent-brand, #2563eb)',
    shadowOpacity: '0.28',
  },
  dark: {
    markBackground: 'var(--tng-semantic-accent-brand, #3b82f6)',
    markText: 'var(--tng-semantic-foreground-inverse, #ffffff)',
    title: 'var(--tng-semantic-foreground-primary, #f9fafb)',
    caption: 'var(--tng-semantic-foreground-muted, #cbd5e1)',
    shadow: 'var(--tng-semantic-accent-brand, #60a5fa)',
    shadowOpacity: '0.34',
  },
};

export const logoElements = {
  shadow: {
    dx: 0,
    dy: 10,
    stdDeviation: 10,
  },
  markText: {
    font: 'lobster',
    text: 'D.C',
    x: 30,
    y: 32,
    fontSize: 26,
    anchor: 'center middle',
    box: {
      x: 8,
      y: 10,
      width: 44,
      height: 44,
      radius: 14,
    },
  },
  titleText: {
    font: 'lobster',
    text: 'Daybook.Cloud',
    x: 64,
    y: 27,
    fontSize: 23,
    anchor: 'left middle',
  },
  wordmarkText: {
    font: 'lobster',
    text: 'Daybook.Cloud',
    x: 8,
    y: 32,
    fontSize: 23,
    anchor: 'left middle',
  },
  captionText: {
    font: 'roboto',
    text: 'DIVE INTO SIMPLICITY',
    x: 65,
    y: 47,
    fontSize: 9,
    anchor: 'left middle',
    attributes: {
      transform: 'scale(1.08 1)',
    },
  },
};

export const logoVariants = [
  {
    id: 'full-caption',
    fileName: 'daybook-cloud-logo.svg',
    width: 270,
    height: 64,
    viewBox: '0 0 270 64',
    title: 'Daybook.Cloud logo',
    description:
      'Daybook.Cloud logo with D.C mark and Dive into simplicity tagline.',
    includeMark: true,
    includeTitle: true,
    includeCaption: true,
  },
  {
    id: 'small',
    fileName: 'daybook-cloud-logo-small.svg',
    width: 64,
    height: 64,
    viewBox: '0 0 64 64',
    title: 'Daybook.Cloud small logo',
    description: 'Daybook.Cloud D.C mark.',
    includeMark: true,
    includeTitle: false,
    includeCaption: false,
  },
  {
    id: 'full',
    fileName: 'daybook-cloud-logo-full.svg',
    width: 224,
    height: 64,
    viewBox: '0 0 224 64',
    title: 'Daybook.Cloud full logo',
    description: 'Daybook.Cloud logo with D.C mark and wordmark.',
    includeMark: true,
    includeTitle: true,
    includeCaption: false,
  },
  {
    id: 'wordmark',
    fileName: 'daybook-cloud-logo-wordmark.svg',
    width: 160,
    height: 64,
    viewBox: '0 0 160 64',
    title: 'Daybook.Cloud wordmark',
    description: 'Daybook.Cloud wordmark.',
    includeMark: false,
    includeTitle: true,
    titleElement: 'wordmarkText',
    includeCaption: false,
  },
];
