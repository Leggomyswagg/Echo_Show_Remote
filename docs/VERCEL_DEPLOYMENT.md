# Vercel Deployment

The Expo web artifact is produced with `npx expo export --platform web` into `dist`.

Vercel should use the repository root as the project root, install dependencies with npm, run the Expo web export as the build command, and serve `dist` as the output directory.

Required runtime configuration must be supplied in Vercel Project Settings and never committed to git. In particular, cloud control must not silently fall back to an unauthenticated or fake relay endpoint.

For an SPA deployment, configure a catch-all rewrite to `/`. If the project changes to Expo Router static/server output, update the Vercel routing configuration accordingly.
