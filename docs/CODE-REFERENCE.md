# Code reference

[← README](../README.md) · [Architecture](ARCHITECTURE.md) · [Testing](TESTING.md)

All paths below are relative to the repository root. Server modules execute on SFCC, client code executes in the shopper's browser, and scripts execute locally or in GitHub Actions.

## Storage and validation service

[`cartridges/plugin_productreviews/cartridge/scripts/productReviews.js`](../cartridges/plugin_productreviews/cartridge/scripts/productReviews.js) is the single persistence module. It uses `CustomObjectMgr`, `ProductMgr`, `Site`, `Transaction`, `MessageDigest`, `Encoding`, and `Bytes` from the SFCC Script API.

| Function | Contract and behavior |
| --- | --- |
| `getSettings()` | Returns `{ enabled, moderation }` from current-site preferences. Values other than explicit `false` leave each feature enabled. |
| `getProduct(pid)` | Accepts a nonempty string up to 256 characters. Rejects missing/offline products; resolves variants and variation groups to an online master. Returns the platform product or `null`. |
| `getKey(pid, customerNo)` | Internal helper. SHA-256 of JSON `[site ID, product ID, customer number]`, returned as hex. |
| `getOwnReview(pid, customerNo)` | Direct key lookup, or `null` when no identity is supplied. The caller must derive identity from the authenticated session. |
| `validate(form)` | Returns `{ values, errors, valid }`. Trims string fields and checks lengths. Accepts whole-star values including `4.0` and normalizes them to numbers. Ignores unrecognized fields. |
| `toPublic(object)` | Internal helper. Maps a stored record to public fields and falls back to `creationDate` if no submission timestamp exists. |
| `countRating(pid, rating)` | Internal helper. Counts only approved reviews for the specified product and star bucket, closing the query iterator on every path. |
| `getReviews(pid, requestedPage)` | Returns `{ total, average, distribution, items, page, pages }`. Uses five count buckets and one page of five approved reviews. |
| `save(pid, customerNo, values, moderation)` | Requires a customer number and validated values. Creates or updates one custom object in a transaction. Returns `{ status }` or `{ error: 'rate' }`. Throws platform failures to the controller. |

`getKey`, `toPublic`, and `countRating` are internal. The other functions are exported. Do not call `save` with raw request fields: validation and identity checks belong before persistence.

### Field validation

| Field | Accepted value | Resource error key |
| --- | --- | --- |
| `rating` | Whole number 1–5; decimal zero suffixes and surrounding whitespace normalize to an integer | `error.rating` |
| `displayName` | Trimmed string, 2–40 characters | `error.displayName` |
| `title` | Trimmed string, 3–100 characters | `error.title` |
| `body` | Trimmed string, 10–2,000 characters | `error.body` |

Values such as `4.5`, `6`, `1e0`, `4,0`, or `5junk` fail validation. The template explicitly serializes radio values as whole-number strings to avoid formatting ambiguity.

## Review controller

[`controllers/Reviews.js`](../cartridges/plugin_productreviews/cartridge/controllers/Reviews.js) registers five HTTPS routes.

| Route | Method | Input | Output |
| --- | --- | --- | --- |
| `Reviews-Show` | GET | `pid`, optional one-based `page` | Decorated full review page, including the current customer's form or sign-in prompt |
| `Reviews-List` | GET | `pid`, optional `page` | Uncached HTML fragment for the product-page widget |
| `Reviews-Login` | GET | `pid` | Saves a validated product ID and redirects to login, or directly to the return route if authenticated |
| `Reviews-Return` | GET | Saved session product ID | Redirects to the product's `#product-reviews` anchor; falls back to `Account-Show` when no valid product is available |
| `Reviews-Submit` | POST | `pid`, rating, display name, title, body, generated CSRF field | JSON for AJAX, or a rendered failure / redirect for ordinary HTML submission |

### Controller helpers

| Helper | Responsibility |
| --- | --- |
| `noCache(res)` | Sets SFRA's cache period to zero and calls `res.base.setExpires(new Date(0))`. Avoids forbidden manual cache headers. |
| `token()` | Obtains the platform CSRF field name and a fresh token. |
| `customerNo(req)` | Returns an identity only when `req.currentCustomer.raw.authenticated` and a profile are present. |
| `viewModel(req, product)` | Builds public review data, own-review form values/status, pagination URLs, settings, sign-in URL, and CSRF token. |
| `renderReviews(template)` | Shared GET handler. Handles feature/product availability, consumes an HTML success flash for the matching product, and returns a controlled unavailable view on platform failures. |
| `fail(status, key)` | Submit-local helper. Localizes errors, refreshes CSRF in JSON failures, preserves normalized HTML form values where possible, and never writes a review. |

