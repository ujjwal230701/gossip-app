# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
npm run lint       # Lint with ESLint
```

No test framework is configured yet.

## Architecture

**Expo Router (file-based routing)** — `app/` maps directly to routes:
- `app/_layout.tsx` — Root layout; wraps everything in React Navigation's `ThemeProvider`
- `app/(tabs)/` — Tab group with bottom navigation (Home + Explore)
- Route files become URL paths; `_layout.tsx` files define layout boundaries

**Theme system** — Three-layer pattern:
1. `constants/theme.ts` — Color palette for light/dark modes
2. `hooks/use-theme-color.ts` — Hook that reads current scheme and allows per-component overrides
3. `ThemedText` / `ThemedView` in `components/` — Wrappers that consume the hook

**Cross-platform patterns:**
- Platform-specific files use suffixes: `.ios.ts`, `.web.ts` (e.g., `use-color-scheme.web.ts`, `icon-symbol.ios.tsx`)
- Icons: SF Symbols on iOS (`icon-symbol.ios.tsx`), Material Icons fallback on Android/Web (`icon-symbol.tsx`)
- The bundler automatically picks the right file at build time

**Path aliases** — `@/*` resolves to the project root (configured in `tsconfig.json`). Use `@/components/...`, `@/constants/...`, etc. instead of relative paths.

**Animations** — `react-native-reanimated` + `react-native-gesture-handler`. New React Native Architecture is enabled; do not mix legacy animated APIs.

**React Compiler** is enabled (`experiments.reactCompiler` in `app.json`) — avoid manual `useMemo`/`useCallback` for performance optimization; the compiler handles it.
