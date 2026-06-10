import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';

interface CartItem {
    id: number;
    name: string;
    description: string;
    originalPrice: number;
    currentPrice: number;
    earnings: number;
    quantity: number;
    deliveryDate: string;
    image: string;
}

interface RecommendedProduct {
    id: number;
    name: string;
    price: string;
    rating: number;
    image: string;
}

/** Shopping cart page with totals and recommendations. */
@Component({
    selector: 'app-shopping-cart-page',
    imports: [FormsModule, ButtonModule, DividerModule, InputNumberModule, InputTextModule],
    templateUrl: './shopping-cart.page.html',
})
export class ShoppingCartPage {
    /**
     * Editable shopping cart items and their quantities.
     */
    cartItems = signal<CartItem[]>([
        {
            id: 1,
            name: 'AeroShield™ Storm Jacket',
            description: 'Storm-FIT Windproof & Water-Resistant Jacket',
            originalPrice: 330.99,
            currentPrice: 279.99,
            earnings: 51.0,
            quantity: 1,
            deliveryDate: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-1.jpg'
        },
        {
            id: 2,
            name: 'StormEdge™ Midnight Coat',
            description: 'Storm-FIT Windproof Coat Jacket',
            originalPrice: 320.49,
            currentPrice: 289.99,
            earnings: 30.5,
            quantity: 1,
            deliveryDate: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-2.jpg'
        },
        {
            id: 3,
            name: 'AeroFlex™ All-Weather Jacket',
            description: 'Storm-FIT Linen Jacket',
            originalPrice: 349.99,
            currentPrice: 319.99,
            earnings: 30.0,
            quantity: 1,
            deliveryDate: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-3.jpg'
        }
    ]);

    /**
     * Recommended products displayed below the cart.
     */
    recommendedProducts: RecommendedProduct[] = [
        {
            id: 1,
            name: 'SkyLum™ Urban Trench Coat',
            price: '$249.99',
            rating: 4.7,
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-1.jpg'
        },
        {
            id: 5,
            name: 'BreGD™ Lightweight Jacket',
            price: '$199.99',
            rating: 4.5,
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-5.jpg'
        },
        {
            id: 6,
            name: 'FlowMotion™ Cape Jacket',
            price: '$349.99',
            rating: 4.7,
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-6.jpg'
        }
    ];

    /**
     * Promo code typed into the cart summary form.
     */
    promoCode = '';

    /**
     * Cart subtotal computed from item prices and quantities.
     */
    subtotal = computed(() => {
        return this.cartItems().reduce((sum, item) => sum + item.currentPrice * item.quantity, 0);
    });

    /**
     * Total savings computed from item earnings and quantities.
     */
    totalEarnings = computed(() => {
        return this.cartItems().reduce((sum, item) => sum + item.earnings * item.quantity, 0);
    });

    /**
     * VAT amount applied to the cart.
     */
    vat = computed(() => 20.0);

    /**
     * Final cart total including VAT.
     */
    total = computed(() => {
        return this.subtotal() + this.vat();
    });

    /**
     * Updates the quantity for one cart item when the value is positive.
     *
     * @param itemId - Cart item id to update.
     * @param newQuantity - New positive quantity.
     */
    updateQuantity(itemId: number, newQuantity: number) {
        const items = this.cartItems();
        const item = items.find((i) => i.id === itemId);
        if (item && newQuantity > 0) {
            item.quantity = newQuantity;
            this.cartItems.set([...items]);
        }
    }

    /**
     * Removes one item from the cart.
     *
     * @param itemId - Cart item id to remove.
     */
    removeItem(itemId: number) {
        const items = this.cartItems();
        const index = items.findIndex((i) => i.id === itemId);
        if (index > -1) {
            items.splice(index, 1);
            this.cartItems.set([...items]);
        }
    }

    /**
     * Handles promo code submission for host integration.
     */
    applyPromoCode() {
        return;
    }

    /**
     * Handles checkout submission for host integration.
     */
    checkout() {
        return;
    }
}
