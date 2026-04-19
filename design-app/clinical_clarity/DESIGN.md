# Design System Specification: The Clinical Sanctuary

## 1. Overview & Creative North Star: "The Clinical Sanctuary"

The objective of this design system is to move medical management away from the cluttered, anxiety-inducing spreadsheets of the past and toward a high-end, editorial experience. We are building **"The Clinical Sanctuary."** 

This North Star dictates a UI that feels authoritative yet weightless. We achieve this by rejecting the "boxed-in" nature of traditional software. Instead of rigid grids and heavy borders, we use **intentional asymmetry**, **overlapping glass layers**, and **tonal depth**. The interface should feel like a series of fine translucent sheets organized on a pristine surface, prioritizing "Breathing Room" to reduce the cognitive load on healthcare professionals.

---

## 2. Colors & Surface Philosophy

This system utilizes a sophisticated palette of Medical Blues and architectural greys. The goal is "Atmospheric Trust."

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off the UI. Standard dividers create visual noise. Boundaries must be defined through:
1.  **Tonal Shifts:** Placing a `surface_container_low` (`#f3f4f5`) panel against a `surface` (`#f8f9fa`) background.
2.  **Negative Space:** Using the Spacing Scale to create "void-based" separation.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. The deeper the element's function, the higher the elevation token:
*   **Base:** `surface` (`#f8f9fa`) - The desktop or "table" everything sits on.
*   **Secondary Content:** `surface_container_low` (`#f3f4f5`) - Used for sidebars or secondary navigation.
*   **Primary Work Area:** `surface_container_lowest` (`#ffffff`) - Reserved for the most critical data entry or patient records.
*   **Active Overlays:** `surface_bright` (`#f8f9fa`) - For "popping" important interaction states.

### The "Glass & Gradient" Rule
To achieve a premium "Director’s Level" finish, use **Glassmorphism** for floating elements (e.g., navigation bars or quick-action modals). 
*   **Token:** Use `surface_container_lowest` at 75% opacity with a `24px` backdrop-blur. 
*   **Signature Textures:** For high-priority CTAs or Hero analytics, use a subtle linear gradient (45-degree) from `primary` (`#00408b`) to `primary_container` (`#0057b8`). This adds "soul" and depth that flat hex codes lack.

---

## 3. Typography: Editorial Authority

We utilize **Inter** to bridge the gap between technical precision and modern readability.

*   **Display (lg/md):** Used for "Big Data" summaries (e.g., patient counts, vital statistics). These should feel like headlines in a premium medical journal.
*   **Title (lg/md):** Used for module headers. Use `on_surface` (`#191c1d`) with a semi-bold weight to command attention without shouting.
*   **Body (md/lg):** The workhorse. Ensure a line-height of at least 1.5 to maintain the "Sanctuary" feel. 
*   **Label (sm):** Reserved for technical metadata (e.g., timestamps, blood pressure units). Always use `on_surface_variant` (`#424752`) to keep it secondary to primary data.

---

## 4. Elevation & Depth: The Layering Principle

Depth is achieved through light and tone, not shadows and lines.

*   **Ambient Shadows:** Traditional drop shadows are forbidden. If an element must float (like a dropdown), use an **Ambient Glow**: A shadow with a `40px` blur, `0%` spread, and `4%` opacity of `on_surface` (`#191c1d`). It should be felt, not seen.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a container edge, use the **Ghost Border**. Apply `outline_variant` (`#c2c6d4`) at **15% opacity**. This provides a "suggestion" of a boundary without breaking the fluid aesthetic.
*   **Interaction Depth:** When a user interacts with a card, do not move it "up" with a shadow. Instead, shift its background from `surface_container_low` to `surface_container_highest` (`#e1e3e4`). The change in tonal density is more professional and less "game-like."

---

## 5. Components: Precision Primitive Styling

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary_container`), `xl` roundedness (`0.75rem`). No border.
*   **Secondary:** `surface_container_high` background with `primary` text. This creates a "soft-click" aesthetic.
*   **Tertiary:** Purely text-based using `primary` color, with a `surface_variant` hover state.

### Input Fields
*   Avoid the "box" look. Use `surface_container_low` as a subtle fill. 
*   **Active State:** Instead of a thick border, use a `2px` bottom-only stroke in `primary` and a very soft `primary_fixed` glow.

### Cards (Patient Records/Stats)
*   **Strict Rule:** No internal divider lines. Separate the "Patient Name" from "Diagnosis" using a `1.5rem` (24px) vertical gap.
*   Apply `lg` roundedness (`0.5rem`) to maintain a friendly but clinical edge.

### Glassmorphic Modals
*   Background: `surface_container_lowest` at 80% opacity.
*   Border: `1px` "Ghost Border" (10% opacity `outline`).
*   Blur: `20px` to `32px` for a "frosted medical glass" look.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** embrace asymmetric layouts. A wide left margin for a headline can make the page feel custom-designed rather than templated.
*   **Do** use `tertiary` (`#004e1c`) for "Success" or "Stable" states. It is a more sophisticated, "medical" green than the standard neon success colors.
*   **Do** use fluid transitions (300ms, cubic-bezier(0.4, 0, 0.2, 1)) for all hover and modal entries.

### Don’t:
*   **Don't** use pure black for text. Use `on_surface` (`#191c1d`) to keep the contrast high but the feel "soft."
*   **Don't** use standard 1px grey dividers (`#cccccc`). They are the enemy of this design system.
*   **Don't** crowd the screen. If a desktop view feels "full," it is likely over-designed. Increase the white space until the data "floats."