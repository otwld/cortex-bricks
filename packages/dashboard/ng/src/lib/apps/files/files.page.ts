import { Component, inject, computed, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem } from 'primeng/api';

interface ActivityFeed {
    id: number;
    fileName: string;
    icon: string;
    description: string;
    author: string;
    time: string;
    dotColor: string;
    ringColor: string;
}

interface StorageData {
    id: number;
    type: string;
    count: number;
    color: string;
    shadowColor: string;
    flexValue: number;
}

interface PinnedItem {
    id: number;
    name: string;
    type: string;
    size: string;
    icon: string;
}

interface Comment {
    id: number;
    author: string;
    content: string;
    time: string;
}

interface Document {
    id: number;
    fileName: string;
    type: string;
    fileSize: string;
    size: string;
    uploadDate: string;
    editDate: string;
    owner: string;
    icon: string;
    comments: Comment[];
}

/** Files application page with storage summary, document table, and editor drawer. */
@Component({
    selector: 'app-files',
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, DrawerModule, InputTextModule, MenuModule, TagModule, TextareaModule, ConfirmDialogModule],
    providers: [ConfirmationService],
    templateUrl: './files.page.html',
})
export class FilesPage {
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

    activeFilter = signal<string>('All Files');

    filterOptions = ['All Files', 'Recently Uploaded', 'Large Files', 'Uploaded by Me'];

    showEditDrawer = false;
    editingItem: Document | null = null;
    isAddMode = false;
    editForm: Partial<Document> = {
        fileName: '',
        owner: '',
        type: '',
        fileSize: '',
        size: '',
        uploadDate: '',
        editDate: ''
    };
    newComment = '';
    rows = 5;

    activityFeed: ActivityFeed[] = [
        {
            id: 1,
            fileName: 'Diamond.pdf',
            icon: 'pi-file-pdf',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
            author: 'Olivia Martinez',
            time: 'Today, 08:00 PM',
            dotColor: 'bg-primary-500',
            ringColor: 'ring-primary-500'
        },
        {
            id: 2,
            fileName: 'Genesis.png',
            icon: 'pi-image',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
            author: 'Jessica Davis',
            time: 'Yesterday, 11:42 PM',
            dotColor: 'bg-green-500',
            ringColor: 'ring-green-500'
        },
        {
            id: 3,
            fileName: 'Avalon.esp',
            icon: 'pi-file',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
            author: 'Robert Fox',
            time: 'Dec 11, 2025',
            dotColor: 'bg-cyan-500',
            ringColor: 'ring-cyan-500'
        },
        {
            id: 4,
            fileName: 'Poseidon.zip',
            icon: 'pi-file-o',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
            author: 'Emily Johnson',
            time: 'Dec 10, 2025',
            dotColor: 'bg-yellow-500',
            ringColor: 'ring-yellow-500'
        },
        {
            id: 5,
            fileName: 'Portfolio.pdf',
            icon: 'pi-file-pdf',
            description: 'Latest updates to the client portfolio with new design mockups and specifications.',
            author: 'Sarah Wilson',
            time: 'Dec 9, 2025',
            dotColor: 'bg-purple-500',
            ringColor: 'ring-purple-500'
        },
        {
            id: 6,
            fileName: 'Database.sql',
            icon: 'pi-database',
            description: 'Database schema updates and new table structures for the project.',
            author: 'Benjamin Taylor',
            time: 'Dec 8, 2025',
            dotColor: 'bg-red-500',
            ringColor: 'ring-red-500'
        }
    ];

    storageData: StorageData[] = [
        { id: 1, type: 'PNG', count: 12762, color: 'bg-green-500', shadowColor: 'rgba(34,197,94,0.16)', flexValue: 12762 },
        { id: 2, type: 'CSS', count: 10824, color: 'bg-orange-500', shadowColor: 'rgba(249,115,22,0.16)', flexValue: 10824 },
        { id: 3, type: 'PDF', count: 8824, color: 'bg-primary-500', shadowColor: 'rgba(59,130,246,0.16)', flexValue: 8824 },
        { id: 4, type: 'DOCX', count: 7145, color: 'bg-violet-500', shadowColor: 'rgba(139,92,246,0.16)', flexValue: 7145 },
        { id: 5, type: 'EPS', count: 6802, color: 'bg-cyan-500', shadowColor: 'rgba(6,182,212,0.16)', flexValue: 6802 },
        { id: 6, type: 'ZIP', count: 5829, color: 'bg-yellow-500', shadowColor: 'rgba(234,179,8,0.16)', flexValue: 5829 },
        { id: 7, type: 'XLS', count: 5240, color: 'bg-rose-500', shadowColor: 'rgba(244,63,94,0.16)', flexValue: 5240 }
    ];

