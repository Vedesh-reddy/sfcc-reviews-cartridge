# Troubleshooting

[← README](../README.md) · [Installation](INSTALLATION.md)

| Symptom | Check or resolution |
| --- | --- |
| Old placeholder stars and no review section | Confirm the active code version has the plugin, place it before `app_storefront_base`, and clear the PDP page cache. |
| `Pipeline not found (Reviews)` | The controller is missing from the active cartridge path. Confirm `<code-version>/plugin_productreviews/cartridge/controllers/Reviews.js`; avoid the nested generator scaffold. |
| Review link exists but the panel does not load | Check the browser request to `Reviews-List`, verify built JS/CSS were uploaded, and inspect the SFCC error log. |
| “Reviews are temporarily unavailable” | Confirm the `ProductReview` type and all custom attributes were imported. Also confirm the requested product and its master are online and reviews are enabled. |
| Platform rejects `Cache-Control` | Use `Response.setExpires` as implemented. SFCC does not allow arbitrary public headers through `setHttpHeader`. |
| Rating selected but validation still appears | Build/deploy the latest template, service, and JS. Radio values are explicit integer strings; the service accepts equivalent whole-number decimals. Changing selection clears a stale group error. Hard-refresh old assets. |
| Review submitted but not public | Inspect its status in **Merchant Tools → Custom Objects → Manage Custom Objects**. Pending/rejected reviews are excluded from public totals. |
| Editing makes a review disappear | Expected when approval is required: editing changes the status back to pending. |
| Repeated update rejected | Wait one minute after the previous submission. |
| An expired form fails | AJAX errors supply a fresh CSRF token. Retry or return to a freshly loaded review page. Sign in again if the session expired. |
| Login returns to the wrong page | Check redirect slot 3 and the ordering of login/config overlays in the cartridge path. |
| Review form styles differ | The screenshots use the project's Bootstrap 5 storefront. Reconcile utilities with your host theme. |
| Custom Page Designer layout has no widget | Include `reviews/widget` with the main `product` model; the plugin only overlays the standard dynamic templates. |
| Preference changes do not hide the widget immediately | Clear the outer product-page cache; the personal review fragment itself is not cached. |

## Diagnosis order

1. Open `Reviews-Show?pid=<online-product-id>` on your own site's controller URL.
2. If the route is missing, inspect deployed paths and the site cartridge path before changing JavaScript.
3. If the route exists but fails, inspect custom-object metadata and SFCC logs.
4. If the full page works but the PDP does not, inspect overlays, cached markup, and the fragment request in browser Network tools.
5. If only submission fails, inspect the HTTP status and JSON field errors without logging customer review text or tokens.

The review service logs controlled platform failures under the standard SFCC logger. Do not publish credential files, session tokens, or full customer request payloads in issues.
