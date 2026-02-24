# Errors & Fixes

A record of CI/CD errors encountered during the project and how they were resolved.

---

## 1. Missing Environment Variable at Build Time (`next build`)

**Error:** `next build` failed because `process.env.NASA_API_KEY` was undefined.

**Why it happens:** Next.js runs server-side code during `next build` to pre-render pages. Any page referencing an environment variable (e.g. `process.env.NASA_API_KEY`) needs that variable available **at build time**. In CI/Docker environments, host env vars are not inherited automatically, so Jenkins fails the build when the variable is missing.

**Fix:**

- Inject the env var into the build step using Jenkins credentials (`withCredentials`) or the `environment` block.
- Alternatively, mark the page as dynamic (`export const dynamic = 'force-dynamic'`) to skip build-time pre-rendering.

---

## 2. `npm TAR_ENTRY_ERROR (ENOENT)` in Jenkins + Docker

**Error:**

```
npm WARN tar TAR_ENTRY_ERROR ENOENT: no such file or directory
```

**Why it happens:** `npm ci` aggressively deletes and re-extracts `node_modules`. When run inside a Docker container on a Jenkins **bind-mounted** workspace, Jenkins and Docker both interact with the same filesystem simultaneously. This creates race conditions where files temporarily disappear mid-extraction, causing `ENOENT` errors. This is **not** a permissions issue.

**Fix:**

- Use a Docker agent with `reuseNode true` so the same workspace is reused without remounting.
- Clean the workspace **after** the pipeline with `cleanWs()`.
- Avoid unnecessary `chown` or manual deletion of `node_modules`.

This eliminates concurrent filesystem access and stabilises `npm ci`.

---

## 3. SonarQube Error: Unable to Guess Task ID

**Error:** The Jenkins pipeline failed at the Quality Gate step with:

```
Unable to guess SonarQube task id
```

**Why it happens:** The SonarQube analysis was executed using `docker run`, which ran the Sonar Scanner **outside** Jenkins' pipeline context. As a result, Jenkins could not access the `.report-task.txt` file — which contains the SonarQube task ID and server details needed by `waitForQualityGate()`.

**Fix:**

- Run the SonarQube scan using `docker.image().inside {}` instead of `docker run`.
- This lets Jenkins manage the container, auto-mount the workspace, capture `.report-task.txt`, and correctly link the analysis to the Quality Gate.

> **Key Takeaway:** `waitForQualityGate()` only works when SonarQube analysis runs **inside** the Jenkins pipeline context, not via standalone `docker run`.

---

### Note: Two Ways to Run Docker in Jenkins

Both approaches keep the scan inside Jenkins' context and work with `waitForQualityGate()`:

| Approach                   | Scope       | How it works                                                                                                                |
| -------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `docker.image().inside {}` | Step-level  | Jenkins starts Docker inside a specific step, auto-mounts the workspace, and tracks everything.                             |
| `agent { docker { … } }`   | Stage-level | Jenkins starts the container before the stage begins; all steps run inside it with auto-mounted workspace. More structured. |

---

> **Overall Takeaway:** Package managers should not run on frequently remounted CI workspaces. Workspace isolation or reuse is essential to avoid filesystem race conditions in Docker-based CI pipelines.

---

## 4. Trivy Image Scan Failing Due to HIGH Severity CVEs

**Error:**  
During the Trivy image scan, the pipeline failed because HIGH severity CVEs were detected inside the Node base image (`node:20-alpine`).

**Why it happens:**  
Trivy scans the entire image filesystem, including OS and global packages. HIGH severity vulnerabilities were found in npm's bundled dependencies like `glob` and `tar` located under `/usr/local/lib/node_modules/npm/`. These vulnerabilities are not from the application code but from packages included with Node itself. Since the scan was configured with `--severity HIGH,CRITICAL --exit-code 1`, any HIGH severity issue caused the build to fail.

**Fix:**

- Update the base image to the latest version with patches.
- Switch to a slimmer or distroless image with fewer dependencies.
- Use `--ignore-unfixed` to skip vulnerabilities without available fixes.
- Fail the pipeline only on CRITICAL vulnerabilities instead of HIGH.

---

## 5. Insecure Docker Login Practices in CI/CD

**Error:** Using `docker login -u username -p password` exposes credentials in shell history, process list, and CI/CD logs.

**Why it happens:**

- Passwords passed as CLI arguments (`-p password`) are visible in shell history and process listings (`ps aux`).
- In CI/CD pipelines, credentials may leak through logs or be stored insecurely.
- This violates security best practices for handling secrets.

**Fix:**

Use `--password-stdin` to read the password securely from standard input instead of command arguments:

```bash
echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
```

**How `--password-stdin` works:**

Instead of passing the password as a CLI argument, Docker reads it from **stdin** (standard input). The pipe (`|`) sends the output of `echo $DOCKER_PASS` directly to Docker's stdin, keeping the password out of the process list and command history.

**Linux I/O streams:**

| Stream   | Description      |
| -------- | ---------------- |
| `stdin`  | Input to program |
| `stdout` | Output           |
| `stderr` | Error output     |

**Why this is secure:**

1. **Password not in CLI arguments:** Commands like `ps aux` cannot see the password since it's not passed as an argument.
2. **No shell history exposure:** The password is not typed directly as part of the command.
3. **Safe for CI/CD:** In Jenkins, using `withCredentials([usernamePassword(...)])` ensures passwords are:
   - Injected temporarily
   - Masked in logs
   - Never stored in the repository
   - Not visible in console output

**What happens after login:**

Docker stores an authentication token in `~/.docker/config.json`. This token is used for subsequent `docker push` and `docker pull` commands, so the original password is no longer needed.

**Best practices:**

- Use Jenkins Credentials Store or similar secret management tools
- Always use `--password-stdin` for login operations
- Prefer access tokens over real passwords where possible
- Never commit secrets to Git
- Optionally run `docker logout` after completing push operations

---
