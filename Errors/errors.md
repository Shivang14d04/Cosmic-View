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

## 7. CVE Error in Trivy Scan (CRITICAL)

**Error:** The Trivy image scan stage failed because a CRITICAL CVE was detected.

**Scan output:**

```
Library: zlib
CVE: CVE-2026-22184
Severity: CRITICAL
Installed Version: 1.3.1-r2
Fixed Version: 1.3.2-r0
```

**Why it happens:**

- The image was built from `node:22-alpine`.
- The base image included a vulnerable `zlib` version.
- Trivy was configured with `--severity CRITICAL --exit-code 1`, so any CRITICAL finding fails the build.

**Fix:**

- Upgrade packages in the final image:

```dockerfile
RUN apk update && apk upgrade --no-cache
```

- Alternatively, use a newer base image that already contains the fixed package.

**Key takeaway:** Trivy failures often come from base image packages, not application code. Keep base images and OS packages current.

---

## 8. Jenkins Disk Space Exhausted

**Error:** Jenkins ran out of disk space during pipeline execution.

**Why it happens:** Build artifacts, old workspaces, Docker images/containers, and the Trivy database accumulate over time on the EC2 instance.

**Fix:**

- Remove old workspaces:

```bash
sudo rm -rf /var/lib/jenkins/workspace/*
```

- Remove unused Docker resources:

```bash
docker system prune -af
docker volume prune -f
```

**Prevention:**

- Add cleanup steps after builds:

```groovy
cleanWs()
sh 'docker system prune -af'
```

---

## 9. SonarQube Quality Gate Failure: Dockerfile Glob

**Error:** Quality gate failed due to a glob pattern in a `COPY` instruction.

**Why it happens:** Using `package-lock.json*` can match unintended files and make builds non-deterministic, which SonarQube flags.

**Fix:**

- Copy files explicitly:

```dockerfile
COPY package.json package-lock.json ./
```

---

# Terraform Destroy Failures on EKS — Root Cause & Resolution Guide

> **TL;DR** — Kubernetes dynamically creates AWS resources (Load Balancers, ENIs, Elastic IPs) that Terraform never tracked. AWS blocks deletion of anything that still has live dependencies. Clean Kubernetes resources first, then run `terraform destroy`.

---

## Table of Contents

