# Flambé mark

`source/` preserves the three PNG originals supplied by David for this branding
update, without modifying their artwork:

- `production.png`: warm yellow/orange, magenta, and purple flame.
- `development.png`: blue flame.
- `share-viewer.png`: green flame.

`source/plugin.png` is a separate composite of the supplied production flame
with an asymmetric flame-chart background, made using the built-in image
generation tool. It was composed from `source/production.png`, then revised to
stagger the chart rows. The final edit prompt is saved in
`source/plugin.prompt.txt`; transparent output was enabled.

From `frontend/`, run `npm ci` then `npm run branding:generate` to regenerate
the checked-in PNG/ICO outputs. `npm run branding:check` verifies they match.
The renderer is pinned in `package-lock.json`.

- Production favicon: 32×32, warm/purple, transparent.
- Development favicon: 32×32, blue, transparent (including the legacy core copy).
- Share viewer: green 32×32 favicon, genuine 16/32/48 ICO, and 180×180 touch icon.
- Main Apple touch icon: 180×180. PWA icons: 192×192 and 512×512.
- Touch/PWA icons: opaque white with padding for the manifest's maskable use.
- Plugin logo/composer icon: 512×512, flame with flame-chart background, transparent.
- Login/register mark: `flambe.png`, 128×128, full color, transparent.

The generator also synchronizes the tracked Phoenix root copies. Vite copies
public assets into its build output and keeps root PWA assets synchronized.
Generated Single Burner bundles are rebuilt by their normal packaging workflow.
Login/register import the generated 128×128 mark through Vite. The renderer
embeds the source PNGs in a temporary SVG only to resize and pad them; no
vector recreation or replacement design is involved.
