import { Component, OnInit, signal, computed, ViewChild, model, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { MenuItem } from 'primeng/api';
import { Card } from 'primeng/card';
import { ComposeDialog } from './compose-dialog';
import { MailService, Email } from './mail.service';

interface MenuItemData {
    label: string;
    icon: string;
    count?: number;
}

/** Mail inbox with folder filters, pagination, and compose dialog. */
@Component({
    selector: 'app-mail-inbox',
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, AvatarModule, TagModule, MenuModule, PaginatorModule, DrawerModule, InputTextModule, IconFieldModule, InputIconModule, ComposeDialog, Card],
    templateUrl: './mail-inbox.html',
})
export class MailInbox implements OnInit {
    /**
     * Row action popup menu used for the currently selected email.
     */
    @ViewChild('actionMenu') actionMenu!: Menu;

    /**
     * Bulk action popup menu used when one or more emails are selected.
     */
    @ViewChild('bulkActionMenu') bulkActionMenu!: Menu;

    private mailService = inject(MailService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    /**
     * Shared email collection loaded by the mail service.
     */
    emailsData = this.mailService.emailsData;

    /**
     * Folder navigation items loaded from the dashboard demo data.
     */
    menuItems = signal<MenuItemData[]>([]);

    /**
     * Category navigation items loaded from the dashboard demo data.
     */
    categoryItems = signal<MenuItemData[]>([]);

    /**
     * Currently selected folder label, or null when a category is active.
     */
    selectedMenuItem = signal<string | null>('Inbox');

    /**
     * Currently selected category label, or null when a folder is active.
     */
    selectedCategory = signal<string | null>(null);

    /**
     * Emails selected in the current paginated table view.
     */
    selectedEmails = model<Email[]>([]);

    /**
     * Sender-name search query applied after folder or category filtering.
     */
    searchQuery = model('');

    /**
     * Whether the compose dialog overlay is visible.
     */
    showComposeOverlay = model(false);

    /**
     * Whether the responsive folder/category drawer is visible.
     */
    showMenuDrawer = model(false);

    /**
     * First row index for the current paginator page.
     */
    first = signal(0);

    /**
     * Number of emails shown on each paginator page.
     */
    rows = signal(15);

    /**
     * Email id currently associated with the row action menu.
     */
    selectedEmailId = signal<number | null>(null);

    /**
     * Full email record currently associated with the row action menu.
     */
    selectedEmailData = signal<Email | null>(null);

    /**
     * Math namespace exposed for numeric calculations in the template.
     */
    Math = Math;

    /**
     * Loads email data, navigation metadata, and optional initial view state from the route query.
     */
    async ngOnInit() {
        await this.mailService.loadEmails();

        const response = await fetch('/demo/data/emailData.json');
        const data = await response.json();
        this.menuItems.set(data.menuItems);
        this.categoryItems.set(data.categoryItems);

        const viewFromQuery = this.route.snapshot.queryParams['view'];
        if (viewFromQuery) {
            const isMenuItem = this.menuItems().some((item) => item.label === viewFromQuery);
            const isCategoryItem = this.categoryItems().some((item) => item.label === viewFromQuery);

            if (isMenuItem) {
                this.selectedMenuItem.set(viewFromQuery);
                this.selectedCategory.set(null);
            } else if (isCategoryItem) {
                this.selectedCategory.set(viewFromQuery);
                this.selectedMenuItem.set(null);
            }
        }
    }

    // Filter functions
    /**
     * Filters active inbox mail by excluding deleted, spam, and archived messages.
     *
     * @param emailList - Source email collection to filter.
     * @returns Emails visible in the inbox folder.
     */
    getInboxEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => !email.deleted && !email.spam && !email.archived);
    }

    /**
     * Filters starred mail while excluding deleted and spam messages.
     *
     * @param emailList - Source email collection to filter.
     * @returns Starred emails that are still actionable.
     */
    getStarredEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.starred && !email.deleted && !email.spam);
    }

    /**
     * Filters important mail while excluding deleted and spam messages.
     *
     * @param emailList - Source email collection to filter.
     * @returns Important emails that are still actionable.
     */
    getImportantEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.important && !email.deleted && !email.spam);
    }

    /**
     * Filters archived mail that has not been deleted.
     *
     * @param emailList - Source email collection to filter.
     * @returns Archived emails available for restore or review.
     */
    getArchivedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.archived && !email.deleted);
    }

    /**
     * Filters spam mail that has not been deleted.
     *
     * @param emailList - Source email collection to filter.
     * @returns Spam emails available in the spam folder.
     */
    getSpamEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.spam && !email.deleted);
    }

    /**
     * Filters messages that are currently in the trash.
     *
     * @param emailList - Source email collection to filter.
     * @returns Deleted emails available for recovery.
     */
    getDeletedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.deleted);
    }

    /**
     * Filters active inbox mail by category.
     *
     * @param emailList - Source email collection to filter.
     * @param category - Category label to match.
     * @returns Non-deleted, non-spam, non-archived emails in the category.
     */
    getCategoryEmails(emailList: Email[], category: string): Email[] {
        return emailList.filter((email) => email.category === category && !email.deleted && !email.spam && !email.archived);
    }

    /**
     * Filters unread inbox mail for folder badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread emails visible in the inbox folder.
     */
    getUnreadInboxEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => !email.deleted && !email.spam && !email.archived && !email.read);
    }

    /**
     * Filters unread starred mail for folder badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread starred emails that are still actionable.
     */
    getUnreadStarredEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.starred && !email.deleted && !email.spam && !email.read);
    }

    /**
     * Filters unread important mail for folder badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread important emails that are still actionable.
     */
    getUnreadImportantEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.important && !email.deleted && !email.spam && !email.read);
    }

    /**
     * Filters unread archived mail for folder badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread archived emails available for restore or review.
     */
    getUnreadArchivedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.archived && !email.deleted && !email.read);
    }

    /**
     * Filters unread spam mail for folder badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread spam emails available in the spam folder.
     */
    getUnreadSpamEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.spam && !email.deleted && !email.read);
    }

    /**
     * Filters unread deleted mail for trash badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @returns Unread deleted emails available for recovery.
     */
    getUnreadDeletedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.deleted && !email.read);
    }

    /**
     * Filters unread active inbox mail by category for badge counts.
     *
     * @param emailList - Source email collection to filter.
     * @param category - Category label to match.
     * @returns Unread, non-deleted, non-spam, non-archived emails in the category.
     */
    getUnreadCategoryEmails(emailList: Email[], category: string): Email[] {
        return emailList.filter((email) => email.category === category && !email.deleted && !email.spam && !email.archived && !email.read);
    }

    /**
     * Emails after applying the active folder or category filter.
     */
    baseFilteredEmails = computed(() => {
        const menuItem = this.selectedMenuItem();
        const category = this.selectedCategory();

        if (menuItem) {
            switch (menuItem) {
                case 'Inbox':
                    return this.getInboxEmails(this.emailsData());
                case 'Starred':
                    return this.getStarredEmails(this.emailsData());
                case 'Important':
                    return this.getImportantEmails(this.emailsData());
                case 'Sent':
                    return [];
                case 'Archived':
                    return this.getArchivedEmails(this.emailsData());
                case 'Spam':
                    return this.getSpamEmails(this.emailsData());
                case 'Trash':
                    return this.getDeletedEmails(this.emailsData());
                default:
                    return this.getInboxEmails(this.emailsData());
            }
        } else if (category) {
            return this.getCategoryEmails(this.emailsData(), category);
        }
        return this.getInboxEmails(this.emailsData());
    });

    /**
     * Emails after applying the sender search query to the active folder or category.
     */
    filteredEmails = computed(() => {
        const emails = this.baseFilteredEmails();
        const query = this.searchQuery();
        if (!query.trim()) {
            return emails;
        }
        return emails.filter((email) => email.sender.toLowerCase().includes(query.toLowerCase().trim()));
    });

    /**
     * Current page of emails shown by the table.
     */
    paginatedEmails = computed(() => {
        const start = this.first();
        const end = start + this.rows();
        return this.filteredEmails().slice(start, end);
    });

    /**
     * Folder menu items decorated with unread counts.
     */
    menuItemsWithCounts = computed(() => {
        return this.menuItems().map((item) => ({
            ...item,
            count: this.getMenuItemCount(item.label)
        }));
    });

    /**
     * Category menu items decorated with unread counts.
     */
    categoryItemsWithCounts = computed(() => {
        return this.categoryItems().map((item) => ({
            ...item,
            count: this.getCategoryItemCount(item.label)
        }));
    });

    /**
     * Row action menu items derived from the selected email state.
     */
    actionMenuItems = computed<MenuItem[]>(() => {
        const email = this.selectedEmailData();
        const emailId = this.selectedEmailId();
        const isInTrash = email?.deleted;

        if (emailId === null) {
            return [];
        }

        if (isInTrash) {
            return [{ label: 'Recover', icon: 'pi pi-replay', command: () => this.recoverEmail(emailId) }];
        }

        return [
            { label: 'Forward', icon: 'pi pi-reply', disabled: true },
            {
                label: email?.archived ? 'Unarchive' : 'Archive',
                icon: email?.archived ? 'pi pi-replay' : 'pi pi-inbox',
                command: () => (email?.archived ? this.unarchiveEmail(emailId) : this.archiveEmail(emailId))
            },
            { label: 'Spam', icon: 'pi pi-ban', command: () => this.markAsSpam(emailId) },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.deleteEmail(emailId) }
        ];
    });

    /**
     * Bulk action menu items derived from the current selection.
     */
    bulkActionMenuItems = computed<MenuItem[]>(() => {
        const selected = this.selectedEmails();
        const hasArchivedEmails = selected.some((email) => email.archived);
        const hasNonArchivedEmails = selected.some((email) => !email.archived);
        const hasDeletedEmails = selected.some((email) => email.deleted);

        if (this.selectedMenuItem() === 'Trash' || hasDeletedEmails) {
            return [{ label: 'Recover', icon: 'pi pi-replay', command: () => this.bulkRecover() }];
        }

        const items: MenuItem[] = [
            { label: 'Mark as Read', icon: 'pi pi-eye', command: () => this.bulkMarkAsRead() },
            { label: 'Mark as Unread', icon: 'pi pi-eye-slash', command: () => this.bulkMarkAsUnread() },
            { separator: true },
            { label: 'Star', icon: 'pi pi-star', command: () => this.bulkToggleStar(true) },
            { label: 'Unstar', icon: 'pi pi-star-fill', command: () => this.bulkToggleStar(false) },
            { separator: true },
            { label: 'Mark as Important', icon: 'pi pi-bookmark', command: () => this.bulkToggleImportant(true) },
            { label: 'Mark as Not Important', icon: 'pi pi-bookmark-fill', command: () => this.bulkToggleImportant(false) },
            { separator: true }
        ];

        if (hasNonArchivedEmails) {
            items.push({ label: 'Archive', icon: 'pi pi-inbox', command: () => this.bulkArchive() });
        }
        if (hasArchivedEmails) {
            items.push({ label: 'Unarchive', icon: 'pi pi-replay', command: () => this.bulkUnarchive() });
        }
        items.push({ label: 'Mark as Spam', icon: 'pi pi-ban', command: () => this.bulkMarkAsSpam() });
        items.push({ label: 'Delete', icon: 'pi pi-trash', command: () => this.bulkDelete() });

        return items;
    });

    /**
     * Resolves the unread badge count for one folder label.
     *
     * @param label - Folder label from the mail navigation menu.
     * @returns Unread count for the folder, or zero for unsupported labels.
     */
    getMenuItemCount(label: string): number {
        switch (label) {
            case 'Inbox':
                return this.getUnreadInboxEmails(this.emailsData()).length;
            case 'Starred':
                return this.getUnreadStarredEmails(this.emailsData()).length;
            case 'Important':
                return this.getUnreadImportantEmails(this.emailsData()).length;
            case 'Sent':
                return 0;
            case 'Archived':
                return this.getUnreadArchivedEmails(this.emailsData()).length;
            case 'Spam':
                return this.getUnreadSpamEmails(this.emailsData()).length;
            case 'Trash':
                return this.getUnreadDeletedEmails(this.emailsData()).length;
            default:
                return 0;
        }
    }

    /**
     * Resolves the unread badge count for one category label.
     *
     * @param label - Category label from the mail navigation menu.
     * @returns Unread count for the category.
     */
    getCategoryItemCount(label: string): number {
        return this.getUnreadCategoryEmails(this.emailsData(), label).length;
    }

    /**
     * Builds uppercase initials for sender avatars.
     *
     * @param name - Sender display name.
     * @returns Initials derived from each word in the name.
     */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Selects a deterministic avatar color class from the sender name.
     *
     * @param name - Sender display name.
     * @returns Tailwind utility classes for the sender avatar.
     */
    getAvatarColor(name: string): string {
        const colors = ['bg-violet-100 text-violet-950', 'bg-lime-100 text-lime-950', 'bg-red-100 text-rose-950', 'bg-cyan-100 text-cyan-950', 'bg-indigo-100 text-indigo-950'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    /**
     * Updates the paginator offset when PrimeNG emits a page change.
     *
     * @param event - PrimeNG paginator state.
     */
    onPageChange(event: PaginatorState) {
        this.first.set(event.first ?? 0);
    }

    /**
     * Opens the row action menu for one email and stores its current data.
     *
     * @param event - Browser event used to anchor the popup menu.
     * @param emailId - Email id represented by the clicked row.
     */
    toggleActionMenu(event: Event, emailId: number) {
        this.selectedEmailId.set(emailId);
        this.selectedEmailData.set(this.emailsData().find((e) => e.id === emailId) ?? null);
        this.actionMenu.toggle(event);
    }

    /**
     * Opens the bulk action menu for the current table selection.
     *
     * @param event - Browser event used to anchor the popup menu.
     */
    toggleBulkActionMenu(event: Event) {
        this.bulkActionMenu.toggle(event);
    }

    /**
     * Shows the compose dialog overlay.
     */
    openCompose() {
        this.showComposeOverlay.set(true);
    }

    /**
     * Hides the compose dialog overlay.
     */
    closeCompose() {
        this.showComposeOverlay.set(false);
    }

    /**
     * Handles compose submission and closes the dialog.
     */
    sendEmail() {
        this.closeCompose();
    }

    /**
     * Marks an unread email as read and navigates to its detail route.
     *
     * @param email - Email selected from the table.
     */
    navigateToEmail(email: Email) {
        if (!email.read) {
            this.mailService.markAsRead(email.id);
        }
        const from = this.selectedMenuItem() || this.selectedCategory() || 'Inbox';
        this.router.navigate(['/apps/mail/detail', email.id], { queryParams: { from } });
    }

    /**
     * Toggles the responsive folder/category drawer.
     */
    toggleMenuDrawer() {
        this.showMenuDrawer.set(!this.showMenuDrawer());
    }

    /**
     * Selects a folder and clears any active category filter.
     *
     * @param label - Folder label to activate.
     */
    selectMenuItem(label: string) {
        this.selectedMenuItem.set(label);
        this.selectedCategory.set(null);
        this.first.set(0);
    }

    /**
     * Selects a category and clears any active folder filter.
     *
     * @param label - Category label to activate.
     */
    selectCategory(label: string) {
        this.selectedCategory.set(label);
        this.selectedMenuItem.set(null);
        this.first.set(0);
    }

    /**
     * Toggles the starred state for one email.
     *
     * @param emailId - Email id to update.
     */
    toggleStar(emailId: number) {
        this.mailService.toggleStar(emailId);
    }

    /**
     * Toggles the important state for one email.
     *
     * @param emailId - Email id to update.
     */
    toggleImportant(emailId: number) {
        this.mailService.toggleImportant(emailId);
    }

    /**
     * Moves one email to the archive.
     *
     * @param emailId - Email id to archive.
     */
    archiveEmail(emailId: number) {
        this.mailService.archiveEmail(emailId);
    }

    /**
     * Restores one archived email to active folders.
     *
     * @param emailId - Email id to unarchive.
     */
    unarchiveEmail(emailId: number) {
        this.mailService.unarchiveEmail(emailId);
    }

    /**
     * Moves one email to the spam folder.
     *
     * @param emailId - Email id to mark as spam.
     */
    markAsSpam(emailId: number) {
        this.mailService.markAsSpam(emailId);
    }

    /**
     * Moves one email to the trash.
     *
     * @param emailId - Email id to delete.
     */
    deleteEmail(emailId: number) {
        this.mailService.deleteEmail(emailId);
    }

    /**
     * Restores one email from trash.
     *
     * @param emailId - Email id to recover.
     */
    recoverEmail(emailId: number) {
        this.mailService.recoverEmail(emailId);
    }

    /**
     * Marks all selected emails as read and clears the table selection.
     */
    bulkMarkAsRead() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsRead(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Marks all selected emails as unread and clears the table selection.
     */
    bulkMarkAsUnread() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsUnread(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Sets the starred state for all selected emails and clears the table selection.
     *
     * @param starred - Desired starred state.
     */
    bulkToggleStar(starred: boolean) {
        this.selectedEmails().forEach((selected) => {
            this.mailService.updateEmail(selected.id, { starred });
        });
        this.selectedEmails.set([]);
    }

    /**
     * Sets the important state for all selected emails and clears the table selection.
     *
     * @param important - Desired important state.
     */
    bulkToggleImportant(important: boolean) {
        this.selectedEmails().forEach((selected) => {
            this.mailService.updateEmail(selected.id, { important });
        });
        this.selectedEmails.set([]);
    }

    /**
     * Archives all selected emails and clears the table selection.
     */
    bulkArchive() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.archiveEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Unarchives all selected emails and clears the table selection.
     */
    bulkUnarchive() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.unarchiveEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Marks all selected emails as spam and clears the table selection.
     */
    bulkMarkAsSpam() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsSpam(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Moves all selected emails to trash and clears the table selection.
     */
    bulkDelete() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.deleteEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Recovers all selected emails from trash and clears the table selection.
     */
    bulkRecover() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.recoverEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }
}
