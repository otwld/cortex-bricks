import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Card } from 'primeng/card';

interface Author {
    name: string;
    title: string;
    avatar: string;
}

interface Slide {
    id: number;
    image: string;
    title: string;
    category: string;
    author: Author;
}

interface BlogPost {
    id: number;
    category: string;
    date: string;
    title: string;
    description: string;
    link: string;
    hasImage: boolean;
    image?: string;
}

/** CMS article listing page. */
@Component({
    selector: 'app-list',
    imports: [NgClass, Card],
    templateUrl: './list.html',
})
export class List implements OnInit, OnDestroy {
    /**
     * Index of the hero slide currently displayed.
     */
    currentSlide = signal(0);
    private slideInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Hero carousel slides shown at the top of the CMS listing.
     */
    slides: Slide[] = [
        {
            id: 1,
            image: '/demo/images/cms/cms-hero-1.jpg',
            title: 'How Manufacturing Giants Drive Economic Growth',
            category: 'Newest Blog',
            author: {
                name: 'Dianne Russell',
                title: 'CEO @ucs.ai',
                avatar: '/demo/images/cms/avatars/avatar-dianne.jpg'
            }
        },
        {
            id: 2,
            image: '/demo/images/cms/cms-hero-2.jpg',
            title: 'Investment Strategies for Industrial Sectors',
            category: 'Newest Blog',
            author: {
                name: 'Michael Chen',
                title: 'Business Strategist @ventures.co',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face'
            }
        },
        {
            id: 3,
            image: '/demo/images/cms/cms-hero-3.jpg',
            title: `Why Blue-Collar Jobs Are Banking's Best Bet`,
            category: 'Newest Blog',
            author: {
                name: 'Sarah Mitchell',
                title: 'E-commerce Expert @digitalcommerce.io',
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face'
            }
        }
    ];

    /**
     * Blog post columns shown below the hero carousel.
     */
    blogPosts: BlogPost[][] = [
        [
            {
                id: 1,
                category: 'FINANCE',
                date: 'Oct 29, 2025',
                title: 'Industrial Investment Strategies That Drive Growth',
                description: 'Smart approaches to capitalize on manufacturing sector opportunities.',
                link: 'Discover industrial investment potential',
                hasImage: false
            },
            {
                id: 2,
                category: 'BANKING',
                date: 'Oct 24, 2025',
                title: "Energy Sector Banking: Powering Tomorrow's Economy",
                description:
                    'The energy transition is reshaping global markets, creating new opportunities for investors and businesses. From renewable infrastructure to traditional energy modernization, understanding financing trends helps you make informed decisions about portfolio diversification and long-term growth strategies.',
                link: 'Explore energy sector financing',
                hasImage: true,
                image: '/demo/images/cms/cms-list-1.jpg'
            },
            {
                id: 3,
                category: 'INVESTMENT',
                date: 'Oct 16, 2025',
                title: 'Space Technology: The Next Frontier for Investors',
                description: 'Aerospace innovations are creating unprecedented investment opportunities worldwide.',
                link: 'Launch your space investment strategy',
                hasImage: false
            },
            {
                id: 4,
                category: 'ECONOMY',
                date: 'Oct 7, 2025',
                title: 'Manufacturing Renaissance and Economic Recovery',
                description: 'How industrial growth is reshaping modern financial landscapes.',
                link: 'Analyze manufacturing market trends',
                hasImage: false
            }
        ],
        [
            {
                id: 5,
                category: 'AEROSPACE & INNOVATION',
                date: 'Oct 29, 2025',
                title: 'Financing the Future: Space Economy Investment Guide',
                description:
                    'The space economy is experiencing unprecedented growth, driven by private sector innovation and government partnerships. From satellite communications to space tourism, understanding investment opportunities in aerospace requires strategic financial planning. Explore how emerging space technologies are creating new markets and generating substantial returns for forward-thinking investors.',
                link: 'Explore aerospace investment opportunities',
                hasImage: true,
                image: '/demo/images/cms/cms-list-4.jpg'
            },
            {
                id: 6,
                category: 'CORPORATE FINANCE',
                date: 'Oct 27, 2025',
                title: 'Executive Leadership and Strategic Financial Planning',
                description:
                    'Effective corporate leadership requires mastering complex financial strategies that drive sustainable growth. From capital allocation to risk management, executive decision-making shapes company performance and shareholder value. Discover essential financial leadership principles that help executives navigate market volatility and capitalize on emerging opportunities.',
                link: 'Master executive financial strategies',
                hasImage: true,
                image: '/demo/images/cms/cms-list-7.jpg'
            }
        ],
        [
            {
                id: 7,
                category: 'TRAVEL',
                date: 'Oct 11, 2025',
                title: 'Global Economic Trends Shaping 2025',
                description: 'Navigate international markets with expert insights on emerging economic patterns. From supply chain innovations to currency fluctuations, stay informed about global financial developments.',
                link: 'Explore international market analysis',
                hasImage: false
            },
            {
                id: 8,
                category: 'BUSINESS',
                date: 'Oct 30, 2025',
                title: 'Industrial Automation: Financial Impact and Opportunities',
                description: 'Modern manufacturing is transforming through automation and smart technologies. Learn how these changes affect investment portfolios, job markets, and business valuation strategies.',
                link: 'Discover automation finance insights',
                hasImage: false
            },
            {
                id: 9,
                category: 'MANUFACTURING',
                date: 'Oct 2, 2025',
                title: 'Industrial Infrastructure: Building Financial Foundations',
                description:
                    'Strategic infrastructure investment is the cornerstone of economic development. Understanding how manufacturing facilities, energy systems, and industrial complexes create value helps investors identify long-term growth opportunities in the industrial sector.',
                link: 'Check out infrastructure investment guide',
                hasImage: true,
                image: '/demo/images/cms/cms-list-6.jpg'
            }
        ]
    ];

    /**
     * Starts automatic hero slide rotation.
     */
    ngOnInit() {
        this.startAutoSlide();
    }

    /**
     * Stops automatic hero slide rotation.
     */
    ngOnDestroy() {
        this.stopAutoSlide();
    }

    /**
     * Advances the hero carousel to the next slide.
     */
    nextSlide() {
        this.currentSlide.set((this.currentSlide() + 1) % this.slides.length);
    }

    /**
     * Moves the hero carousel to the previous slide.
     */
    prevSlide() {
        this.currentSlide.set(this.currentSlide() === 0 ? this.slides.length - 1 : this.currentSlide() - 1);
    }

    /**
     * Starts the recurring hero carousel timer.
     */
    startAutoSlide() {
        this.slideInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    /**
     * Clears the recurring hero carousel timer when active.
     */
    stopAutoSlide() {
        if (this.slideInterval) {
            clearInterval(this.slideInterval);
            this.slideInterval = null;
        }
    }
}
