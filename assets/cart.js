/**
 * Cart Module - Beardless Cub Theme
 *
 * ES6+ module for AJAX cart operations using Shopify Cart API.
 * No external dependencies - vanilla JavaScript only.
 *
 * @see https://shopify.dev/docs/api/ajax/reference/cart
 */

class CartDrawer {
  constructor() {
    this.drawer = document.getElementById('cart-drawer');
    this.overlay = document.getElementById('cart-overlay');
    this.itemsContainer = document.getElementById('cart-items');
    this.subtotalElement = document.getElementById('cart-subtotal');
    this.countElements = document.querySelectorAll('[data-cart-count]');
    this.emptyMessage = document.getElementById('cart-empty');
    this.cartContent = document.getElementById('cart-content');

    this.isOpen = false;
    this.isUpdating = false;
    this.lastActiveElement = null;
    this.scrollPosition = 0;

    this.init();
  }

  /**
   * Initialize cart drawer functionality
   */
  init() {
    // Bind event listeners
    this.bindEvents();

    // Initial cart fetch
    this.fetchCart();

    document.addEventListener('cart:refresh', () => this.fetchCart());
  }

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Open cart triggers
    document.querySelectorAll('[data-cart-toggle]').forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });

    // Close button
    document.querySelectorAll('[data-cart-close]').forEach(btn => {
      btn.addEventListener('click', () => this.close());
    });

    // Overlay click to close
    this.overlay?.addEventListener('click', () => this.close());

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Add to cart form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target.closest('form[action*="/cart/add"]');
      if (form) {
        e.preventDefault();
        this.handleAddToCart(form);
      }
    });

    // Quantity change events (delegated)
    this.drawer?.addEventListener('click', (e) => {
      const decrementBtn = e.target.closest('[data-quantity-decrement]');
      const incrementBtn = e.target.closest('[data-quantity-increment]');
      const removeBtn = e.target.closest('[data-item-remove]');

      if (decrementBtn) {
        this.handleQuantityChange(decrementBtn, -1);
      } else if (incrementBtn) {
        this.handleQuantityChange(incrementBtn, 1);
      } else if (removeBtn) {
        this.handleRemoveItem(removeBtn);
      }
    });

    // Quantity input change
    this.drawer?.addEventListener('change', (e) => {
      const input = e.target.closest('[data-quantity-input]');
      if (input) {
        const key = input.dataset.key;
        const quantity = parseInt(input.value, 10);
        if (quantity >= 0) {
          this.updateItem(key, quantity);
        }
      }
    });

    this.drawer?.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && this.isOpen) {
        this.handleTabKey(e);
      }
    });
  }

  /**
   * Toggle cart drawer open/closed
   */
  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  /**
   * Open cart drawer
   */
  open() {
    if (!this.drawer) return;

    this.lastActiveElement = document.activeElement;
    this.isOpen = true;
    this.drawer.setAttribute('data-drawer-open', 'true');
    this.overlay?.classList.add('overlay--visible');
    document.body.setAttribute('data-drawer-open', 'true');
    this.lockScroll();

    this.drawer.setAttribute('aria-hidden', 'false');

    const focusable = this.getFocusableElements();
    const firstFocusable = focusable[ 0 ] || this.drawer;
    if (firstFocusable?.focus) {
      try {
        firstFocusable.focus({ preventScroll: true });
      } catch {
        firstFocusable.focus();
      }
    }
  }

  /**
   * Close cart drawer
   */
  close() {
    if (!this.drawer) return;

    this.isOpen = false;
    this.drawer.setAttribute('data-drawer-open', 'false');
    this.overlay?.classList.remove('overlay--visible');
    document.body.removeAttribute('data-drawer-open');

    this.drawer.setAttribute('aria-hidden', 'true');
    this.unlockScroll();

    const target =
      (this.lastActiveElement && document.contains(this.lastActiveElement))
        ? this.lastActiveElement
        : document.querySelector('[data-cart-toggle]');
    if (target?.focus) {
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    }
  }

  /**
   * Fetch current cart state
   * @returns {Promise<Object>} Cart data
   */
  async fetchCart() {
    try {
      const response = await fetch('/cart.js', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to fetch cart');

      const cart = await response.json();
      this.renderCart(cart);
      return cart;
    } catch (error) {
      console.error('Cart fetch error:', error);
      return null;
    }
  }

  /**
   * Add item to cart
   * @param {number|string} variantId - Product variant ID
   * @param {number} quantity - Quantity to add
   * @param {Object} properties - Optional line item properties
   * @returns {Promise<Object>} Updated cart data
   */
  async addItem(variantId, quantity = 1, properties = {}) {
    if (this.isUpdating) return;
    this.isUpdating = true;
    this.setLoading(true);

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          quantity,
          properties
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Failed to add item');
      }

      const cart = await this.fetchCart();
      this.open();

      // Dispatch custom event
      document.dispatchEvent(new CustomEvent('cart:item-added', {
        detail: { variantId, quantity, cart }
      }));

      return cart;
    } catch (error) {
      console.error('Add to cart error:', error);
      this.showError(error.message);
      return null;
    } finally {
      this.isUpdating = false;
      this.setLoading(false);
    }
  }

  /**
   * Update item quantity
   * @param {string} key - Line item key
   * @param {number} quantity - New quantity (0 to remove)
   * @returns {Promise<Object>} Updated cart data
   */
  async updateItem(key, quantity) {
    if (this.isUpdating) return;
    this.isUpdating = true;
    this.setLoading(true);

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });

      if (!response.ok) throw new Error('Failed to update item');

      const cart = await response.json();
      this.renderCart(cart);

      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart }
      }));

      return cart;
    } catch (error) {
      console.error('Update cart error:', error);
      this.showError('Failed to update cart');
      return null;
    } finally {
      this.isUpdating = false;
      this.setLoading(false);
    }
  }

  /**
   * Remove item from cart
   * @param {string} key - Line item key
   * @returns {Promise<Object>} Updated cart data
   */
  async removeItem(key) {
    return this.updateItem(key, 0);
  }

  /**
   * Handle add to cart form submission
   * @param {HTMLFormElement} form
   */
  async handleAddToCart(form) {
    const formData = new FormData(form);
    const variantId = formData.get('id');
    const quantity = parseInt(formData.get('quantity') || '1', 10);

    // Collect properties
    const properties = {};
    for (const [ key, value ] of formData.entries()) {
      if (key.startsWith('properties[')) {
        const propKey = key.replace('properties[', '').replace(']', '');
        properties[ propKey ] = value;
      }
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Adding...';
    }

    await this.addItem(variantId, quantity, properties);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  }

  /**
   * Handle quantity button clicks
   * @param {HTMLElement} button
   * @param {number} change - Amount to change (+1 or -1)
   */
  handleQuantityChange(button, change) {
    const key = button.dataset.key;
    const input = this.drawer.querySelector(`[data-quantity-input][data-key="${key}"]`);
    const currentQty = parseInt(input?.value || '1', 10);
    const newQty = Math.max(0, currentQty + change);

    this.updateItem(key, newQty);
  }

  /**
   * Handle remove button click
   * @param {HTMLElement} button
   */
  handleRemoveItem(button) {
    const key = button.dataset.key;
    this.removeItem(key);
  }

  /**
   * Render cart contents
   * @param {Object} cart - Cart data from API
   */
  renderCart(cart) {
    // Update item count badges
    this.countElements.forEach(el => {
      el.textContent = cart.item_count;
      el.style.display = cart.item_count > 0 ? '' : 'none';
    });

    // Update subtotal
    if (this.subtotalElement) {
      this.subtotalElement.textContent = this.formatMoney(cart.total_price);
    }

    // Toggle empty state
    if (this.emptyMessage && this.cartContent) {
      if (cart.item_count === 0) {
        this.emptyMessage.style.display = '';
        this.cartContent.style.display = 'none';
      } else {
        this.emptyMessage.style.display = 'none';
        this.cartContent.style.display = '';
      }
    }

    // Render items
    if (this.itemsContainer) {
      this.itemsContainer.innerHTML = cart.items.map(item => this.renderItem(item)).join('');
    }
  }

  /**
   * Render single cart item
   * @param {Object} item - Line item data
   * @returns {string} HTML string
   */
  renderItem(item) {
    const variantTitle = item.variant_title && item.variant_title !== 'Default Title'
      ? item.variant_title
      : '';

    return `
      <div class="cart-item" data-key="${item.key}">
        <div class="cart-item__image">
          ${item.image ? `
            <img
              src="${this.getSizedImage(item.image, '120x')}"
              alt="${item.title}"
              width="60"
              height="60"
              loading="lazy"
            >
          ` : `
            <div class="cart-item__placeholder"></div>
          `}
        </div>

        <div class="cart-item__details">
          <a href="${item.url}" class="cart-item__title">${item.product_title}</a>
          ${variantTitle ? `<p class="cart-item__variant">${variantTitle}</p>` : ''}
          <p class="cart-item__price">${this.formatMoney(item.final_line_price)}</p>
        </div>

        <div class="cart-item__quantity">
          <button
            type="button"
            class="cart-item__qty-btn"
            data-quantity-decrement
            data-key="${item.key}"
            aria-label="Decrease quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>

          <input
            type="number"
            class="cart-item__qty-input"
            data-quantity-input
            data-key="${item.key}"
            value="${item.quantity}"
            min="0"
            aria-label="Quantity"
          >

          <button
            type="button"
            class="cart-item__qty-btn"
            data-quantity-increment
            data-key="${item.key}"
            aria-label="Increase quantity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="cart-item__remove"
          data-item-remove
          data-key="${item.key}"
          aria-label="Remove ${item.title}"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Format money value
   * @param {number} cents - Amount in cents
   * @returns {string} Formatted price
   */
  formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return `$${amount}`;
  }

  /**
   * Get sized image URL
   * @param {string} url - Original image URL
   * @param {string} size - Size parameter (e.g., '120x')
   * @returns {string} Sized image URL
   */
  getSizedImage(url, size) {
    if (!url) return '';
    return url.replace(/_(pico|icon|thumb|small|compact|medium|large|grande|original|master)?\./, `_${size}.`);
  }

  /**
   * Set loading state
   * @param {boolean} loading
   */
  setLoading(loading) {
    this.drawer?.classList.toggle('loading', loading);
  }

  /**
   * Show error message
   * @param {string} message
   */
  showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'cart-toast cart-toast--error';
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('cart-toast--visible');
    });

    // Remove after delay
    setTimeout(() => {
      toast.classList.remove('cart-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  lockScroll() {
    this.scrollPosition = window.scrollY || window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';
  }

  unlockScroll() {
    const scrollY = this.scrollPosition || 0;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
  }

  getFocusableElements() {
    if (!this.drawer) return [];
    return Array.from(
      this.drawer.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  handleTabKey(e) {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[ 0 ];
    const last = focusable[ focusable.length - 1 ];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      try {
        last.focus({ preventScroll: true });
      } catch {
        last.focus();
      }
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      try {
        first.focus({ preventScroll: true });
      } catch {
        first.focus();
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new CartDrawer());
} else {
  new CartDrawer();
}

// Export for module usage
export { CartDrawer };
