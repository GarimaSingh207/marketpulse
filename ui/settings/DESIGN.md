---
name: Aethelred Precision
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c5b4'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a8f80'
  outline-variant: '#4d4639'
  surface-tint: '#e8c177'
  primary: '#e8c177'
  on-primary: '#402d00'
  primary-container: '#c8a45d'
  on-primary-container: '#513a00'
  inverse-primary: '#775a1a'
  secondary: '#bac3ff'
  on-secondary: '#00208d'
  secondary-container: '#0136d6'
  on-secondary-container: '#b0bbff'
  tertiary: '#c6c7c2'
  on-tertiary: '#2f312e'
  tertiary-container: '#a8a9a5'
  on-tertiary-container: '#3c3e3b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdea3'
  primary-fixed-dim: '#e8c177'
  on-primary-fixed: '#261900'
  on-primary-fixed-variant: '#5c4202'
  secondary-fixed: '#dee1ff'
  secondary-fixed-dim: '#bac3ff'
  on-secondary-fixed: '#001159'
  on-secondary-fixed-variant: '#0031c5'
  tertiary-fixed: '#e3e3de'
  tertiary-fixed-dim: '#c6c7c2'
  on-tertiary-fixed: '#1a1c19'
  on-tertiary-fixed-variant: '#454744'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 64px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-md:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.2'
  data-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  gutter: 32px
  margin-desktop: 64px
  margin-mobile: 24px
  container-max: 1440px
---

## Brand & Style
The design system embodies a synthesis of industrial precision and editorial luxury. Inspired by the functionalist philosophy of Dieter Rams and the mechanical excellence of Porsche Design, the UI prioritizes clarity, performance, and an understated aesthetic. 

The visual style is characterized by **Matte Minimalism**. It rejects decorative flourishes like glassmorphism or vibrant gradients in favor of solid surfaces, sharp geometry, and hairline precision. The interface must feel like a physical instrument—tangible, reliable, and premium. High-contrast typography and generous negative space create an "Institutional Editorial" feel, ensuring that complex financial data is presented with the authority of a high-end broadsheet.

## Colors
The palette is rooted in a deep, warm charcoal foundation to reduce eye strain and provide a sophisticated backdrop for data. 

- **Primary Accent (Burnished Gold):** Reserved for brand moments, primary calls to action, and indicators of high-value status. 
- **Secondary Accent (Deep Sapphire):** Used sparingly for information highlights and tertiary interactive elements.
- **Surface Tiers:** Depth is created through a progression of dark grays (Soft Graphite to Matte Stone) rather than transparency. 
- **Text:** The use of "Cream" (#F5F5F0) instead of pure white softens the contrast, providing a premium, paper-like readability against the dark background.

## Typography
The typographic strategy uses a dual-font approach to distinguish between narrative content and empirical data.

- **Inter** is the workhorse for the interface, utilized in headlines and body copy for its neutral, objective clarity.
- **JetBrains Mono** is employed for all numerical values, financial tickers, and data tables. Its monospaced nature ensures that columns of figures align perfectly, conveying a sense of institutional rigor.

Large display sizes should use tighter letter spacing to maintain a cohesive, "locked-in" look. Small labels should always be uppercase with generous tracking for a professional, technical aesthetic.

## Layout & Spacing
This design system employs an **Editorial Fixed Grid**. Layouts should prioritize asymmetric compositions that guide the eye through hierarchy rather than simple repetition.

- **Desktop:** 12-column grid with wide 32px gutters and 64px outer margins. This creates the "luxury whitespace" necessary for an editorial feel.
- **Alignment:** Content is often offset; for example, a headline might occupy the first 8 columns while the last 4 columns remain empty or house a secondary intelligence panel.
- **Vertical Rhythm:** Use increments of 8px (the spacing unit) for all margins and padding to maintain a disciplined, structural integrity.

## Elevation & Depth
Elevation is communicated through **Tonal Layering** and **Deep, Diffused Shadows**. 

1. **Base:** Warm Charcoal (#171717) for the main canvas.
2. **Raised Surfaces:** Matte Stone (#2D2D2D) for modules and cards. These surfaces do not use borders; they are defined by their color and shadow.
3. **Shadows:** Use large blur radii (30px-60px) with very low opacity (15-20%) black shadows. This creates a soft, ambient lift that feels "tangible" rather than "floating."
4. **Dividers:** Use 1px hairline dividers in `rgba(245, 245, 240, 0.1)` to delineate sections within a single tonal layer without adding visual clutter.

## Shapes
The shape language is strictly **Soft (0.25rem)**. This slight rounding takes the "edge" off the brutalist origins of the style, making it feel more like a machined luxury product (like a camera body) than a raw architectural drawing. 

- **Buttons & Inputs:** Use the base 4px (0.25rem) radius.
- **Cards/Modules:** Use 8px (0.5rem) to provide a clear container hierarchy.
- **Icons:** Use thin strokes (1.5px) and sharp terminals to match the precision of the typography.

## Components
Consistent implementation across key components is vital for the brand's authoritative feel.

- **Buttons:** Primary buttons use a solid Burnished Gold background with black Inter Medium text. Secondary buttons are "Ghost" style with a 1px Stone border and Cream text. No hover gradients; use simple opacity shifts.
- **Hero Portfolio:** High-impact sections should feature large Display typography and 1px hairlines. Backgrounds here can be slightly darker than the base to create a focal point.
- **Financial Charts:** Use thin strokes (1px) for axes and data lines. Fills under area charts should be monochromatic (using Sapphire or Gold) with a maximum opacity of 10%. Grid lines should be barely visible.
- **Investment Rows:** Large vertical padding (24px+) between rows. Use JetBrains Mono for the price and percentage changes to emphasize technical precision.
- **Market Intelligence Panel:** A dedicated right-hand column for curated news. It should use a distinct surface color (Soft Graphite) to separate it from the primary transactional or data-heavy content.
- **Input Fields:** Flat, matte surfaces with a hairline bottom border that turns Burnished Gold on focus. Avoid full-box outlines where possible to maintain the editorial look.