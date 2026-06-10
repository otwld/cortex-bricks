import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';

interface OrderItem {
    id: number;
    name: string;
    description: string;
    price: number;
    estimatedDelivery: string;
    image: string;
}

interface PaymentMethod {
    type: string;
    last4: string;
    cardNumber: string;
    brand: string;
}

interface ShippingAddress {
    name: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

/** Order summary confirmation page. */
@Component({
    selector: 'app-order-summary-page',
    imports: [ButtonModule],
    templateUrl: './order-summary.page.html',
})
export class OrderSummaryPage {
    /**
     * Purchased order items shown in the confirmation summary.
     */
    orderItems: OrderItem[] = [
        {
            id: 1,
            name: 'AeroShield™ Storm Jacket',
            description: 'Storm-FIT Windproof & Water-Resistant Jacket',
            price: 279.99,
            estimatedDelivery: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-1.jpg'
        },
        {
            id: 2,
            name: 'StormEdge™ Midnight Coat',
            description: 'Storm-FIT Windproof Coat Jacket',
            price: 289.99,
            estimatedDelivery: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-2.jpg'
        },
        {
            id: 3,
            name: 'AeroFlex™ All-Weather Jacket',
            description: 'Storm-FIT Linen Jacket',
            price: 319.99,
            estimatedDelivery: 'Saturday, January 18th',
            image: '/demo/images/ecommerce/shopping-cart/ecommerce-shoppingcart-3.jpg'
        }
    ];

    /**
     * Masked payment method displayed for the completed order.
     */
    paymentMethod: PaymentMethod = {
        type: 'Credit Card',
        last4: '1089',
        cardNumber: '5200 19****** 1089',
        brand: 'Visa'
    };

    /**
     * Shipping destination displayed for the completed order.
     */
    shippingAddress: ShippingAddress = {
        name: 'Robert Fox',
        phone: '+1 (123) 456-7890',
        street: '1234 Elm Street, Apt 56',
        city: 'Springfield',
        state: 'IL',
        zip: '62704',
        country: 'USA'
    };

    /**
     * Shipping charge applied to the order.
     */
    shipping = 18.0;

    /**
     * Discount amount applied to the order.
     */
    discount = 111.5;

    /**
     * VAT amount included in the order.
     */
    vat = 20.0;

    /**
     * Final order total displayed in the summary.
     */
    total = 909.97;
}
