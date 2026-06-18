# DevTrace — Interview Preparation Notes

---

## 1. Important Spring Concepts Used

| Concept | Where Used | What It Does |
|---------|-----------|--------------|
| `@SpringBootApplication` | `BackendApplication.java` | Enables auto-configuration, component scan, Spring Boot |
| `@ConfigurationPropertiesScan` | `BackendApplication.java` | Auto-discovers all `@ConfigurationProperties` beans |
| `@RestController` | All controllers | Combines `@Controller` + `@ResponseBody`; returns JSON |
| `@RequestMapping`, `@PostMapping`, `@GetMapping` | All controllers | Maps HTTP methods + URL paths to methods |
| `@Valid` + `@RequestBody` | `AnalysisController` | Triggers Jakarta Bean Validation on incoming DTO |
| `@NotBlank`, `@Pattern` | `AnalysisRequestDto` | Validates that fields are non-empty and match a regex |
| `@PathVariable`, `@RequestParam` | `AnalysisController` | Binds URL path segments and query parameters |
| `@Service`, `@Component` | `AnalysisService`, git analyzers, AI providers | Marks Spring-managed beans |
| **Constructor Injection** | Entire project | No `@Autowired` on fields; explicit, testable, immutable wiring |
| `@ConfigurationProperties` | `AiProperties`, `DevTraceProperties` | Maps `application.yml` subtrees to typed Java classes |
| `@Configuration`, `@Bean` | `AsyncConfig`, `JacksonConfig`, `CorsConfig` | Explicit bean declarations |
| `@RestControllerAdvice` + `@ExceptionHandler` | `GlobalExceptionHandler` | Centralized exception-to-HTTP-response mapping |
| `@EnableAsync` + `ThreadPoolTaskExecutor` | `AsyncConfig` | Configures a background thread pool (4 core, 8 max, 50 queue) |
| `@Qualifier("taskExecutor")` | `AnalysisService` constructor | Disambiguates which `Executor` bean to inject |
| `@Value` | `OAuth2LoginSuccessHandler`, `OAuth2LoginFailureHandler` | Injects scalar property values |
| `@EnableWebSecurity` | `SecurityConfig` | Activates Spring Security |
| **`SecurityFilterChain`** | `SecurityConfig` | Configures CORS, CSRF, route protection, OAuth2 login, logout |
| **`oauth2Login()`** | `SecurityConfig` | Enables GitHub OAuth2 login flow |
| **`OAuth2AuthorizedClientService`** | `SessionService` | Stores and retrieves the OAuth access token per user |
| **`SecurityContextHolder`** | `SessionService` | Reads the current user's `Authentication` object |
| **`Map<String, AiProvider>` injection** | `AiOrchestrator` | Spring auto-populates a map of all `AiProvider` beans keyed by bean name |

---

## 2. Application Flow

### A. GitHub OAuth Login Flow

```
1. User clicks "Login with GitHub"
2. Browser → GET /oauth2/authorization/github
3. Spring Security redirects → GitHub consent page
4. User approves → GitHub sends code to /login/oauth2/code/github
5. Spring exchanges code → access_token (stored in OAuth2AuthorizedClientService)
6. OAuth2LoginSuccessHandler redirects → frontend /analyze
7. Frontend calls GET /api/auth/me
8. SessionService reads SecurityContextHolder → builds GithubUser
9. Returns { authenticated: true, login, avatarUrl, name }
```

---

### B. Repository Access Verification Flow

```
1. Frontend calls GET /api/analysis/verify?repositoryUrl=...
2. JGit lsRemoteRepository (anonymous) → if success → return PUBLIC
3. If TransportException (auth required):
   a. User logged in? → try lsRemoteRepository with OAuth token
   b. Token works? → PRIVATE_ACCESSIBLE
   c. Token fails? → PRIVATE_NOT_ACCESSIBLE
4. Any other error → NOT_FOUND
```

---

### C. Analysis Submission & Async Processing Flow