### Submission sequence

1. Expire the response and normalize the submitted fields.
2. Reject an invalid CSRF token before product lookup or persistence.
3. Reject a guest or remembered-but-unauthenticated customer.
4. Check feature availability and resolve the canonical online product.
5. Reject field errors; otherwise call the transactional save operation.
6. Return a rate-limit result, a JSON success, or a full-page redirect with a primitive session flash.

The AJAX discriminator is `X-Requested-With: XMLHttpRequest`. `productID`, `customerNo`, and moderation status are supplied by server logic, regardless of any similarly named browser fields.

### Response contract

Successful AJAX submission:

```json
{ "success": true, "message": "Thank you! Your review has been submitted for approval." }
```

Validation failure, with illustrative token values:

```json
{
  "success": false,
  "message": "Please correct the highlighted fields.",
  "fieldErrors": { "rating": "Select a whole-star rating from 1 to 5." },
  "csrf": { "name": "platform-generated-field-name", "value": "fresh-session-token" },
  "retryAfter": null
}
```

| HTTP status | Meaning |
| --- | --- |
| 200 | Successful read or AJAX save |
| 302 | Login/return redirects or successful ordinary HTML POST |
| 400 | Invalid review fields |
| 401 | Authentication required |
| 403 | Invalid or expired CSRF token |
| 404 | Reviews disabled, or product unavailable |
| 429 | Update within one minute; JSON `retryAfter` is 60 |
| 503 | Controlled platform/storage failure |

Read failures render an unavailable view. JSON errors do not expose platform exception details; diagnostic messages go to the SFCC logger.

## Login integration

[`controllers/Login.js`](../cartridges/plugin_productreviews/cartridge/controllers/Login.js) extends the base controller. Its appended `Show` handler sets OAuth reentry slot 3 only when the incoming `rurl` is 3; ordinary login behavior stays inherited.

[`config/oAuthRenentryRedirectEndpoints.js`](../cartridges/plugin_productreviews/cartridge/config/oAuthRenentryRedirectEndpoints.js) copies the base mapping via `module.superModule` and adds `3: 'Reviews-Return'`. The filename follows SFRA's existing `Renentry` spelling. Another cartridge using slot 3 must be reconciled before deployment.

## Browser module

[`client/default/js/productReviews.js`](../cartridges/plugin_productreviews/cartridge/client/default/js/productReviews.js) expects SFRA's global jQuery.

| Function or event | Behavior |
| --- | --- |
| `showMessage($widget, message, error)` | Inserts text into the live status region, selects alert styling, and moves focus to the message. |
| `loadReviews($widget, url, focus)` | Fetches an HTML fragment with cache disabled, replaces only the panel, updates matching product summary links, manages `aria-busy`, and preserves the full-page fallback on failure. |
| DOM ready | Loads widgets lacking `data-loaded`; a full reviews page already contains its content. |
| Pagination click | Prevents default navigation while JavaScript is active, avoids a second concurrent page load, and focuses the new heading. |
| Rating change | Clears the rating-group error and all rating radios' `aria-invalid` flags. |
| Form submit | Checks native validity, prevents double submission, serializes the form, POSTs to the controller, and refreshes the panel after success. |
| Submit failure | Displays server messages as text, renews the hidden CSRF value, retains input, marks field errors, and focuses the first invalid field. |

### DOM contract

| Selector / attribute | Purpose |
| --- | --- |
| `.product-reviews` | Widget boundary |
| `data-reviews-url` | Current product's initial fragment URL |
| `data-review-pid` | Associates the widget with the product's summary link |
| `data-loaded` | Marks an already rendered full-page panel |
| `.review-panel` | Fragment replacement target |
| `.review-message` | Accessible live result/status message |
| `.review-content[data-summary]` | Public summary text returned by the fragment |
| `[data-review-summary-pid]` | PDP link updated after loading the widget |
| `.review-page[data-url]` | AJAX pagination URL; `href` remains the full-page fallback |
| `.review-form`, `.review-csrf` | Form submission and token renewal |
| `#review-<field>-error` | Corresponding field error container |

