# SecuraAI visual direction

## Design read

Enterprise security administration for regulated organizations. The interface prioritizes trust, legibility, predictable navigation and accessible state communication.

## UI UX Pro Max design dials

- `DESIGN_VARIANCE: 3`: controlled asymmetry in authentication, predictable structure in product screens.
- `MOTION_INTENSITY: 2`: hover, focus, press and state feedback only.
- `VISUAL_DENSITY: 7`: compact enough for daily administration without becoming a cockpit.

## System rules

- Typography: Geist through `next/font`.
- Accent: one restrained security green, expressed through semantic CSS variables.
- Shapes: controls use 8px radius; containers use 12px radius; badges may be pill-shaped when the shape communicates status.
- Shadows: omitted by default. Use a tinted shadow only for a floating overlay such as a menu.
- Icons: Lucide is retained because it is the established project dependency. Product icons use `strokeWidth={1.8}` when touched.
- Themes: semantic CSS variables provide light and dark parity. Respect system preference and the manual toggle.
- Motion: do not add decorative animation. Honor `prefers-reduced-motion` globally.
- Data: prototype screens may use invented values only when the page labels them clearly as sample data; never present them as production results or wire them into fake behavior.

UI UX Pro Max is the primary design methodology. The verified project master is `design-system/securaai/MASTER.md`. Taste Skill remains a secondary redesign and anti-generic audit layer; domain-heavy product patterns should evolve toward another enterprise system such as Fluent UI only through an explicit migration decision.
