# Development phases

[← README](../README.md)

The existing working implementation is organized into five reviewable delivery phases. These branches describe the repository's packaging and review structure; they do not claim to reproduce the original chronological development history.

Each phase has a dedicated feature branch and PR targeting `main`. Phases are merged in order, retaining their branches and merge commits for reference.

| Phase | Feature branch | Scope | Pull request |
| --- | --- | --- | --- |
| 01 · Foundation | `feature/phase-01-foundation` | Cartridge identity, metadata definitions, placeholder deployment config | To be linked after creation |
| 02 · Review storage | `feature/phase-02-review-storage` | Canonical products, validation, keys, transactional persistence, approved aggregates, storage tests | To be linked after creation |
| 03 · Storefront | `feature/phase-03-storefront` | HTTPS routes, login return flow, review templates, browser interactions, styling, resources, controller tests | To be linked after creation |
| 04 · Tooling and quality | `feature/phase-04-tooling-quality` | Reproducible npm dependencies, standalone build, lint checks, metadata ZIP, GitHub Actions, PR template | To be linked after creation |
| 05 · Documentation | `feature/phase-05-documentation` | Screenshot gallery, installation, merchant operation, architecture, complete code reference, testing, troubleshooting | To be linked after creation |

## Review order

Start with the data model, then the service's exported contracts. Review the controller's early failure returns before inspecting the templates and browser code. Review build/deployment assumptions next, then use the documentation and screenshots to verify the end-user and merchant workflows.

The final `main` branch contains all five phases. Build output is generated locally or downloaded from a successful GitHub Actions run; it is not committed to source control.
