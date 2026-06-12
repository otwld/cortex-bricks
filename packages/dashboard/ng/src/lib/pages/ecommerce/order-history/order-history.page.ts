import { NgClass } from '@angular/common';
import { Component, computed, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { Card } from 'primeng/card';

interface DeliveryAddress {
    title: string;
    address: string;
    city: string;
    name: string;
    phone: string;
}

interface Order {
    id: number;
    orderNumber: string;
    product: string;
    variant: string;
    size: string;
    seller: string;
    image: string;
    date: string;
    status: string;
    statusLabel: string;
    statusColor: 'warn' | 'success' | 'danger' | 'info' | 'secondary' | 'contrast' | undefined;
    total: string;
    subtotal: string;
    shipping: string;
    tax: string;
    cardNumber: string;
    deliveryStatus: string;
    estimatedDelivery: string;
    recipient: string;
    deliveryAddress: DeliveryAddress;
}

/** Order history page with filters and expandable details. */
@Component({
    selector: 'app-order-history-page',
    imports: [NgClass, FormsModule, ButtonModule, IconFieldModule, InputIconModule, InputTextModule, TagModule, Card],
    templateUrl: './order-history.page.html',
})
export class OrderHistoryPage {
    /**
     * Search text applied to order number, product, and variant values.
     */
    searchQuery = model('');

    /**
     * Active order status filter selected in the toolbar.
     */
    activeFilter = signal<'all' | 'ongoing' | 'returns' | 'cancelled' | 'completed'>('all');

    /**
     * Expansion state keyed by order id for detail panels.
     */
    expandedOrders: { [key: number]: boolean } = {};

    /**
     * Demo order records shown in the order history list.
     */
    orders: Order[] = [
        {
            id: 1,
            orderNumber: '124812476',
            product: 'SkyLum™ Urban Trench Coat',
            variant: 'Premium Urban Design with Weather Protection',
            size: 'M',
            seller: 'StyleHub',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-1.jpg',
            date: 'January 04, 2025',
            status: 'ongoing',
            statusLabel: 'Order in progress',
            statusColor: 'warn',
            total: '$249.99',
            subtotal: '$249.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '5200 19****** 1089',
            deliveryStatus: 'processing',
            estimatedDelivery: '07 Jan Pts 2025',
            recipient: 'Robert Fox',
            deliveryAddress: {
                title: 'Home',
                address: '1234 Elm Street, Apt 56',
                city: 'Springfield, IL 62704 USA',
                name: 'Robert Fox',
                phone: '+1 (123) 456-7890'
            }
        },
        {
            id: 2,
            orderNumber: '124812477',
            product: 'AeroFX™ All-Weather Jacket',
            variant: 'Advanced Weather Protection Technology',
            size: 'L',
            seller: 'TechWear',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-2.jpg',
            date: 'January 10, 2025',
            status: 'ongoing',
            statusLabel: 'Order in progress',
            statusColor: 'warn',
            total: '$319.99',
            subtotal: '$319.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '4200 18****** 2341',
            deliveryStatus: 'shipping',
            estimatedDelivery: '13 Jan Pts 2025',
            recipient: 'Sarah Johnson',
            deliveryAddress: {
                title: 'Work',
                address: '789 Business Center',
                city: 'Chicago, IL 60601 USA',
                name: 'Sarah Johnson',
                phone: '+1 (234) 567-8901'
            }
        },
        {
            id: 3,
            orderNumber: '124812478',
            product: 'AeroShield™ Storm Jacket',
            variant: 'Storm-FIT Windproof & Water-Resistant',
            size: 'S',
            seller: 'ZenTrailMs',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-3.jpg',
            date: 'January 12, 2025',
            status: 'completed',
            statusLabel: 'Order completed',
            statusColor: 'success',
            total: '$279.99',
            subtotal: '$279.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '3100 15****** 7865',
            deliveryStatus: 'delivered',
            estimatedDelivery: '15 Jan Pts 2025',
            recipient: 'Michael Chen',
            deliveryAddress: {
                title: 'Home',
                address: '456 Oak Avenue',
                city: 'Portland, OR 97201 USA',
                name: 'Michael Chen',
                phone: '+1 (345) 678-9012'
            }
        },
        {
            id: 4,
            orderNumber: '124812479',
            product: 'Nukie Windrunner PrimaLoft®',
            variant: 'Premium Insulated Winter Jacket',
            size: 'XL',
            seller: 'SportGear',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-4.jpg',
            date: 'January 08, 2025',
            status: 'completed',
            statusLabel: 'Order completed',
            statusColor: 'success',
            total: '$299.99',
            subtotal: '$299.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '6200 17****** 4321',
            deliveryStatus: 'delivered',
            estimatedDelivery: '11 Jan Pts 2025',
            recipient: 'Emma Rodriguez',
            deliveryAddress: {
                title: 'Home',
                address: '789 Maple Drive',
                city: 'Austin, TX 78701 USA',
                name: 'Emma Rodriguez',
                phone: '+1 (456) 789-0123'
            }
        },
        {
            id: 5,
            orderNumber: '124812480',
            product: 'BreGD™ Lightweight Jacket',
            variant: 'Ultra-Light Summer Performance',
            size: 'M',
            seller: 'ActiveWear',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-5.jpg',
            date: 'January 14, 2025',
            status: 'completed',
            statusLabel: 'Order completed',
            statusColor: 'success',
            total: '$199.99',
            subtotal: '$199.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '7200 16****** 9876',
            deliveryStatus: 'delivered',
            estimatedDelivery: '17 Jan Pts 2025',
            recipient: 'James Wilson',
            deliveryAddress: {
                title: 'Home',
                address: '321 Elm Street',
                city: 'Denver, CO 80202 USA',
                name: 'James Wilson',
                phone: '+1 (567) 890-1234'
            }
        },
        {
            id: 6,
            orderNumber: '124812481',
            product: 'FlowMotion™ Cape Jacket',
            variant: 'Designer Cape Style with Modern Fit',
            size: 'L',
            seller: 'LuxeFashion',
            image: '/demo/images/ecommerce/order-history/ecommerce-orderhistory-6.jpg',
            date: 'January 16, 2025',
            status: 'completed',
            statusLabel: 'Order completed',
            statusColor: 'success',
            total: '$349.99',
            subtotal: '$349.99',
            shipping: '$0',
            tax: '$0',
            cardNumber: '8200 14****** 5432',
            deliveryStatus: 'delivered',
            estimatedDelivery: '19 Jan Pts 2025',
            recipient: 'Olivia Martinez',
            deliveryAddress: {
                title: 'Home',
                address: '654 Cedar Lane',
                city: 'San Francisco, CA 94102 USA',
                name: 'Olivia Martinez',
                phone: '+1 (678) 901-2345'
            }
        }
    ];

    /**
     * Orders after applying status and search filters.
     */
    filteredOrders = computed(() => {
        let filtered = this.orders;

        if (this.activeFilter() !== 'all') {
            switch (this.activeFilter()) {
                case 'ongoing':
                    filtered = filtered.filter((order) => order.status === 'ongoing');
                    break;
                case 'returns':
                    filtered = filtered.filter((order) => order.status === 'returns');
                    break;
                case 'cancelled':
                    filtered = filtered.filter((order) => order.status === 'cancelled');
                    break;
                case 'completed':
                    filtered = filtered.filter((order) => order.status === 'completed');
                    break;
            }
        }

        if (this.searchQuery().trim()) {
            const query = this.searchQuery().toLowerCase().trim();
            filtered = filtered.filter((order) => order.orderNumber.toLowerCase().includes(query) || order.product.toLowerCase().includes(query) || order.variant.toLowerCase().includes(query));
        }

        return filtered;
    });

    /**
     * Toggles the expanded details panel for an order.
     *
     * @param orderId - Order id whose detail panel should change.
     */
    toggleOrder(orderId: number) {
        this.expandedOrders[orderId] = !this.expandedOrders[orderId];
    }

    /**
     * Maps delivery status to the current progress step.
     *
     * @param status - Delivery status value from the order.
     * @returns One-based progress step for the delivery timeline.
     */
    getDeliveryProgress(status: string): number {
        switch (status) {
            case 'pending':
            case 'received':
                return 1;
            case 'processing':
                return 2;
            case 'shipping':
            case 'in_transit':
                return 3;
            case 'delivered':
            case 'completed':
                return 4;
            default:
                return 1;
        }
    }
}
