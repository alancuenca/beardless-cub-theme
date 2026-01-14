# Beardless Cub Theme

A custom Shopify 2.0 theme built from scratch for clothing and jewelry e-commerce. This theme demonstrates deep platform knowledge through clean architecture, modern JavaScript patterns, and thoughtful UX design.

**Built in 48 hours** as a demonstration of Shopify theme development expertise.

## Technical Highlights

- **Custom Shopify 2.0 Theme** - Built from Shopify's skeleton theme, not a Dawn fork
- **Vanilla CSS with BEM** - No frameworks, organized CSS architecture with custom properties
- **ES6+ JavaScript** - Zero dependencies, native module patterns
- **AJAX Cart Drawer** - Full Shopify Cart API integration without jQuery
- **Metafield Integration** - Product attributes (material, care instructions, sizing)
- **4 Custom Sections** - Complex schemas with blocks, demonstrating theme editor flexibility

## Architecture Overview

```
beardless-cub-theme/
├── assets/
│   ├── critical.css         # Above-the-fold styles, design tokens
│   └── cart.js              # ES6 cart module with AJAX operations
├── blocks/
│   ├── group.liquid         # Reusable layout block
│   └── text.liquid          # Text content block
├── config/
│   ├── settings_schema.json # Theme settings (typography, colors, layout)
│   └── settings_data.json   # Settings values
├── layout/
│   ├── theme.liquid         # Main layout with cart drawer
│   └── password.liquid      # Password page layout
├── locales/
│   ├── en.default.json      # English translations
│   └── en.default.schema.json
├── sections/
│   ├── hero-slideshow.liquid      # Hero with blocks, View Transitions
│   ├── featured-collection.liquid # Product grid section
│   ├── product-highlight.liquid   # Metafields showcase
│   ├── testimonials.liquid        # Carousel with nested blocks
│   ├── cart-drawer.liquid         # AJAX cart drawer
│   ├── header.liquid              # Responsive nav with mobile menu
│   ├── footer.liquid              # Newsletter, social, navigation
│   ├── product.liquid             # Full product page
│   ├── collection.liquid          # Collection grid with sorting
│   └── ...
├── snippets/
│   ├── product-card.liquid  # Reusable product card
│   ├── price.liquid         # Price display component
│   ├── css-variables.liquid # Theme CSS custom properties
│   ├── image.liquid         # Responsive image helper
│   └── meta-tags.liquid     # SEO meta tags
└── templates/
    └── *.json               # JSON templates
```

## Key Technical Decisions

### 1. No Dawn Fork

Built from Shopify's minimal skeleton theme to demonstrate understanding of the theme architecture from first principles. Every line of code is intentional and documented.

### 2. Vanilla CSS Architecture

```css
/* Design Tokens in :root */
:root {
  --space-md: 1rem;
  --color-primary: #1a1a1a;
  --transition-base: 250ms ease;
}

/* BEM Naming Convention */
.product-card { }
.product-card__image { }
.product-card__image--secondary { }
```

**Why not Tailwind?** To demonstrate CSS mastery and create maintainable, semantic code that any developer can understand without framework knowledge.

### 3. ES6 Modules Without Build Tools

```javascript
// cart.js - Native module pattern
class CartDrawer {
  async addItem(variantId, quantity = 1) {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity })
    });
    return response.json();
  }
}

export { CartDrawer };
```

**Why no bundler?** Shopify themes don't require complex build pipelines. Modern browsers support ES6 modules natively. This reduces complexity and demonstrates that simpler is often better.

### 4. Cart API Integration

Direct integration with Shopify's AJAX Cart API endpoints:
- `POST /cart/add.js` - Add items
- `POST /cart/change.js` - Update quantities
- `GET /cart.js` - Fetch cart state

The cart drawer opens automatically on add-to-cart and updates in real-time without page refreshes.

### 5. Metafield Integration

Product metafields demonstrated in the Product Highlight section and product page:

```liquid
{% if product.metafields.custom.material %}
  <div class="product-highlight__material">
    <span class="label">{{ 'products.material' | t }}</span>
    {{ product.metafields.custom.material | metafield_text }}
  </div>
{% endif %}
```

Supports:
- `product.metafields.custom.material` - Product materials
- `product.metafields.custom.care_instructions` - Care/cleaning info
- `product.metafields.custom.sizing_guide` - Size chart reference

## Custom Sections

### 1. Hero Slideshow
- Multiple slides using blocks system
- Autoplay with progress indicator
- Touch/swipe navigation
- View Transitions API for smooth animations
- Customizable content position and text color

### 2. Featured Collection
- Dynamic product grid from any collection
- Responsive columns (configurable for desktop/mobile)
- Quick add to cart functionality
- Lazy loading images with srcset

### 3. Product Highlight
- Large product showcase with metafields
- Flexible layout (image left/right)
- Add to cart with variant selection
- Background color customization

### 4. Testimonials
- Carousel with star ratings
- Author info with images
- Touch-enabled navigation
- Accessible keyboard controls

## Performance Optimizations

| Optimization | Implementation |
|--------------|----------------|
| **LCP** | Critical CSS inlined, hero image preload, font preconnect |
| **FID** | Deferred non-critical JS, native ES modules |
| **CLS** | Explicit image dimensions, font-display: swap |
| **TBT** | Minimal JS, no blocking scripts |

### Performance Features
- Critical CSS loaded synchronously (`critical.css`)
- Section-scoped CSS via `{% stylesheet %}` tags
- Lazy loading for off-screen images
- Responsive images with `srcset` and `sizes`
- Font preloading with `font-display: swap`

## Accessibility Features

- Skip to content link
- ARIA labels and roles throughout
- Keyboard navigation support
- Focus visible states
- Semantic HTML structure
- Color contrast compliance
- Screen reader announcements for cart updates

## Browser Support

Designed for modern evergreen browsers:
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Setup Instructions

### Prerequisites
- Shopify CLI installed
- A Shopify Partner account
- A development store

### Installation

1. Clone or download this theme:
```bash
git clone https://github.com/[username]/beardless-cub-theme.git
cd beardless-cub-theme
```

2. Connect to your Shopify store:
```bash
shopify theme dev --store your-store.myshopify.com
```

3. Preview in your browser at the URL provided by Shopify CLI.

### Deployment

Deploy to your store:
```bash
shopify theme push --store your-store.myshopify.com
```

## Customization

### Theme Settings
Access via **Online Store > Themes > Customize**:
- Typography (font family)
- Colors (background, foreground)
- Layout (page width, margins)
- Input styling

### Metafields Setup
Create these product metafields in **Settings > Custom data > Products**:
- `custom.material` (Single line text)
- `custom.care_instructions` (Multi-line text)
- `custom.sizing_guide` (Single line text or URL)

## Code Quality

- **Commented code** - Every file includes purpose documentation
- **LiquidDoc** - Snippets documented with `{% doc %}` tags
- **Consistent formatting** - 2-space indentation, organized imports
- **Translation-ready** - All strings use `{{ 'key' | t }}`

## File Structure Conventions

- **Sections**: Full-width page components with `{% schema %}`
- **Blocks**: Reusable nestable components
- **Snippets**: Render helpers with `{% doc %}` documentation
- **Templates**: JSON files defining section order

## License

MIT License - See LICENSE.md

---

**Built by [Your Name]** as a demonstration of Shopify theme development expertise.

Questions? Reach out at [your@email.com]
