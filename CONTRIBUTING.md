# Contributing

Start from `main` and create a focused `feature/`, `fix/`, or `docs/` branch. Keep behavior changes and documentation accurate together.

```sh
npm ci
npm run validate
npm run package:metadata
```

For a platform behavior change, also exercise the affected workflow on an SFCC sandbox. CI mocks cannot validate real platform restrictions or metadata installation. Document which checks were automated and which were performed manually.

Use the PR template to explain the trigger, resulting behavior, validation, and deployment notes. Add tests for regressions involving identity, moderation, caching, serialization, or data access. Preserve iterator cleanup and the rule that only approved reviews are public.

Keep credentials and generated output out of Git. Add new merchant-facing settings to both the metadata and the merchant guide. Update resource bundles for new text. Reconcile SFRA template overlays when updating the host storefront.

See [NOTICE.md](NOTICE.md) for attribution and terms before redistributing SFRA-derived material.