```
1. POST /api/analysis/start { repositoryUrl, githubUsername }
2. Bean Validation (@NotBlank, @Pattern) → 400 if invalid
3. AnalysisService.submitAnalysis():
   a. Generate UUID jobId
   b. Create AnalysisJob (PENDING, progress=0) → store in ConcurrentHashMap
   c. Resolve OAuth token on REQUEST THREAD (SecurityContextHolder is thread-local)
   d. Submit task to ThreadPoolTaskExecutor
4. Return { jobId } immediately (async)
```

---

### D. Background Analysis Pipeline (Async Thread)

```
processAnalysis(jobId, token):

[10%]  Job set to RUNNING

[20%]  RepositoryCloner.cloneRepository(url, tempDir, token)
       → JGit Git.cloneRepository() with UsernamePasswordCredentialsProvider(token, "")

[40%]  ContributionAggregator.aggregate(repoPath, username):
       → Single-pass JGit log traversal (git.log().all())
       → For each commit matching the author:
           - Compute diffs with DiffFormatter
           - Feed diffs to FileChangeAnalyzer, FolderAnalyzer simultaneously
           - Feed commit message to KeywordAnalyzer

[60%]  ContributionContextBuilder.build(rawData):
       → ContributionClassifier maps folder paths → engineering domains (Frontend, Backend, etc.)
       → KeywordAnalyzer extracts top keywords
       → Formats contribution period, technology indicators

[70%]  GitStatistics built from ContributionContext

[90%]  AiOrchestrator.generateReport(context):
       → Try providers in order: gemini → openrouter → ollama
       → PromptBuilder assembles the LLM prompt
       → Provider calls AI API (HTTP via java.net.http.HttpClient)
       → AiResponseParser strips markdown fences, deserializes JSON → AiContributionReport
       → AI failure is isolated (job still COMPLETES without AI report)

[100%] AnalysisJob set to COMPLETED, result stored
       finally: RepositoryCloner.deleteRepository(tempDir)
```

---

### E. Job Polling Flow

```
Frontend polls: GET /api/analysis/{jobId}/status
→ Returns { jobId, status: RUNNING, progress: 60 }

When status == COMPLETED:
GET /api/analysis/{jobId}/result
→ Returns { status, result: { statistics, aiReport, contributionBreakdown, ... } }

If jobId not found → JobNotFoundException → GlobalExceptionHandler → HTTP 404
```

---

### F. GitHub Repositories Fetch Flow

```
1. GET /api/github/repositories (requires authentication)
2. SecurityConfig: /api/github/** → authenticated()
3. SessionService.getOAuthToken() → reads stored OAuth token
4. HttpClient calls api.github.com/user/repos?sort=updated&per_page=100
   with Authorization: Bearer <token>
5. Jackson parses JSON → List<GithubRepoDto>
6. Returns repo list to frontend
```

---

## 3. Interview Questions & Answers

---

**Q: Explain the full flow when a user submits an analysis.**

> The `POST /api/analysis/start` request hits `AnalysisController`, Spring validates the DTO using Bean Validation, then `AnalysisService.submitAnalysis()` creates an `AnalysisJob` in a `ConcurrentHashMap` with status `PENDING`. The OAuth token is resolved on the request thread (since `SecurityContextHolder` is thread-local) and passed to a background task submitted to the `ThreadPoolTaskExecutor`. The HTTP response returns immediately with a `jobId`. In the background thread, the pipeline runs: clone → single-pass git analysis → context building → AI report generation → result stored. The frontend polls `/status` and fetches `/result` when done.

---

**Q: Why was the OAuth token resolved on the request thread, not inside the async method?**

> `SecurityContextHolder` uses `ThreadLocal` storage by default — it's only populated on the request-handling thread. The async thread pool doesn't inherit it. If `getOAuthToken()` was called inside the async lambda, it would get an empty security context and return `null`. The fix is to call `sessionService.getOAuthToken()` before `taskExecutor.execute(...)` and pass the token as a parameter to the async method.

---

**Q: Why did you not use `@Async` on the service method?**

