/**
 * Global type declarations for Claude Code CLI build.
 *
 * Many modules were dead-code-eliminated from the source map and exist
 * only as dynamic imports behind feature() gates. We declare them here
 * so TypeScript doesn't complain.
 */

// ─── Build-time macros (replaced by Bun bundler) ───────────────────────
declare const MACRO: {
  VERSION: string
  VERSION_CHANGELOG: string
  BUILD_TIME: string
  FEEDBACK_CHANNEL: string
  ISSUES_EXPLAINER: string
  PACKAGE_URL: string
  NATIVE_PACKAGE_URL: string
}

// ─── bun:bundle feature() API ──────────────────────────────────────────
declare module 'bun:bundle' {
  export function feature(name: string): boolean
}

// ─── Native addon modules ──────────────────────────────────────────────
declare module 'color-diff-napi' {
  export function closest(color: any, palette: any, bc?: any): any
  export function furthest(color: any, palette: any, bc?: any): any
  export function diff(a: any, b: any): number
}

declare module 'modifiers-napi' {
  export function getModifiers(): any
}

declare module 'audio-capture-napi' {
  export function startCapture(options?: any): any
  export function stopCapture(): void
}

declare module 'image-processor-napi' {
  export function processImage(buffer: Buffer, options?: any): Buffer
}

declare module 'url-handler-napi' {
  export function register(protocol: string, handler: (url: string) => void): void
  export function unregister(protocol: string): void
}

// ─── plist (used but not always available) ──────────────────────────────
declare module 'plist' {
  export function parse(input: string): any
  export function build(obj: any): string
}

// ─── cacache (optional cache module) ────────────────────────────────────
declare module 'cacache' {
  export function get(cachePath: string, key: string, opts?: any): Promise<any>
  export function put(cachePath: string, key: string, data: any, opts?: any): Promise<any>
  export function rm(cachePath: string, key: string): Promise<any>
  export namespace ls {
    function stream(cachePath: string): any
  }
}

// ─── .md / .txt file imports (Bun's built-in text loader) ──────────────
declare module '*.md' {
  const content: string
  export default content
}

declare module '*.txt' {
  const content: string
  export default content
}

// ─── Catch-all for feature-gated modules not in source map ─────────────
// These modules were DCE'd from the source map. They are only ever
// loaded via dynamic import() behind feature() guards, so they will
// never actually execute. We declare them to suppress TS2307.

// SDK types
declare module './sdk/controlTypes.js' { const _: any; export = _; export default _; }
declare module '../entrypoints/sdk/controlTypes.js' { const _: any; export = _; export default _; }
declare module 'src/entrypoints/sdk/controlTypes.js' { const _: any; export = _; export default _; }
declare module './sdk/settingsTypes.generated.js' { const _: any; export = _; export default _; }
declare module './sdkUtilityTypes.js' { const _: any; export = _; export default _; }
declare module '../../entrypoints/sdk/sdkUtilityTypes.js' { const _: any; export = _; export default _; }