1. [Why This Happens](#1-why-this-happens)
2. [The Dependency Chain](#2-the-dependency-chain)
3. [Common Hidden Blockers](#3-common-hidden-blockers)
4. [Resolution — Step-by-Step](#4-resolution--step-by-step)
   - [Step 1 — Clean Kubernetes Resources](#step-1--clean-kubernetes-resources)
   - [Step 2 — Verify Load Balancers](#step-2--verify-load-balancers)
   - [Step 3 — Verify EC2 Instances](#step-3--verify-ec2-instances)
   - [Step 4 — Check ENIs](#step-4--check-enis)
   - [Step 5 — Check NAT Gateways & Elastic IPs](#step-5--check-nat-gateways--elastic-ips)
   - [Step 6 — Run Terraform Destroy](#step-6--run-terraform-destroy)
5. [Fast Debug Checklist](#5-fast-debug-checklist)
6. [Special Case — VPC Stuck in `deleting`](#6-special-case--vpc-stuck-in-deleting)
7. [What NOT To Do](#7-what-not-to-do)
8. [Golden Rules](#8-golden-rules)
9. [Prevention & Best Practices](#9-prevention--best-practices)

---

## 1. Why This Happens

Terraform tracks only the resources it creates. In an EKS cluster, Kubernetes itself provisions AWS resources at runtime in response to Kubernetes objects — these resources exist entirely outside Terraform's state.

```
┌──────────────────────────────────────────────────────┐
│  kubectl apply -f service.yaml  (type: LoadBalancer)  │
│         │                                              │
│         ▼                                              │
│  Kubernetes Controller → AWS API                       │
│         │                                              │
│         ▼                                              │
│  ELB / NLB created ──► Terraform has NO record of it  │
└──────────────────────────────────────────────────────┘
```

When `terraform destroy` runs:

1. Terraform attempts to delete the VPC, subnets, and internet gateway.
2. AWS finds the ELB/ENI/EIP still attached to these resources.
3. AWS returns `DependencyViolation` and blocks the deletion.
4. Terraform exits with an error, leaving the infrastructure half-destroyed.

---

## 2. The Dependency Chain

AWS enforces a strict bottom-up deletion order. Anything at a higher layer must be gone before the layer below can be deleted.

```
┌─────────────────────────────────────────────┐
│  Layer 4 — Compute & Services               │
│  EC2 Instances / Load Balancers (ELB/ALB/   │
│  NLB) / NAT Gateways / Elastic IPs / ENIs   │
└────────────────────┬────────────────────────┘
                     │ must be deleted first
                     ▼
┌─────────────────────────────────────────────┐
│  Layer 3 — Subnets                          │
│  Public & Private Subnets                   │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Layer 2 — VPC                              │
└────────────────────┬────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  Layer 1 — Internet Gateway                 │
└─────────────────────────────────────────────┘
```

If **anything** in Layer 4 exists, **everything** below it will fail to delete.

---

## 3. Common Hidden Blockers

| Resource                       | Created By                               | Why It Blocks                |
| ------------------------------ | ---------------------------------------- | ---------------------------- |
| Classic Load Balancer (ELBv1)  | `Service type=LoadBalancer`              | Attached to subnets          |
| ALB / NLB (ELBv2)              | `Ingress` or `Service type=LoadBalancer` | Attached to subnets          |
| ENI (`amazon-elb` description) | AWS automatically for ELBs               | Attached to subnets          |
| ENI (`aws-k8s-*` description)  | AWS VPC CNI for pods                     | Attached to subnets          |
| NAT Gateway                    | Kubernetes egress traffic                | Requires subnet, EIP         |
| Elastic IP                     | Attached to NAT Gateway                  | Blocks NAT GW deletion       |
| EC2 Instances (worker nodes)   | Managed Node Group                       | Attached to subnets          |
| Security Group rules           | EKS controller                           | References block SG deletion |

> **Key insight:** ENIs with description `amazon-elb` cannot be deleted directly. You must delete the owning Load Balancer first — AWS will release the ENI automatically.

---

## 4. Resolution — Step-by-Step

> ⚠️ **Always perform steps 1–5 before running `terraform destroy`.** Running destroy first and then trying to clean up is significantly harder.

### Step 1 — Clean Kubernetes Resources

Delete all services and ingresses that may have provisioned AWS Load Balancers. Do this while the cluster is still reachable.

```bash
# Delete all services across all namespaces
kubectl delete svc --all -A

# Delete all ingresses across all namespaces
kubectl delete ingress --all -A

# Wait ~60 seconds for the AWS Load Balancer Controller
# or in-tree cloud provider to deprovision the ELBs
sleep 60
```

> If the cluster is already unreachable, skip to Step 2 and clean up manually via AWS CLI.

---

### Step 2 — Verify Load Balancers

Check for both ELBv1 (Classic) and ELBv2 (ALB/NLB). Both can block VPC deletion.

```bash
# List ELBv2 (ALB / NLB)
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[*].{Name:LoadBalancerName,ARN:LoadBalancerArn,Type:Type,State:State.Code}' \
  --output table

# List ELBv1 (Classic)
aws elb describe-load-balancers \
  --query 'LoadBalancerDescriptions[*].{Name:LoadBalancerName,DNS:DNSName}' \
  --output table
```

**If any remain, delete them:**

```bash
# Delete ELBv2 by ARN
aws elbv2 delete-load-balancer \
  --load-balancer-arn <arn>

# Delete ELBv1 by name
aws elb delete-load-balancer \
  --load-balancer-name <name>
```

---

### Step 3 — Verify EC2 Instances

EKS worker nodes in a managed node group are typically removed when Terraform destroys the node group, but it's worth confirming.

```bash
# List running instances with their tags
aws ec2 describe-instances \
  --filters "Name=instance-state-name,Values=running,pending,stopping" \
  --query 'Reservations[*].Instances[*].{ID:InstanceId,State:State.Name,Type:InstanceType,Name:Tags[?Key==`Name`].Value|[0]}' \
  --output table
```

**If EKS worker nodes still appear, terminate them:**

```bash
aws ec2 terminate-instances --instance-ids <id1> <id2>

# Wait for termination
aws ec2 wait instance-terminated --instance-ids <id1> <id2>
```

---

### Step 4 — Check ENIs

ENIs are the most common silent blocker. They persist even after a Load Balancer appears deleted, due to AWS async cleanup.

```bash
# List all non-terminated ENIs, grouped by description
aws ec2 describe-network-interfaces \
  --query 'NetworkInterfaces[*].{ID:NetworkInterfaceId,Status:Status,Description:Description,Owner:Attachment.InstanceOwnerId}' \
  --output table
```

**Interpret the results:**

| ENI Description                        | Status      | Action                                                       |
| -------------------------------------- | ----------- | ------------------------------------------------------------ |
| `amazon-elb`                           | any         | Delete the owning Load Balancer — ENI releases automatically |
| `aws-k8s-*` or `interface for fargate` | `in-use`    | Find and delete the owning resource                          |
| _(blank or custom)_                    | `available` | Safe to delete manually (see below)                          |
| any                                    | `in-use`    | Find the attachment owner before deleting                    |

```bash
# Detach an ENI that is in 'available' status and delete it
aws ec2 delete-network-interface \
  --network-interface-id <eni-id>
```

> ❌ **Never force-delete an `amazon-elb` ENI directly.** It will fail and is unnecessary — deleting the Load Balancer releases it automatically.

---

### Step 5 — Check NAT Gateways & Elastic IPs

```bash
# List NAT Gateways (filter out already-deleted ones)
aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available,pending,deleting" \
  --query 'NatGateways[*].{ID:NatGatewayId,State:State,SubnetId:SubnetId}' \
  --output table

# List Elastic IPs
aws ec2 describe-addresses \
  --query 'Addresses[*].{AllocationId:AllocationId,IP:PublicIp,AssociationId:AssociationId}' \
  --output table
```

**Delete NAT Gateways first, then release EIPs:**

```bash
# Delete NAT Gateway (async — takes 1–2 min to fully delete)
aws ec2 delete-nat-gateway --nat-gateway-id <id>

# Wait before releasing the EIP — the NAT GW must be deleted first
aws ec2 wait nat-gateway-deleted --nat-gateway-ids <id>

# Release the Elastic IP
aws ec2 release-address --allocation-id <allocation-id>
```

---

### Step 6 — Run Terraform Destroy

After completing steps 1–5:

```bash
cd <your-terraform-directory>

terraform destroy
```

If it still fails, re-run the AWS CLI checks above — something was missed. Terraform error messages will typically reference a specific resource ID, making it easier to trace back to the blocker.

---

## 5. Fast Debug Checklist

When `terraform destroy` fails with `DependencyViolation`, run through this in order:

```
[ ] 1. kubectl delete svc --all -A && kubectl delete ingress --all -A
[ ] 2. aws elbv2 describe-load-balancers    → delete if any found
[ ] 3. aws elb describe-load-balancers      → delete if any found
[ ] 4. aws ec2 describe-instances           → terminate if running
[ ] 5. aws ec2 describe-network-interfaces  → trace owner or delete if 'available'
[ ] 6. aws ec2 describe-nat-gateways        → delete if found
[ ] 7. aws ec2 describe-addresses           → release unassociated EIPs
[ ] 8. terraform destroy
```

---

## 6. Special Case — VPC Stuck in `deleting`

Sometimes subnets and the internet gateway delete successfully but the VPC itself gets stuck. This is almost always caused by ENIs that haven't been released yet by AWS (async cleanup lag).

**Verify:**

```bash
# Replace <vpc-id> with your actual VPC ID
aws ec2 describe-network-interfaces \
  --filters "Name=vpc-id,Values=<vpc-id>" \
  --query 'NetworkInterfaces[*].{ID:NetworkInterfaceId,Status:Status,Description:Description}' \
  --output table
```

**Resolution:**

- If ENIs are still listed → wait 1–3 minutes and check again. AWS is cleaning them up asynchronously.
- If ENIs are gone but VPC is still stuck → wait an additional 2–5 minutes. AWS VPC deletion propagation can lag.
- Run `terraform destroy` again once the VPC is gone from `aws ec2 describe-vpcs`.

> Do **not** attempt to force-delete a VPC via the console or CLI while Terraform considers it in-state — this will cause a state drift that requires manual `terraform state rm` to fix.

---

## 7. What NOT To Do

| ❌ Don't                                           | Why                                                           |
| -------------------------------------------------- | ------------------------------------------------------------- |
| Run `terraform destroy` before cleaning Kubernetes | AWS will immediately return `DependencyViolation`             |
| Manually delete `amazon-elb` ENIs                  | AWS won't allow it — delete the owning Load Balancer instead  |
| Ignore `DependencyViolation` errors                | Something still exists; retrying without fixing it won't help |
| Force-delete a VPC while Terraform tracks it       | Creates state drift requiring manual cleanup                  |
| Delete Security Groups before their dependent SGs  | SGs that reference each other must be cleaned in order        |

---

## 8. Golden Rules

```
1. Kubernetes creates AWS resources → Terraform doesn't know about them
2. AWS blocks deletion if ANY dependency exists
3. Always clean Kubernetes BEFORE running terraform destroy
4. amazon-elb ENI = delete the Load Balancer, NOT the ENI
5. DependencyViolation = something still exists — find it
6. VPC stuck = async cleanup lag — wait and retry
```

---

## 9. Prevention & Best Practices

### Use NLB Instead of Classic ELB

Classic Load Balancers (ELBv1) are harder to manage and slower to clean up. Annotate your services to use NLB:

```yaml
apiVersion: v1
kind: Service
metadata:
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
```

### Add a Pre-Destroy Cleanup Script

Check this into your repo alongside your Terraform code:

```bash
#!/bin/bash
# scripts/pre-destroy.sh
# Run this before terraform destroy in EKS environments

set -e

REGION="${AWS_REGION:-us-east-1}"

echo "==> Deleting Kubernetes services and ingresses..."
kubectl delete svc --all -A --ignore-not-found
kubectl delete ingress --all -A --ignore-not-found

echo "==> Waiting 60s for AWS to deprovision load balancers..."
sleep 60

echo "==> Checking for remaining ELBv2 load balancers..."
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[*].LoadBalancerArn' \
  --output text --region "$REGION" | \
  tr '\t' '\n' | \
  xargs -I{} aws elbv2 delete-load-balancer --load-balancer-arn {} --region "$REGION" || true

echo "==> Checking for remaining ELBv1 load balancers..."
aws elb describe-load-balancers \
  --query 'LoadBalancerDescriptions[*].LoadBalancerName' \
  --output text --region "$REGION" | \
  tr '\t' '\n' | \
  xargs -I{} aws elb delete-load-balancer --load-balancer-name {} --region "$REGION" || true

echo "==> Pre-destroy cleanup complete. Ready to run terraform destroy."
```

### Keep Infrastructure and Kubernetes in Sync

Consider managing Kubernetes resources alongside Terraform using one of these approaches:

- **Terraform Kubernetes provider** — declare `kubernetes_service` resources in Terraform so it knows about them and can destroy them in the right order.
- **Helm + Terraform helm_release** — use the `helm_release` resource to manage application deployments; Terraform will destroy the Helm release (and its Load Balancers) before touching the VPC.
- **ArgoCD / GitOps** — manage app lifecycle separately; include a pre-destroy hook that cleans Kubernetes resources before infra teardown.

---

_Last updated: 2026 | Applies to: terraform-aws-modules/eks ≥ v20, Kubernetes ≥ 1.27, AWS provider ≥ v5_

## 11.

# 🍪 Cookies in Next.js (Localhost vs Vercel vs EKS)

## 🧠 Core Concept

Cookies behave differently depending on:

- **HTTP vs HTTPS**
- **Same-origin vs Cross-origin**
- Browser security rules

---

# 🔑 Key Cookie Options

### 1. `secure`

- `true` → Cookie ONLY works on **HTTPS**
- `false` → Works on **HTTP + HTTPS**

---

### 2. `sameSite`

- `"strict"` → Only same-site requests (very restrictive)
- `"lax"` → Same-site + normal navigation (recommended for HTTP)
- `"none"` → Allows cross-site (requires HTTPS + secure=true)

---

# 🌍 Environment Comparison

## ✅ Localhost

- URL: `http://localhost`
- Browser treats as **trusted**
- Same-origin always

✔ Works with:

```js
secure: false,
sameSite: "strict"
```

---

## ✅ Vercel

- URL: `https://your-app.vercel.app`
- HTTPS + same domain

✔ Works with:

```js
secure: true,
sameSite: "strict"
```

---

## ❌ EKS (without HTTPS)

- URL: `http://<load-balancer>.elb.amazonaws.com`
- HTTP + stricter browser rules

🚫 This fails:

```js
secure: true,        // ❌ requires HTTPS
sameSite: "strict",  // ❌ too restrictive
```

---

# ✅ Correct Config for EKS (HTTP)

```js
secure: false,
sameSite: "lax"
```

✔ Allows:

- Cookie storage on HTTP
- Normal navigation
- API calls from frontend

---

# 🔥 Why `secure: true` fails on HTTP

Browser rule:

> ❗ “Secure cookies can ONLY be stored over HTTPS”

So:

- HTTP + `secure: true` → ❌ cookie rejected

---

# 🔥 Why `sameSite: "strict"` fails

Browser rule:

> ❗ “Only send cookie if request is strictly same-site”

In EKS:

- Redirects / API calls may be treated as cross-site
- Cookie gets blocked

---

# 🚀 Production Config (HTTPS)

When you add domain + HTTPS:

```js
secure: true,
sameSite: "none"
```

✔ Required for:

- Cross-origin setups
- Subdomains
- Real production apps

---

# 🎯 Golden Rules

### 👉 HTTP (EKS without HTTPS)

```js
secure: false;
sameSite: "lax";
```

### 👉 HTTPS (Production)

```js
secure: true;
sameSite: "none";
```

---

# 🧠 One-line Summary

> Cookies fail in EKS because `secure=true` needs HTTPS and `sameSite=strict` is too restrictive.

---

# 🚀 Dev Insight

This is a **real-world production issue**:

- Common in DevOps setups
- Happens in Kubernetes deployments
- Frequently asked in interviews

---