> `@Async` works through Spring's proxy mechanism. If you call an `@Async` method from within the same bean (self-invocation), the call bypasses the proxy and runs synchronously. By injecting the `Executor` directly and calling `taskExecutor.execute(...)`, the async execution is guaranteed regardless of where the call originates.

---

**Q: How does the AI provider fallback work?**

> `AiOrchestrator` reads the provider order from config (`gemini → openrouter → ollama`). For each provider key, it resolves the Spring bean named `<key>Provider` from an injected `Map<String, AiProvider>`. It tries that provider; if it throws, it logs the failure and tries the next one. If all fail, a `RuntimeException` is thrown — but in `AnalysisService`, the AI step is wrapped in its own try/catch so the job still completes with git statistics only.

---

**Q: How does Spring know which `AiProvider` beans to inject into `AiOrchestrator`?**

> When you declare `Map<String, AiProvider>` as a constructor parameter, Spring automatically collects all beans of type `AiProvider` into a map keyed by bean name. Each provider is annotated `@Component("geminiProvider")`, `@Component("openrouterProvider")`, etc. The orchestrator then looks up `"gemini" + "Provider"` = `"geminiProvider"` to find the right bean at runtime.

---

**Q: Explain the single-pass aggregation design.**

> The old approach would traverse commits separately per analyzer. `ContributionAggregator` does one traversal: for each commit matching the author, diffs are computed once via `DiffFormatter`, then fed to `FileChangeAnalyzer` and `FolderAnalyzer` simultaneously, while the commit message goes to `KeywordAnalyzer`. This halves JGit I/O compared to multiple passes.

---

**Q: How does OAuth2 login work in Spring Security?**

> `SecurityConfig` calls `http.oauth2Login()`. Spring registers GitHub as a client via `application.yml` with `client-id`, `client-secret`, and scopes (`read:user`, `repo`). When the user hits `/oauth2/authorization/github`, Spring redirects to GitHub's consent page. GitHub redirects back with an auth code to `/login/oauth2/code/github`. Spring exchanges the code for an access token, fetches the user profile, stores the token in `OAuth2AuthorizedClientService`, and stores the `OAuth2AuthenticationToken` in `SecurityContextHolder`. The custom `OAuth2LoginSuccessHandler` then redirects the browser to the frontend.

---

**Q: Why is CSRF disabled?**

> CSRF attacks exploit session cookies sent automatically by browsers to malicious third-party sites. This is mitigated here by CORS: `allowedOrigins` is set to the specific frontend URL (not wildcard), and `allowCredentials(true)` requires the browser to enforce exact origin matching. This combination prevents cross-site requests, making CSRF tokens redundant for this REST API.

---

**Q: How does the `GlobalExceptionHandler` work?**

> `@RestControllerAdvice` makes the class apply to all `@RestController` classes globally. `@ExceptionHandler(SomeException.class)` methods are called when that exception propagates out of any controller. The handler maps:
> - `JobNotFoundException` → HTTP 404
> - `GitException` → HTTP 400
> - `MethodArgumentNotValidException` → HTTP 400 with field-level error map
> - `Exception` (catch-all) → HTTP 500

---

**Q: Why use `@ConfigurationProperties` instead of `@Value`?**

> `@ConfigurationProperties` binds an entire YAML subtree to a typed Java class with nested objects, IDE autocompletion, and type safety. `@Value` only injects single scalar values. For `AiProperties`, which has nested config for three providers (gemini, openrouter, ollama), `@ConfigurationProperties` is far cleaner. `@Value` is only used for simple single-property injections like `frontendUrl` in the OAuth handlers.

---

**Q: How does repository access verification work without cloning?**

> `JGit.lsRemoteRepository()` only fetches the remote's reference list — no data is downloaded, no clone happens. If it succeeds anonymously, the repo is `PUBLIC`. If it throws a `TransportException` with "Authentication is required", the repo is private — the service then retries with the OAuth token. This three-state result (`PUBLIC`, `PRIVATE_ACCESSIBLE`, `PRIVATE_NOT_ACCESSIBLE`) lets the frontend show the right UI message before the user even starts analysis.

