---
name: Technical Editorial
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e4'
  on-surface-variant: '#bbcbbc'
  inverse-surface: '#e3e2e4'
  inverse-on-surface: '#303033'
  outline: '#869587'
  outline-variant: '#3c4a3f'
  surface-tint: '#43e188'
  primary: '#60f99e'
  on-primary: '#00391c'
  primary-container: '#3ddc84'
  on-primary-container: '#005c31'
  inverse-primary: '#006d3b'
  secondary: '#aec6ff'
  on-secondary: '#002e6b'
  secondary-container: '#024ead'
  on-secondary-container: '#aec6ff'
  tertiary: '#ffd7a7'
  on-tertiary: '#452b00'
  tertiary-container: '#ffb340'
  on-tertiary-container: '#6f4700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#66fea2'
  primary-fixed-dim: '#43e188'
  on-primary-fixed: '#00210e'
  on-primary-fixed-variant: '#00522b'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#aec6ff'
  on-secondary-fixed: '#001a43'
  on-secondary-fixed-variant: '#004397'
  tertiary-fixed: '#ffddb4'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#291800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#121315'
  on-background: '#e3e2e4'
  surface-variant: '#343537'
  bg-surface: '#16181C'
  bg-card: '#1E2027'
  bg-hover: '#252830'
  border-low: '#2E3139'
  text-primary: '#E8E9EC'
  text-secondary: '#8B8FA8'
  text-muted: '#4A4E62'
  accent-red: '#E05C5C'
  accent-purple: '#A78BFA'
typography:
  display-lg:
    fontFamily: JetBrains Mono
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  display-md:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  editor-body:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.8'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  ui-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.05em
  ai-prose:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  caption-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  sidebar-width: 240px
  visualizer-width: 320px
  topbar-height: 44px
  editor-pad-x: 56px
  editor-pad-y: 48px
  gutter: 1rem
  panel-gap: 1px
---

## Brand & Style

The design system embodies a "Monospace meets Editorial" aesthetic, tailored for a technical audience that values precision, version control, and structured thinking. It bridges the gap between a high-performance code editor and a sophisticated publishing platform.

The visual direction is **Minimalist-Technical**. It relies on rigid structural grids, 1px borders, and high-density information layouts. The atmosphere is focused and utilitarian, using deep "dark-first" surfaces to reduce eye strain during long technical sessions. Motion is functional rather than decorative, used primarily to visualize data structures and state changes in real-time.

**Key Principles:**
- **Information over Decoration:** Every line and color must serve a functional purpose.
- **Git-Centric Logic:** Success, branching, and conflicts are communicated through established version-control color metaphors.
- **Structural Depth:** Depth is created through tonal layering (color shifts) rather than organic shadows.

## Colors

This design system utilizes a "dark-first" palette designed for high contrast and technical clarity. The primary background (`#0E0F11`) provides a deep foundation, while incremental shifts in lightness define hierarchy and interactive zones.

**Color Roles:**
- **Primary (Git-Green):** Used for success states, active commits, and positive actions.
- **Secondary (Branch-Blue):** Used for interactive elements, links, and version branching.
- **Tertiary (Amber):** Reserved for AI suggestions, warnings, and non-destructive alerts.
- **Neutral:** A range of cool-toned grays used for structural borders and text hierarchy.
- **Semantic Accents:** Red is strictly for deletions/errors, while Purple is dedicated to specialized data structure visualizations (e.g., Hash Map highlights).

## Typography

The typographic strategy bifurcates content into "System" and "Human" categories. 

**JetBrains Mono** is used for all "System" content: the editor, note titles, commit hashes, and data structures. It reinforces the technical nature of the product. The editor body uses a generous `1.8` line-height to maintain legibility in dense technical notes.

**Inter** is used for "Human/UI" chrome: labels, metadata, and AI-generated prose. This sans-serif provides a soft counterpoint to the rigid monospace blocks, making the UI feel accessible and editorial. Uppercase styling with expanded letter-spacing is used for category headers to create clear section breaks.

## Layout & Spacing

The layout is governed by a rigid, three-column architecture that mimics the layout of a modern IDE. 

**Structure:**
- **Primary Sidebar (Left):** Fixed at 240px. Contains navigation and the note tree.
- **Editor (Center):** Flexible width. This is the focus area with intentional "editorial" padding (56px horizontal) to prevent line lengths from becoming too long for comfortable reading.
- **Utility Panel (Right):** Fixed at 320px, collapsible. Houses the DSA visualizer and AI assistant.

**Grid Philosophy:**
Instead of traditional fluid gutters, the system uses "Panel-Gap" logic, where components are separated by 1px borders (`--border-low`). On mobile devices, the side panels collapse into drawers, and the editor padding reduces to 20px to maximize screen real estate.

## Elevation & Depth

This system avoids traditional shadows to maintain a flat, technical aesthetic. Depth is communicated through **Tonal Layering** and **High-Contrast Outlines**.

1.  **Level 0 (Base):** The deepest layer (`#0E0F11`), used for the main background.
2.  **Level 1 (Surface):** Secondary panels like the sidebar and topbar (`#16181C`).
3.  **Level 2 (Card):** Interactive elements and frames that sit atop surfaces (`#1E2027`).
4.  **Level 3 (Overlay):** Modals and context menus. These are the only elements allowed to use a subtle backdrop blur (12px) and a standard 1px border to separate from the content below.

**Active States:** Rather than lifting an element, "Active" status is shown through a 2px solid border in Git-Green or a subtle inner glow in the visualizer nodes.

## Shapes

The shape language is primarily **Rigid and Industrial**. 

- **Standard Elements:** Panels and editor blocks use 0px (sharp) or 4px (Soft) corners to maintain a structured grid.
- **Buttons & Cards:** Use a uniform 8px radius (`rounded-lg`) to provide a subtle "object" feel.
- **Interactive Pills:** Branch selectors, tags, and status badges use a fully rounded (Pill) shape to distinguish them from structural containers.
- **Modals:** Use a softer 16px radius (`rounded-xl`) to signal a temporary departure from the rigid grid.

## Components

### Buttons
Buttons are strictly flat. 
- **Primary:** Background `accent-green`, text `bg-base`. 
- **Ghost:** 1px border `border-low`, text `text-primary`.
- **Actionable (Commit):** Uses `jetbrainsMono` uppercase for a "terminal" feel.

### Input Fields
Inputs should look like editor fragments. 
- **Default:** Background `bg-surface`, 1px border `border-low`. 
- **Focus:** 2px solid `accent-blue` with a 2px offset. 
- **Placeholder:** Text `text-muted`.

### Cards
Note cards in the list view use `bg-card`. Active cards are marked with a 2px solid `accent-green` border on the left edge only.

### DSA Nodes
Visualizer nodes (Linked List, Trees) use `bg-hover` backgrounds with `1px` borders. Active nodes use an `accent-green` border with a subtle outer glow of the same color. Edges (lines) use `accent-green` at 0.5 opacity.

### Chips & Tags
Tags are rendered as small pills using `bg-hover` and `ui-label` typography. Branch tags specifically use a `⎇` prefix icon and `accent-blue` text.

### AI Suggestion Drawer
The AI container uses a dashed `tertiary` border when "thinking" and switches to a solid surface with `ai-prose` (italic Inter) for output.