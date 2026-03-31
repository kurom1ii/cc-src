# Claude Code Prompt Architecture

Phân tích hệ thống prompt của Claude Code CLI v2.1.88, trích xuất từ source map.

## Tổng quan

**53 prompt files** tổng cộng, chia thành 4 nhóm:

| Nhóm | Số file | Mô tả |
|------|---------|-------|
| `system/` | 7 | System prompt chính + safety + memory |
| `tools/` | 38 | Prompt cho từng tool (Bash, Edit, Agent...) |
| `services/` | 4 | Prompt cho compact, memory extraction, docs |
| `utils/` | 2 | Chrome automation, buddy companion |

---

## 1. System Prompt (`system/`)

### `prompts.ts` (915 dòng) — BỘ NÃO CHÍNH

File quan trọng nhất. Hàm `getSystemPrompt()` ghép toàn bộ system prompt từ nhiều section:

**Cấu trúc prompt assembly (theo thứ tự):**

```
1. Identity intro     → "You are Claude Code, Anthropic's official CLI..."
2. CYBER_RISK         → Safety instruction (từ Safeguards team)
3. System section     → Hook guidance, system reminders
4. Doing tasks        → Software engineering behavior rules
5. Actions            → Reversibility/blast radius awareness
6. Using tools        → Tool selection guidance (khi nào dùng tool nào)
7. Tone & style       → No emojis, concise, file_path:line_number format
8. Output efficiency  → "Go straight to the point", skip filler
── DYNAMIC BOUNDARY ──
9. Session guidance   → Session-specific context
10. Memory            → CLAUDE.md + auto memory
11. Environment info  → OS, shell, git, model, working dir
12. Language          → Response language setting
13. Output style      → Custom output styles
14. MCP instructions  → Connected MCP server instructions
15. Scratchpad        → Scratchpad directory info
16. FRC section       → Function result clearing reminder
17. Token budget      → Token target instructions (nếu có)
```

**Điểm thú vị:**
- Prompt chia làm **static** (cacheable, phía trên boundary) và **dynamic** (recompute mỗi turn)
- `systemPromptSection()` wrapper cho phép cache từng section riêng lẻ
- `DANGEROUS_uncachedSystemPromptSection()` dùng cho MCP instructions vì server connect/disconnect giữa turns
- Có "numeric length anchors" thử nghiệm: giới hạn 25 words giữa tool calls, 100 words cho response cuối — chỉ bật cho Anthropic internal users

### `cyberRiskInstruction.ts` (24 dòng) — SAFETY POLICY

Owned bởi Safeguards team (David Forsythe, Kyla Guru). Nội dung ngắn:
- Cho phép: defensive security, CTF, educational, pentesting có authorization
- Từ chối: DoS, mass targeting, supply chain compromise, detection evasion
- Dual-use tools cần authorization context rõ ràng

### `claudemd.ts` (1479 dòng) — MEMORY LOADER

Load và inject CLAUDE.md files vào system prompt. Thứ tự load:
1. Managed memory (enterprise)
2. User memory (`~/.claude/CLAUDE.md`)
3. Project memory (`CLAUDE.md` tại project root)
4. Local memory (`CLAUDE.local.md`)

### `teammatePromptAddendum.ts` — SWARM MODE

Prompt bổ sung cho teammate agents trong multi-agent mode. Giải thích visibility constraints và communication protocol.

---

## 2. Tool Prompts (`tools/`)

Mỗi tool có file prompt riêng, export `PROMPT` và `DESCRIPTION`. **Top 10 tools quan trọng nhất theo size:**

| Tool | Dòng | Chức năng chính |
|------|------|-----------------|
| **BashTool** | 369 | Hướng dẫn chạy shell commands, committing, PR, git safety |
| **AgentTool** | 287 | Spawn sub-agents, isolation, team workflow |
| **SkillTool** | 241 | Invoke user-defined skills, slash commands |
| **TodoWriteTool** | 184 | Task list management, khi nào nên/không nên dùng |
| **EnterPlanModeTool** | 170 | Plan mode entry, khi nào cần planning vs code trực tiếp |
| **PowerShellTool** | 145 | Windows PowerShell execution |
| **ScheduleCronTool** | 135 | Cron scheduling, timezone handling |
| **ToolSearchTool** | 122 | Search for available tools |
| **TeamCreateTool** | 113 | Multi-agent team creation |
| **ConfigTool** | 93 | Settings configuration |

### BashTool prompt highlights:
- **Git Safety Protocol**: NEVER update git config, NEVER force push, NEVER skip hooks, NEVER amend unless asked
- **Committing workflow**: parallel git status + diff + log → draft message → commit with `Co-Authored-By`
- **PR creation**: analyze ALL commits (not just latest), include test plan
- Prefer dedicated tools (Read/Edit/Glob/Grep) over bash equivalents

### AgentTool prompt highlights:
- Brief agents "like a smart colleague who just walked into the room"
- **"Never delegate understanding"** — không viết "based on your findings, fix the bug"
- Launch multiple agents in parallel khi có thể
- Foreground vs background guidance

---

## 3. Service Prompts (`services/`)

| Service | Dòng | Chức năng |
|---------|------|-----------|
| **compact** | 375 | Conversation compaction — tóm tắt history để giảm context |
| **sessionMemory** | 324 | Session memory read/write |
| **extractMemories** | 154 | Background memory extraction agent |
| **magicDocs** | 127 | Auto-update documentation |

### Compact prompt:
- Chạy khi conversation quá dài, cần tóm tắt
- Giữ lại: recent messages, active tasks, important decisions
- Loại bỏ: tool output đã processed, repetitive content

### Extract Memories prompt:
- Agent "fork" chạy background cùng system prompt + conversation prefix
- Tự động phát hiện và lưu: user preferences, project context, feedback patterns

---

## 4. Utility Prompts (`utils/`)

| File | Chức năng |
|------|-----------|
| **claudeInChrome** | Browser automation via Chrome extension |
| **buddy** | AI companion persona (fun mode) |

---

## Key Design Patterns

1. **Section-based caching**: Mỗi prompt section được cache riêng, chỉ recompute khi thay đổi → tối ưu prompt cache hit rate

2. **Feature flag gating**: Nhiều sections bọc trong `feature()` → DCE tại build time, chỉ include features đã bật

3. **Static vs Dynamic split**: `SYSTEM_PROMPT_DYNAMIC_BOUNDARY` chia prompt thành phần cố định (cache) và phần thay đổi mỗi turn

4. **Layered safety**: `CYBER_RISK_INSTRUCTION` inject ở tầng cao nhất, không thể bị override bởi CLAUDE.md hay plugins

5. **Tool prompt independence**: Mỗi tool tự quản lý prompt riêng, system prompt chỉ cung cấp guidance chung về khi nào dùng tool nào
