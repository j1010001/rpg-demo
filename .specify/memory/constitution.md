<!--
SYNC IMPACT REPORT
Version change: (none — initial ratification) → 1.0.0
Modified principles: All populated from template placeholders (I–VI)
Added sections: Core Principles (I–VI), Technology Constraints, Requirement Provenance Format, Governance
Removed sections: [SECTION_2_NAME], [SECTION_3_NAME] placeholder blocks replaced with concrete sections
Templates requiring updates:
  - .specify/templates/spec-template.md ✅ updated — provenance block format added to FR examples
  - .specify/templates/tasks-template.md ✅ updated — Phase 0 (Deployable Probe) added before Phase 1 Setup
  - .specify/templates/plan-template.md ✅ no change needed — Constitution Check is abstract, populates at plan time
Follow-up TODOs: None — all placeholders resolved
-->

# RPG Demo Constitution

## Core Principles

### I. Human Authority at Spec Altitude

Humans decide WHAT (scope, goals) and WHY (priorities, rationale) at specification level.
Agents own HOW: architecture choices, implementation strategy, tooling decisions.
Spec-level decisions MUST NOT be delegated to agents or resolved unilaterally during
implementation. When the WHAT or WHY is unclear, agents MUST escalate rather than infer.

### II. Minimal Escalation

Workers MUST escalate ONLY on:

- **(a)** spec ambiguity that forces a decision that cannot be resolved by reading existing specs,
- **(b)** a constitutional conflict that prevents completing a task, or
- **(c)** acceptance criteria that are structurally unachievable as written.

Workers MUST NOT escalate for style choices, implementation uncertainty, aesthetic preferences,
or any decision the spec leaves to the worker's judgment. Silence from the spec is permission.

### III. Deployable Probe First

The first milestone of every feature MUST be a deployable, browser-openable probe: a minimal
vertical slice that demonstrates the feature's core mechanic. No feature advances to full
implementation until its probe ships and can be manually validated. The probe is not a mockup;
it MUST run in a real browser without modification.

### IV. Static-First Stack

The project MUST be a static site: no build step, no backend, no server-side rendering.
All implementation MUST use HTML, CSS, and vanilla JS only — no frameworks, bundlers,
transpilers, or package managers. Files MUST work when opened directly in a browser
(via file:// or served as static assets) without any preprocessing.
Any deviation from this stack requires a constitutional amendment.

### V. Requirement Provenance

Every requirement MUST carry provenance: who decided it and at what weighted percentage.
Format: `Decided by: [Name/Role] | Weight: [%] | Date: YYYY-MM-DD`
For multi-stakeholder decisions, all contributors are listed with weights summing to 100%.
Requirements without provenance are invalid and MUST NOT be implemented until attributed.
Provenance records are immutable: changes to a requirement require a new entry, not an edit.

### VI. Spec-Arbitrated Review

Reviewers MUST arbitrate only against the spec and this constitution.
Spec-silent style decisions are the worker's call; a reviewer MUST NOT block work for
preference or convention not mandated by the spec or constitution.
If the spec is silent and the reviewer disagrees with the worker's choice, the reviewer's
only recourse is to propose a spec amendment — not to block the current work.

## Technology Constraints

The stack is non-negotiable:

- **HTML + CSS + vanilla JS** — no React, Vue, Angular, Svelte, or any other framework
- **No build step** — no Webpack, Vite, Rollup, esbuild, or equivalent
- **No backend** — no Node.js server, no API, no database; all state is client-side
- **No package manager dependencies** — no npm/yarn/pnpm installs required to run the project

This constraint exists to maximize portability, minimize setup friction, and ensure the project
can be opened by anyone with a browser. It is a load-bearing architectural decision, not a
preference. Violations require a constitutional amendment before implementation begins.

## Requirement Provenance Format

Every functional requirement in a spec MUST include a provenance block immediately after
the requirement text:

```
- **FR-001**: System MUST [capability]
  > Decided by: [Name/Role] | Weight: 100% | Date: YYYY-MM-DD
```

For multi-stakeholder decisions:

```
- **FR-002**: System MUST [capability]
  > Decided by: Alice (Product) 60%, Bob (Tech Lead) 40% | Date: YYYY-MM-DD
```

Weights represent decision authority, not implementation priority. The spec's Requirements
section is the canonical provenance record for this project.

## Governance

- This constitution supersedes all other project documentation on matters of principle.
- Amendments require: (1) identifying the affected principle, (2) written rationale,
  (3) version bump per semver rules below, (4) update to this file, (5) propagation to
  dependent templates.
- **MAJOR** bump: principle removal, redefinition, or change that breaks existing work.
- **MINOR** bump: new principle or section added, or materially expanded guidance.
- **PATCH** bump: clarifications, wording fixes, typo corrections.
- All agents MUST read the current constitution before beginning any task.
- Constitution compliance is the first gate in every plan's Constitution Check section.

**Version**: 1.0.0 | **Ratified**: 2026-06-15 | **Last Amended**: 2026-06-15
