# Flambé mark

`source/production.png` is an amber/gold color edit of the original warm/purple
flame supplied by David, made with the built-in image generation tool. It was
first introduced as the Single Burner variant and is now the main Flambé mark.
Its original generation prompt is preserved in `source/production.prompt.txt`;
the historical Single Burner wording in that prompt remains unchanged.

These three source PNGs preserve David's supplied originals without modifying
their artwork:

- `single-burner.png`: the warm yellow/orange, magenta, and purple flame that
  previously served as the production mark.
- `development.png`: blue flame.
- `share-viewer.png`: green flame.

`source/plugin.png` is a separate composite of the amber production flame with
an asymmetric pastel flame-chart background, made using the built-in image
generation tool. It uses a smaller flame, thinner cyan/pink/yellow/peach traces,
and generous margins. Child spans fit within their parent on the row above.
The original composite used the warm/purple flame now stored in
`source/single-burner.png`; later edits refined chart containment and selected
the amber foreground. The final edit prompt is saved in
`source/plugin.prompt.txt`; transparent output was enabled.

From `frontend/`, run `npm ci` then `npm run branding:generate` to regenerate
the checked-in PNG/ICO outputs. `npm run branding:check` verifies they match.
The renderer is pinned in `package-lock.json`.

- Production favicon: 32×32, amber/gold, transparent.
- Development favicon: 32×32, blue, transparent (including the legacy core copy).
- Single Burner favicon: 32×32, warm/purple, transparent. The Single Burner build
  selects it directly; the local server also selects it for hosted-build layouts.
- Share viewer: green 32×32 favicon, genuine 16/32/48 ICO, and 180×180 touch icon.
- Main Apple touch icon: 180×180. PWA icons: 192×192 and 512×512.
- Touch/PWA icons: opaque white with padding for the manifest's maskable use.
- Plugin logo/composer icon: 512×512, amber flame with flame-chart background,
  transparent.
- Login/register mark: `flambe.png`, 128×128, amber/gold, transparent.

The generator also synchronizes the tracked Phoenix root copies. Vite copies
public assets into its build output and keeps root PWA assets synchronized.
Generated Single Burner bundles are rebuilt by their normal packaging workflow.
Login/register import the generated 128×128 mark through Vite. The renderer
embeds the source PNGs in a temporary SVG only to resize and pad them; no
vector recreation or replacement design is involved.
