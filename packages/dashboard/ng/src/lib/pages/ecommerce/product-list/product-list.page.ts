import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';

interface Product {
    id: number;
    name: string;
    price: string;
    priceNumber: number;
    rating: number;
    category: string;
    dateAdded: Date;
    image: string;
}

interface SelectOption {
    label: string;
    value: string | null;
}

/** E-commerce product listing page with filters and sorting. */
@Component({
    selector: 'app-product-list-page',
    imports: [FormsModule, IconFieldModule, InputIconModule, InputTextModule, SelectModule, TagModule],
    templateUrl: './product-list.page.html',
})
export class ProductListPage {
    /**
     * Product cards shown by the listing page before filtering and sorting.
     */
    products: Product[] = [
        {
            id: 1,
            name: 'SkyLum™ Urban Trench Coat',
            price: '$249.99',
            priceNumber: 249.99,
            rating: 4.7,
            category: 'new',
            dateAdded: new Date('2024-01-15'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-1.jpg'
        },
        {
            id: 2,
            name: 'AeroFX™ All-Weather Jacket',
            price: '$319.99',
            priceNumber: 319.99,
            rating: 4.8,
            category: 'featured',
            dateAdded: new Date('2024-01-10'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-2.jpg'
        },
        {
            id: 3,
            name: 'AeroShield™ Storm Jacket',
            price: '$279.99',
            priceNumber: 279.99,
            rating: 4.6,
            category: 'sale',
            dateAdded: new Date('2024-01-12'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-3.jpg'
        },
        {
            id: 4,
            name: 'Nukie Windrunner PrimaLoft®',
            price: '$299.99',
            priceNumber: 299.99,
            rating: 4.9,
            category: 'featured',
            dateAdded: new Date('2024-01-08'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-4.jpg'
        },
        {
            id: 5,
            name: 'BreGD™ Lightweight Jacket',
            price: '$199.99',
            priceNumber: 199.99,
            rating: 4.5,
            category: 'sale',
            dateAdded: new Date('2024-01-14'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-5.jpg'
        },
        {
            id: 6,
            name: 'FlowMotion™ Cape Jacket',
            price: '$349.99',
            priceNumber: 349.99,
            rating: 4.7,
            category: 'new',
            dateAdded: new Date('2024-01-16'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-6.jpg'
        },
        {
            id: 7,
            name: 'Windianer® (Yellow Edition)',
            price: '$269.99',
            priceNumber: 269.99,
            rating: 4.4,
            category: 'featured',
            dateAdded: new Date('2024-01-09'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-7.jpg'
        },
        {
            id: 8,
            name: 'Stratos™ Monochrome Suit',
            price: '$399.99',
            priceNumber: 399.99,
            rating: 4.8,
            category: 'new',
            dateAdded: new Date('2024-01-17'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-8.jpg'
        },
        {
            id: 9,
            name: 'PueLoft® Summer White',
            price: '$229.99',
            priceNumber: 229.99,
            rating: 4.3,
            category: 'sale',
            dateAdded: new Date('2024-01-11'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-9.jpg'
        },
        {
            id: 10,
            name: 'LuxeBreeze™ Pink Dress',
            price: '$189.99',
            priceNumber: 189.99,
            rating: 4.6,
            category: 'featured',
            dateAdded: new Date('2024-01-13'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-10.jpg'
        },
        {
            id: 11,
            name: 'StormEdge™ Midnight Coat',
            price: '$289.99',
            priceNumber: 289.99,
            rating: 4.7,
            category: 'new',
            dateAdded: new Date('2024-01-18'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-11.jpg'
        },
        {
            id: 12,
            name: 'DieCR™ Classic Blue Jacket',
            price: '$219.99',
            priceNumber: 219.99,
            rating: 4.2,
            category: 'sale',
            dateAdded: new Date('2024-01-07'),
            image: '/demo/images/ecommerce/product-list/ecommerce-productlist-12.jpg'
        }
    ];

    /**
     * Product name search query.
     */
    searchQuery = '';

    /**
     * Category value currently selected in the category filter.
     */
    selectedCategory: string | null = null;

    /**
     * Sort mode currently selected in the sort filter.
     */
    selectedSort: string | null = null;

    /**
     * Category filter options displayed above the product grid.
     */
    categories: SelectOption[] = [
        { label: 'All Products', value: null },
        { label: 'New Product', value: 'new' },
        { label: 'Sale', value: 'sale' },
        { label: 'Featured', value: 'featured' }
    ];

    /**
     * Sort options displayed above the product grid.
     */
    sortOptions: SelectOption[] = [
        { label: 'Default', value: null },
        { label: 'Price: Low to High', value: 'price_asc' },
        { label: 'Price: High to Low', value: 'price_desc' },
        { label: 'Newest First', value: 'newest' },
        { label: 'Rating: High to Low', value: 'rating' }
    ];

    /**
     * Products after applying search, category, and sort selections.
     *
     * @returns Filtered and sorted product list for the grid.
     */
    get filteredAndSortedProducts(): Product[] {
        let filtered = this.products;

        if (this.searchQuery.trim()) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter((product) => product.name.toLowerCase().includes(query));
        }

        if (this.selectedCategory) {
            filtered = filtered.filter((product) => product.category === this.selectedCategory);
        }

        if (this.selectedSort) {
            switch (this.selectedSort) {
                case 'price_asc':
                    filtered = [...filtered].sort((a, b) => a.priceNumber - b.priceNumber);
                    break;
                case 'price_desc':
                    filtered = [...filtered].sort((a, b) => b.priceNumber - a.priceNumber);
                    break;
                case 'newest':
                    filtered = [...filtered].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
                    break;
                case 'rating':
                    filtered = [...filtered].sort((a, b) => b.rating - a.rating);
                    break;
            }
        }

        return filtered;
    }

    /**
     * Returns the display label for a product category value.
     *
     * @param category - Category value stored on the product.
     * @returns Human-readable category label.
     */
    getCategoryLabel(category: string): string {
        switch (category) {
            case 'new':
                return 'New';
            case 'sale':
                return 'Sale';
            case 'featured':
                return 'Featured';
            default:
                return category;
        }
    }
}
