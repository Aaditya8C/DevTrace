# DevTrace — Technical Interview Preparation Notes

> **Purpose:** This document is a deep technical reference for confidently explaining the DevTrace codebase in backend developer interviews. Every section is derived directly from the actual implementation.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Backend Architecture](#2-backend-architecture)
3. [Feature Breakdown](#3-feature-breakdown)
4. [API Reference](#4-api-reference)
5. [Data Models](#5-data-models)
6. [Security Implementation](#6-security-implementation)
7. [External Integrations](#7-external-integrations)
8. [Important Design Decisions](#8-important-design-decisions)
9. [Frequently Asked Interview Questions](#9-frequently-asked-interview-questions)
10. [My Contributions Summary](#10-my-contributions-summary)

---

## 1. Project Overview

### Purpose of the Application

**DevTrace** is a developer contribution intelligence tool. Given a GitHub repository URL and a GitHub username, it:
1. Clones the repository locally.
2. Performs a **single-pass traversal of all Git commits** attributed to that user.
3. Extracts file-level statistics, keyword intelligence from commit messages, and folder-level contribution data.
4. Classifies contributions into engineering domains (Frontend, Backend, Security, etc.).
5. Sends a structured contribution profile to an **AI provider** (Gemini, OpenRouter, or Ollama) which generates a recruiter-ready career report: contribution summaries, resume bullets, LinkedIn summary, and interview topics.
6. Returns the full `AnalysisResult` to the frontend for display.

### High-Level Architecture

```
[Frontend (Next.js)]
        │  HTTP (REST + Session Cookie)
        ▼
[Spring Boot Backend]
   ├── SecurityConfig (OAuth2 GitHub Login)
   ├── AnalysisController
   │       └── AnalysisService
   │               ├── RepositoryCloner (JGit)
   │               ├── ContributionAggregator
   │               │       ├── FileChangeAnalyzer
   │               │       ├── FolderAnalyzer
   │               │       └── KeywordAnalyzer
   │               ├── ContributionContextBuilder
   │               │       └── ContributionClassifier
   │               └── AiOrchestrator
   │                       ├── GeminiProvider   → Google Gemini API
   │                       ├── OpenRouterProvider → OpenRouter API
   │                       └── OllamaProvider   → Local Ollama
   ├── GithubApiController → GitHub REST API (v3)
   └── AuthController      → Session / OAuth2 user info
```

### Major Modules

| Module | Package | Responsibility |
|--------|---------|---------------|
| Controller Layer | `controller` | HTTP request/response mapping |
| Service Layer | `service` | Business logic coordination |
| Git Analysis Engine | `git` | Repository cloning + commit traversal |
| AI Layer | `ai` | Prompt building, provider abstraction, response parsing |
| Security Layer | `security` | OAuth2 GitHub login, session management |
| Configuration | `config` | Properties, CORS, async thread pool, Jackson |
| Exception Handling | `exception` | Global exception handler + custom exceptions |
| DTOs | `dto` | API request/response transfer objects |
| Models | `model` | Internal data structures, enums, records |

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | Java 21 |
| Framework | Spring Boot 4.0.6 |
| Security | Spring Security + Spring OAuth2 Client |
| Git Library | Eclipse JGit 7.3.0 |
| HTTP Client | Java 11 `java.net.http.HttpClient` (built-in) |
| JSON | Jackson (`jackson-databind`) |
| Boilerplate Reduction | Lombok |
| Validation | Jakarta Bean Validation (`spring-boot-starter-validation`) |
| Monitoring | Spring Boot Actuator |
| Frontend | Next.js 16.2.7 + React 19 + TypeScript |
| Containerization | Docker (multi-stage build, Eclipse Temurin JRE 21) |
| Build Tool | Maven (with Maven Wrapper) |

### Database Used

> **No relational database is used.** All analysis job state is held **in-memory** using a `ConcurrentHashMap` inside `AnalysisService`. This is intentional for the current scope — no JPA, no persistence layer.

### Authentication Mechanism

- **GitHub OAuth 2.0** via `spring-boot-starter-oauth2-client`.
- Users log in with GitHub; the backend stores the `OAuth2AuthorizedClient` (containing the access token) in the `OAuth2AuthorizedClientService`.
- Session is maintained via **HTTP session cookie (`JSESSIONID`)**.
- No JWT is used — this is session-based stateful authentication.

### External Integrations

| Integration | Purpose |
|------------|---------|
| GitHub OAuth API | User authentication |
| GitHub REST API (`api.github.com`) | Fetching user repositories list |
| Google Gemini API | AI report generation (primary provider) |
| OpenRouter API | AI fallback provider (accesses DeepSeek, etc.) |
| Ollama (local) | AI fallback for local LLM inference |
| JGit | Git clone, ls-remote, diff computation |

---

## 2. Backend Architecture

### Package Structure

```
com.devtrace.backend
├── BackendApplication.java              ← Entry point (@SpringBootApplication + @ConfigurationPropertiesScan)
├── ai/
│   ├── AiResponseParser.java            ← Strips markdown fences, deserializes JSON to AiContributionReport
│   ├── ContributionContext.java         ← Rich data object passed to AI layer
│   ├── PromptBuilder.java               ← Builds the LLM prompt from ContributionContext
│   ├── model/
│   │   ├── AiRequest.java               ← Internal model for OpenAI-compatible API requests
│   │   ├── AiResponse.java              ← Not used in hot path; present for reference
│   │   └── ProviderType.java            ← Enum: GEMINI, OPENROUTER, OLLAMA
│   ├── orchestrator/
│   │   └── AiOrchestrator.java          ← Routes to correct provider, records metrics, handles fallback
│   └── provider/
│       ├── AiProvider.java              ← Interface: 4 generation methods
│       ├── AbstractAiProvider.java      ← LRU cache + shared HTTP logic (template method pattern)
│       ├── GeminiProvider.java          ← Google Gemini API implementation
│       ├── OllamaProvider.java          ← Local Ollama implementation
│       └── OpenRouterProvider.java      ← OpenRouter API implementation
├── config/
│   ├── AiProperties.java                ← @ConfigurationProperties(prefix="ai") — provider config
│   ├── AsyncConfig.java                 ← ThreadPoolTaskExecutor (4 core, 8 max, 50 queue)
│   ├── CorsConfig.java                  ← WebMvcConfigurer for /api/** CORS
│   ├── DevTraceProperties.java          ← @ConfigurationProperties(prefix="devtrace") — temp dir, frontend URL
│   └── JacksonConfig.java               ← ObjectMapper @Bean
├── controller/
│   ├── AnalysisController.java          ← /api/analysis — start, status, result, verify
│   ├── AuthController.java              ← /api/auth/me — current user info
│   ├── GithubApiController.java         ← /api/github/repositories — GitHub API proxy
│   └── HealthController.java            ← /api/health — simple UP status
├── dto/
│   ├── AnalysisRequestDto.java          ← Input: repositoryUrl + githubUsername (@NotBlank, @Pattern)
│   ├── AnalysisResponseDto.java         ← Output: jobId
│   ├── GithubRepoDto.java               ← Output: name, owner, isPrivate, cloneUrl, updatedAt, language
│   ├── JobResultDto.java                ← Output: status + AnalysisResult + errorMessage
│   ├── JobStatusDto.java                ← Output: jobId + status + progress (0–100)
│   └── UserResponseDto.java             ← Output: authenticated, login, avatarUrl, name
├── exception/
│   ├── ErrorResponse.java               ← Generic error body (status, error, message, timestamp)
│   ├── GitException.java                ← RuntimeException for JGit failures
│   ├── GlobalExceptionHandler.java      ← @RestControllerAdvice — maps exceptions to HTTP responses
│   ├── JobNotFoundException.java        ← RuntimeException for missing job IDs
│   └── ValidationErrorResponse.java     ← Error body with field-level errors map
├── git/
│   ├── CommitAnalyzer.java              ← Per-commit diff stats (utility; largely superseded by aggregator)
│   ├── CommitStats.java                 ← Record: commit + files + added + deleted
│   ├── ContributionAggregator.java      ← CORE: single-pass JGit traversal, feeds all analyzers
│   ├── ContributionClassifier.java      ← Maps folder paths to engineering domain labels with colors
│   ├── ContributionContextBuilder.java  ← Pure transform: RawContributionData → ContributionContext
│   ├── FileChangeAnalyzer.java          ← Extension frequency + technology detection
│   ├── FolderAnalyzer.java              ← Folder path normalization + frequency tracking
│   ├── KeywordAnalyzer.java             ← Stop-word filtering + keyword normalization from commit messages
│   └── RepositoryCloner.java            ← JGit clone (with optional OAuth token) + delete
├── model/
│   ├── AiContributionReport.java        ← Output model: contributionSummary, resumeBullets, linkedInSummary, interviewTopics
│   ├── AnalysisJob.java                 ← In-memory job state machine: jobId, status, progress, result
│   ├── AnalysisResult.java              ← Final aggregated result: stats + AI report + breakdown
│   ├── AnalysisStatus.java              ← Enum: PENDING, RUNNING, COMPLETED, FAILED
│   ├── ContributionBreakdownItem.java   ← area + percentage + commits + filesChanged + color
│   ├── FileChangeResult.java            ← Record: extensionFrequency + change counts + technology list
│   ├── GitStatistics.java               ← totalCommits, filesModified, linesAdded, linesDeleted, period
│   ├── RawContributionData.java         ← Record: raw aggregator outputs (internal transfer object)
│   └── RepositoryAccessState.java       ← Enum: PUBLIC, PRIVATE_ACCESSIBLE, PRIVATE_NOT_ACCESSIBLE, NOT_FOUND
└── security/
    ├── GithubUser.java                  ← @Builder Lombok POJO: id, login, name, avatarUrl, email
    ├── OAuth2LoginFailureHandler.java   ← Redirects to frontend with ?error=oauth_denied
    ├── OAuth2LoginSuccessHandler.java   ← Redirects to frontend /analyze on success
    ├── SecurityConfig.java              ← SecurityFilterChain — CORS, CSRF off, route rules, OAuth2 + logout
    └── SessionService.java              ← Reads OAuth2AuthenticationToken from SecurityContext
```

### Layered Architecture

```
HTTP Request
    │
    ▼
[Controller] — Receives HTTP, validates input, delegates to service, maps to DTO
    │
    ▼
[Service] — Orchestrates business logic, manages async execution
    │
    ├─▶ [git package] — JGit operations (clone, walk, diff, analyze)
    │
    └─▶ [ai package] — AI prompt building, provider routing, response parsing
```

### Key Spring Boot Concepts Used

1. **`@RestController`** — combines `@Controller` + `@ResponseBody`; returns JSON directly.
2. **`@RequestMapping` / `@PostMapping` / `@GetMapping`** — URL + method binding.
3. **`@Valid` + `@RequestBody`** — triggers Bean Validation on incoming DTOs.
4. **`@PathVariable` / `@RequestParam`** — binds URI segments and query parameters.
5. **`@Service` / `@Component`** — marks beans for Spring's component scan.
6. **Constructor Injection** — used exclusively throughout the project (no `@Autowired` on fields).
7. **`@ConfigurationProperties`** — strongly-typed config binding for `ai.*` and `devtrace.*` prefixes.
8. **`@ConfigurationPropertiesScan`** — on main class; scans for all `@ConfigurationProperties` beans.
9. **`@RestControllerAdvice` + `@ExceptionHandler`** — centralized exception-to-HTTP mapping.
10. **`@EnableAsync` + `ThreadPoolTaskExecutor`** — async background processing.
11. **`@Qualifier("taskExecutor")`** — disambiguates the injected `Executor` bean in `AnalysisService`.
12. **`@Bean`** — explicit bean registration (`ObjectMapper`, `taskExecutor`, `corsConfigurer`).
13. **`@Value`** — property injection in `OAuth2LoginSuccessHandler` and `OAuth2LoginFailureHandler`.

---

## 3. Feature Breakdown

---

### Feature 1: GitHub OAuth2 Login

#### Purpose

Allows users to authenticate with their GitHub account so the backend can obtain a GitHub OAuth access token. This token is later used to clone private repositories and fetch the user's repository list.

#### Files Involved

- `SecurityConfig.java` — configures the OAuth2 login filter chain
- `OAuth2LoginSuccessHandler.java` — handles successful login redirect
- `OAuth2LoginFailureHandler.java` — handles failed/denied login redirect
- `SessionService.java` — reads the authenticated user + access token from the security context
- `AuthController.java` — exposes `/api/auth/me` endpoint
- `GithubUser.java` — Lombok POJO representing the authenticated user
- `UserResponseDto.java` — API response shape
- `application.yml` — GitHub OAuth client ID/secret config

#### Flow

1. User clicks "Login with GitHub" on frontend → browser is redirected to `/oauth2/authorization/github`.
2. Spring Security redirects the browser to GitHub's OAuth consent page.
3. GitHub redirects back to `/login/oauth2/code/github` with an authorization code.
4. Spring Security exchanges the code for an access token and stores the `OAuth2AuthorizedClient`.
5. `OAuth2LoginSuccessHandler.onAuthenticationSuccess()` redirects the browser to `${frontendUrl}/analyze`.
6. Frontend calls `GET /api/auth/me` — `AuthController` delegates to `SessionService.isAuthenticated()`.
7. `SessionService` reads `OAuth2AuthenticationToken` from `SecurityContextHolder`, extracts `OAuth2User` attributes (`login`, `name`, `avatar_url`, `id`, `email`) and builds a `GithubUser` object.
8. `UserResponseDto(authenticated=true, login, avatarUrl, name)` is returned.

#### Interview Explanation

> "I implemented GitHub OAuth2 login using Spring Security's built-in `oauth2Login()` DSL. The GitHub client ID and secret are injected from environment variables. On success, a custom `SimpleUrlAuthenticationSuccessHandler` redirects the browser back to the Next.js frontend's `/analyze` page. The OAuth access token is stored internally by Spring's `OAuth2AuthorizedClientService` and I retrieve it later on demand via `SessionService.getOAuthToken()` — which reads from the `SecurityContextHolder`. I chose session-based authentication (no JWT) because the app is a browser-based SPA that naturally supports HTTP session cookies, and this approach gave me access to the full OAuth token without implementing a token relay."

---

### Feature 2: Analysis Job Submission & Async Processing

#### Purpose

Accepts a repository URL and GitHub username, creates a tracking job, and kicks off the entire analysis pipeline asynchronously so the HTTP response returns immediately with a `jobId` that the client can poll.

#### Files Involved

- `AnalysisController.java` — `POST /api/analysis/start`
- `AnalysisService.java` — core orchestration
- `AsyncConfig.java` — `ThreadPoolTaskExecutor` configuration
- `AnalysisRequestDto.java` — input validation
- `AnalysisResponseDto.java` — returns `jobId`
- `AnalysisJob.java` — in-memory job state
- `AnalysisStatus.java` — `PENDING → RUNNING → COMPLETED / FAILED`

#### Flow

1. `POST /api/analysis/start` → `AnalysisController.startAnalysis()` with `@Valid @RequestBody AnalysisRequestDto`.
2. Bean Validation fires: `@NotBlank` on both fields; `@Pattern` validates GitHub URL format (`^https?://github\.com/[^/]+/[^/]+$`).
3. `AnalysisService.submitAnalysis()` generates a `UUID.randomUUID()` job ID.
4. An `AnalysisJob` object is created with `status=PENDING, progress=0` and stored in the `ConcurrentHashMap<String, AnalysisJob> jobStore`.
5. **Critical design choice:** The OAuth token is resolved on the HTTP request thread (`sessionService.getOAuthToken()`) before handing off to the async thread — because `SecurityContextHolder` is not available in a different thread by default.
6. `taskExecutor.execute(() -> processAnalysis(jobId, token))` submits the task to the `ThreadPoolTaskExecutor` (4 core, 8 max, 50 queue).
7. The HTTP response returns immediately with `{"jobId": "<uuid>"}`.
8. In the background, `processAnalysis()` runs through the full pipeline (clone → aggregate → build context → AI report → set result).

#### Interview Explanation

> "I used Spring's `ThreadPoolTaskExecutor` for async processing. The key challenge was that `SecurityContextHolder` stores the security context in a thread-local — so the OAuth token would be null if read inside the async thread. I solved this by resolving the token on the request thread before calling `taskExecutor.execute()`, then passing it explicitly to the async method. I explicitly avoided using `@Async` on the service method itself because that only works when the async call comes from an external caller (due to Spring's proxy-based AOP) — calling `@Async` from within the same bean bypasses the proxy and runs synchronously."

---

### Feature 3: Repository Cloning

#### Purpose

Clones the target GitHub repository to a temporary local directory so the git analysis engine can traverse commit history without making API calls per commit.

#### Files Involved

- `RepositoryCloner.java`
- `DevTraceProperties.java` — temp directory path (`${java.io.tmpdir}/devtrace/repos`)
- `AnalysisService.java` — calls `repositoryCloner.cloneRepository(url, tempRepoDir, token)`

#### Flow

1. `AnalysisService.processAnalysis()` computes `tempRepoDir = Paths.get(devTraceProperties.getTempDirectory(), jobId)`.
2. `RepositoryCloner.cloneRepository(url, path, token)` is called.
3. Uses `Git.cloneRepository()` (JGit API) with `.setURI(repositoryUrl)`, `.setDirectory(path)`, `.setCloneAllBranches(false)`.
4. If a non-null token is provided, sets `UsernamePasswordCredentialsProvider(token, "")` — GitHub accepts the OAuth token as the username with an empty password.
5. Catches `TransportException` for auth failures and wraps it in a `GitException`.
6. After analysis completes (or fails), `repositoryCloner.deleteRepository(tempRepoDir)` is called in the `finally` block, using `Files.walk()` sorted in reverse order to delete files before directories.

#### Interview Explanation

> "I used JGit's `Git.cloneRepository()` to programmatically clone repositories. For private repo access, GitHub's OAuth token is passed as the username to `UsernamePasswordCredentialsProvider` — GitHub's HTTPS authentication protocol accepts the token in this position with an empty password string. The repository is cloned into a job-specific temp directory (using the job UUID as the folder name to prevent collision). Cleanup is always performed in a `finally` block regardless of success or failure. For public repos, no token is needed and the clone is done anonymously."

---

### Feature 4: Repository Access Verification

#### Purpose

Before submitting an analysis, the frontend checks whether the given repository URL is accessible — PUBLIC, accessible PRIVATE (user is logged in), or inaccessible.

#### Files Involved

- `AnalysisController.java` — `GET /api/analysis/verify?repositoryUrl=...`
- `AnalysisService.verifyRepositoryAccess()`
- `RepositoryAccessState.java` — enum: `PUBLIC`, `PRIVATE_ACCESSIBLE`, `PRIVATE_NOT_ACCESSIBLE`, `NOT_FOUND`
- `SessionService.java` — used to check if OAuth token exists

#### Flow

1. `GET /api/analysis/verify?repositoryUrl=<url>` → `verifyRepositoryAccess()`.
2. First, attempts `Git.lsRemoteRepository().setRemote(url).call()` **anonymously** (no credentials).
3. If it succeeds → returns `PUBLIC`.
4. If it throws `TransportException` with "Authentication is required" or "not authorized" → repository is private.
5. Checks if user is authenticated (`sessionService.isAuthenticated()`).
6. If authenticated, retries `lsRemoteRepository` with the OAuth token as `UsernamePasswordCredentialsProvider`.
7. If the retry succeeds → `PRIVATE_ACCESSIBLE`.
8. If the retry fails → `PRIVATE_NOT_ACCESSIBLE`.
9. Any other exception (invalid URL, network error) → `NOT_FOUND`.

#### Interview Explanation

> "The verification endpoint uses JGit's `lsRemoteRepository` which is a lightweight operation — it only fetches the remote's reference list without cloning anything. This is perfect for access checks. The function implements a tiered fallback: first try anonymously, then with the stored OAuth token. The result enum allows the frontend to render contextually correct UI — showing 'Login to access private repo' or 'Repository not found' based on the exact state."

---

### Feature 5: Single-Pass Git Contribution Aggregation

#### Purpose

Traverses all commits in the cloned repository and collects contribution data for a specific GitHub user in a single pass. This replaces a naive multi-pass approach that would parse commits multiple times.

#### Files Involved

- `ContributionAggregator.java` — orchestrates the single-pass traversal
- `FileChangeAnalyzer.java` — tracks file extension frequencies and change types
- `FolderAnalyzer.java` — tracks folder modification frequency
- `KeywordAnalyzer.java` — extracts and normalizes keywords from commit messages
- `CommitAnalyzer.java` — utility for per-commit diff stats (used internally by aggregator)
- `RawContributionData.java` — Java record that carries all raw outputs
- `FileChangeResult.java` — Java record from `FileChangeAnalyzer`

#### Flow

1. `ContributionAggregator.aggregate(repoPath, githubUsername)` is called.
2. Opens the `.git` directory using `FileRepositoryBuilder`.
3. All three analyzers are `reset()` to clear any prior state.
4. `git.log().call()` returns all commits in reverse chronological order.
5. For each `RevCommit`, `matchesAuthor()` checks if the commit's author name or email contains the target username (case-insensitive substring match).
6. For matching commits:
   - Short message is added to `commitMessages` list.
   - `keywordAnalyzer.processCommitMessage()` tokenizes and normalizes the message.
   - Commit date is tracked for first/last range calculation.
   - Diffs are computed once using `DiffFormatter` by comparing commit tree to parent tree (or `EmptyTreeIterator` for initial commit).
   - Line counts (`edit.getLengthB()` for added, `edit.getLengthA()` for deleted) are accumulated.
   - Diffs are fed to **both** `fileChangeAnalyzer.processDiffs()` and `folderAnalyzer.processDiffs()`.
7. Returns a `RawContributionData` record with all aggregated data.

#### Key Implementation Details

- **`DiffFormatter`** with `DisabledOutputStream.INSTANCE` — suppresses raw diff output to save memory.
- **`df.setDetectRenames(true)`** — rename detection prevents over-counting deleted+added as two separate changes.
- **`CanonicalTreeParser`** — used to parse commit tree objects for diff comparison.
- **`EmptyTreeIterator`** — handles initial commits (no parent) by comparing against an empty tree.
- The `matchesAuthor()` method uses `toLowerCase()` + `contains()` substring matching to handle cases where the full name contains the username, or the email prefix matches the username.

#### Interview Explanation

> "I refactored the contribution analysis from a multi-pass approach to a single-pass design. In one traversal, each commit's diff is computed once and simultaneously fed to the FileChangeAnalyzer, FolderAnalyzer, and KeywordAnalyzer. This avoids the overhead of re-traversing the commit graph multiple times and opening the repository multiple times. JGit's `DiffFormatter` does the heavy lifting of computing edit lists from tree comparisons. For the initial commit (no parent), I use JGit's `EmptyTreeIterator` to compare the tree against nothing."

---

### Feature 6: Contribution Context Building & Classification

#### Purpose

Transforms raw analyzer outputs into a semantically rich `ContributionContext` object that the AI layer can consume without needing access to raw git data.

#### Files Involved

- `ContributionContextBuilder.java` — pure transformation, no I/O
- `ContributionClassifier.java` — maps folder paths to engineering domain labels
- `ContributionContext.java` — the structured output passed to AI
- `KeywordAnalyzer.java` — `getTopKeywords(15)` called here
- `FolderAnalyzer.java` — `getTopFolders(10)` called here

#### Flow (inside `ContributionContextBuilder.build()`)

1. **Contribution period**: computed using `ChronoUnit.DAYS.between()` and `ChronoUnit.MONTHS.between()` on the first/last commit dates from `RawContributionData`.
2. **Top folders**: `folderAnalyzer.getTopFolders(10)` — sorted by frequency, top 10.
3. **Top keywords**: `keywordAnalyzer.getTopKeywords(15)` — sorted by frequency, top 15.
4. **Contribution breakdown**: `ContributionClassifier.classify(folderFrequency, totalCommits)`:
   - Iterates folder paths, matches them against `ClassificationRule` records (e.g., `"controller"`, `"service"` → "REST API Development").
   - Accumulates commit counts per domain.
   - Calculates percentage = `(domainCount / totalWeight) * 100`, rounded.
   - Assigns colors from a predefined palette (`#6366f1`, `#8b5cf6`, etc.).
5. **Primary areas**: top 5 domain labels from the breakdown.
6. **Major activities**: `deriveMajorActivities()` filters keyword frequency map against a hardcoded `activityKeywords` set, then formats them (e.g., `"refactoring"` → `"Refactoring"`).
7. **Technology indicators**: from `FileChangeResult.technologyIndicators()` — mapped from `EXTENSION_TECH_MAP` in `FileChangeAnalyzer`.
8. **Commit messages**: `extractDescriptiveCommits()` filters out merge commits, WIP, "initial commit", and very short messages (< 12 chars), returning up to 30 unique messages.
9. All fields are assembled into a `ContributionContext` object and returned.

#### `ContributionClassifier` Pattern

Uses Java 16+ **sealed record** syntax internally (`private record ClassificationRule(String label, List<String> patterns) {}`). Rules are evaluated in-order; the first folder segment matching a pattern wins. Root-level files are excluded by `FolderAnalyzer` (no folder → no classification contribution).

#### Interview Explanation

> "The `ContributionContextBuilder` is a pure transformation component — no JGit calls, no network I/O, no state. It takes a `RawContributionData` record from the aggregation step and transforms it into a `ContributionContext` that the AI layer needs. The separation is intentional: the Git analysis and the AI-facing representation are completely decoupled. The `ContributionClassifier` uses pattern-matching rules against folder paths — for example, if a user modified files in `controller/` or `api/` folders, that gets classified as 'REST API Development'. Percentages are derived from folder frequency weights relative to total."

---

### Feature 7: AI Report Generation with Provider Fallback

#### Purpose

Sends the structured `ContributionContext` to an LLM (Large Language Model) and receives a structured JSON report with contribution summaries, resume bullets, a LinkedIn summary, and interview topics.

#### Files Involved

- `AiOrchestrator.java` — routes to providers, handles fallbacks, tracks metrics
- `AiProvider.java` — interface with 4 generation methods
- `AbstractAiProvider.java` — template method: LRU cache + shared OpenAI-compatible HTTP logic
- `GeminiProvider.java` — Google Gemini API (`generativelanguage.googleapis.com`)
- `OpenRouterProvider.java` — OpenRouter API (`openrouter.ai/api/v1/chat/completions`)
- `OllamaProvider.java` — local Ollama (`localhost:11434/v1/chat/completions`)
- `PromptBuilder.java` — assembles the full LLM prompt from `ContributionContext`
- `AiResponseParser.java` — strips markdown fences, parses JSON into `AiContributionReport`
- `AiProperties.java` — `@ConfigurationProperties(prefix="ai")` binding
- `AiContributionReport.java` — deserialized report model

#### Provider Fallback Logic (AiOrchestrator)

```
getProviderOrder() → ["gemini", "openrouter", "ollama"] (from ai.properties)

for each providerKey in order:
    beanName = providerKey + "Provider"   // e.g., "geminiProvider"
    provider = providerMap.get(beanName)  // Spring injects Map<String, AiProvider>
    try:
        summary     = provider.generateContributionSummary(context)
        resume      = provider.generateResumeBullets(context)
        linkedin    = provider.generateLinkedInSummary(context)
        topics      = provider.generateInterviewTopics(context)
        return AiContributionReport(summary, resume, linkedin, topics)
    catch:
        recordFailure(); try next provider

if all fail → throw RuntimeException("All configured AI providers failed")
```

#### LRU Cache in AbstractAiProvider

- Uses `Collections.synchronizedMap(new LinkedHashMap<>(..., true))` with `removeEldestEntry()` override.
- Cache key: `ContributionContext` (uses default `equals`/`hashCode` from Lombok's `@Data`).
- Cache limit: 50 entries.
- **Important:** When any of the 4 `generate*` methods is called, `getReport(context)` first checks the cache. If present, all 4 outputs are retrieved from the cached report without making a second API call.

#### PromptBuilder

The prompt is constructed as a Java **text block** (Java 15+ feature). It includes:
- Repository name, commit count, files modified, lines added/deleted, contribution period.
- Primary engineering focus areas (bullets).
- Major activities (bullets).
- Technology stack (comma-separated).
- Contribution breakdown (per-area percentages).
- Top modified directories.
- Key themes from commit keywords.
- File type breakdown.
- Actual descriptive commit messages (up to 30).

The AI is instructed to return **raw JSON only** (no markdown code fences), matching the `AiContributionReport` schema.

#### AiResponseParser

- Trims the response and strips `\`\`\`json` and `\`\`\`` prefixes/suffixes if present (handling non-compliant LLM outputs).
- Deserializes the cleaned JSON string into `AiContributionReport` using Jackson `ObjectMapper`.

#### Gemini vs OpenRouter vs Ollama API Shape

| Aspect | Gemini | OpenRouter / Ollama |
|--------|--------|---------------------|
| Endpoint | `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | `/v1/chat/completions` |
| Request shape | `{ contents: [{ parts: [{ text: prompt }] }] }` | `{ model, messages: [{role, content}], temperature: 0.7 }` |
| Response path | `candidates[0].content.parts[0].text` | `choices[0].message.content` |
| Auth | API key in URL query param | `Authorization: Bearer <key>` header |
| Timeout | 30 seconds | 30s (OpenRouter), 60s (Ollama) |

#### Interview Explanation

> "I designed the AI layer using the **Strategy + Template Method** pattern. `AiProvider` is the interface; `AbstractAiProvider` implements the caching logic and shared HTTP utilities (for OpenAI-compatible APIs), and each concrete provider only implements `executeReportGeneration()`. The `AiOrchestrator` discovers providers by name from Spring's `Map<String, AiProvider>` injection — Spring auto-injects all beans of type `AiProvider` keyed by their bean name. Fallback order is configured externally in `application.yml`. The orchestrator also records per-provider latency and success/failure metrics using `ConcurrentHashMap` counters. The AI failure is isolated — if all providers fail, the job still completes with git statistics, just without the AI report."

---

### Feature 8: GitHub Repositories Listing

#### Purpose

Proxies the GitHub REST API to return a list of the authenticated user's repositories so the frontend can display a repository picker.

#### Files Involved

- `GithubApiController.java` — `GET /api/github/repositories`
- `SessionService.java` — provides the OAuth token
- `GithubRepoDto.java` — response shape per repository

#### Flow

1. `GET /api/github/repositories` — secured by `SecurityConfig` (`.requestMatchers("/api/github/**").authenticated()`).
2. `SessionService.getOAuthToken()` retrieves the user's OAuth token.
3. Constructs an HTTP request to `https://api.github.com/user/repos?sort=updated&per_page=100`.
4. Sets headers: `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`.
5. Sends using `java.net.http.HttpClient` (blocking `httpClient.send()`).
6. Parses JSON response with `ObjectMapper.readTree()`.
7. Maps each JSON node to `GithubRepoDto(name, owner, isPrivate, cloneUrl, updatedAt, language)`.
8. Returns `List<GithubRepoDto>`.
9. If GitHub returns non-200 → forward that status code. On exception → 500.

#### Design Notes

- Uses Java's built-in `HttpClient` instead of Spring's `RestTemplate` or `WebClient` — avoids adding a dependency for a simple use case.
- Nullability is handled with `node.has("language") && !node.get("language").isNull()`.

#### Interview Explanation

> "The GitHub repositories endpoint is a thin proxy — it takes the stored OAuth token, calls `api.github.com/user/repos`, parses the JSON with Jackson's `JsonNode` tree API, and maps it to a typed DTO list. I used Java's native `java.net.http.HttpClient` (introduced in Java 11) instead of Spring's `RestTemplate` to keep dependencies minimal. The endpoint is secured — only authenticated users can call it, enforced at the security filter chain level, not in the controller code itself."

---

### Feature 9: Job Polling (Status & Result)

#### Purpose

Allows the frontend to poll for the progress and eventual result of a running analysis job.

#### Files Involved

- `AnalysisController.java` — `GET /api/analysis/{jobId}/status`, `GET /api/analysis/{jobId}/result`
- `AnalysisService.getJob(jobId)`
- `JobStatusDto.java` — returns `jobId`, `status`, `progress`
- `JobResultDto.java` — returns `status`, `AnalysisResult`, `errorMessage`
- `JobNotFoundException.java` — thrown when jobId not found
- `GlobalExceptionHandler.java` — maps to HTTP 404

#### Flow

1. Frontend polls `GET /api/analysis/{jobId}/status` every N seconds.
2. `getJob(jobId)` looks up the `ConcurrentHashMap` — throws `JobNotFoundException` if not found.
3. `GlobalExceptionHandler.handleJobNotFound()` catches it → `404 { status, error, message, timestamp }`.
4. If found, maps `AnalysisJob` → `JobStatusDto` with current `status` and `progress` (0–100 integer).
5. When `status == COMPLETED`, frontend calls `GET /api/analysis/{jobId}/result`.
6. Returns `JobResultDto` with the full `AnalysisResult` (stats + AI report + breakdown + extensions + keywords + technology indicators).

#### Progress Steps

| Progress | Stage |
|----------|-------|
| 0% | PENDING |
| 10% | RUNNING started |
| 20% | Pre-clone |
| 40% | Clone complete |
| 60% | Aggregation complete |
| 70% | Context built |
| 90% | AI report done |
| 100% | COMPLETED or FAILED |

---

### Feature 10: Keyword Extraction & Normalization

#### Purpose

Extracts meaningful engineering terms from commit messages by filtering noise (stop words) and normalizing verb tenses to canonical forms (e.g., "refactored" → "refactoring").

#### Files Involved

- `KeywordAnalyzer.java`
- `ContributionContextBuilder.java` — calls `getTopKeywords(15)` and `deriveMajorActivities()`

#### How it Works

1. Each commit message is split on non-alphanumeric characters (regex `[^a-zA-Z0-9\s-]` → space).
2. Tokens shorter than 3 characters are discarded.
3. `STOP_WORDS` set (95+ words) filters out generic verbs ("fix", "add", "update"), merge noise, and common English words.
4. `NORMALIZATION_MAP` (30+ entries) converts past tense / variant forms to the canonical form:
   - `"refactored"` / `"refactor"` / `"refactors"` → `"refactoring"`
   - `"validated"` / `"validate"` → `"validation"`
   - `"integrated"` → `"integration"`, etc.
5. Frequency is accumulated with `keywordFrequency.merge(normalized, 1, Integer::sum)`.
6. `getTopKeywords(15)` returns the 15 highest-frequency keywords.
7. `deriveMajorActivities()` further filters against an `activityKeywords` set to surface engineering activity labels.

---

## 4. API Reference

### POST /api/analysis/start

**Method:** POST  
**Path:** `/api/analysis/start`  
**Security:** Public (but OAuth token captured from session if available)

**Request Payload:**
```json
{
  "repositoryUrl": "https://github.com/owner/repo",
  "githubUsername": "octocat"
}
```

**Validation Rules:**
- `repositoryUrl`: `@NotBlank` + `@Pattern(regexp = "^https?://github\\.com/[^/]+/[^/]+$")`
- `githubUsername`: `@NotBlank`

**Response Payload:**
```json
{ "jobId": "550e8400-e29b-41d4-a716-446655440000" }
```

**Controller File:** `AnalysisController.java`  
**Service File:** `AnalysisService.java`  

**Execution Flow:**
1. Validation → `submitAnalysis()` → UUID generated → `AnalysisJob` stored → token resolved → async task submitted → `jobId` returned immediately.

**Error Response (validation failure):**
```json
{
  "status": 400,
  "error": "Validation Failed",
  "errors": { "repositoryUrl": "Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)" },
  "timestamp": "..."
}
```

---

### GET /api/analysis/{jobId}/status

**Method:** GET  
**Path:** `/api/analysis/{jobId}/status`  
**Security:** Public

**Response Payload:**
```json
{
  "jobId": "...",
  "status": "RUNNING",
  "progress": 60
}
```

Status values: `PENDING | RUNNING | COMPLETED | FAILED`

---

### GET /api/analysis/{jobId}/result

**Method:** GET  
**Path:** `/api/analysis/{jobId}/result`  
**Security:** Public

**Response Payload (COMPLETED):**
```json
{
  "status": "COMPLETED",
  "result": {
    "statistics": {
      "totalCommits": 142,
      "filesModified": 389,
      "linesAdded": 12041,
      "linesDeleted": 4210,
      "contributionPeriod": "5 months"
    },
    "aiReport": {
      "contributionSummary": ["..."],
      "resumeBullets": ["..."],
      "linkedInSummary": "...",
      "interviewTopics": ["..."]
    },
    "contributionBreakdown": [
      { "area": "Frontend Development", "percentage": 45, "commits": 64, "filesChanged": 112, "color": "#6366f1" }
    ],
    "fileExtensions": { ".tsx": 89, ".java": 67 },
    "topKeywords": ["authentication", "refactoring", "api"],
    "technologyIndicators": ["TypeScript", "React", "Java"]
  },
  "errorMessage": null
}
```

---

### GET /api/analysis/verify

**Method:** GET  
**Path:** `/api/analysis/verify?repositoryUrl=https://github.com/owner/repo`  
**Security:** Public

**Response:** Enum string — `PUBLIC | PRIVATE_ACCESSIBLE | PRIVATE_NOT_ACCESSIBLE | NOT_FOUND`

---

### GET /api/auth/me

**Method:** GET  
**Path:** `/api/auth/me`  
**Security:** Public (returns `authenticated: false` if not logged in)

**Response:**
```json
{
  "authenticated": true,
  "login": "octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/u/...",
  "name": "The Octocat"
}
```

---

### GET /api/github/repositories

**Method:** GET  
**Path:** `/api/github/repositories`  
**Security:** Authenticated only (`/api/github/**` → `authenticated()`)

**Response:**
```json
[
  {
    "name": "my-project",
    "owner": "octocat",
    "private": false,
    "cloneUrl": "https://github.com/octocat/my-project.git",
    "updatedAt": "2026-06-01T10:00:00Z",
    "language": "Java"
  }
]
```

---

### GET /api/health

**Method:** GET  
**Path:** `/api/health`  
**Security:** Public

**Response:** `{ "status": "UP" }`

---

### POST /api/auth/logout

**Method:** POST  
**Path:** `/api/auth/logout`  
**Security:** Any authenticated user

Invalidates the HTTP session, clears authentication, deletes `JSESSIONID` cookie. Returns HTTP 200.

---

## 5. Data Models

### AnalysisJob

**File:** `model/AnalysisJob.java`  
**Type:** Lombok `@Data` POJO  
**Storage:** In-memory `ConcurrentHashMap<String, AnalysisJob>` in `AnalysisService`

| Field | Type | Description |
|-------|------|-------------|
| `jobId` | `String` | UUID — primary key in the map |
| `status` | `AnalysisStatus` | PENDING → RUNNING → COMPLETED / FAILED |
| `progress` | `int` | 0–100 polled by frontend |
| `repositoryUrl` | `String` | Target repository |
| `githubUsername` | `String` | Target contributor |
| `startedAt` | `LocalDateTime` | Job creation time |
| `completedAt` | `LocalDateTime` | Set on completion |
| `result` | `AnalysisResult` | Populated on COMPLETED |
| `errorMessage` | `String` | Populated on FAILED |

---

### AnalysisResult

**File:** `model/AnalysisResult.java`  
**Type:** Lombok `@Data` POJO

| Field | Type | Description |
|-------|------|-------------|
| `statistics` | `GitStatistics` | Raw commit/line/file counts |
| `aiReport` | `AiContributionReport` | AI-generated career content (nullable) |
| `contributionBreakdown` | `List<ContributionBreakdownItem>` | Per-domain breakdown with colors |
| `fileExtensions` | `Map<String, Integer>` | Extension → file count |
| `topKeywords` | `List<String>` | Top 15 commit message keywords |
| `technologyIndicators` | `List<String>` | Technologies derived from extensions |

---

### RawContributionData

**File:** `model/RawContributionData.java`  
**Type:** Java 16 `record` (immutable)  
**Purpose:** Internal transfer object between `ContributionAggregator` and `ContributionContextBuilder`. Never exposed via API.

---

### ContributionContext

**File:** `ai/ContributionContext.java`  
**Type:** Lombok `@Data` POJO  
**Purpose:** The processed data structure passed to the AI layer. Contains pre-analyzed intelligence so the AI only polishes output, never receives raw diffs.

---

### AiContributionReport

**File:** `model/AiContributionReport.java`  
**Type:** Lombok `@Data` POJO  
**Purpose:** Direct deserialization target of the AI's JSON response.

| Field | Type |
|-------|------|
| `contributionSummary` | `List<String>` |
| `resumeBullets` | `List<String>` |
| `linkedInSummary` | `String` |
| `interviewTopics` | `List<String>` |

---

### FileChangeResult

**File:** `model/FileChangeResult.java`  
**Type:** Java `record` (immutable)

| Field | Type |
|-------|------|
| `extensionFrequency` | `Map<String, Integer>` |
| `filesAdded` | `int` |
| `filesModified` | `int` |
| `filesDeleted` | `int` |
| `technologyIndicators` | `List<String>` |

---

### ContributionBreakdownItem

**File:** `model/ContributionBreakdownItem.java`  
**Type:** Lombok `@Data` POJO

| Field | Type | Example |
|-------|------|---------|
| `area` | `String` | `"Frontend Development"` |
| `percentage` | `int` | `45` |
| `commits` | `int` | `64` |
| `filesChanged` | `int` | `112` |
| `color` | `String` | `"#6366f1"` |

---

### RepositoryAccessState

**File:** `model/RepositoryAccessState.java`  
**Type:** Enum

```java
PUBLIC                  // Anonymous ls-remote succeeded
PRIVATE_ACCESSIBLE      // Anonymous failed, OAuth token succeeded
PRIVATE_NOT_ACCESSIBLE  // Both failed (private, no access)
NOT_FOUND               // Invalid URL or network error
```

---

## 6. Security Implementation

### SecurityConfig Overview

**File:** `security/SecurityConfig.java`  
**Annotation:** `@Configuration @EnableWebSecurity`  

The `SecurityFilterChain` bean configures:

1. **CORS** — delegates to `CorsConfig` bean (`/api/**` → frontend origin only, `allowCredentials(true)` for session cookies).
2. **CSRF** — disabled (`csrf.disable()`) because the API is consumed by a same-origin Next.js SPA and CORS + credentials provide sufficient protection.
3. **Authorization Rules:**
   - `/api/health`, `/actuator/**` → `permitAll()`
   - `/api/analysis/**` → `permitAll()` (auth is checked internally for private repo access)
   - `/api/auth/me` → `permitAll()` (returns `authenticated: false` if not logged in)
   - `/api/github/**` → `authenticated()` (enforced at filter level)
   - Everything else → `authenticated()`
4. **OAuth2 Login** — `oauth2Login()` with custom `successHandler` and `failureHandler`.
5. **Logout** — `POST /api/auth/logout` → session invalidated, cookie cleared, returns HTTP 200.

### Authentication Flow

```
User Browser
    │
    │  1. GET /oauth2/authorization/github
    ▼
Spring Security OAuth2 Filter
    │  2. Redirect → github.com/login/oauth/authorize
    ▼
GitHub OAuth Consent Page
    │  3. User approves → GitHub redirects to /login/oauth2/code/github?code=xxx
    ▼
Spring OAuth2 Filter
    │  4. POST to github.com/login/oauth/access_token
    │     Exchanges code → access_token
    │  5. GET api.github.com/user (fetches profile)
    │  6. Stores OAuth2AuthorizedClient in OAuth2AuthorizedClientService
    │  7. Stores OAuth2AuthenticationToken in SecurityContextHolder
    │  8. Stores authentication in HTTP session
    ▼
OAuth2LoginSuccessHandler
    │  9. sendRedirect(frontendUrl + "/analyze")
    ▼
Frontend /analyze page
    │  10. GET /api/auth/me (with session cookie)
    ▼
AuthController
    │  11. SessionService reads SecurityContextHolder → GithubUser
    ▼
UserResponseDto { authenticated: true, login, avatarUrl, name }
```

### SessionService

**File:** `security/SessionService.java`  

Key methods:

```java
// Check if current request is authenticated via OAuth2
public boolean isAuthenticated() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null && auth.isAuthenticated() && auth instanceof OAuth2AuthenticationToken;
}

// Get the raw OAuth2 access token value (used for GitHub API calls and JGit)
public String getOAuthToken() {
    // Casts to OAuth2AuthenticationToken
    // Loads OAuth2AuthorizedClient by registration ID + principal name
    // Returns client.getAccessToken().getTokenValue()
}
```

### OAuth2 Application Configuration

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          github:
            client-id: ${GITHUB_CLIENT_ID}
            client-secret: ${GITHUB_CLIENT_SECRET}
            scope:
              - read:user
              - repo         ← required for private repository access
```

The `repo` scope grants access to private repositories. Without it, private repository cloning would fail.

### Security Sequence Diagram

```
Client          Spring Security      GitHub OAuth         OAuth2AuthorizedClientService
  │                   │                    │                          │
  │──GET /oauth2/─────▶│                   │                          │
  │   authorization/   │──redirect─────────▶│                          │
  │   github           │                    │──user approves──▶        │
  │                    │◀──code=xxx─────────│                          │
  │                    │──exchange code──────▶│                         │
  │                    │◀──access_token──────│                          │
  │                    │──store token────────────────────────────────▶│
  │                    │──store in session  │                          │
  │◀──redirect /analyze│                    │                          │
  │──GET /api/auth/me──▶│                   │                          │
  │                    │──read from context │                          │
  │◀──UserResponseDto──│                    │                          │
```

---

## 7. External Integrations

### GitHub OAuth API

- **Purpose:** User authentication
- **Provider:** `spring-boot-starter-oauth2-client` (Spring handles token exchange automatically)
- **Scopes:** `read:user`, `repo`
- **Token storage:** `InMemoryOAuth2AuthorizedClientService` (Spring default)
- **Error handling:** `OAuth2LoginFailureHandler` → redirect to `?error=oauth_denied`

---

### GitHub REST API v3

- **Purpose:** Fetch authenticated user's repository list
- **File:** `GithubApiController.java`
- **Endpoint:** `GET https://api.github.com/user/repos?sort=updated&per_page=100`
- **Authentication:** `Authorization: Bearer <OAuth_token>`
- **HTTP Client:** `java.net.http.HttpClient`
- **Error handling:** Non-200 status forwarded as-is; exceptions return HTTP 500

---

### Google Gemini API

- **Purpose:** Primary AI provider for report generation
- **File:** `GeminiProvider.java`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=<api_key>`
- **Authentication:** API key as URL query parameter
- **Request format:** `{ contents: [{ parts: [{ text: "<prompt>" }] }] }`
- **Response parsing:** `candidates[0].content.parts[0].text`
- **Timeout:** 30 seconds
- **Error handling:** Non-200 → `RuntimeException`; exception causes orchestrator to try next provider

---

### OpenRouter API

- **Purpose:** Fallback AI provider (accesses models like DeepSeek-R1)
- **File:** `OpenRouterProvider.java`
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions` (configurable)
- **Authentication:** `Authorization: Bearer <api_key>` + `HTTP-Referer: https://devtrace.com` + `X-Title: DevTrace`
- **Request format:** OpenAI-compatible `{ model, messages, temperature: 0.7 }`
- **Response parsing:** `choices[0].message.content`
- **Timeout:** 30 seconds

---

### Ollama (Local LLM)

- **Purpose:** Second fallback; supports local/offline LLM inference
- **File:** `OllamaProvider.java`
- **Endpoint:** `http://localhost:11434/v1/chat/completions` (configurable)
- **Authentication:** None (local service)
- **Enabled flag:** `ai.ollama.enabled=false` (disabled by default)
- **Timeout:** 60 seconds (longer, for local inference)
- **Note:** Uses the same OpenAI-compatible HTTP helper from `AbstractAiProvider`

---

### JGit (Eclipse JGit Library)

- **Purpose:** Git operations — cloning, commit traversal, diff computation, ls-remote
- **Version:** `7.3.0.202506031305-r`
- **Files:** `RepositoryCloner.java`, `ContributionAggregator.java`, `CommitAnalyzer.java`, `AnalysisService.verifyRepositoryAccess()`
- **Key classes used:**
  - `Git.cloneRepository()` — clone a repository
  - `Git.lsRemoteRepository()` — lightweight remote reference listing (for access verification)
  - `Git.log()` — iterate commits
  - `DiffFormatter` — compute file-level diffs between commit trees
  - `RevWalk`, `RevCommit` — navigate commit graph
  - `CanonicalTreeParser`, `EmptyTreeIterator` — parse tree objects for diffing
  - `UsernamePasswordCredentialsProvider` — provide OAuth token for authentication

---

## 8. Important Design Decisions

### 1. In-Memory Job Store (`ConcurrentHashMap`)

**Why:** No database dependency keeps the architecture simple. `ConcurrentHashMap` is thread-safe for concurrent reads/writes from the async analysis thread and request threads. For the current scope (single instance), this is sufficient.

**Trade-offs:** Jobs are lost on server restart. No persistence. Does not scale across multiple server instances.

**Interview point:** "If I were to scale this, I would replace the in-memory store with Redis — it supports TTL-based expiry, is thread-safe by design, and works across multiple application instances."

---

### 2. OAuth Token Resolution Before Async Handoff

**Why:** `SecurityContextHolder` uses `ThreadLocal` storage by default. The `@Async` thread pool does not inherit the security context from the request thread. Resolving the token on the HTTP thread and passing it explicitly solves this without configuring `SecurityContextPropagationTaskDecorator`.

**Code location:** `AnalysisService.submitAnalysis()` — `String token = sessionService.getOAuthToken()` called before `taskExecutor.execute(...)`.

---

### 3. Avoided `@Async` in Favor of Direct `taskExecutor.execute()`

**Why:** Spring's `@Async` works through a proxy. Calling `@Async`-annotated methods from within the same bean bypasses the proxy (self-invocation problem) and executes synchronously. By injecting the `Executor` and calling it directly, the async execution is guaranteed regardless of the call origin.

---

### 4. Single-Pass Aggregation

**Why:** An earlier version traversed commits multiple times (once per analyzer). The refactored design (`ContributionAggregator`) traverses the commit log once and fans out to all analyzers simultaneously. This reduces JGit I/O and improves performance proportionally to the number of analyzers.

---

### 5. DTOs to Decouple API Shape from Internal Models

**Why:** `AnalysisJob` contains `LocalDateTime`, `AnalysisStatus` enum, and other internal details. DTOs (`JobStatusDto`, `JobResultDto`) expose only what the client needs in the right shape. `AnalysisRequestDto` has Bean Validation annotations that would be inappropriate on a domain model.

---

### 6. Template Method Pattern for AI Providers

**Why:** All three providers share: (a) LRU caching logic, (b) OpenAI-compatible HTTP request building (for OpenRouter/Ollama). `AbstractAiProvider` implements these once, and concrete providers only implement `executeReportGeneration()`. This avoids code duplication and makes adding a new provider straightforward.

---

### 7. Strategy Pattern for Provider Selection

**Why:** `AiOrchestrator` receives a `Map<String, AiProvider>` injected by Spring. Spring automatically populates this map with all `AiProvider` beans keyed by their bean names. The orchestrator selects providers at runtime based on the configured `primary-provider` and `fallback-order`. No `if/else` provider dispatch code.

---

### 8. `@ConfigurationProperties` Over `@Value`

**Why:** AI configuration has nested properties (gemini, openrouter, ollama each with their own sub-properties). `@ConfigurationProperties` maps the entire YAML subtree into a strongly-typed object graph with IDE autocompletion and validation support. `@Value` is only used for simple scalar values (`frontendUrl` in OAuth handlers).

---

### 9. Java Records for Internal Transfer Objects

**Why:** `RawContributionData` and `FileChangeResult` are immutable data carriers passed between pipeline stages. Java `record` provides a concise, immutable, value-based representation with auto-generated `equals`, `hashCode`, and `toString` — perfect for data transfer objects that should not be mutated.

---

### 10. AI Failure Isolation

**Why:** The AI report is valuable but not critical. If all AI providers fail, the job still completes with git statistics (`GitStatistics`, `contributionBreakdown`, `fileExtensions`, `topKeywords`). The AI call is wrapped in a separate try/catch that sets `aiReport = null` rather than failing the entire job.

---

### 11. CSRF Disabled

**Why:** CSRF protection is primarily needed for cookie-based authentication where a malicious site can trigger authenticated requests. The DevTrace API:
1. Already uses CORS with `allowedOrigins` configured to the specific frontend URL (not wildcard).
2. Uses `allowCredentials(true)` — which requires explicit origin matching.

CORS + credential requirements together prevent cross-origin cookie abuse, making CSRF redundant. SPA architectures commonly disable CSRF for REST APIs.

---

### 12. Dockerfile — Multi-Stage Build

**Why:** Stage 1 uses `eclipse-temurin:21-jdk-jammy` to compile and package the application. Stage 2 uses `eclipse-temurin:21-jre-jammy` (much smaller image — no compiler, no dev tools) to run the JAR. This significantly reduces the final image size and attack surface.

---

## 9. Frequently Asked Interview Questions

---

**Q1: Explain the full request lifecycle of `POST /api/analysis/start`.**

> The request enters `AnalysisController.startAnalysis()`. Spring's `DispatcherServlet` routes it based on `@PostMapping("/start")`. `@Valid` triggers Jakarta Bean Validation on the `AnalysisRequestDto` — if validation fails, `MethodArgumentNotValidException` is thrown and caught by `GlobalExceptionHandler`, returning a 400 with field-level error details. On success, `AnalysisService.submitAnalysis()` generates a UUID, creates an `AnalysisJob` in `PENDING` state, stores it in a `ConcurrentHashMap`, resolves the OAuth token from the security context (on the request thread), then submits the analysis task to the `ThreadPoolTaskExecutor`. The response `{ jobId }` is returned immediately.

---

**Q2: Why did you disable CSRF?**

> CSRF protection prevents cross-site request forgery — where a malicious site tricks the browser into making authenticated requests. We mitigate this with CORS: `allowedOrigins` is set to the specific frontend URL, and `allowCredentials(true)` is required, which browsers enforce only for exact origin matches. This combination prevents a malicious origin from triggering our endpoints. CSRF tokens would also complicate SPA authentication flows since there's no server-rendered form to embed the token in.

---

**Q3: How does the OAuth2 access token get from GitHub to JGit for private repo cloning?**

> When the user logs in, Spring's OAuth2 client filter exchanges the authorization code for an access token and stores it in the `OAuth2AuthorizedClientService`. When an analysis is submitted, `SessionService.getOAuthToken()` loads the `OAuth2AuthorizedClient` for the current user's registration ID and principal name, returning `client.getAccessToken().getTokenValue()`. This token is passed to `RepositoryCloner.cloneRepository()`, which sets it as `new UsernamePasswordCredentialsProvider(token, "")` on the JGit clone command. GitHub accepts an OAuth token in the username position over HTTPS.

---

**Q4: Why is the OAuth token resolved on the request thread, not inside the async method?**

> `SecurityContextHolder` uses `ThreadLocal` by default. Each thread has its own security context, and it is populated by Spring Security's filter chain only for the request-processing thread. The async thread pool (`ThreadPoolTaskExecutor`) does not inherit this context. If we called `getOAuthToken()` inside the async lambda, it would read an empty security context and return null. By calling it before the `taskExecutor.execute(...)` call, we capture the token on the request thread where the context is populated, then pass it explicitly as a parameter.

---

**Q5: Explain the AI provider fallback mechanism.**

> `AiOrchestrator.getProviderOrder()` builds an ordered list from `ai.primary-provider` and `ai.fallback-order` config properties (e.g., `["gemini", "openrouter", "ollama"]`). For each provider key, the orchestrator resolves a Spring bean named `<key>Provider` (e.g., `"geminiProvider"`) from an injected `Map<String, AiProvider>`. It calls all four generation methods on that provider. If any throws an exception, the failure is logged, metrics are recorded, and the next provider is tried. If all fail, a `RuntimeException` is thrown, but in `AnalysisService` this is caught separately so the job completes with git stats only.

---

**Q6: How does Spring know which `AiProvider` beans to inject into `AiOrchestrator`?**

> Spring automatically collects all beans that implement `AiProvider` into a `Map<String, AiProvider>` when that type is declared as a constructor parameter. The map key is the Spring bean name. Each provider is annotated with `@Component("geminiProvider")`, `@Component("openrouterProvider")`, `@Component("ollamaProvider")` — these explicit names become the map keys. The orchestrator then resolves providers by name by appending `"Provider"` to the config key (e.g., config key `"gemini"` → bean name `"geminiProvider"`).

---

**Q7: Explain the single-pass aggregation design.**

> `ContributionAggregator.aggregate()` opens the Git repository once using `FileRepositoryBuilder`, calls `git.log().call()` to get all commits, and iterates them once. For each commit that matches the target author, diffs are computed once using `DiffFormatter.scan()`. These diffs are then simultaneously fed to `FileChangeAnalyzer.processDiffs()` and `FolderAnalyzer.processDiffs()`, while the commit message is passed to `KeywordAnalyzer.processCommitMessage()`. This replaces an older design that would have iterated commits separately per analyzer.

---

**Q8: How does `FolderAnalyzer` normalize paths?**

> `FolderAnalyzer.normalizeFolderPath()` splits the file path on `/` and takes only the first two segments. For example, `src/components/ui/Button.tsx` → `src/components`. Root-level files (no `/`) return `null` and are excluded. This prevents over-fragmentation where deep paths would each appear as unique entries, causing classifier inaccuracies.

---

**Q9: How does `ContributionClassifier` classify contributions?**

> It maintains a `List<ClassificationRule>` where each rule has a label (e.g., "REST API Development") and a list of folder-segment patterns (e.g., `["controller", "controllers", "api"]`). For each folder in the frequency map, it splits the path and checks each segment against all rules in order. The first match determines the domain label. Unmatched folders are classified as "Other". Domain frequency weights are then used to compute percentages.

---

**Q10: How does the LRU cache in `AbstractAiProvider` work?**

> It uses `Collections.synchronizedMap()` wrapping a `LinkedHashMap` with access-order enabled (`true` as the third constructor argument). In access-order mode, `LinkedHashMap` moves recently accessed entries to the tail. The `removeEldestEntry()` override returns `true` when `size() > 50`, which causes the eldest (least recently accessed) entry to be removed. This is the classic Java LRU cache pattern. `synchronizedMap()` makes it thread-safe for concurrent access from multiple analysis jobs.

---

**Q11: What happens when the AI fails?**

> In `AnalysisService.processAnalysis()`, the AI generation is wrapped in a separate try/catch block. If `aiOrchestrator.generateReport()` throws (because all providers failed), the exception is logged and `aiReport` remains `null`. The job still reaches `COMPLETED` status with `AnalysisResult` populated by git statistics, breakdown data, keywords, and technology indicators. The API response will have `aiReport: null`.

---

**Q12: Explain Bean Validation in this project.**

> `AnalysisRequestDto` uses Jakarta Bean Validation annotations: `@NotBlank` on both fields (prevents null and whitespace-only values) and `@Pattern` on `repositoryUrl` with the regex `^https?://github\.com/[^/]+/[^/]+$` to ensure only valid GitHub repo URLs are accepted. The `@Valid` annotation on the controller method parameter triggers validation. On failure, Spring throws `MethodArgumentNotValidException`, which `GlobalExceptionHandler` catches and converts to a 400 response with a `ValidationErrorResponse` containing a map of field → error message pairs.

---

**Q13: How does exception handling work?**

> `GlobalExceptionHandler` is annotated with `@RestControllerAdvice`, which makes it applicable to all `@RestController` classes. It defines `@ExceptionHandler` methods for:
> - `JobNotFoundException` → HTTP 404 with `ErrorResponse`
> - `GitException` → HTTP 400 with `ErrorResponse`
> - `MethodArgumentNotValidException` → HTTP 400 with `ValidationErrorResponse` (field-level map)
> - `Exception` (catch-all) → HTTP 500 with `ErrorResponse`
> 
> All error responses include `status`, `error`, `message`, and `timestamp` (as `LocalDateTime`).

---

**Q14: Why use Java's `HttpClient` instead of `RestTemplate` or `WebClient`?**

> The application makes HTTP calls to the GitHub API and AI providers. The built-in `java.net.http.HttpClient` (Java 11+) handles these without adding Spring WebFlux (for `WebClient`) or a deprecated library (`RestTemplate`). Since all calls are simple synchronous POST/GET operations without reactive streams, `HttpClient` is sufficient and keeps the dependency footprint minimal.

---

**Q15: Explain the `@ConfigurationProperties` usage.**

> `AiProperties` is annotated with `@ConfigurationProperties(prefix = "ai")`. Spring binds the `ai.*` YAML subtree to this class's fields using relaxed binding (e.g., `ai.primary-provider` → `primaryProvider`). Nested classes `GeminiProperties`, `OpenRouterProperties`, `OllamaProperties` map to `ai.gemini.*`, etc. The main class uses `@ConfigurationPropertiesScan` to auto-discover all `@ConfigurationProperties` beans. This approach gives type-safe, IDE-autocomplete-friendly configuration instead of scattered `@Value` annotations.

---

**Q16: How does `RepositoryCloner.deleteRepository()` work?**

> It uses `Files.walk(destinationPath)` to create a `Stream<Path>` of all files and directories under the path. The stream is sorted in **reverse order** (using `Comparator.reverseOrder()`) so that child files appear before their parent directories — this is critical because you cannot delete a non-empty directory. Each path is converted to a `File` and `delete()` is called. Any deletion failure is logged as a warning. This pattern is the standard Java NIO approach for recursive directory deletion.

---

**Q17: What is the `AnalysisStatus` lifecycle?**

> 1. `PENDING` — job created, waiting in the executor queue.
> 2. `RUNNING` — `processAnalysis()` has started executing on the async thread.
> 3. `COMPLETED` — full pipeline (clone → analyze → AI) completed successfully; `result` is populated.
> 4. `FAILED` — any exception during the pipeline; `errorMessage` is set.

---

**Q18: How does CorsConfig work?**

> `CorsConfig` defines a `WebMvcConfigurer` `@Bean` that overrides `addCorsMappings()`. It registers a CORS mapping for `/api/**` paths with:
> - `allowedOrigins` → `devTraceProperties.getFrontendUrl()` (single specific origin, not wildcard)
> - `allowedMethods` → `GET, POST, PUT, DELETE, OPTIONS`
> - `allowedHeaders` → `*`
> - `allowCredentials(true)` → required for session cookies to be included in cross-origin requests
>
> `SecurityConfig` also references CORS with `.cors(cors -> {})` which tells Spring Security to respect the CORS configuration defined by the `WebMvcConfigurer`.

---

**Q19: Why are Java `record` types used for `RawContributionData` and `FileChangeResult`?**

> Records are concise, immutable value objects. Since `RawContributionData` is a pure internal data carrier with no behavior (just data), and it is populated once in `ContributionAggregator` and consumed in `ContributionContextBuilder`, immutability is appropriate. Records auto-generate canonical constructors, `equals`, `hashCode`, and `toString`. They signal to readers that these types are data containers, not entities or services.

---

**Q20: How does `KeywordAnalyzer` prevent noise from dominating results?**

> Three filtering layers:
> 1. **Length filter:** tokens shorter than 3 characters are discarded (eliminates abbreviations and single letters).
> 2. **Stop word filter:** 95+ words are excluded, including generic verbs (`fix`, `add`, `update`), merge noise (`merge`, `merged`), and common English words.
> 3. **Normalization:** 30+ entries map variant forms to canonical ones so `"refactored"` and `"refactor"` both increment the same `"refactoring"` counter instead of splitting the signal.

---

**Q21: What happens if the async thread pool is saturated (queue full)?**

> `ThreadPoolTaskExecutor` is configured with `corePoolSize=4`, `maxPoolSize=8`, `queueCapacity=50`. If 8 threads are active and 50 jobs are queued, the next `execute()` call will be rejected by the default `AbortPolicy`, throwing a `RejectedExecutionException` back on the request thread. This would propagate as an HTTP 500 error. A production improvement would be a `CallerRunsPolicy` (runs on the request thread) or a custom rejection handler.

---

**Q22: Explain constructor injection vs field injection.**

> The project uses constructor injection exclusively (no `@Autowired` on fields). Constructor injection:
> - Makes dependencies explicit and immutable (`final` fields).
> - Makes the class testable without a Spring context (just call the constructor with mocks).
> - Fails fast at startup if a dependency is missing (vs. `NullPointerException` at runtime with field injection).
> - Allows Spring to detect circular dependencies at startup (not at runtime).

---

**Q23: How does logout work?**

> `SecurityConfig` configures `.logout()` with:
> - `logoutUrl("/api/auth/logout")` — listens for POST requests to this URL.
> - `logoutSuccessHandler` — a lambda that sets the HTTP response status to 200 (not a redirect, since it's an SPA).
> - `invalidateHttpSession(true)` — destroys the server-side session.
> - `clearAuthentication(true)` — removes the `Authentication` from `SecurityContextHolder`.
> - `deleteCookies("JSESSIONID")` — removes the session cookie from the browser.

---

**Q24: Explain the `@EnableAsync` setup.**

> `AsyncConfig` is annotated `@Configuration @EnableAsync`. `@EnableAsync` tells Spring to detect `@Async` annotations and proxy the annotated methods. It also processes `Executor` beans named `taskExecutor` as the default executor. The `threadPoolTaskExecutor` bean is explicitly named `"taskExecutor"`. In `AnalysisService`, the executor is injected with `@Qualifier("taskExecutor")` to disambiguate from Spring's default async executor.

---

**Q25: What design pattern does `AiOrchestrator + AiProvider` implement?**

> **Strategy Pattern**: `AiProvider` is the strategy interface. `GeminiProvider`, `OpenRouterProvider`, `OllamaProvider` are concrete strategies. `AiOrchestrator` is the context that selects and executes strategies at runtime based on configuration.
>
> **Template Method Pattern**: `AbstractAiProvider` defines the algorithm skeleton (`getReport()` with caching → `executeReportGeneration()`). Subclasses override only `executeReportGeneration()`.
>
> **Chain of Responsibility**: The ordered fallback loop in `AiOrchestrator.generateReport()` is structurally a chain of responsibility — each provider in the chain gets a chance to handle the request before the next.

---

**Q26: How does the `PromptBuilder` work?**

> `PromptBuilder.buildReportPrompt(ContributionContext)` assembles a large text block (Java 15+ text block syntax using `"""..."""`). It embeds all pre-analyzed data from `ContributionContext` into the prompt using `String.formatted()` with placeholders. It instructs the LLM to return **only raw JSON** (no markdown fences) matching the `AiContributionReport` schema. The `AiResponseParser` then strips any accidental markdown fences before passing to Jackson for deserialization.

---

**Q27: What is the `CommitAnalyzer` used for?**

> `CommitAnalyzer.java` is a utility component that computes per-commit diff stats (files changed, lines added/deleted) for a single `RevCommit`. In the current architecture, this logic is effectively inlined into `ContributionAggregator` for performance (avoiding re-opening `DiffFormatter`). `CommitAnalyzer` appears to be a legacy class that predates the single-pass refactor but is retained in the codebase.

---

**Q28: How does the `matchesAuthor()` method work in `ContributionAggregator`?**

> ```java
> private boolean matchesAuthor(String name, String email, String username) {
>     if (username == null) return false;
>     String lowerUsername = username.toLowerCase();
>     boolean nameMatch = name != null && name.toLowerCase().contains(lowerUsername);
>     boolean emailMatch = email != null && email.toLowerCase().contains(lowerUsername);
>     return nameMatch || emailMatch;
> }
> ```
> It performs case-insensitive substring matching against both the commit author name and email. This handles common patterns like: username "johndoe" matching name "John Doe", or email "johndoe@gmail.com". The OR logic means either a name or email match is sufficient.

---

**Q29: What Java 21 features are used?**

> - **Text blocks** (Java 15, standard in 21): `PromptBuilder` uses `"""..."""` for the multi-line prompt string.
> - **Records** (Java 16, standard in 21): `RawContributionData`, `FileChangeResult`, `CommitStats`, `ClassificationRule` (private record inside `ContributionClassifier`).
> - **Pattern matching for `instanceof`** (Java 16): Used in `SessionService` — `if (auth instanceof OAuth2AuthenticationToken oauthToken)` directly binds the variable.
> - **Switch expression enhancements**: `FileChangeAnalyzer.processDiffs()` uses arrow-style switch cases (`case ADD -> filesAdded++`).
> - **`Map.ofEntries()`**: Used in `FileChangeAnalyzer` for the large `EXTENSION_TECH_MAP`.

---

**Q30: Explain the Docker multi-stage build.**

> Stage 1 (`build`): Based on `eclipse-temurin:21-jdk-jammy`. Copies the Maven wrapper and `pom.xml` first, runs `./mvnw dependency:go-offline -B` to cache dependencies as a separate Docker layer. Then copies `src/` and runs `./mvnw clean package -DskipTests` to produce the JAR.
>
> Stage 2 (runtime): Based on `eclipse-temurin:21-jre-jammy` — JRE only, no compiler or Maven. Copies only the JAR from Stage 1. The final image is smaller and has a reduced attack surface. `EXPOSE 8080` and `ENTRYPOINT ["java", "-jar", "app.jar"]` configure the container.

---

**Q31: How are environment variables used?**

> `application.yml` references environment variables using Spring's `${ENV_VAR_NAME}` syntax:
> - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — OAuth app credentials
> - `GEMINI_API_KEY`, `OPENROUTER_API_KEY` — AI provider keys
> - `DEVTRACE_FRONTEND_URL` — used for CORS and OAuth redirect
> - `PORT` — server port (defaults to `8080` via `${PORT:8080}`)
> - `OPENROUTER_MODEL`, `OPENROUTER_URL`, `OLLAMA_URL`, `OLLAMA_MODEL`, `OLLAMA_ENABLED` — optional overrides

---

**Q32: How would you add a new AI provider?**

> 1. Create a class extending `AbstractAiProvider` with `@Component("newProvider")`.
> 2. Implement `executeReportGeneration(ContributionContext)`.
> 3. Add configuration properties to `AiProperties` (nested `@Data` class).
> 4. Add `new-provider` to `ai.fallback-order` or `ai.primary-provider` in `application.yml`.
> 
> No changes needed in `AiOrchestrator` — it auto-discovers providers through Spring's `Map<String, AiProvider>` injection.

---

**Q33: What is `@ConfigurationPropertiesScan` on the main class?**

> `@ConfigurationPropertiesScan` instructs Spring Boot to scan the package for all classes annotated with `@ConfigurationProperties` and register them as Spring beans. Without this (or `@EnableConfigurationProperties`), `@ConfigurationProperties` classes would not be auto-discovered. `DevTraceProperties` lacks `@Component` but has `@ConfigurationProperties` — it relies on `@ConfigurationPropertiesScan` from the main class.

---

**Q34: Explain `ConcurrentHashMap` usage in `AnalysisService`.**

> `ConcurrentHashMap` is used as the in-memory job store. It is chosen because:
> 1. **Thread safety**: The request thread writes new jobs (`put`), the async analysis thread updates job status/progress (`get` + mutation on the job object), and multiple request threads may read (`get`). `ConcurrentHashMap` allows concurrent reads and segmented writes.
> 2. **No blocking reads**: Unlike `Collections.synchronizedMap()` which locks the whole map for every operation, `ConcurrentHashMap` uses segment-level locking (or CAS in modern Java) for writes, allowing concurrent reads.
> 
> Note: The `AnalysisJob` object itself is not thread-safe (it's a Lombok `@Data` POJO with simple setters). Since only one thread (the async thread) mutates a specific job's fields, this is safe in practice.

---

**Q35: How does Lombok reduce boilerplate in this project?**

> Lombok annotations used:
> - `@Data` — generates getters, setters, `equals`, `hashCode`, `toString` (used on `AnalysisJob`, `AnalysisResult`, `GitStatistics`, `ContributionBreakdownItem`, `AiContributionReport`, `ContributionContext`, `GithubUser`, all DTOs).
> - `@NoArgsConstructor`, `@AllArgsConstructor` — generate constructors (needed alongside `@Data` for Jackson deserialization which requires no-args constructor, and for convenient construction).
> - `@Builder` — builder pattern for `GithubUser` and `AiRequest` (used by `SessionService.getCurrentUser()`).
> - Configured in `pom.xml` as an annotation processor path in `maven-compiler-plugin`.

---

**Q36: What happens if a GitHub URL is valid format but doesn't exist?**

> `RepositoryCloner.cloneRepository()` would throw a JGit `TransportException`. This is caught and wrapped in a `GitException` with message "Repository not found or access denied." `GlobalExceptionHandler` maps `GitException` to HTTP 400 with that message. In `AnalysisService.processAnalysis()`, the `GitException` propagates from the clone step, the job is set to `FAILED` with the error message, and cleanup runs in `finally`.

---

**Q37: Explain `FolderAnalyzer`'s treatment of deleted files.**

> ```java
> String path = diff.getChangeType() == DiffEntry.ChangeType.DELETE
>         ? diff.getOldPath()
>         : diff.getNewPath();
> ```
> For deleted files, `diff.getNewPath()` returns `/dev/null` (the git convention for deleted files). Using `oldPath` for deletions correctly attributes the deletion to the file's original location. The same logic exists in `FileChangeAnalyzer`. The `normalizeFolderPath()` method also checks for `/dev/null` explicitly and returns `null` for it.

---

**Q38: How are AI provider metrics tracked?**

> `AiOrchestrator` maintains four `ConcurrentHashMap<String, Long>` maps: `requestCounts`, `successCounts`, `failureCounts`, `accumulatedLatency`. On each provider attempt: `requestCounts.merge(key, 1L, Long::sum)`. On success: `successCounts` and `accumulatedLatency` incremented. On failure: `failureCounts` and `accumulatedLatency`. The `getMetrics()` method computes derived values (success rate, average latency) and returns a `LinkedHashMap<String, Object>` snapshot. This is available for future monitoring API exposure.

---

**Q39: Why does `SecurityConfig` have `anyRequest().authenticated()` as the catch-all?**

> It follows the **secure-by-default** principle. Any new endpoint added to the codebase will automatically require authentication unless explicitly listed under `permitAll()`. This prevents accidentally exposing sensitive endpoints because a developer forgot to add security rules. The specific permits are listed first (`permitAll` for health, analysis endpoints, auth/me), and all others default to requiring authentication.

---

**Q40: How would you add persistence to `AnalysisJob`?**

> 1. Add a database dependency (`spring-boot-starter-data-jpa` + a driver).
> 2. Annotate `AnalysisJob` with `@Entity`, add an `@Id` field.
> 3. Create `AnalysisJobRepository extends JpaRepository<AnalysisJob, String>`.
> 4. Replace `ConcurrentHashMap` operations in `AnalysisService` with repository calls.
> 5. Add `@Transactional` on write operations.
> 6. Consider serializing `AnalysisResult` as a JSON column (`@Column(columnDefinition = "TEXT")` + Jackson serialization).

---

## 10. My Contributions Summary

### Resume-Level Contributions

- **Designed and implemented a Git contribution intelligence engine** that performs single-pass traversal of commit history using Eclipse JGit, extracting file-level statistics, folder-level domain classification, and commit message keyword analysis in a single repository walk.

- **Built a multi-provider AI orchestration layer** with Strategy + Template Method patterns supporting Google Gemini, OpenRouter, and local Ollama as providers with configurable fallback order, per-provider LRU caching, and runtime metrics tracking.

- **Implemented GitHub OAuth2 authentication** using Spring Security's `oauth2Login()` DSL with custom success/failure handlers, session-based token storage, and safe OAuth token propagation to async execution contexts.

- **Engineered asynchronous job processing pipeline** with `ThreadPoolTaskExecutor` (4–8 threads, 50-job queue) and in-memory `ConcurrentHashMap` job tracking with real-time progress reporting (0–100%) via REST polling endpoints.

- **Implemented repository access verification** using JGit's lightweight `lsRemoteRepository` (no clone required) with tiered anonymous-then-authenticated checks mapping to a `RepositoryAccessState` enum.

- **Built a structured contribution classification system** mapping repository folder paths to engineering domain labels (Frontend, Backend, Security, DevOps, etc.) with percentage breakdowns and color assignments for dashboard chart rendering.

- **Implemented commit message NLP preprocessing** with a 95+ stop word filter, 30+ keyword normalization rules (past tense → canonical form), and activity classification to surface engineering themes from git history.

- **Containerized the application** using a multi-stage Docker build (JDK build stage → JRE runtime stage) for reduced image size and deployed via environment-variable-driven configuration.

---

### Interview Talking Points

- I can explain every layer of the analysis pipeline end-to-end: clone → single-pass traversal → multi-analyzer data collection → context enrichment → AI orchestration → response.
- I made the explicit architectural decision to resolve the OAuth token on the request thread before async handoff, and I can explain the `SecurityContextHolder` `ThreadLocal` issue that motivated it.
- I can explain why `@Async` was not used and why direct `taskExecutor.execute()` was chosen to avoid the Spring proxy self-invocation bypass.
- I designed the AI provider system to be open for extension without modifying `AiOrchestrator` — new providers are discovered automatically via Spring's `Map<String, AiProvider>` injection.
- I can discuss trade-offs of the in-memory job store and articulate a Redis-based migration path.
- I understand the security decisions: why CSRF is disabled, why CORS is configured with explicit origins, and how the session-based OAuth flow avoids JWT complexity for a browser SPA.

---

### Technical Depth Areas to Revise Before Interviews

| Topic | Specific to this Project |
|-------|-------------------------|
| Spring Security OAuth2 flow | `OAuth2AuthenticationToken`, `OAuth2AuthorizedClientService`, `OAuth2AuthorizedClient` |
| Spring async processing | `ThreadPoolTaskExecutor`, `@Qualifier`, `SecurityContextHolder` thread-locality |
| Spring Security filter chain | `SecurityFilterChain`, `cors()`, `csrf()`, `authorizeHttpRequests()`, `oauth2Login()`, `logout()` |
| Spring `@ConfigurationProperties` | Relaxed binding, nested properties, `@ConfigurationPropertiesScan` |
| `@RestControllerAdvice` and `@ExceptionHandler` | Exception hierarchy, response entity construction |
| Jakarta Bean Validation | `@NotBlank`, `@Pattern`, `@Valid`, `MethodArgumentNotValidException` |
| Eclipse JGit API | `RevWalk`, `RevCommit`, `DiffFormatter`, `CanonicalTreeParser`, `EmptyTreeIterator`, `UsernamePasswordCredentialsProvider` |
| Java `record` types | Immutability, canonical constructor, component accessors |
| Java text blocks | Multi-line strings, `String.formatted()` |
| Design patterns | Strategy, Template Method, Chain of Responsibility, Factory (via Spring DI) |
| `ConcurrentHashMap` thread-safety characteristics | Read/write concurrency, `merge()` method semantics |
| LRU cache implementation | `LinkedHashMap` access-order + `removeEldestEntry()` |
| Docker multi-stage builds | Dependency caching layers, JDK vs JRE image sizing |
| Java `HttpClient` | `HttpRequest.newBuilder()`, `BodyHandlers.ofString()`, timeout config |
| Lombok annotations | `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` and annotation processor setup |
