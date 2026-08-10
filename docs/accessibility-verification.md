# Accessibility verification

## Automated scope

The web accessibility regression suite covers the sign-in form, seller listing entry, buyer catalogue and filters, buyer viewings, admin moderation queue, admin viewing scheduler, and Arabic right-to-left catalogue layout.

Each covered surface must have no serious or critical Axe violations against WCAG 2 A/AA and WCAG 2.1 A/AA rules. The suite also checks keyboard reachability for primary controls, 44 by 44 pixel mobile touch targets, semantic form names, and absence of horizontal overflow in the right-to-left mobile layout.

Run the gate with:

```sh
pnpm --filter @autoiq/web test:e2e:accessibility
```

## Continuous verification

The accessibility suite runs in CI after Chromium installation. Shared design tokens and components retain the verified contrast, focus, labels, unique control IDs, and minimum target sizes across the covered surfaces.

## Release evidence

Automated checks do not replace human assistive-technology review. VoiceOver and TalkBack walkthroughs on physical release devices, plus a release-candidate Lighthouse report, remain release-environment evidence and should be captured before a public launch.
