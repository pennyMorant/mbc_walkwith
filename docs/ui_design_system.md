# MBC WalkWith UI Design System

Status: draft

The app should feel calm, readable, trustworthy, and practical. It should not feel like a marketing landing page or a social media app.

## 1. Design Principles

- Use Material Design 3 as the UI foundation.
- Use dynamic color where available.
- Keep layouts quiet and readable.
- Prioritize text clarity for Bible reading, sermon notes, and bulletins.
- Use cards for repeated items and framed tools, not for every page section.
- Follow the app Material 3 shape scale: cards use 24dp corners; modal bottom sheets use 28dp top corners.
- Use icons for common actions.
- Support text scaling and accessibility.

## 2. Theme

Current implementation:

```text
lib/theme/
  app_colors.dart
  app_theme.dart
  theme_provider.dart
```

Theme rules:

- `useMaterial3: true` is required.
- Dynamic color should be used when available.
- Fallback seed color should stay stable.
- Keep AppBar surfaces neutral and low elevation.
- Use `AppTheme.cardRadius` for cards and card-like surfaces.
- Use `AppTheme.chipRadius` for chips and compact label pills.
- Use `AppTheme.bottomSheetRadius` for modal bottom sheet top corners.
- Use `AppColorSchemeX` for semantic dynamic surfaces. `scaffoldBg` maps to `surface` and `insetSurfaceColor` to `surfaceContainerHighest`. In light mode, `tintedCardColor` maps to `surfaceContainerLow` and `navigationBg` to `surfaceContainer`; in dark mode they map to `surfaceContainer` and `surfaceContainerHigh` so cards and persistent navigation remain distinct from the base surface. Do not blend `primary` into these surfaces; Android and Material already own the dynamic palette.
- Persist user-selected light/dark/system mode through `themeModeProvider`.
- Avoid one-note color palettes.
- Avoid decorative gradients, blobs, and oversized hero treatments.

Fallback seed:

```text
#4285F4
```

This keeps the fallback close to the current `AppTheme.seedColor`; Android dynamic color can override it when available.

## 3. Typography

Text hierarchy:

```text
headlineSmall:
  page section titles, sermon title in player panel

titleLarge:
  bottom sheet title, detail page title

titleMedium:
  card title, section title

bodyLarge:
  Bible verse text, long-form reading text

bodyMedium:
  card body, summary, normal UI text

labelMedium:
  chips, metadata, compact labels
```

Reader text:

- Default verse font size should be comfortable, around 18px.
- Line height should be generous, around 1.6-1.8.
- Support dynamic scaling through reader settings.
- Do not put dense controls inside the reading text flow.

## 4. App Shell

Main navigation:

```text
Tab 1: Study
Tab 2: Sermons
Tab 3: Life
Tab 4: Mine
```

Use Material 3 `NavigationBar`.

Rules:

- Keep the four main tabs focused on primary app areas: Study, Sermons, Life, and Mine.
- Use detail routes for deeper screens.
- Preserve tab state when switching tabs.
- Avoid global drawers unless admin/member tools require them later.

## 5. Study UI

Study screen structure:

```text
Large app bar
Continue reading card
Testament segmented control
Book category cards
Chapter picker bottom sheet
Reader detail route
Explanation bottom sheet
Lexicon bottom sheet
```

Book library rules:

- Split the Bible into testament and category groups such as Gospel, History, Wisdom, Prophets, and Letters.
- Wrap each category group in one Material 3 card surface.
- Keep individual book tiles compact and scannable.
- Use 24dp corners for category cards and book tiles.

Chapter picker rules:

- Open chapter selection in a modal bottom sheet.
- Limit the sheet height to 50% of the viewport.
- Keep the sheet header fixed and make the chapter grid scroll internally.
- Use 28dp top corners for the sheet shape.

Verse tile rules:

- Verse number is visually secondary but easy to scan.
- Long press opens explanation.
- Tappable original-language terms show a clear icon or subtle marker.
- Keep verse text uncluttered.

Explanation sheet rules:

- Use a bottom sheet.
- Show verse reference.
- Show concise summary first.
- Then show sections such as context, explanation, pastoral note.
- Show source categories.
- Show disclaimer at bottom.

## 6. Sermon UI

Sermon screen structure:

```text
Large app bar
Current player panel
Outline
Cited Scripture
Recent sermons
```

Player rules:

- Primary action is play/pause.
- Secondary actions are skip back, skip forward, speed.
- Use a stable control layout so buttons do not jump.
- Keep metadata visible: speaker, date, series, primary reference.

Outline rules:

- Each outline item should show title, start time, and summary.
- Transcript can be added later under detail route or a tabbed section.

Cited Scripture rules:

- Scripture cards should be tappable.
- Tapping should navigate to the Study route for that verse/chapter.

## 7. Life UI

Life screen structure:

```text
Large app bar
Weekly summary
Bulletin feed
Giving entry
```

Rules:

- Treat bulletin items as structured cards, not embedded PDFs.
- Keep privacy-aware content clearly marked.
- Prayer content should not appear on public surfaces.
- Giving card should look serious and quiet, not promotional.

## 8. Mine UI

Mine screen structure:

```text
Default app bar
Member profile card
Preferences card
Giving and annual statement entry
Account detail route
About/version card
```

Rules:

- The profile card shows member identity first, then group/fellowship chips when
  available.
- Detailed profile editing belongs on a secondary route with filled input
  fields and the save action outside the content card.
- Donation history and annual statements are secondary flows from Mine, not Life
  feed content.
- Theme mode uses a segmented control for system, light, and dark.
- Font size uses a slider because older church members need easy text scaling.
- Notification settings expose the native permission path: request permission
  when missing, and open system app settings when already granted.
- Language follows the platform app language setting; the app opens native
  settings instead of storing an in-app override.
- Show the active Bible translation clearly because it is derived from the current app locale.

## 9. Shared Components

Recommended shared widgets:

```text
AppSectionHeader
AppInfoPill
AppEmptyState
AppErrorState
AppLoadingState
AppListCard
AppBottomSheetScaffold
```

Shared component rules:

- Generic components go under `shared/widgets/`.
- Feature-specific components go under `features/<feature>/presentation/widgets/`.
- Do not over-configure shared widgets.
- If a component needs many feature-specific options, it probably belongs inside the feature.

## 10. States

Every data-driven screen should support:

```text
loading
success
empty
error
offline
unauthorized
```

Error states:

- Use plain language.
- Offer a retry action when possible.
- Do not show raw exception text.

Empty states:

- Explain what is missing.
- Offer the next useful action.

Offline states:

- Show cached data if available.
- Clearly mark stale or offline content where needed.

## 11. Accessibility

Rules:

- All icon-only buttons need tooltips.
- Important controls need semantic labels where default semantics are insufficient.
- Text should scale without clipping.
- Touch targets should be at least 44x44.
- Color should not be the only signal for state.
