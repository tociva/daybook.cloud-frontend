// scripts/logo-util/create-daybook-logo-svg.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TextToSVG from 'text-to-svg';

import {
  cssClasses,
  fonts,
  logoElements,
  logoVariants,
  outputDirectory,
  theme,
} from './logo-data.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '../..');
const logoUtilDirectory = scriptDirectory;
const outputDirectoryPath = path.join(projectRoot, outputDirectory);

const loadedFonts = Object.fromEntries(
  Object.entries(fonts).map(([fontKey, fontConfig]) => [
    fontKey,
    TextToSVG.loadSync(path.join(logoUtilDirectory, fontConfig.path)),
  ]),
);

function getTextPath(element, className) {
  const { attributes = {}, font, text, ...options } = element;

  return loadedFonts[font].getPath(text, {
    ...options,
    attributes: {
      ...attributes,
      class: className,
    },
  });
}

const textPaths = {
  mark: getTextPath(logoElements.markText, cssClasses.markText),
  title: getTextPath(logoElements.titleText, cssClasses.title),
  wordmark: getTextPath(logoElements.wordmarkText, cssClasses.title),
  caption: getTextPath(logoElements.captionText, cssClasses.caption),
};

function cssVar(name, fallback) {
  return `var(${name}, ${fallback})`;
}

function renderThemeStyle() {
  const { dark, light, variables } = theme;

  return `  <style>
    .${cssClasses.logo} {
      color-scheme: light dark;
    }

    .${cssClasses.markBackground} {
      fill: ${cssVar(variables.markBackground, light.markBackground)};
    }

    .${cssClasses.markText} {
      fill: ${cssVar(variables.markText, light.markText)};
    }

    .${cssClasses.title} {
      fill: ${cssVar(variables.title, light.title)};
    }

    .${cssClasses.caption} {
      fill: ${cssVar(variables.caption, light.caption)};
    }

    .${cssClasses.shadow} {
      flood-color: ${cssVar(variables.shadow, light.shadow)};
      flood-opacity: ${cssVar(variables.shadowOpacity, light.shadowOpacity)};
    }

    @media (prefers-color-scheme: dark) {
      .${cssClasses.markBackground} {
        fill: ${cssVar(variables.markBackground, dark.markBackground)};
      }

      .${cssClasses.markText} {
        fill: ${cssVar(variables.markText, dark.markText)};
      }

      .${cssClasses.title} {
        fill: ${cssVar(variables.title, dark.title)};
      }

      .${cssClasses.caption} {
        fill: ${cssVar(variables.caption, dark.caption)};
      }

      .${cssClasses.shadow} {
        flood-color: ${cssVar(variables.shadow, dark.shadow)};
        flood-opacity: ${cssVar(variables.shadowOpacity, dark.shadowOpacity)};
      }
    }
  </style>`;
}

function renderMark(filterId) {
  const { box } = logoElements.markText;

  return `  <rect
    class="${cssClasses.markBackground}"
    x="${box.x}"
    y="${box.y}"
    width="${box.width}"
    height="${box.height}"
    rx="${box.radius}"
    filter="url(#${filterId})"
  />

  ${textPaths.mark}`;
}

function renderMarkDefs(filterId) {
  return `  <defs>
    <filter id="${filterId}" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow
        class="${cssClasses.shadow}"
        dx="${logoElements.shadow.dx}"
        dy="${logoElements.shadow.dy}"
        stdDeviation="${logoElements.shadow.stdDeviation}"
      />
    </filter>
  </defs>`;
}

function renderVariant(variant) {
  const filterId = `daybookLogoShadow-${variant.id}`;
  const titleId = `daybookLogoTitle-${variant.id}`;
  const descId = `daybookLogoDesc-${variant.id}`;
  const defs = variant.includeMark ? `\n${renderMarkDefs(filterId)}\n` : '';
  const titlePath =
    variant.titleElement === 'wordmarkText' ? textPaths.wordmark : textPaths.title;
  const body = [
    variant.includeMark ? renderMark(filterId) : null,
    variant.includeTitle ? `  ${titlePath}` : null,
    variant.includeCaption ? `  ${textPaths.caption}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  return `<svg
  xmlns="http://www.w3.org/2000/svg"
  class="${cssClasses.logo} ${cssClasses.variantPrefix}${variant.id}"
  width="${variant.width}"
  height="${variant.height}"
  viewBox="${variant.viewBox}"
  role="img"
  aria-labelledby="${titleId} ${descId}"
>
  <title id="${titleId}">${variant.title}</title>
  <desc id="${descId}">${variant.description}</desc>

${renderThemeStyle()}
${defs}

${body}
</svg>
`;
}

fs.mkdirSync(outputDirectoryPath, { recursive: true });

for (const variant of logoVariants) {
  const outputPath = path.join(outputDirectoryPath, variant.fileName);
  fs.writeFileSync(outputPath, renderVariant(variant));
  console.log(`Created ${path.relative(projectRoot, outputPath)}`);
}
