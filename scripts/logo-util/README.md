# Daybook Logo Utility Data

This folder contains the generation-only inputs and renderer for the Daybook logo SVGs.

- `logo-data.mjs` is the source of truth for logo text, output filenames, geometry, theme colors, CSS variable names, and accessibility labels.
- `fonts/*.ttf` contains the font files consumed by `text-to-svg` when converting the wordmark and caption into SVG paths.

Run the generator from the project root:

```sh
node scripts/logo-util/create-daybook-logo-svg.mjs
```

The generator writes three theme-compatible SVG assets:

- `public/assets/logo/daybook-cloud-logo.svg`: full logo with caption.
- `public/assets/logo/daybook-cloud-logo-small.svg`: small D.C mark.
- `public/assets/logo/daybook-cloud-logo-full.svg`: full logo without caption.

The generated SVGs use CSS classes and custom properties such as `--daybook-logo-title` and `--daybook-logo-caption`, with built-in light and dark fallbacks via `prefers-color-scheme`. The fallback chain also reads the app's Tailng semantic tokens, so inline consumers inherit the active theme while still being able to override the logo-specific custom properties directly.
