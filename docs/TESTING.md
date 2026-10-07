# Testing and validation

[← README](../README.md) · [Code reference](CODE-REFERENCE.md)

## Repeatable local checks

```sh
npm ci
npm run validate
npm run package:metadata
```

`validate` checks JavaScript, SCSS, all seven ISML templates, local documentation/image links, 28 unit tests, and the production asset build. Metadata packaging produces a ZIP suitable for Site Import & Export. The two metadata files were also validated against Salesforce's metadata XSD during implementation; XSD validation is not part of the offline npm command.

## Unit suites

### Storage service — 13 tests

[`test/unit/plugin_productreviews/productReviews.js`](../test/unit/plugin_productreviews/productReviews.js) exercises the real service through mocked SFCC dependencies:

- Default/explicit site preferences.
- Variant and variation-group resolution; missing/offline parent rejection.
- Field lengths and rating validation, including whole-number decimal serialization.
- Server-controlled identity, product, and moderation state.
- One-record edits and re-moderation of approved reviews.
- The one-minute update guard.
- Key separation across products, customers, and sites.
- Approved-only aggregates and public-field projection.
- Pagination, empty lists, unknown iterator counts, and resource cleanup after failures.

The query mock records requested filters and models sorting and paging; it is not a real custom-object database or a concurrent transaction engine.

### Controller — 15 tests

[`test/unit/plugin_productreviews/ReviewsController.js`](../test/unit/plugin_productreviews/ReviewsController.js) exercises registered route handlers with a recording `server` mock:

- HTTPS wiring and POST-only mutation.
- Early returns for invalid CSRF and unauthenticated requests.
- Disabled features and unavailable products.
- Localized field errors without writes.
- Server-derived identity and moderation configuration.
- Rate-limit and storage-failure responses.
- Platform-supported response expiry, personal fragments, and guest prompts.
- Graceful missing-metadata behavior.
- Ordinary HTML POST fallback and primitive session flash values.
- Validated login return routing.

[`test/mocks/modules/serverMock.js`](../test/mocks/modules/serverMock.js) records route methods and middleware chains. Platform header writes deliberately throw in the controller fixture so unsupported cache-header usage cannot silently pass again.

## Browser and sandbox evidence

During implementation, browser checks with mocked responses covered lazy loading, summary updates, form POST serialization, field errors, text escaping, CSRF renewal, save refresh, pagination focus, and fallback links. The rating regression check also confirmed that selecting a new rating clears its error and sends the chosen integer.

Live sandbox checks verified:

- The deployed review controller and assets load from the correct cartridge path.
- `Reviews-List` and `Reviews-Show` return 200 with platform-generated no-cache headers.
- The actual PDP displays the review panel and its sign-in button opens login.
- An invalid CSRF submission returns 403 without creating a review.
- The author confirmed the working submission/edit/moderation flow and supplied the screenshots in this repository on October 6, 2026.

These observations are distinct from CI. CI uses mocks and cannot prove your sandbox configuration, credentials, cartridge order, or data import is correct. The temporary browser harness used during development is not included as a reusable automated end-to-end suite.

## Sandbox acceptance checklist

| Scenario | Expected result |
| --- | --- |
| Guest opens an empty product | Empty state and sign-in prompt; no private form data |
| Signed-in shopper submits 1, 2, 3, 4, or 5 stars | Accepted integer rating; pending by default |
| Missing fields or fractional rating | Validation error and no write |
| Invalid CSRF token | HTTP 403 and no write |
| Remembered but unauthenticated shopper | HTTP 401 and no write |
| Merchant approves | Public review, count, average, and histogram update |
| Merchant rejects | Review disappears publicly; author can revise |
| Author edits an approved review | Same record; pending again when approval is required |
| Edit within one minute | HTTP 429; JSON retry interval 60 seconds |
| More than five approved reviews | Five per page, bounded navigation, approved-only totals |
| Different variant of the same master | Same review collection |
| Bundle, set, and standard Page Designer PDP | One main-product widget with no nested duplicates |
| JavaScript disabled | Full-page reading, pagination, and ordinary HTML submission remain available |
| Approval disabled | Future submissions publish immediately; existing pending rows remain pending |
| Reviews disabled and PDP cache cleared | Widget absent; submission rejected |

Use your own sandbox test accounts for mutation checks. Do not treat production customer activity as test data.
