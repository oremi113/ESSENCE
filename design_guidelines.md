# Essynce Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from emotionally-driven platforms like Calm and Notion, with focus on creating a warm, intimate experience for voice preservation.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 345 25% 15% (Deep warm charcoal)
- Background: 45 40% 96% (Warm cream)
- Accent: 340 30% 75% (Soft dusty rose)
- Secondary: 210 25% 85% (Gentle dusty blue)

**Dark Mode:**
- Primary: 45 35% 92% (Warm off-white)
- Background: 345 15% 8% (Deep warm charcoal)
- Accent: 340 25% 65% (Muted rose)
- Secondary: 210 20% 25% (Dark blue-gray)

### Typography
- **Headings**: Playfair Display (serif) - weights 400, 600
- **Body Text**: Inter (sans-serif) - weights 400, 500, 600
- **Size Scale**: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl

### Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent spacing creates rhythm and emotional comfort
- Generous whitespace between sections (space-y-12 or space-y-16)
- Form elements use p-4 and m-2 for comfortable interaction

### Component Library

**Navigation**: Clean header with logo and minimal navigation, sticky positioning

**Recording Interface**: 
- Large, centered recording button with subtle pulsing animation during recording
- Waveform visualization area with gentle curves
- Progress indicator as elegant progress bar with soft rounded corners

**Cards**: Soft shadows (shadow-lg), rounded corners (rounded-xl), padding p-6

**Buttons**: 
- Primary: Filled with primary color, rounded-lg, px-6 py-3
- Secondary: Outline style with soft borders
- Recording: Large circular button with distinctive red recording state

**Forms**: Clean inputs with subtle borders, focus states with accent color, rounded-md

**Audio Player**: Custom-styled player with waveform, elegant play/pause controls

## Emotional Design Principles

### Warmth & Intimacy
- Soft, organic shapes over harsh geometric forms
- Subtle gradients from cream to soft pink in hero areas
- Gentle drop shadows and soft borders throughout

### Trust & Permanence
- Consistent visual hierarchy suggesting reliability
- Solid, readable typography choices
- Clear visual feedback for all interactions

### Simplicity & Focus
- One primary action per screen
- Minimal cognitive load with clear next steps
- Breathing room around important elements

## Onboarding Experience
**Hero Section**: Full-height welcome screen with tagline "Capture your voice. Preserve your essence." over subtle gradient background (cream to soft pink). Large, inviting "Begin Your Journey" button.

## Visual Treatments
**Gradients**: Subtle linear gradients from cream (45 40% 96%) to soft pink (340 35% 90%) for hero backgrounds and card highlights.

**Background**: Predominantly cream with subtle texture suggestion through very light patterns or grain.

**Interactive States**: Gentle hover effects with slight scale (hover:scale-105) and shadow increases. Focus states use accent color borders.

## Images
**Profile Avatars**: Circular, soft-edged placeholder images for user profiles
**Waveform Visualizations**: Dynamic, organic wave patterns during recording
**No large hero images**: Design relies on typography, color, and space for emotional impact

This design creates an intimate, trustworthy environment where users feel comfortable preserving their most precious memories through voice.