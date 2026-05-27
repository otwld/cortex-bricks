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
    imports: [FormsModule, AccordionModule, ButtonModule, CheckboxModule, ChipModule, DatePickerModule, DrawerModule, EditorModule, InputTextModule, MultiSelectModule, RadioButtonModule, SelectModule],
    templateUrl: './edit.html',
})
export class Edit {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    accordionPanelPT = {
        root: {
            class: '!px-0'
        }
    };

    accordionPT = { root: { class: 'border-0! shadow-none!' } };

    accordionHeaderPT = {
        root: { class: 'bg-transparent! border-0! p-0! py-4! shadow-none!' },
        content: { class: 'justify-start items-center w-full px-0' }
    };

    accordionContentPT = { content: { class: 'bg-transparent! border-0! p-0! pb-4!' } };

    sidebarVisible = signal(false);
    coverImage = signal<string | null>('/demo/images/cms/cms-hero-1.jpg');

    title = model('The Smartest Ways to Earn Airline Miles');
    content = model(
        'Your credit score plays a crucial role in your financial well-being, influencing your ability to secure loans, mortgages, and even rental agreements. A higher score can unlock better interest rates and financial flexibility. Understanding how to improve and maintain a strong credit score is essential for achieving financial stability. Here are five golden rules to help you boost your score effectively.'
    );
    status = model('Draft');
    visibility = model('Public');
    publishDate = model<Date | null>(new Date());
    selectedAuthors = model<Author[]>([{ name: 'Dianne Russell', image: '/demo/images/cms/avatars/avatar-dianne.jpg' }]);
    selectedCategories = model<string[]>(['Lifestyle', 'Art', 'Banking']);
    selectedTags = model<string[]>(['World', 'Space']);

    accordionValue = ['status', 'visibility', 'publish-date'];

    tagOptions: string[] = ['World', 'Space', 'Technology', 'Science', 'Nature', 'Travel', 'Art', 'Music', 'Food', 'Sports'];

    statusOptions: StatusOption[] = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Published', value: 'Published' },
        { label: 'Scheduled', value: 'Scheduled' }
    ];

    authorOptions: Author[] = [
        { name: 'Dianne Russell', image: '/demo/images/cms/avatars/avatar-dianne.jpg' },
        { name: 'Jane Smith', image: '/demo/images/cms/avatars/avatar-jane.jpg' },
        { name: 'Darrell Steward', image: '/demo/images/cms/avatars/avatar-darrell.jpg' },
        { name: 'Emma Wilson', image: '/demo/images/cms/avatars/avatar-emma.jpg' },
        { name: 'Ethan Hunt', image: '/demo/images/cms/avatars/avatar-ethan.jpg' },
        { name: 'Sophia Chen', image: '/demo/images/cms/avatars/avatar-sophia.jpg' }
    ];

    categories: string[] = ['Lifestyle', 'Sustainability', 'Culture', 'Art', 'Banking', 'Technology'];

    formattedPublishDate = computed(() => {
        const publishDate = this.publishDate();
        if (!publishDate) return 'Immediately';
        const date = new Date(publishDate);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    });

    /**
     * Runs remove cover image.
     */
    removeCoverImage() {
        this.coverImage.set(null);
    }

    /**
     * Runs trigger file upload.
     */
    triggerFileUpload() {
        this.fileInput?.nativeElement.click();
    }

    /**
     * Runs handle file upload.
     *
     * @param event - event value.
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
     * Runs remove author.
     *
     * @param event - event value.
     *
     * @param authorToRemove - author to remove value.
     */
    removeAuthor(event: Event, authorToRemove: Author) {
        event.stopPropagation();
        this.selectedAuthors.set(this.selectedAuthors().filter((author) => author.name !== authorToRemove.name));
    }
}
