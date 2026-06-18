---
name: Moody Sophisticate
colors:
  primary: "#000000"
  secondary: "#5C4E4E"
  surface: "#D1D1D0"
  on-surface: "#000000"
  error: "#5C4E4E"
typography:
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: 400
rounded:
  md: 0px
---

# Design System

## Overview
A sophisticated, moody, and minimal design system for the Jetty Compliance Engine. By utilizing the lightest shade as the page background rather than the text, it establishes a bright, high-density, yet industrial interface with rich contrast, sharp edges, and zero visual clutter.

## Colors
- **Primary / On-Surface** (`#000000`): Used for primary text, major headers, solid borders, and active status states.
- **Secondary** (`#5C4E4E`): Dark taupe/brown. Used for interactive states, secondary buttons, subheaders, and important indicators.
- **Accent / Highlight** (`#988686`): Light taupe. Used for disabled elements, placeholder text, and subtle grid dividers.
- **Surface** (`#D1D1D0`): Light gray. Used as the global page background and default container backgrounds.

## Typography
- **Headlines**: Monospace (JetBrains Mono / Geist Mono), bold, uppercase.
- **Body**: Monospace, regular, 14–16px.
- **Labels**: Monospace, semi-bold, 11px, tracking-wide.

## Components
- **Buttons**: Sharp corners (0px rounded), 2px solid black border. Normal state uses secondary/taupe backgrounds with black borders; hover state inverts to full white/black contrast.
- **Inputs**: Thick 2px solid black border, light gray background, monospaced placeholder text.
- **Cards**: Flat containers with solid black outlines, utilizing background contrast without any drop shadows or elevations.

## Do's and Don'ts
- **Do** keep all edges completely sharp (`rounded-none`).
- **Do** use the light gray background to maintain readability and avoid a heavy dark-mode aesthetic.
- **Don't** use soft drop-shadows or gradients; rely purely on raw solid-line boundaries.
- **Do** use uppercase for labels and headers to emphasize the technical compliance theme.
