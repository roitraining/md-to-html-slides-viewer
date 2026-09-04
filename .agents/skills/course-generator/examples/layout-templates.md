# Course Generator Slide Layout Templates

Copy and paste these templates when building decks for the HTML Slides Viewer.
See [SKILL.md](../SKILL.md) for course structure, timing, and multi-file rules.

---

## 0. Multi-file course layout

```text
course-root/
  00-introduction.md
  01-getting-started.md
  02-basic-language-syntax.md
  images/
    roi-logo-with-name.png
    ch01-architecture-overview.png
    ch02-console-screenshot.png   # may be a TODO placeholder target
```

Every Markdown file starts with the **same** course-title metadata:

```markdown
<!-- course-title: 815: Hands-On Terraform -->
```

---

## 1. Title / Chapter Divider

```markdown
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Course 815:
# Hands-On Terraform

## Infrastructure as Code for Cloud Teams
```

Chapter divider variant:

```markdown
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

815: Hands-On Terraform

# Chapter 2: State & Remote Backends
```

---

## 2. Welcome (Introduction chapter)

```markdown
# Welcome!

- ROI leads the industry in designing and delivering customized technology and management training solutions
- Meet your instructor
  - Name
  - Background
  - Contact info
- Let’s get started!
```

Do **not** invent a fictional instructor—leave Name / Background / Contact info as placeholders unless the user provides details.

---

## 3. Course Objectives (1 overall + one per chapter)

```markdown
# Course Objectives

- **Build and operate production Terraform workflows** with remote state, modules, and safe apply practices
- Get productive with Terraform core workflow and providers
- Manage remote state, locking, and collaboration
- Design reusable modules and workspaces
- Apply policy, testing, and delivery patterns
```

(First bullet = overall course objective; following bullets = one per content chapter.)

---

## 4. Course Agenda (chapter list)

Course-level orientation (distinct from per-section Navigation):

```markdown
# Agenda

- Chapter 1: Getting Started with Terraform
- Chapter 2: State & Remote Backends
- Chapter 3: Modules & Workspaces
- Chapter 4: Delivery & Guardrails
```

Optional: use `<!-- layout: navigation -->` and bold the first chapter if you want syllabus highlighting.

---

## 5. Who Should Attend / Prerequisites

```markdown
# Who Should Attend

- Cloud engineers and DevOps practitioners
- Developers who own infrastructure as code
- Technical leads standardizing IaC practices
```

```markdown
# Prerequisites

- Comfortable with the Linux command line
- Familiar with at least one major cloud console (AWS, Azure, or GCP)
- Basic Git workflows (clone, commit, push)
```

---

## 6. Chapter Objectives

```markdown
# Chapter 2: Objectives

- Explain why local state fails for teams
- Configure a remote backend with locking
- Recover from common state drift scenarios
```

---

## 7. Section Navigation (full list, one bold)

Repeat before **each** section. Same list every time; move the bold.

```markdown
<!-- layout: navigation -->
# Chapter 2

- **Why State Matters**
- Remote Backends
- State Locking & Conflicts
- Drift & Recovery
```

Later in the chapter:

```markdown
<!-- layout: navigation -->
# Chapter 2

- Why State Matters
- **Remote Backends**
- State Locking & Conflicts
- Drift & Recovery
```

---

## 8. Default Content (+ alerts)

```markdown
# Why Local State Fails

- **Single laptop**: state lives on one machine
- **No locking**: concurrent applies can corrupt state
- **Secrets risk**: state may contain sensitive values
- **No history**: hard to audit who changed what

> [!WARNING]
> Never commit `terraform.tfstate` to git.
```

Alert examples:

```markdown
> [!NOTE]
> Background context the instructor can expand on.

> [!TIP]
> A shortcut experienced practitioners use.

> [!IMPORTANT]
> A rule students must not miss.

> [!CAUTION]
> Strong caution before a destructive action.
```

---

## 9. Auto-Split (list + image, no layout directive)

```markdown
# Remote Backend Shape

- **Bucket / container** stores state objects
- **Lock table** prevents concurrent writes
- **IAM / identity** scopes least privilege
- **Encryption** at rest is mandatory

![Backend Diagram](images/ch02-remote-backend-diagram.png)
```

---

## 10. Two-Column / Three-Column

```markdown
<!-- layout: 2-column -->
# Local vs Remote State

### Local
- Fast for solo prototypes
- No team sharing
- Easy to lose or overwrite

### Remote
- Shared source of truth
- State locking
- Audit-friendly workflows
```

```markdown
<!-- layout: 3-column -->
# Backend Options

### Amazon S3
- DynamoDB locks
- Common in AWS shops

### Azure Blob
- Native lease locking
- Entra ID auth patterns

### GCS
- Object generation preconditions
- Strong GCP IAM fit
```

Prefer a **table** or columns instead of more than two levels of nested bullets.

---

## 11. Title-Image

```markdown
<!-- layout: title-image -->
# Reference Architecture

![System Diagram](images/ch02-reference-architecture.png)
```

---

## 11b. Stacked (content top, image below)

Use when bullets and a wide diagram belong on the same slide, but auto-split (side-by-side) is the wrong shape.

```markdown
<!-- layout: stacked -->
# From Chatbots to Agents

- A chatbot answers one prompt at a time—you drive every step
- An agent pursues a goal: it plans, acts, checks results, and keeps going
- The shift is giving the model a loop, tools, and permission to act

![From chatbots to agents](images/chatbots-to-agents.png)
```

Alias: `<!-- layout: stack -->` also works.

---

## 12. Code teaching slide

~~~~markdown
# Declaring a Remote Backend

- Backends are configured in Terraform, not variables
- Changing backend settings requires a migration workflow

```hcl
terraform {
  backend "s3" {
    bucket         = "tf-state-prod"
    key            = "network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-locks"
    encrypt        = true
  }
}
```
~~~~

Always include a language tag on fences.

---

## 13. Image placeholder (human must supply)

When you cannot create an accurate asset (e.g. real product UI):

```markdown
# Enable Bucket Versioning

- Turn on versioning before migrating state
- Confirm the setting in the cloud console

<!-- TODO IMAGE: Screenshot of AWS S3 console showing bucket versioning enabled -->
![S3 versioning console](images/ch02-s3-versioning-screenshot.png)
```

Generate custom diagrams/infographics/photos into `images/` when you can; use TODO placeholders when you cannot.

---

## 14. Lab stub (end of chapter — no lab body)

Do **not** write lab steps here. Labs are authored separately.

```markdown
# Lab 2: Configure Remote State

**Time:** 25 minutes

**Lab guide:** [Lab 2 instructions](https://example.com/labs/lab-02)
```

---

## 15. What You Learned (past tense of Chapter Objectives)

```markdown
# What You Learned

- Explained why local state fails for teams
- Configured a remote backend with locking
- Recovered from common state drift scenarios
```

---

## 16. Q&A

```markdown
# Q&A

Questions?
```

---

## 17. Assemble files

**`00-introduction.md`:** Title → Welcome → Course Objectives → Agenda → Who Should Attend → Prerequisites

**Each `0N-….md` chapter:** Title → Chapter Objectives → (Navigation → section slides) × N → Lab stub → What You Learned → Q&A
