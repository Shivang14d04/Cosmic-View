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

## 6. Kubernetes Production Best Practices: `resources`, `readinessProbe`, and `livenessProbe`

In Kubernetes deployments, the `resources`, `readinessProbe`, and `livenessProbe` sections are optional but considered best practices for production environments.

**`resources`**

Allows you to define CPU and memory **requests** (minimum resources the container needs) and **limits** (maximum resources it can consume). This helps Kubernetes schedule pods efficiently and prevents one container from exhausting the node's resources.

**`readinessProbe`**

Checks whether the application inside the container is ready to receive traffic. Until it passes, Kubernetes will not route requests to that pod.

**`livenessProbe`**

Checks whether the container is still healthy and responsive. If it fails repeatedly, Kubernetes automatically restarts the container to recover from crashes or hangs.

> Many tutorials (like TechWorld with Nana) omit these fields to keep examples simple, but in real production systems they are commonly included to improve **reliability**, **stability**, and **self-healing behavior**.

**Example configuration:**

```yaml
resources:
  requests:
    cpu: "100m"
    memory: "128Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"

readinessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 20
```

## 7 CVE Error in Trivy Scan

During the CI/CD pipeline, the Trivy image scan stage failed because it detected a CRITICAL vulnerability in the Docker image.

The scan output reported:

Library: zlib
CVE: CVE-2026-22184
Severity: CRITICAL
Installed Version: 1.3.1-r2
Fixed Version: 1.3.2-r0
What is CVE?

CVE (Common Vulnerabilities and Exposures) is a public database that tracks known security vulnerabilities in software. Each vulnerability is assigned a unique identifier such as CVE-2026-22184.

Security scanners like Trivy check container images against this database to detect vulnerable packages.

Why the error occurred

The Docker image was built using the base image:

node:22-alpine

This Alpine Linux image contained an outdated version of the zlib library (1.3.1-r2) which has a known vulnerability that could allow arbitrary code execution through a buffer overflow.

Since the pipeline used the following Trivy configuration:

--severity CRITICAL
--exit-code 1

Trivy returned exit code 1 when a CRITICAL vulnerability was found, causing the Jenkins pipeline to fail.

How the issue was fixed

The vulnerability was resolved by upgrading system packages in the final Docker image using:

RUN apk update && apk upgrade --no-cache

This updates vulnerable packages (including zlib) to a secure version (1.3.2-r0), eliminating the CVE detected by Trivy.

Key takeaway

Security scanners like Trivy help enforce DevSecOps practices by preventing container images with critical vulnerabilities from being deployed. Updating base image packages or using newer base images is a common method to resolve such CVEs.

## 8 Jenkins Disk Space Issue

Another issue occurred when the Jenkins EC2 instance ran out of disk space during pipeline execution.

Cause

The Jenkins instance stored large amounts of data from previous builds, including:

Jenkins workspace directories

Docker images and containers

Trivy vulnerability database

Build artifacts and logs

Over time, these accumulated and filled the instance storage.

Solution

The issue was resolved by cleaning unused resources.

Remove old workspaces:

sudo rm -rf /var/lib/jenkins/workspace/\*

Remove unused Docker images and containers:

docker system prune -af

Remove unused Docker volumes:

docker volume prune -f

After cleanup, disk usage dropped and the Jenkins pipeline could run successfully again.

Best Practice

To prevent this issue in the future, Jenkins pipelines should automatically clean workspaces and unused Docker resources after builds using steps such as:

cleanWs()
docker system prune -af

## 9 SonarQube Quality Gate Failure Due to Glob Pattern in Dockerfile

The SonarQube quality gate failed because the Dockerfile used a glob pattern (package-lock.json\*) in the COPY command. Wildcard globbing can unintentionally copy extra files and make builds non-deterministic. The issue was resolved by explicitly copying the required files using COPY package.json package-lock.json ./, ensuring reproducible and predictable Docker builds in the CI/CD pipeline.
