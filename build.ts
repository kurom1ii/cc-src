/**
 * Build script for Claude Code CLI using Bun bundler.
 *
 * Usage:
 *   bun run build.ts            # Bundle only (outputs dist/cli.js)
 *   bun run build.ts --compile  # Bundle + compile to standalone executable
 */

const isCompile = process.argv.includes('--compile')

// All feature flags extracted from source code.
// Set to `false` to dead-code-eliminate (DCE) the feature at build time.
// Set to `true` to include the feature in the build.
const FEATURE_FLAGS: Record<string, boolean> = {
  ABLATION_BASELINE: false,
  AGENT_MEMORY_SNAPSHOT: false,
  AGENT_TRIGGERS: false,
  AGENT_TRIGGERS_REMOTE: false,
  ALLOW_TEST_VERSIONS: false,
  ANTI_DISTILLATION_CC: false,
  AUTO_THEME: true,
  AWAY_SUMMARY: true,
  BASH_CLASSIFIER: false,
  BG_SESSIONS: false,
  BREAK_CACHE_COMMAND: false,
  BRIDGE_MODE: false,
  BUDDY: false,
  BUILDING_CLAUDE_APPS: false,
  BUILTIN_EXPLORE_PLAN_AGENTS: true,
  BYOC_ENVIRONMENT_RUNNER: false,
  CACHED_MICROCOMPACT: true,
  CCR_AUTO_CONNECT: false,
  CCR_MIRROR: false,
  CCR_REMOTE_SETUP: false,
  CHICAGO_MCP: false,
  COMMIT_ATTRIBUTION: true,
  COMPACTION_REMINDERS: true,
  CONNECTOR_TEXT: false,
  CONTEXT_COLLAPSE: true,
  COORDINATOR_MODE: false,
  COWORKER_TYPE_TELEMETRY: false,
  DAEMON: false,
  DIRECT_CONNECT: false,
  DOWNLOAD_USER_SETTINGS: false,
  DUMP_SYSTEM_PROMPT: false,
  ENHANCED_TELEMETRY_BETA: false,
  EXPERIMENTAL_SKILL_SEARCH: false,
  EXTRACT_MEMORIES: true,
  FILE_PERSISTENCE: true,
  FORK_SUBAGENT: false,
  HARD_FAIL: false,
  HISTORY_PICKER: true,
  HISTORY_SNIP: true,
  HOOK_PROMPTS: true,
  IS_LIBC_GLIBC: false,
  IS_LIBC_MUSL: false,
  KAIROS: false,
  KAIROS_BRIEF: false,
  KAIROS_CHANNELS: false,
  KAIROS_DREAM: false,
  KAIROS_GITHUB_WEBHOOKS: false,
  KAIROS_PUSH_NOTIFICATION: false,
  LODESTONE: false,
  MCP_RICH_OUTPUT: true,
  MCP_SKILLS: true,
  MEMORY_SHAPE_TELEMETRY: false,
  MESSAGE_ACTIONS: false,
  MONITOR_TOOL: false,
  NATIVE_CLIENT_ATTESTATION: false,
  NATIVE_CLIPBOARD_IMAGE: false,
  NEW_INIT: true,
  OVERFLOW_TEST_TOOL: false,
  PERFETTO_TRACING: false,
  POWERSHELL_AUTO_MODE: false,
  PROACTIVE: false,
  PROMPT_CACHE_BREAK_DETECTION: false,
  QUICK_SEARCH: false,
  REACTIVE_COMPACT: true,
  REVIEW_ARTIFACT: false,
  RUN_SKILL_GENERATOR: false,
  SELF_HOSTED_RUNNER: false,
  SHOT_STATS: false,
  SKILL_IMPROVEMENT: false,
  SLOW_OPERATION_LOGGING: false,
  SSH_REMOTE: false,
  STREAMLINED_OUTPUT: true,
  TEAMMEM: false,
  TEMPLATES: false,
  TERMINAL_PANEL: false,
  TOKEN_BUDGET: true,
  TORCH: false,
  TRANSCRIPT_CLASSIFIER: false,
  TREE_SITTER_BASH: false,
  TREE_SITTER_BASH_SHADOW: false,
  UDS_INBOX: false,
  ULTRAPLAN: false,
  ULTRATHINK: false,
  UNATTENDED_RETRY: false,
  UPLOAD_USER_SETTINGS: false,
  VERIFICATION_AGENT: false,
  VOICE_MODE: false,
  WEB_BROWSER_TOOL: false,
  WORKFLOW_SCRIPTS: false,
}

async function build() {
  console.log(`[build] Starting Bun build...`)
  console.log(`[build] Mode: ${isCompile ? 'bundle + compile' : 'bundle only'}`)
  console.log(`[build] Features enabled: ${Object.entries(FEATURE_FLAGS).filter(([,v]) => v).map(([k]) => k).join(', ')}`)

  const result = await Bun.build({
    entrypoints: ['./src/entrypoints/cli.tsx'],
    outdir: './dist',
    target: 'bun',
    format: 'esm',
    sourcemap: 'linked',
    minify: false,
    splitting: false,
    // Build-time constants
    define: {
      // MACRO object — replaced at build time
      'MACRO.VERSION': JSON.stringify('2.1.88-dev'),
      'MACRO.VERSION_CHANGELOG': JSON.stringify(''),
      'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'MACRO.FEEDBACK_CHANNEL': JSON.stringify('#claude-code-feedback'),
      'MACRO.ISSUES_EXPLAINER': JSON.stringify('https://github.com/anthropics/claude-code/issues'),
      'MACRO.PACKAGE_URL': JSON.stringify('https://www.npmjs.com/package/@anthropic-ai/claude-code'),
      'MACRO.NATIVE_PACKAGE_URL': JSON.stringify(''),
      // Feature flags for bun:bundle's feature() API
      ...Object.fromEntries(
        Object.entries(FEATURE_FLAGS).map(([key, value]) => [
          `__FEATURE_${key}__`,
          String(value),
        ])
      ),
    },
    external: [
      // Node.js built-ins
      'node:*',
      // Native modules that can't be bundled
      'sharp',
      'color-diff-napi',
      'modifiers-napi',
      '@img/*',
      // OpenTelemetry exporters (optional, loaded dynamically)
      '@opentelemetry/exporter-metrics-otlp-grpc',
      '@opentelemetry/exporter-metrics-otlp-proto',
      '@opentelemetry/exporter-prometheus',
      '@opentelemetry/exporter-logs-otlp-grpc',
      '@opentelemetry/exporter-logs-otlp-proto',
      '@opentelemetry/exporter-trace-otlp-grpc',
      '@opentelemetry/exporter-trace-otlp-proto',
    ],
  })

  if (!result.success) {
    console.error('[build] Build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  console.log(`[build] Bundle created successfully:`)
  for (const output of result.outputs) {
    const sizeKB = (output.size / 1024).toFixed(1)
    console.log(`  ${output.path} (${sizeKB} KB)`)
  }

  if (isCompile) {
    console.log(`[build] Compiling standalone executable...`)
    const proc = Bun.spawn([
      'bun', 'build', '--compile',
      '--target=bun',
      '--outfile=./dist/claude',
      './dist/cli.js',
    ], {
      stdout: 'inherit',
      stderr: 'inherit',
    })
    const exitCode = await proc.exited
    if (exitCode !== 0) {
      console.error(`[build] Compile failed with exit code ${exitCode}`)
      process.exit(1)
    }
    console.log(`[build] Standalone executable created: ./dist/claude`)
  }

  console.log(`[build] Done!`)
}

build()
