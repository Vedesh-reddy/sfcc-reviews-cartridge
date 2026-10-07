# Merchant guide

[← README](../README.md) · [Installation](INSTALLATION.md)

## Feature settings

Select the correct site, then open:

**Merchant Tools → Site Preferences → Custom Site Preference Groups → Product Reviews**

![Review settings in Business Manager](images/site-preferences.png)

| Setting | Attribute ID | Default | Effect |
| --- | --- | --- | --- |
| Enable product reviews | `productReviewsEnabled` | Yes | Displays the widget and allows reading/submitting reviews. |
| Require review approval | `productReviewsModeration` | Yes | New and edited reviews are saved as pending until approved. |

Turning approval off publishes future submissions immediately. Existing pending reviews stay pending until you approve them or their authors resubmit. Disabling reviews does not delete stored reviews. Clear the outer product-page cache when changing whether the widget is enabled.

## Find a review

Open:

**Merchant Tools → Custom Objects → Manage Custom Objects**

Choose the `ProductReview` object type for the current site. Use the available search fields to find reviews by moderation status, product ID, or customer number. Open the matching object.

![Review fields and approval control](images/review-moderation.png)

## Approve or reject

Review the public display name, title, text, and star rating. Set **Moderation status** and click **Apply**.

| Selection | Result |
| --- | --- |
| `pending` | Hold the submission for further review. The author can see their own saved version. |
| `approved` | Publish it and include it in the product's review count, average, and distribution. |
| `rejected` | Hide it from other customers. The author can edit and resubmit it. |

Reload the product page to see the change. The review endpoint recalculates approved totals on every request, so approval changes do not require clearing the review cache.

Do not edit **Product ID**, **Customer number**, or the review key when moderating. These identify ownership and the one-review-per-product rule. For variants and variation groups, the saved product ID is the master product's ID.

## What the shopper sees

### Guest

![Published review visible to a guest](images/reviews-guest.png)

Guests can read approved reviews and use the sign-in link. Login returns them to the product's review section.

### Signed-in customer

![Review form for an authenticated customer](images/review-form.png)

All fields are required: rating 1–5, display name 2–40 characters, title 3–100 characters, and review text 10–2,000 characters. The display name is public; the customer number is not displayed in storefront review data.

### Editing an existing review

![Edit form and published status](images/review-edit.png)

The customer's existing review is prefilled. The same record is updated, rather than creating a second review. When approval is enabled, an edit to a published review returns it to pending and removes its contribution to public totals until approved again. Updates are limited to one per minute for that customer and product.

### No approved reviews

![Empty review state](images/reviews-empty.png)

Pending and rejected reviews do not appear in this state or in public totals.

## Removing a review

Delete the matching custom object through Manage Custom Objects when the record should be removed entirely. To find a customer's records, search by `customerNo`. Automatic account-deletion integration is outside this cartridge; handle review removal through your existing customer-data process.

Deleting a review removes its one-review record, so the customer can submit again. Hiding it with `rejected` preserves the record and the author's edit workflow.