    totalFiles = computed(() => this.storageData.reduce((sum, item) => sum + item.count, 0));

    pinnedItems: PinnedItem[] = [
        { id: 1, name: 'Genesis', type: 'DOCX', size: '17.4 MB', icon: 'pi-file-word' },
        { id: 2, name: 'Avalon', type: 'XLS', size: '24 MB', icon: 'pi-file-excel' },
        { id: 3, name: 'Poseidon', type: 'EPS', size: '11.4 MB', icon: 'pi-image' },
        { id: 4, name: 'PrimeBlocks', type: 'ZIP', size: '32 MB', icon: 'pi-file-o' },
        { id: 5, name: 'PrimeOne', type: 'CSS', size: '23 MB', icon: 'pi-code' },
        { id: 6, name: 'Diamond', type: 'PDF', size: '24 MB', icon: 'pi-file-pdf' }
    ];

    documents = signal<Document[]>([
        {
            id: 1,
            fileName: 'Diamond',
            type: 'PDF',
            fileSize: '24 MB',
            size: '-',
            uploadDate: 'Jan 11, 2025',
            editDate: 'Jan 22, 2025',
            owner: 'Robert Fox',
            icon: 'pi-file-pdf',
            comments: [
                { id: 1, author: 'Olivia Martinez', content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.', time: 'Today, 08:00 PM' },
                { id: 2, author: 'Jessica Davis', content: 'Great work on this document! The formatting looks perfect.', time: 'Yesterday, 10:30 AM' }
            ]
        },
        {
            id: 2,
            fileName: 'Genesis',
            type: 'DOCX',
            fileSize: '17.4 MB',
            size: '-',
            uploadDate: 'Jan 7, 2025',
            editDate: 'Jan 14, 2025',
            owner: 'Emily Johnson',
            icon: 'pi-file-word',
            comments: [{ id: 1, author: 'Robert Fox', content: 'Please review the final draft before publishing.', time: 'Today, 02:15 PM' }]
        },
        { id: 3, fileName: 'Mountain', type: 'PNG', fileSize: '8.3 MB', size: '2880x1440', uploadDate: 'Jan 2, 2025', editDate: 'Jan 14, 2025', owner: 'David Smith', icon: 'pi-image', comments: [] },
        {
            id: 4,
            fileName: 'Avalon',
            type: 'XLS',
            fileSize: '21 MB',
            size: '-',
            uploadDate: 'Jan 1, 2025',
            editDate: 'Jan 12, 2025',
            owner: 'Jessica Davis',
            icon: 'pi-file-excel',
            comments: [{ id: 1, author: 'Benjamin Taylor', content: 'The calculations look accurate. Ready for client presentation.', time: 'Jan 12, 2025' }]
        },
        { id: 5, fileName: 'Poseidon', type: 'EPS', fileSize: '11.4 MB', size: '-', uploadDate: 'Jan 2, 2025', editDate: 'Jan 11, 2025', owner: 'Robert Fox', icon: 'pi-image', comments: [] },
        { id: 6, fileName: 'PrimeBlocks', type: 'ZIP', fileSize: '32 MB', size: '-', uploadDate: 'Jan 2, 2025', editDate: 'Jan 16, 2025', owner: 'James Anderson', icon: 'pi-file-o', comments: [] },
        { id: 7, fileName: 'PrimeOne', type: 'CSS', fileSize: '23.3 MB', size: '-', uploadDate: 'Feb 27, 2025', editDate: 'Feb 28, 2025', owner: 'Benjamin Taylor', icon: 'pi-code', comments: [] },
        { id: 8, fileName: 'Portfolio', type: 'PDF', fileSize: '15.2 MB', size: '-', uploadDate: 'Dec 28, 2024', editDate: 'Jan 5, 2025', owner: 'Robert Fox', icon: 'pi-file-pdf', comments: [] },
        { id: 9, fileName: 'Presentation', type: 'PPTX', fileSize: '45.7 MB', size: '-', uploadDate: 'Jan 15, 2025', editDate: 'Jan 20, 2025', owner: 'Sarah Wilson', icon: 'pi-file', comments: [] },
        { id: 10, fileName: 'Spreadsheet', type: 'XLS', fileSize: '6.8 MB', size: '-', uploadDate: 'Jan 18, 2025', editDate: 'Jan 25, 2025', owner: 'Robert Fox', icon: 'pi-file-excel', comments: [] },
        { id: 11, fileName: 'Logo', type: 'SVG', fileSize: '2.1 MB', size: '1024x1024', uploadDate: 'Jan 22, 2025', editDate: 'Jan 24, 2025', owner: 'Alex Brown', icon: 'pi-image', comments: [] },
        { id: 12, fileName: 'Database', type: 'SQL', fileSize: '128 MB', size: '-', uploadDate: 'Jan 5, 2025', editDate: 'Jan 26, 2025', owner: 'Robert Fox', icon: 'pi-database', comments: [] },
        { id: 13, fileName: 'Report', type: 'DOCX', fileSize: '3.2 MB', size: '-', uploadDate: 'Jan 28, 2025', editDate: 'Jan 29, 2025', owner: 'Lisa Chen', icon: 'pi-file-word', comments: [] }
    ]);

    filteredDocuments = computed(() => {
        const docs = this.documents();
        switch (this.activeFilter()) {
            case 'Recently Uploaded':
                return [...docs].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
            case 'Large Files':
                return docs.filter((doc) => parseFloat(doc.fileSize) > 20);
            case 'Uploaded by Me':
                return docs.filter((doc) => doc.owner === 'Robert Fox');
            default:
                return docs;
        }
    });

    feedMenuItems: MenuItem[] = [
        { label: 'Open', icon: 'pi pi-external-link' },
        { label: 'Share', icon: 'pi pi-share-alt' },
        { label: 'Download', icon: 'pi pi-download' },
        { label: 'Delete', icon: 'pi pi-trash' }
    ];

    pinnedMenuItems: MenuItem[] = [
        { label: 'Open', icon: 'pi pi-external-link' },
        { label: 'Unpin', icon: 'pi pi-times' },
        { label: 'Share', icon: 'pi pi-share-alt' },
        { label: 'Delete', icon: 'pi pi-trash' }
    ];

    private readonly confirmationService = inject(ConfirmationService);

    /**
     * Runs create table menu items.
     *
     * @param document - document value.
     *
     * @returns The files page create table menu items result.
     */
    createTableMenuItems(document: Document): MenuItem[] {
        return [
            { label: 'Edit', icon: 'pi pi-pencil', command: () => this.editDocument(document) },
            { label: 'Pin', icon: 'pi pi-bookmark' },
            { label: 'Share', icon: 'pi pi-share-alt' },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.confirmDeleteDocument(document) }
        ];
    }

