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
    /**
     * Popup menu used for selecting additional product colors.
     */
    @ViewChild('colorMenu') colorMenu!: Menu;

    /**
     * Hidden native input used to upload the cover product image.
     */
    @ViewChild('coverInput') coverInput!: ElementRef<HTMLInputElement>;

    /**
     * Hidden native input used to upload the first additional product image.
     */
    @ViewChild('image1Input') image1Input!: ElementRef<HTMLInputElement>;

    /**
     * Hidden native input used to upload the second additional product image.
     */
    @ViewChild('image2Input') image2Input!: ElementRef<HTMLInputElement>;

    /**
     * Hidden native input used to upload the third additional product image.
     */
    @ViewChild('image3Input') image3Input!: ElementRef<HTMLInputElement>;

    /**
     * Draft product fields bound to the new-product form.
     */
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

    /**
     * Product category options shown in the category selector.
     */
    categories: SelectOption[] = [
        { label: 'Jackets', value: 'jackets' },
        { label: 'Coats', value: 'coats' },
        { label: 'Dresses', value: 'dresses' },
        { label: 'Suits', value: 'suits' }
    ];

    /**
     * Cargo company options shown in the shipping multiselect.
     */
    cargoCompanies: SelectOption[] = [
        { label: 'FedEx', value: 'fedex' },
        { label: 'DHL', value: 'dhl' },
        { label: 'UPS', value: 'ups' },
        { label: 'USPS', value: 'usps' }
    ];

    /**
     * Size chips available for the product variant selector.
     */
    sizes: Size[] = [{ label: 'XS' }, { label: 'S' }, { label: 'M' }, { label: 'L' }, { label: 'XL' }, { label: 'XXL' }];

    /**
     * Size labels currently selected for the product.
     */
    selectedSizes = signal<string[]>([]);

    /**
     * Color values currently selected for the product.
     */
    selectedColors = signal<string[]>(['blue', 'red']);

    /**
     * Uploaded cover image data URL shown in the main image preview.
     */
    coverImage = signal<string | null>(null);

    /**
     * Uploaded additional image data URLs shown in the three secondary slots.
     */
    additionalImages = signal<(string | null)[]>([null, null, null]);

    /**
     * Available color swatches and utility classes for product colors.
     */
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

    /**
     * Color menu items excluding colors that are already selected.
     */
    menuItems = computed(() =>
        this.colorOptions
            .filter((color) => !this.selectedColors().includes(color.value))
            .map((color) => ({
                label: color.name,
                command: () => this.addColor(color.value)
            }))
    );

    /**
     * Opens the hidden upload input for the requested image slot.
     *
     * @param type - Image slot identifier to open.
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
     * Reads an uploaded image file into the cover image preview.
     *
     * @param event - Native change event from the cover image input.
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
     * Reads an uploaded image file into one secondary image preview slot.
     *
     * @param event - Native change event from the image input.
     * @param index - Secondary image slot index to update.
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
     * Toggles one size label in the selected size list.
     *
     * @param sizeLabel - Size label to add or remove.
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
     * Adds a color value when it is not already selected.
     *
     * @param colorValue - Color value to add.
     */
    addColor(colorValue: string) {
        if (!this.selectedColors().includes(colorValue)) {
            this.selectedColors.set([...this.selectedColors(), colorValue]);
        }
    }

    /**
     * Removes a color value from the selected color list.
     *
     * @param colorValue - Color value to remove.
     */
    removeColor(colorValue: string) {
        this.selectedColors.set(this.selectedColors().filter((c) => c !== colorValue));
    }

    /**
     * Opens the color picker popup menu.
     *
     * @param event - Browser event used to anchor the popup menu.
     */
    showColorMenu(event: Event) {
        this.colorMenu.toggle(event);
    }

    /**
     * Resolves the swatch utility classes for one color value.
     *
     * @param colorValue - Color value to look up.
     * @returns CSS utility classes for the color swatch.
     */
    getColorClass(colorValue: string): string {
        const color = this.colorOptions.find((c) => c.value === colorValue);
        return color ? color.class : 'bg-gray-500';
    }

    /**
     * Clears the cover image preview without opening the upload input.
     *
     * @param event - Click event from the cover image remove button.
     */
    removeCoverImage(event: Event) {
        event.stopPropagation();
        this.coverImage.set(null);
    }

    /**
     * Clears one secondary image preview without opening the upload input.
     *
     * @param event - Click event from the image remove button.
     * @param index - Secondary image slot index to clear.
     */
    removeAdditionalImage(event: Event, index: number) {
        event.stopPropagation();
        const images = [...this.additionalImages()];
        images[index] = null;
        this.additionalImages.set(images);
    }

    /**
     * Handles the product form submit action for host integration.
     */
    addProduct() {}
}
