# Play Store listing assets

Committed graphics are rendered deterministically from the BiSell mark and the
existing Honda Vezel hero asset:

- `graphics/play-icon-512.png`: 512 × 512 Play Store icon
- `graphics/feature-graphic-1024x500.png`: 1024 × 500 feature graphic

The `source` HTML files are retained so these assets can be reproduced without
altering the logo through generative tooling.

Six Play-ready phone screenshots are committed in `screenshots`. Each image is
1080 × 1920 and was captured headlessly from the production Flutter widgets:

- sign in
- buyer browse filters and verified inventory
- verified Honda Vezel detail and inspection summary
- buyer quote and sourcing requests
- confirmed viewing
- extended buyer profile

The screenshot run used the verified Railway production origin
`https://api-production-af6d.up.railway.app`. API responses were intercepted
with the illustrative fixture in `source/mock-buyer-session.js` so no production
account or customer record was created or exposed. The fixture only controls
data; layout, navigation, images, formatting, and rendering come from the
shipping Flutter code.

`source/playwright-cli.json` records the 432 × 768 logical viewport and 2.5
device scale used to produce the 1080 × 1920 files.
