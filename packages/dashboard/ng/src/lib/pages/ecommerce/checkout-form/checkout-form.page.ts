import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputMaskModule } from 'primeng/inputmask';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

interface CartItem {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    savings: number;
    discount: number;
    image: string;
}

interface Country {
    label: string;
    value: string;
}

/** Checkout form page for shipping, payment, and order totals. */
@Component({
    selector: 'app-checkout-form-page',
    imports: [ButtonModule, SelectModule, InputTextModule, InputMaskModule, FormsModule],
    templateUrl: './checkout-form.page.html',
})
export class CheckoutFormPage {
    /**
     * Shipping, payment, and discount fields bound to the checkout form.
     */
    formData = {
        email: '',
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        country: null as string | null,
        taxId: '',
        discountCode: ''
    };

    /**
     * Country options shown in the billing country selector.
     */
    countries: Country[] = [
        { label: 'United States', value: 'us' },
        { label: 'Canada', value: 'ca' },
        { label: 'United Kingdom', value: 'uk' },
        { label: 'Germany', value: 'de' },
        { label: 'France', value: 'fr' },
        { label: 'Spain', value: 'es' },
        { label: 'Italy', value: 'it' },
        { label: 'Japan', value: 'jp' },
        { label: 'Australia', value: 'au' }
    ];

    /**
     * Cart line items shown in the order summary.
     */
    cartItems: CartItem[] = [
        {
            id: 1,
            name: 'AeroShield™ Storm Jacket',
            price: 279.99,
            originalPrice: 330.99,
            savings: 51.0,
            discount: 15,
            image: '/demo/images/ecommerce/checkoutform/ecommerce-checkoutform-1.jpg'
        },
        {
            id: 2,
            name: 'StormEdge™ Midnight Coat',
            price: 289.99,
            originalPrice: 320.49,
            savings: 30.5,
            discount: 10,
            image: '/demo/images/ecommerce/checkoutform/ecommerce-checkoutform-2.jpg'
        },
        {
            id: 3,
            name: 'AeroFlex™ All-Weather Jacket',
            price: 319.99,
            originalPrice: 349.99,
            savings: 30.0,
            discount: 10,
            image: '/demo/images/ecommerce/checkoutform/ecommerce-checkoutform-3.jpg'
        }
    ];

    /**
     * Cart subtotal before discounts, shipping, and tax.
     */
    subtotal = 1001.47;

    /**
     * Discount amount applied across the cart.
     */
    totalSavings = 111.5;

    /**
     * Original shipping price displayed before free or discounted shipping.
     */
    shippingOriginal = 18.0;

    /**
     * VAT amount included in the order total.
     */
    vat = 20.0;

    /**
     * Final order total shown by the checkout summary.
     */
    total = 909.97;

    /**
     * Handles the checkout submit action for host integration.
     */
    processPayment() {
        return;
    }
}
