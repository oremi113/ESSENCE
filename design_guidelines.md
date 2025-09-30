# ESSENCE - Voice Legacy Platform Design Guidelines

## Design Approach: Skylight Serenity
**Hopeful and Uplifting**: Drawing inspiration from clear skies and gentle dawns, with soft pastels that evoke peace, hope, and emotional warmth.

## Core Design Elements

### Color Palette: Skylight Serenity
**Light Mode:**
- Primary: 220 21% 52% (Dusk blue accent)
- Background: 206 100% 96% (Sky blue)
- Accent: 270 100% 96% (Periwinkle)
- Secondary: 340 100% 98% (Rose cream)

**Dark Mode:**
- Primary: 206 80% 75% (Soft sky blue)
- Background: 220 25% 12% (Deep dusk)
- Accent: 270 45% 60% (Muted periwinkle)
- Secondary: 340 40% 25% (Deep rose)

### Typography
- **Headings**: Playfair Display (serif) - weights 400, 600
- **Body Text**: Inter (sans-serif) - weights 400, 500, 600
- **Size Scale**: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl

### Layout System
**Spacing Primitives**: Use Tailwind units of 4, 6, 8, 12, 16, 24
- Generous whitespace creates breathing room and emotional comfort
- Generous spacing between sections (space-y-12 or space-y-16)
- Touch-friendly sizing (minimum 44px height for interactive elements)
- Mobile-first responsive design

### Border Radius
**Consistent 16px radius** across all components for soft, approachable feel
- Cards: rounded-2xl (16px)
- Buttons: rounded-2xl (16px)
- Inputs: rounded-2xl (16px)
- Modals: rounded-2xl (16px)

### Component Library

**Navigation**: Clean header with logo and minimal navigation, sticky positioning

**Recording Interface**: 
- Large, centered recording button (minimum 64px) with subtle pulsing animation
- Waveform visualization with smooth organic curves
- Progress indicator showing Act completion (▓▓▓░░░ style)

**Cards**: Soft shadows, rounded-2xl corners, generous padding p-6

**Buttons**: 
- Primary: Filled with primary color, rounded-2xl, min-h-11 (44px), px-6
- Secondary: Outline style with soft borders, rounded-2xl
- Touch-friendly: Always minimum 44px height

**Forms**: Clean inputs with subtle borders, focus states with accent color, rounded-2xl

**Audio Player**: Inline player with play/pause controls, waveform visualization

## Emotional Design Principles

### Hopeful & Uplifting
- Soft pastel colors that evoke clear skies and peaceful mornings
- Gentle gradients from sky blue to periwinkle
- Light, airy feel with generous whitespace

### Trust & Clarity
- Consistent visual hierarchy with clear next steps
- Conversational, warm copy throughout
- Progressive disclosure - one step at a time

### Simplicity & Focus
- One primary action per screen
- Clear expectations ("This takes 10 minutes")
- Touch-friendly, mobile-first design

## Voice Training Experience
**3-Act Structure**:
- Act 1: Your Speaking Voice (3 minutes) - Natural conversation
- Act 2: Your Storytelling Voice (4 minutes) - Choose your story
- Act 3: Your Emotional Range (3 minutes) - Full vocal expression

**Progress Indicators**: Visual bars showing ▓▓▓░░░ completion
**Processing Screen**: Hopeful messaging while AI trains (2-3 minutes)
**Success Moment**: Auto-generated preview message in user's voice

## Visual Treatments
**Gradients**: Subtle gradients from sky blue to periwinkle for hero sections
**Soft Shadows**: Gentle drop shadows on cards and buttons
**Interactive States**: Subtle hover effects, clear focus states with accent borders
**Rounded Corners**: Consistent 16px radius creates soft, approachable feel

## Copy Tone
- Warm and conversational (never clinical)
- Clear expectations ("This takes 10 minutes")
- Use icons from lucide-react for visual guidance
- Examples: "Let's preserve your voice" not "Begin voice training"

This design creates a hopeful, uplifting environment where users feel inspired to preserve meaningful memories for loved ones.