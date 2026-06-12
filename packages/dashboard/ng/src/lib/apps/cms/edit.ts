import { Component, computed, ElementRef, model, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccordionModule } from 'primeng/accordion';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { DatePickerModule } from 'primeng/datepicker';
import { DrawerModule } from 'primeng/drawer';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectModule } from 'primeng/select';
import { Card } from 'primeng/card';

interface Author {
    name: string;
    image: string;
}

interface StatusOption {
    label: string;
    value: string;
}

/** CMS article editor page. */
@Component({
    selector: 'app-edit',
    imports: [FormsModule, AccordionModule, ButtonModule, CheckboxModule, ChipModule, DatePickerModule, DrawerModule, EditorModule, InputTextModule, MultiSelectModule, RadioButtonModule, SelectModule, Card],
    templateUrl: './edit.html',
})
export class Edit {
    /**
     * Hidden native file input used by the cover-image upload trigger.
     */
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    /**
     * PrimeNG pass-through styling for accordion panel spacing.
     */
    accordionPanelPT = {
        root: {
            class: '!px-0'
        }
    };

    /**
     * PrimeNG pass-through styling that removes the outer accordion frame.
     */
    accordionPT = { root: { class: 'border-0! shadow-none!' } };

    /**
     * PrimeNG pass-through styling for compact accordion section headers.
     */
    accordionHeaderPT = {
        root: { class: 'bg-transparent! border-0! p-0! py-4! shadow-none!' },
        content: { class: 'justify-start items-center w-full px-0' }
    };

    /**
     * PrimeNG pass-through styling for compact accordion section content.
     */
    accordionContentPT = { content: { class: 'bg-transparent! border-0! p-0! pb-4!' } };

    /**
     * Whether the article settings drawer is visible.
     */
    sidebarVisible = signal(false);

    /**
     * Current cover image URL or uploaded data URL shown in the editor preview.
     */
    coverImage = signal<string | null>('/demo/images/cms/cms-hero-1.jpg');

    /**
     * Editable article title shown in the page header and metadata preview.
     */
    title = model('The Smartest Ways to Earn Airline Miles');

    /**
     * Rich text article body edited through the PrimeNG editor.
     */
    content = model(
        'Your credit score plays a crucial role in your financial well-being, influencing your ability to secure loans, mortgages, and even rental agreements. A higher score can unlock better interest rates and financial flexibility. Understanding how to improve and maintain a strong credit score is essential for achieving financial stability. Here are five golden rules to help you boost your score effectively.'
    );

    /**
     * Publishing workflow state selected in the settings drawer.
     */
    status = model('Draft');

    /**
     * Audience visibility selected for the article.
     */
    visibility = model('Public');

    /**
     * Optional scheduled publish date; null means immediate publishing.
     */
    publishDate = model<Date | null>(new Date());

    /**
     * Authors currently attached to the article.
     */
    selectedAuthors = model<Author[]>([{ name: 'Dianne Russell', image: '/demo/images/cms/avatars/avatar-dianne.jpg' }]);

    /**
     * Categories currently assigned to the article.
     */
    selectedCategories = model<string[]>(['Lifestyle', 'Art', 'Banking']);

    /**
     * Tags currently assigned to the article.
     */
    selectedTags = model<string[]>(['World', 'Space']);

    /**
     * Initially expanded settings accordion sections.
     */
    accordionValue = ['status', 'visibility', 'publish-date'];

    /**
     * Tag options available in the article metadata selector.
     */
    tagOptions: string[] = ['World', 'Space', 'Technology', 'Science', 'Nature', 'Travel', 'Art', 'Music', 'Food', 'Sports'];

    /**
     * Publishing status options available to the editor.
     */
    statusOptions: StatusOption[] = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Published', value: 'Published' },
        { label: 'Scheduled', value: 'Scheduled' }
    ];

    /**
     * Author options available in the author multiselect.
     */
    authorOptions: Author[] = [
        { name: 'Dianne Russell', image: '/demo/images/cms/avatars/avatar-dianne.jpg' },
        { name: 'Jane Smith', image: '/demo/images/cms/avatars/avatar-jane.jpg' },
        { name: 'Darrell Steward', image: '/demo/images/cms/avatars/avatar-darrell.jpg' },
        { name: 'Emma Wilson', image: '/demo/images/cms/avatars/avatar-emma.jpg' },
        { name: 'Ethan Hunt', image: '/demo/images/cms/avatars/avatar-ethan.jpg' },
        { name: 'Sophia Chen', image: '/demo/images/cms/avatars/avatar-sophia.jpg' }
    ];

    /**
     * Category options available in the category selector.
     */
    categories: string[] = ['Lifestyle', 'Sustainability', 'Culture', 'Art', 'Banking', 'Technology'];

    /**
     * Human-readable publish date shown in the article settings summary.
     */
    formattedPublishDate = computed(() => {
        const publishDate = this.publishDate();
        if (!publishDate) return 'Immediately';
        const date = new Date(publishDate);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    });

    /**
     * Clears the cover image from the article draft.
     */
    removeCoverImage() {
        this.coverImage.set(null);
    }

    /**
     * Opens the hidden native file picker for cover-image uploads.
     */
    triggerFileUpload() {
        this.fileInput?.nativeElement.click();
    }

    /**
     * Reads an uploaded image file into the cover-image preview.
     *
     * @param event - Native change event from the hidden file input.
     */
    handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.coverImage.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    /**
     * Removes one selected author without toggling the surrounding multiselect.
     *
     * @param event - Click event from the author chip remove button.
     * @param authorToRemove - Author to remove from the selected list.
     */
    removeAuthor(event: Event, authorToRemove: Author) {
        event.stopPropagation();
        this.selectedAuthors.set(this.selectedAuthors().filter((author) => author.name !== authorToRemove.name));
    }
}
