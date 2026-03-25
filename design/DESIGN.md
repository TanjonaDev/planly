# Design System Strategy: The Pristine Professional

## 1. Overview & Creative North Star

**Creative North Star: "The Clinical Canvas"**

This design system is built to transform a utilitarian cleaning service management tool into a high-end, editorial digital experience. We move away from the "industrial" aesthetic often associated with service apps, opting instead for a philosophy of **Soft Minimalism**. 

The "Clinical Canvas" relies on extreme clarity, intentional asymmetry, and a sense of "airiness." By utilizing large-radius corners (up to `xl: 3rem`) and a hierarchy defined by tonal shifts rather than structural lines, we create a space that feels managed, organized, and premium. We break the standard grid by using overlapping elements (e.g., progress indicators that bleed slightly outside their containers) and dramatic typography scales to guide the eye with authority.

---

## 2. Colors & Surface Philosophy

The palette is anchored by a vibrant, "Electric Blue" that conveys modern efficiency, set against a backdrop of sophisticated neutrals.

### The "No-Line" Rule
**Borders are prohibited.** To define sections, designers must use background color shifts. For example, a card (`surface_container_lowest`) sits on a section background (`surface_container_low`), which in turn sits on the main app background (`surface`). This creates a clean, "épure" look that feels architectural rather than boxed-in.

### Surface Hierarchy
Depth is achieved through the nesting of these specific tokens:
- **Base Layer:** `surface` (#f5f6f7) - The canvas.
- **Section Layer:** `surface_container_low` (#eff1f2) - Large background areas.
- **Card Layer:** `surface_container_lowest` (#ffffff) - Actionable data points.
- **Highlight Layer:** `primary_container` (#8d98ff) - For specialized callouts.

### The "Glass & Gradient" Rule
To elevate the UI beyond a standard flat kit, floating navigation elements and top-level modals should use **Glassmorphism**. Use `surface` at 80% opacity with a `24px` backdrop blur. For primary CTA buttons, apply a subtle linear gradient from `primary` (#2438fa) to `primary_dim` (#0a24ef) to provide a "tactile soul" to the interaction.

---

## 3. Typography

The system uses a dual-font strategy to balance editorial authority with functional legibility.

| Level | Token | Font Family | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Manrope | 3.5rem | Bold, expressive, for data totals. |
| **Headline**| `headline-md`| Manrope | 1.75rem | High-contrast, defines new sections. |
| **Title**   | `title-lg`   | Inter | 1.375rem | Direct, semi-bold for mission names. |
| **Body**    | `body-md`    | Inter | 0.875rem | High readability for descriptions. |
| **Label**   | `label-sm`   | Inter | 0.6875rem | Uppercase with 5% letter spacing. |

**Editorial Intent:** Use `display-lg` for mission counts or time tracking to make data the "hero" of the layout. The juxtaposition of the rounder Manrope for headers and the clinical Inter for data creates a sophisticated, custom-built feel.

---

## 4. Elevation & Depth

We eschew traditional drop shadows in favor of **Tonal Layering** and **Ambient Glows**.

- **The Layering Principle:** A mission tracking card (`surface_container_lowest`) should be placed on a `surface_container_low` background. The difference in hex values provides the "lift."
- **Ambient Shadows:** Only use shadows on "floating" elements (like a FAB or Nav Bar). Shadows must use `on_surface` color at 6% opacity with a `32px` blur and a `12px` Y-offset. This mimics soft, natural light rather than a digital effect.
- **The "Ghost Border" Fallback:** If high-contrast accessibility is required, use a `1px` border using the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Mission Tracking Cards
- **Structure:** Use `DEFAULT` (1rem) padding for internal content and `xl` (3rem) corner radius.
- **Visuals:** No dividers. Use `3.5rem` (10) spacing between the title and the metadata.
- **Progress:** Use a `tertiary_container` background for the track and a `primary` gradient for the fill.

### Floating Navigation Bar
- **Style:** A pill-shaped container with `full` (9999px) radius.
- **Color:** Use `inverse_surface` (#0c0f10) with `on_secondary` icons for high-contrast visibility.
- **Placement:** Floating `2rem` (6) from the bottom edge to maintain "The Clinical Canvas" airiness.

### Input Fields & Controls
- **Inputs:** Use `surface_variant` for the background with no border. On focus, transition to a `2px` `primary` "Ghost Border."
- **Chips:** Selection chips should use `secondary_container` (#d3ccff). Use `md` (1.5rem) radius to differentiate from the sharper `sm` (0.5rem) radius used for status tags.

### Data Visualization (Gauges)
Inspired by the reference image, mission progress should use semi-circular gauges. Use `primary` for completed work and `surface_container_highest` for the remaining path. The central text should utilize `display-md` Manrope.

---

## 6. Do's and Don'ts

### Do
- **Do** use white space as a structural element. If in doubt, increase spacing by one level on the scale (e.g., from `5` to `6`).
- **Do** use "Nested Roundness." If a card has a `3rem` radius, an icon inside it should have a `0.5rem` or `1rem` radius to feel harmonized.
- **Do** use `primary_fixed_dim` for subtle background highlights behind important icons.

### Don't
- **Don't** use pure black (#000000) for text. Always use `on_surface` (#2c2f30) to maintain the soft, premium feel.
- **Don't** use solid horizontal lines to separate list items. Use a `1.4rem` (4) vertical gap instead.
- **Don't** use standard "Success Green." Use the `primary` blue for completion to maintain brand signature, reserving `error` exclusively for mission-critical alerts.