---

**Q: What is the `ConcurrentHashMap` used for and why?**

> It's the in-memory job store in `AnalysisService`. The request thread writes new jobs (`put`), the async analysis thread mutates job status and progress (`get` + setters), and the polling request threads read jobs (`get`). `ConcurrentHashMap` allows concurrent reads and thread-safe writes without locking the entire map — unlike `Collections.synchronizedMap()` which locks on every operation.

---

**Q: How does logout work?**

> `SecurityConfig` configures `POST /api/auth/logout` to: invalidate the HTTP session, clear the `SecurityContextHolder` authentication, and delete the `JSESSIONID` cookie. The `logoutSuccessHandler` returns HTTP 200 instead of a redirect (appropriate for a SPA that handles routing client-side).

---

**Q: Explain constructor injection vs field injection.**

> Constructor injection is used exclusively. It makes dependencies explicit (listed in the constructor), allows fields to be `final` (immutable), makes the class testable without a Spring context (just call the constructor with mocks), and causes Spring to detect circular dependencies at startup rather than at runtime.

---

**Q: How does Bean Validation work in this project?**

> `AnalysisRequestDto` has `@NotBlank` on both fields and `@Pattern` on `repositoryUrl` (regex: `^https?://github\.com/[^/]+/[^/]+$`). The `@Valid` annotation on the controller method parameter tells Spring to run validation before the method executes. On failure, Spring throws `MethodArgumentNotValidException`, which `GlobalExceptionHandler` catches and converts to a 400 response with a map of `{ fieldName: errorMessage }`.

---

**Q: What design patterns are used in the AI layer?**

> - **Strategy**: `AiProvider` is the interface; `GeminiProvider`, `OpenRouterProvider`, `OllamaProvider` are interchangeable strategies.
> - **Template Method**: `AbstractAiProvider` defines the algorithm (check cache → call `executeReportGeneration()` → cache result). Subclasses only implement `executeReportGeneration()`.
> - **Chain of Responsibility**: `AiOrchestrator`'s fallback loop — each provider in the chain gets a chance to handle the request before the next.

---

**Q: How does the LRU cache in `AbstractAiProvider` work?**

> It uses `Collections.synchronizedMap()` wrapping a `LinkedHashMap` constructed with access-order mode (`true` as 3rd argument). In access-order mode, `get()` and `put()` move entries to the tail. The `removeEldestEntry()` override returns `true` when `size() > 50`, evicting the least-recently-accessed entry. `synchronizedMap()` wraps it for thread safety across concurrent analysis jobs.

---

**Q: What happens if a user analyzes a private repo they don't have access to?**

> The clone step in `RepositoryCloner` uses `UsernamePasswordCredentialsProvider(token, "")`. If the token doesn't have access, JGit throws a `TransportException`. `RepositoryCloner` catches it and wraps it in a `GitException`. In `AnalysisService.processAnalysis()`, the exception propagates out of the clone step, the job is set to `FAILED` with the error message, and `deleteRepository()` is called in the `finally` block to clean up.

---

**Q: How are environment variables used?**

> All sensitive and environment-specific values are externalized in `application.yml` using `${ENV_VAR_NAME}` syntax:
> `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` — OAuth credentials  
> `GEMINI_API_KEY`, `OPENROUTER_API_KEY` — AI provider keys  
> `DEVTRACE_FRONTEND_URL` — used for CORS and OAuth redirect  
> `PORT` — server port (defaults to `8080` via `${PORT:8080}`)  
> This makes the application environment-agnostic and Docker-friendly.

---

**Q: How would you scale this application?**

> Current limitations: (1) in-memory job store lost on restart, (2) single instance only. To scale: replace `ConcurrentHashMap` with Redis (supports TTL, works across instances), use Spring Session with Redis for distributed session management, deploy multiple instances behind a load balancer, and use a message queue (e.g., RabbitMQ) instead of `ThreadPoolTaskExecutor` for job submission to decouple producers from consumers.
