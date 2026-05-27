import { NgClass } from '@angular/common';
import { Component, ViewChildren, QueryList, signal, computed, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule, Menu } from 'primeng/menu';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

interface QAItem {
    question: string;
    questionDate: string;
    answer: string;
    answerDate: string;
}

interface Review {
    name: string;
    email: string;
    date: string;
    rating: number;
    comment: string;
    avatar: string;
}

interface Recommendation {
    id: number;
    image: string;
    active: boolean;
}

interface Size {
    label: string;
    disabled: boolean;
}

/** Product overview page with gallery, recommendations, reviews, and Q&A. */
@Component({
    selector: 'app-product-overview-page',
    imports: [NgClass, FormsModule, ButtonModule, TabsModule, TagModule, MenuModule],
    templateUrl: './product-overview.page.html',
})
export class ProductOverviewPage {
    @ViewChildren('reviewMenu') reviewMenus!: QueryList<Menu>;

    selectedSize = signal('S');

    selectedRecommendation = signal(0);

    activeTab = model<string>('description');

    selectedRating = signal<number | 'all'>('all');

    filteredReviews = computed(() => {
        const rating = this.selectedRating();
        if (rating === 'all') {
            return Object.values(this.reviews).flat();
        }
        return this.reviews[rating] || [];
    });

    qaItems: QAItem[] = [
        {
            question: 'Is this jacket suitable for heavy rain?',
            questionDate: 'January 12, 2025 | 18:40',
            answer: 'Yes, the AeroShield™ Storm Jacket features StormGuard™ Fabric, which is water-resistant and repels rain effectively. However, for extreme downpours, we recommend using an additional waterproof layer.',
            answerDate: 'January 12, 2025 | 18:45'
        },
        {
            question: 'Does the jacket run true to size?',
            questionDate: 'January 20, 2025 | 02:35',
            answer: 'Yes, the jacket is designed with a standard slim-fit cut. If you prefer a looser fit, we recommend sizing up. Please refer to our size guide for exact measurements.',
            answerDate: 'January 20, 2025 | 02:40'
        }
    ];

    reviews: { [key: number]: Review[] } = {
        5: [
            {
                name: 'Liam Carter',
                email: 'liam.carter92@email.com',
                date: 'January 18, 2025 | 16:45',
                rating: 5,
                comment: 'Absolutely fantastic jacket! The material feels premium, and it keeps me warm even in freezing temperatures. The fit is perfect, and I love the secure zippered pockets. Would definitely recommend!',
                avatar: 'LC'
            },
            {
                name: 'Emma Wilson',
                email: 'emma.wilson@email.com',
                date: 'January 16, 2025 | 14:20',
                rating: 5,
                comment: 'Outstanding quality! This jacket exceeded my expectations. Perfect for outdoor activities and looks great too. The waterproof feature really works!',
                avatar: 'EW'
            }
        ],
        4: [
            {
                name: 'Sophie Bennett',
                email: 'sophie.bennett@email.com',
                date: 'January 15, 2025 | 12:30',
                rating: 4,
                comment: "Great quality and stylish design. The jacket is very comfortable, but I wish the hood was slightly larger. Other than that, it's a solid purchase for winter wear.",
                avatar: 'SB'
            },
            {
                name: 'Michael Davis',
                email: 'michael.davis@email.com',
                date: 'January 12, 2025 | 10:15',
                rating: 4,
                comment: "Very good jacket overall. Keeps me warm and dry. Only complaint is that it's a bit bulky, but the quality makes up for it.",
                avatar: 'MD'
            }
        ],
        3: [
            {
                name: 'James Holland',
                email: 'jamesholland23@email.com',
                date: 'January 10, 2025 | 09:15',
                rating: 3,
                comment: 'Decent jacket, but not as warm as I expected. Works well for mild winter conditions, but in extreme cold, you might need an extra layer. The build quality is good, though.',
                avatar: 'JH'
            }
        ],
        2: [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@email.com',
                date: 'January 8, 2025 | 16:45',
                rating: 2,
                comment: 'The jacket looks nice but the sizing was off. Ordered a large but it fits more like a medium. The material is okay but not worth the price.',
                avatar: 'SJ'
            }
        ],
        1: [
            {
                name: 'David Brown',
                email: 'david.brown@email.com',
                date: 'January 5, 2025 | 11:30',
                rating: 1,
                comment: 'Very disappointed with this purchase. The jacket started showing wear after just a few uses. The zipper broke within a week. Would not recommend.',
                avatar: 'DB'
            }
        ]
    };

    images: string[] = [
        '/demo/images/ecommerce/productoverview/ecommerce-productoverview-1.jpg',
        '/demo/images/ecommerce/productoverview/ecommerce-productoverview-2.jpg',
        '/demo/images/ecommerce/productoverview/ecommerce-productoverview-3.jpg',
        '/demo/images/ecommerce/productoverview/ecommerce-productoverview-4.jpg'
    ];

    recommendations: Recommendation[] = [
        { id: 1, image: '/demo/images/ecommerce/productoverview/ecommerce-productoverview-5.jpg', active: true },
        { id: 2, image: '/demo/images/ecommerce/productoverview/ecommerce-productoverview-6.jpg', active: false },
        { id: 3, image: '/demo/images/ecommerce/productoverview/ecommerce-productoverview-7.jpg', active: false },
        { id: 4, image: '/demo/images/ecommerce/productoverview/ecommerce-productoverview-8.jpg', active: false }
    ];

    sizes: Size[] = [
        { label: 'XS', disabled: true },
        { label: 'S', disabled: false },
        { label: 'M', disabled: false },
        { label: 'L', disabled: false },
        { label: 'XL', disabled: true },
        { label: 'XXL', disabled: false }
    ];

    reviewMenuItems = [
        {
            label: 'Report Review',
            icon: 'pi pi-flag',
            command: () => undefined
        },
        {
            label: 'Share Review',
            icon: 'pi pi-share-alt',
            command: () => undefined
        },
        {
            separator: true
        },
        {
            label: 'Mark as Helpful',
            icon: 'pi pi-thumbs-up',
            command: () => undefined
        }
    ];

    /**
     * Runs select rating.
     *
     * @param rating - rating value.
     */
    selectRating(rating: number | 'all') {
        this.selectedRating.set(rating);
    }

    /**
     * Runs set size.
     *
     * @param size - size value.
     */
    setSize(size: string) {
        const sizeItem = this.sizes.find((s) => s.label === size);
        if (sizeItem && !sizeItem.disabled) {
            this.selectedSize.set(size);
        }
    }

    /**
     * Runs set recommendation.
     *
     * @param index - index value.
     */
    setRecommendation(index: number) {
        this.selectedRecommendation.set(index);
        this.recommendations.forEach((rec, i) => {
            rec.active = i === index;
        });
    }

    /**
     * Runs toggle review menu.
     *
     * @param event - event value.
     *
     * @param index - index value.
     */
    toggleReviewMenu(event: Event, index: number) {
        const menuArray = this.reviewMenus.toArray();
        if (menuArray[index]) {
            menuArray[index].toggle(event);
        }
    }

    /**
     * Runs get date part.
     *
     * @param dateStr - date str value.
     *
     * @returns The product overview page get date part result.
     */
    getDatePart(dateStr: string): string {
        return dateStr.split(' | ')[0];
    }

    /**
     * Runs get time part.
     *
     * @param dateStr - date str value.
     *
     * @returns The product overview page get time part result.
     */
    getTimePart(dateStr: string): string {
        return dateStr.split(' | ')[1];
    }
}
