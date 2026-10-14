# Changes Log

## V6 Master Release (Executive Revision & Assessment Optimization)

1. **Enhanced Brand Vector Logo:**
   - Vectorized and regenerated the company logo as a pixel-perfect, crisp, anti-aliased SVG (`/company-logo.svg`) and high-resolution transparent PNG (`/company-logo.png`), eliminating camera glare, screen pixels, and angle distortion from the original photo.

2. **Executive Multi-Tab Frontend Suite (`public/index.html`):**
   - **Interactive 10-Test Preset Runner:** Direct 1-click execution for all official assessment scenarios (T01 - T10) with automatic employee switching and verified pass badges, plus a sequential "Run All Tests" batch runner.
   - **Live PostgreSQL Task Explorer:** Tab showing real-time rows in PostgreSQL `tasks` filtered by caller permissions.
   - **Security Audit Log Inspector (R6 Extra):** Tab displaying live entries from `audit_logs` demonstrating the blocking of unauthorized actions (T08, T02, T04).
   - **Company Policy Viewer:** Tab presenting the 6 official company policy rules.
   - **Bilingual (Arabic / English) & Dark / Light Theme:** Persistent state across sessions.
   - **Live Status & Timezone Badge:** Shows connection status to PostgreSQL and `Asia/Riyadh` timezone.

3. **Backend Helper Endpoints:**
   - Added `GET /api/employees` to load employee records dynamically from PostgreSQL.
   - Added `GET /api/tasks` strictly enforcing role-based permissions for the calling user.
   - Added `GET /api/audit-logs` for operational and security visibility.
   - Added `POST /api/reset` for convenient in-app demonstration resets.
   - Added `GET /api/status` exposing current server time in `Asia/Riyadh` and active LLM configuration.

4. **Parser & Normalization Resilience:**
   - Fixed regex replacement precedence in `cleanTaskDescription` so multi-word relative dates (e.g. `بعد بكرة`) take priority over single words (`بكرة`).
   - Reinforced name extraction fallback to avoid capturing command words or generic terms.
   - Added pre-validation sanitization (`cleanRawLlmJson`) and default fallback in `ParsedMessageSchema` for bulletproof LLM response parsing.
   - Added deterministic policy topic rescue for queries with strong policy hints.

5. **Automated Integration Test Suite:**
   - Added `tests/integration.test.ts` running all 10 official assessment scenarios end-to-end.
   - Total automated Vitest tests expanded to **25 tests**, all passing with 100% success rate.

6. **Comprehensive Documentation & Cost Analysis:**
   - Completely upgraded `DECISIONS.md` with full technical justification, a realistic mathematical cost calculation for 100 employees × 20 messages/day across GPT-4o-mini, Gemini 2.0 Flash, and hybrid routing, plus an extra-week production roadmap.
   - Restructured `README.md` highlighting exact code locations where role permissions are enforced (for the evaluation video).
   - Polished `scripts/run-task-cases.ts` to output a clean, formatted terminal summary report.
