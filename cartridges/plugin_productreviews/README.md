# plugin_productreviews

SFRA overlay for customer ratings, written reviews, and Business Manager moderation.

Use the [repository README](../../README.md) for screenshots and a quick start.
The [installation guide](../../docs/INSTALLATION.md) covers deployment, metadata import, and cartridge-path configuration.
The [code reference](../../docs/CODE-REFERENCE.md) documents every module and template.

The plugin must precede `app_storefront_base` in the site's cartridge path.
Build from the repository root using `npm run build`; no nested npm project or `dw.json` is needed here.

Business Manager locations:

- **Merchant Tools → Site Preferences → Custom Site Preference Groups → Product Reviews**
- **Merchant Tools → Custom Objects → Manage Custom Objects**
