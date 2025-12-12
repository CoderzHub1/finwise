# FinWise Theme Guide

## Color Palette

### Primary Colors
- **Background**: `#ffffff` (White)
- **Text Primary**: `#000000` (Black)
- **Text Secondary**: `#525252` (Gray)

### UI Elements
- **Borders**: `#e5e5e5` (Light Gray)
- **Hover Background**: `#f5f5f5` (Off White)
- **Active/Primary Button**: `#000000` (Black)
- **Active Button Hover**: `#262626` (Dark Gray)

### Accent Colors
- **Error Background**: `#fff5f5`
- **Error Text**: `#c53030`
- **Error Border**: `#feb2b2`

## Typography

### Font Sizes
- **Page Title**: `1.8rem`
- **Subtitle**: `0.95rem`
- **Body Text**: `1rem`
- **Small Text**: `0.85rem`

### Font Weights
- **Bold/Headers**: `700`
- **Semi-Bold**: `600`
- **Normal**: `400`

## Component Styles

### Buttons
- **Padding**: `10px 20px` (standard), `10px 24px` (primary)
- **Border Radius**: `12px`
- **Border**: `2px solid #e5e5e5`
- **Transition**: `all 0.3s ease`
- **Hover Effect**: `transform: translateY(-2px)`

### Cards
- **Background**: `#ffffff`
- **Border Radius**: `12px`
- **Box Shadow**: `0 2px 8px rgba(0, 0, 0, 0.1)`
- **Hover Shadow**: `0 4px 16px rgba(0, 0, 0, 0.15)`

### Input Fields
- **Padding**: `12px 20px`
- **Border**: `2px solid #e5e5e5`
- **Border Radius**: `12px`
- **Focus Border**: `#000000`

## Layout

### Spacing
- **Standard Gap**: `20px`
- **Large Gap**: `30px`
- **Small Gap**: `10px`

### Container
- **Max Width**: `1400px`
- **Padding**: `40px 20px`

### Responsive Breakpoints
- **Tablet**: `1024px`
- **Mobile**: `768px`

## Navigation Bar

### Structure
- Logo on left with subtitle
- Navigation buttons in center
- Sign out button on right

### Active State
- Background: `#000000`
- Color: `#ffffff`
- Border: `2px solid #000000`

### Inactive State
- Background: `#ffffff`
- Color: `#000000`
- Border: `2px solid #e5e5e5`

## Usage

All pages should use the `<Navbar>` component:

```jsx
import Navbar from '@/components/Navbar';

<Navbar currentPage="/dashboard" />
```

Pass the current page path to highlight the active navigation item.