[`client/default/scss/productReviews.scss`](../cartridges/plugin_productreviews/cartridge/client/default/scss/productReviews.scss) scopes styles to `.product-reviews`: star colors, text wrapping, histogram sizing, empty-message hiding, form width, and invalid borders. Bootstrap utilities come from the host storefront.

## Templates

All paths in this table are under `cartridge/templates/default/`.

| Template | Responsibility |
| --- | --- |
| [`reviews/widget.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/reviews/widget.isml) | Registers review assets and renders a public loading shell with an accessible full-page fallback. |
| [`reviews/content.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/reviews/content.isml) | Renders summary, histogram, approved reviews, pagination, own status, sign-in prompt or form. Uses escaped text and explicit whole-number radio values. |
| [`reviews/page.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/reviews/page.isml) | Decorates the complete review page, provides the product link, and embeds the already loaded content. |
| [`product/components/pidRating.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/product/components/pidRating.isml) | Keeps the product number and replaces the placeholder rating with a review link that updates after loading. |
| [`product/components/descriptionAndDetails.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/product/components/descriptionAndDetails.isml) | Preserves description/details and adds the widget only when the current product is the page's main product. This prevents duplicates for nested bundle/set items. |
| [`product/setDetails.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/product/setDetails.isml) | Adds a single widget for a standard product set after the set contents. |
| [`experience/components/dynamic/product/setDetails.isml`](../cartridges/plugin_productreviews/cartridge/templates/default/experience/components/dynamic/product/setDetails.isml) | Adds the corresponding widget for the standard dynamic Page Designer set component. |

`reviews/content` explicitly tests `total > 0` before rendering the histogram. This avoids relying on ISML coercion of a numeric zero. The standard and Page Designer product/bundle detail views reuse `descriptionAndDetails`; custom layouts must include the widget themselves.

## Localization and metadata

[`templates/resources/reviews.properties`](../cartridges/plugin_productreviews/cartridge/templates/resources/reviews.properties) contains headings, labels, status messages, validation errors, and success text. Add locale-specific bundles following the host storefront's resource conventions. Current English labels do not have separate singular/plural forms for `stars` and `reviews`.

[`plugin_productreviews.properties`](../cartridges/plugin_productreviews/cartridge/plugin_productreviews.properties) declares the cartridge ID and multilingual storefront flag. `.project` retains the cartridge's Studio project identity.

[`custom-objecttype-definitions.xml`](../metadata/product-reviews/meta/custom-objecttype-definitions.xml) defines `ProductReview` and the moderation field group. [`system-objecttype-extensions.xml`](../metadata/product-reviews/meta/system-objecttype-extensions.xml) defines the two booleans on `SitePreferences`, grouped under `ProductReviews`.

## Build, validation, and repository tooling

| File | Responsibility |
| --- | --- |
| [`package.json`](../package.json), [`package-lock.json`](../package-lock.json) | Pinned development dependencies and repeatable npm commands; no runtime npm modules are needed on SFCC. |
| [`scripts/build.js`](../scripts/build.js) | Runs webpack for browser JavaScript and Sass for the stylesheet, writing only the plugin's static output. |
| [`scripts/check-templates.js`](../scripts/check-templates.js) | Parses all seven ISML templates with caching disabled and fails on issues or a missing template scan. |
| [`scripts/check-docs.js`](../scripts/check-docs.js) | Verifies relative Markdown and HTML image/link targets exist; it does not check external URLs or anchor text. |
| [`scripts/package-metadata.js`](../scripts/package-metadata.js) | Builds the two-file site-import ZIP with the correct archive root. |
| [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Runs validation, packages metadata, and uploads generated artifacts on Node 22 and 24. It does not deploy to SFCC. |
| [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md) | Prompts for behavior, scope, evidence, and deployment notes. |
| [`dw.example.json`](../dw.example.json) | Placeholder-only upload configuration; real `dw.json` files are ignored. |
| [`.eslintrc.json`](../.eslintrc.json), [`.stylelintrc.json`](../.stylelintrc.json), [`ismllinter.config.js`](../ismllinter.config.js) | Source conventions inherited from the working storefront. Browser, test, and script overrides supply their runtime environments. |

The [testing guide](TESTING.md) maps the two unit suites and the SFCC/browser evidence to the features they cover.
