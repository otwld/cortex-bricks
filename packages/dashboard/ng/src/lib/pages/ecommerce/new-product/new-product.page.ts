import { Component, computed, ElementRef, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { Menu } from 'primeng/menu';
import { NgClass } from '@angular/common';

interface Product {
    name: string;
    code: string;
    category: string | null;
    brand: string;
    gender: string;
    price: string;
    sizes: string[];
    cargoCompany: string[] | null;
}

interface SelectOption {
    label: string;
    value: string;
}

interface Size {
    label: string;
}

interface ColorOption {
    name: string;
    value: string;
    class: string;
}

/** E-commerce new product editor page. */
@Component({
    selector: 'app-new-product-page',
    imports: [NgClass, FormsModule, ButtonModule, DividerModule, IconFieldModule, InputGroupModule, InputGroupAddonModule, InputIconModule, InputTextModule, MenuModule, MultiSelectModule, RadioButtonModule, SelectModule],
    templateUrl: './new-product.page.html',
})
export class NewProductPage {
    @ViewChild('colorMenu') colorMenu!: Menu;
    @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;
    @ViewChild('image1Input') image1Input!: ElementRef<HTMLInputElement>;
    @ViewChild('image2Input') image2Input!: ElementRef<HTMLInputElement>;
    @ViewChild('image3Input') image3Input!: ElementRef<HTMLInputElement>;

    product: Product = {
        name: '',
        code: '158692',
        category: null,
        brand: '',
        gender: 'women',
        price: '',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        cargoCompany: null
    };

    categories: SelectOption[] = [
        { label: 'Jackets', value: 'jackets' },
        { label: 'Coats', value: 'coats' },
        { label: 'Dresses', value: 'dresses' },
        { label: 'Suits', value: 'suits' }
    ];

    cargoCompanies: SelectOption[] = [
        { label: 'FedEx', value: 'fedex' },
        { label: 'DHL', value: 'dhl' },
        { label: 'UPS', value: 'ups' },
        { label: 'USPS', value: 'usps' }
    ];

    sizes: Size[] = [{ label: 'XS' }, { label: 'S' }, { label: 'M' }, { label: 'L' }, { label: 'XL' }, { label: 'XXL' }];

    selectedSizes = signal<string[]>([]);
    selectedColors = signal<string[]>(['blue', 'red']);
    coverImage = signal<string | null>(null);
    additionalImages = signal<(string | null)[]>([null, null, null]);

    colorOptions: ColorOption[] = [
        { name: 'Red', value: 'red', class: 'bg-red-500' },
        { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
        { name: 'Green', value: 'green', class: 'bg-green-500' },
        { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
        { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
        { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
        { name: 'Indigo', value: 'indigo', class: 'bg-indigo-500' },
        { name: 'Gray', value: 'gray', class: 'bg-gray-500' },
        { name: 'Black', value: 'black', class: 'bg-black' },
        { name: 'White', value: 'white', class: 'bg-white border border-gray-300' }
    ];

    menuItems = computed(() =>
        this.colorOptions
            .filter((color) => !this.selectedColors().includes(color.value))
            .map((color) => ({
                label: color.name,
                command: () => this.addColor(color.value)
            }))
    );

    /**
     * Runs trigger file upload.
     *
     * @param type - type value.
     */
    triggerFileUpload(type: string) {
        switch (type) {
            case 'cover':
                this.coverInput?.nativeElement.click();
                break;
            case 'image1':
                this.image1Input?.nativeElement.click();
                break;
            case 'image2':
                this.image2Input?.nativeElement.click();
                break;
            case 'image3':
                this.image3Input?.nativeElement.click();
                break;
        }
    }

    /**
     * Runs handle cover upload.
     *
     * @param event - event value.
     */
    handleCoverUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.coverImage.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        input.value = '';
    }

    /**
     * Runs handle image upload.
     *
     * @param event - event value.
     *
     * @param index - index value.
     */
    handleImageUpload(event: Event, index: number) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const images = [...this.additionalImages()];
                images[index] = e.target?.result as string;
                this.additionalImages.set(images);
            };
            reader.readAsDataURL(file);
        }
        input.value = '';
    }

    /**
     * Runs toggle size.
     *
     * @param sizeLabel - size label value.
     */
    toggleSize(sizeLabel: string) {
        const sizes = [...this.selectedSizes()];
        const index = sizes.indexOf(sizeLabel);
        if (index > -1) {
            sizes.splice(index, 1);
        } else {
            sizes.push(sizeLabel);
        }
        this.selectedSizes.set(sizes);
    }

    /**
     * Runs add color.
     *
     * @param colorValue - color value value.
     */
    addColor(colorValue: string) {
        if (!this.selectedColors().includes(colorValue)) {
            this.selectedColors.set([...this.selectedColors(), colorValue]);
        }
    }

    /**
     * Runs remove color.
     *
     * @param colorValue - color value value.
     */
    removeColor(colorValue: string) {
        this.selectedColors.set(this.selectedColors().filter((c) => c !== colorValue));
    }

    /**
     * Runs show color menu.
     *
     * @param event - event value.
     */
    showColorMenu(event: Event) {
        this.colorMenu.toggle(event);
    }

    /**
     * Runs get color class.
     *
     * @param colorValue - color value value.
     *
     * @returns The new product page get color class result.
     */
    getColorClass(colorValue: string): string {
        const color = this.colorOptions.find((c) => c.value === colorValue);
        return color ? color.class : 'bg-gray-500';
    }

    /**
     * Runs remove cover image.
     *
     * @param event - event value.
     */
    removeCoverImage(event: Event) {
        event.stopPropagation();
        this.coverImage.set(null);
    }

    /**
     * Runs remove additional image.
     *
     * @param event - event value.
     *
     * @param index - index value.
     */
    removeAdditionalImage(event: Event, index: number) {
        event.stopPropagation();
        const images = [...this.additionalImages()];
        images[index] = null;
        this.additionalImages.set(images);
    }

    /**
     * Runs add product.
     */
    addProduct() {
        // Implementation for adding product
    }
}