    /**
     * Runs create comment menu items.
     *
     * @param commentId - comment id value.
     *
     * @returns The files page create comment menu items result.
     */
    createCommentMenuItems(commentId: number): MenuItem[] {
        return [
            { label: 'Edit Comment', icon: 'pi pi-pencil' },
            { label: 'Copy Text', icon: 'pi pi-copy' },
            { label: 'Report', icon: 'pi pi-flag' },
            { separator: true },
            { label: 'Remove', icon: 'pi pi-trash', command: () => this.removeComment(commentId) }
        ];
    }

    /**
     * Runs get tag severity.
     *
     * @param type - type value.
     *
     * @returns The files page get tag severity result.
     */
    getTagSeverity(type: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
        const severityMap: Record<string, 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast'> = {
            PDF: 'info',
            DOCX: 'secondary',
            PNG: 'success',
            XLS: 'warn',
            EPS: 'info',
            ZIP: 'warn',
            CSS: 'info',
            PPTX: 'secondary',
            SVG: 'success',
            SQL: 'contrast'
        };
        return severityMap[type] || 'secondary';
    }

    /**
     * Runs edit document.
     *
     * @param document - document value.
     */
    editDocument(document: Document) {
        this.editingItem = document;
        this.isAddMode = false;
        this.editForm = { ...document };
        this.showEditDrawer = true;
    }

    /**
     * Runs add document.
     */
    addDocument() {
        this.editingItem = null;
        this.isAddMode = true;
        this.editForm = {
            fileName: '',
            owner: '',
            type: '',
            fileSize: '',
            size: '',
            uploadDate: '',
            editDate: ''
        };
        this.showEditDrawer = true;
    }

    /**
     * Runs update document.
     */
    updateDocument() {
        if (this.isAddMode) {
            const docs = this.documents();
            const newId = Math.max(...docs.map((d) => d.id)) + 1;
            const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const newDoc: Document = {
                id: newId,
                fileName: this.editForm.fileName || '',
                type: this.editForm.type || '',
                fileSize: this.editForm.fileSize || '',
                size: this.editForm.size || '-',
                uploadDate: this.editForm.uploadDate || currentDate,
                editDate: this.editForm.editDate || currentDate,
                owner: this.editForm.owner || 'Robert Fox',
                icon: this.getIconByType(this.editForm.type || ''),
                comments: []
            };
            this.documents.set([newDoc, ...docs]);
        } else if (this.editingItem) {
            const editingItem = this.editingItem;
            const docs = this.documents();
            const index = docs.findIndex((d) => d.id === editingItem.id);
            if (index !== -1) {
                docs[index] = { ...docs[index], ...this.editForm } as Document;
                this.documents.set([...docs]);
            }
        }
        this.showEditDrawer = false;
    }

    /**
     * Runs add comment.
     */
    addComment() {
        if (this.newComment.trim() && this.editingItem) {
            const comment: Comment = {
                id: Date.now(),
                author: 'Robert Fox',
                content: this.newComment.trim(),
                time: 'Just now'
            };
            this.editingItem.comments.push(comment);
            this.newComment = '';
        }
    }

    /**
     * Runs remove comment.
     *
     * @param commentId - comment id value.
     */
    removeComment(commentId: number) {
        if (this.editingItem?.comments) {
            const commentIndex = this.editingItem.comments.findIndex((c) => c.id === commentId);
            if (commentIndex !== -1) {
                this.editingItem.comments.splice(commentIndex, 1);
            }
        }
    }

    /**
     * Runs get icon by type.
     *
     * @param type - type value.
     *
     * @returns The files page get icon by type result.
     */
    getIconByType(type: string): string {
        const iconMap: Record<string, string> = {
            PDF: 'pi-file-pdf',
            DOCX: 'pi-file-word',
            PNG: 'pi-image',
            JPG: 'pi-image',
            SVG: 'pi-image',
            XLS: 'pi-file-excel',
            EPS: 'pi-image',
            ZIP: 'pi-file-o',
            CSS: 'pi-code',
            PPTX: 'pi-file',
            SQL: 'pi-database'
        };
        return iconMap[type] || 'pi-file';
    }

    /**
     * Runs trigger file upload.
     */
    triggerFileUpload() {
        this.fileInput?.nativeElement?.click();
    }

    /**
     * Runs handle file upload.
     *
     * @param event - event value.
     */
    handleFileUpload(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            this.editForm.fileName = file.name.split('.')[0];
            this.editForm.type = file.name.split('.').pop()?.toUpperCase() || '';
            this.editForm.fileSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

            if (this.isAddMode) {
                if (!this.editForm.uploadDate) {
                    this.editForm.uploadDate = currentDate;
                }
                if (!this.editForm.editDate) {
                    this.editForm.editDate = currentDate;
                }
                if (!this.editForm.owner) {
                    this.editForm.owner = 'Robert Fox';
                }
                if (!this.editForm.size) {
                    this.editForm.size = '-';
                }
            }
        }
    }

    /**
     * Runs remove uploaded file.
     */
    removeUploadedFile() {
        this.editForm.fileName = '';
        this.editForm.type = '';
        this.editForm.fileSize = '';
        this.editForm.size = '';

        if (this.isAddMode) {
            this.editForm.uploadDate = '';
            this.editForm.editDate = '';
            this.editForm.owner = '';
        }

        if (this.fileInput?.nativeElement) {
            this.fileInput.nativeElement.value = '';
        }
    }

    /**
     * Runs confirm delete document.
     *
     * @param document - document value.
     */
    confirmDeleteDocument(document: Document) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${document.fileName}"? This action cannot be undone.`,
            header: 'Delete Document',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Delete',
                severity: 'danger'
            },
            accept: () => {
                this.deleteDocument(document.id);
            }
        });
    }

    /**
     * Runs delete document.
     *
     * @param documentId - document id value.
     */
    deleteDocument(documentId: number) {
        const docs = this.documents();
        const index = docs.findIndex((d) => d.id === documentId);
        if (index !== -1) {
            docs.splice(index, 1);
            this.documents.set([...docs]);
            if (this.editingItem?.id === documentId) {
                this.showEditDrawer = false;
            }
        }
    }

    /**
     * Runs confirm move to trash.
     */
    confirmMoveToTrash() {
        const editingItem = this.editingItem;
        if (!editingItem) return;

        this.confirmationService.confirm({
            message: `Are you sure you want to move "${editingItem.fileName}" to trash? This action cannot be undone.`,
            header: 'Move to Trash',
            icon: 'pi pi-info-circle',
            rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Move to Trash',
                severity: 'danger'
            },
            accept: () => {
                this.deleteDocument(editingItem.id);
            }
        });
    }
}
