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
    imports: [CommonModule, FormsModule, ButtonModule, TableModule, AvatarModule, TagModule, MenuModule, PaginatorModule, DrawerModule, InputTextModule, IconFieldModule, InputIconModule, ComposeDialog],
    templateUrl: './mail-inbox.html',
})
export class MailInbox implements OnInit {
    @ViewChild('actionMenu') actionMenu!: Menu;
    @ViewChild('bulkActionMenu') bulkActionMenu!: Menu;

    private mailService = inject(MailService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    emailsData = this.mailService.emailsData;
    menuItems = signal<MenuItemData[]>([]);
    categoryItems = signal<MenuItemData[]>([]);
    selectedMenuItem = signal<string | null>('Inbox');
    selectedCategory = signal<string | null>(null);

    selectedEmails = model<Email[]>([]);
    searchQuery = model('');
    showComposeOverlay = model(false);
    showMenuDrawer = model(false);
    first = signal(0);
    rows = signal(15);
    selectedEmailId = signal<number | null>(null);
    selectedEmailData = signal<Email | null>(null);

    Math = Math;

    /**
     * Runs ng on init.
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
     * Runs get inbox emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get inbox emails result.
     */
    getInboxEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => !email.deleted && !email.spam && !email.archived);
    }

    /**
     * Runs get starred emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get starred emails result.
     */
    getStarredEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.starred && !email.deleted && !email.spam);
    }

    /**
     * Runs get important emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get important emails result.
     */
    getImportantEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.important && !email.deleted && !email.spam);
    }

    /**
     * Runs get archived emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get archived emails result.
     */
    getArchivedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.archived && !email.deleted);
    }

    /**
     * Runs get spam emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get spam emails result.
     */
    getSpamEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.spam && !email.deleted);
    }

    /**
     * Runs get deleted emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get deleted emails result.
     */
    getDeletedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.deleted);
    }

    /**
     * Runs get category emails.
     *
     * @param emailList - email list value.
     *
     * @param category - category value.
     *
     * @returns The mail inbox get category emails result.
     */
    getCategoryEmails(emailList: Email[], category: string): Email[] {
        return emailList.filter((email) => email.category === category && !email.deleted && !email.spam && !email.archived);
    }

    /**
     * Runs get unread inbox emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread inbox emails result.
     */
    getUnreadInboxEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => !email.deleted && !email.spam && !email.archived && !email.read);
    }

    /**
     * Runs get unread starred emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread starred emails result.
     */
    getUnreadStarredEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.starred && !email.deleted && !email.spam && !email.read);
    }

    /**
     * Runs get unread important emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread important emails result.
     */
    getUnreadImportantEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.important && !email.deleted && !email.spam && !email.read);
    }

    /**
     * Runs get unread archived emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread archived emails result.
     */
    getUnreadArchivedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.archived && !email.deleted && !email.read);
    }

    /**
     * Runs get unread spam emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread spam emails result.
     */
    getUnreadSpamEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.spam && !email.deleted && !email.read);
    }

    /**
     * Runs get unread deleted emails.
     *
     * @param emailList - email list value.
     *
     * @returns The mail inbox get unread deleted emails result.
     */
    getUnreadDeletedEmails(emailList: Email[]): Email[] {
        return emailList.filter((email) => email.deleted && !email.read);
    }

    /**
     * Runs get unread category emails.
     *
     * @param emailList - email list value.
     *
     * @param category - category value.
     *
     * @returns The mail inbox get unread category emails result.
     */
    getUnreadCategoryEmails(emailList: Email[], category: string): Email[] {
        return emailList.filter((email) => email.category === category && !email.deleted && !email.spam && !email.archived && !email.read);
    }

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

    filteredEmails = computed(() => {
        const emails = this.baseFilteredEmails();
        const query = this.searchQuery();
        if (!query.trim()) {
            return emails;
        }
        return emails.filter((email) => email.sender.toLowerCase().includes(query.toLowerCase().trim()));
    });

    paginatedEmails = computed(() => {
        const start = this.first();
        const end = start + this.rows();
        return this.filteredEmails().slice(start, end);
    });

    menuItemsWithCounts = computed(() => {
        return this.menuItems().map((item) => ({
            ...item,
            count: this.getMenuItemCount(item.label)
        }));
    });

    categoryItemsWithCounts = computed(() => {
        return this.categoryItems().map((item) => ({
            ...item,
            count: this.getCategoryItemCount(item.label)
        }));
    });

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
     * Runs get menu item count.
     *
     * @param label - label value.
     *
     * @returns The mail inbox get menu item count result.
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
     * Runs get category item count.
     *
     * @param label - label value.
     *
     * @returns The mail inbox get category item count result.
     */
    getCategoryItemCount(label: string): number {
        return this.getUnreadCategoryEmails(this.emailsData(), label).length;
    }

    /**
     * Runs get avatar initials.
     *
     * @param name - name value.
     *
     * @returns The mail inbox get avatar initials result.
     */
    getAvatarInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    }

    /**
     * Runs get avatar color.
     *
     * @param name - name value.
     *
     * @returns The mail inbox get avatar color result.
     */
    getAvatarColor(name: string): string {
        const colors = ['bg-violet-100 text-violet-950', 'bg-lime-100 text-lime-950', 'bg-red-100 text-rose-950', 'bg-cyan-100 text-cyan-950', 'bg-indigo-100 text-indigo-950'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    /**
     * Runs on page change.
     *
     * @param event - event value.
     */
    onPageChange(event: PaginatorState) {
        this.first.set(event.first ?? 0);
    }

    /**
     * Runs toggle action menu.
     *
     * @param event - event value.
     *
     * @param emailId - email id value.
     */
    toggleActionMenu(event: Event, emailId: number) {
        this.selectedEmailId.set(emailId);
        this.selectedEmailData.set(this.emailsData().find((e) => e.id === emailId) ?? null);
        this.actionMenu.toggle(event);
    }

    /**
     * Runs toggle bulk action menu.
     *
     * @param event - event value.
     */
    toggleBulkActionMenu(event: Event) {
        this.bulkActionMenu.toggle(event);
    }

    /**
     * Runs open compose.
     */
    openCompose() {
        this.showComposeOverlay.set(true);
    }

    /**
     * Runs close compose.
     */
    closeCompose() {
        this.showComposeOverlay.set(false);
    }

    /**
     * Runs send email.
     */
    sendEmail() {
        this.closeCompose();
    }

    /**
     * Runs navigate to email.
     *
     * @param email - email value.
     */
    navigateToEmail(email: Email) {
        if (!email.read) {
            this.mailService.markAsRead(email.id);
        }
        const from = this.selectedMenuItem() || this.selectedCategory() || 'Inbox';
        this.router.navigate(['/apps/mail/detail', email.id], { queryParams: { from } });
    }

    /**
     * Runs toggle menu drawer.
     */
    toggleMenuDrawer() {
        this.showMenuDrawer.set(!this.showMenuDrawer());
    }

    /**
     * Runs select menu item.
     *
     * @param label - label value.
     */
    selectMenuItem(label: string) {
        this.selectedMenuItem.set(label);
        this.selectedCategory.set(null);
        this.first.set(0);
    }

    /**
     * Runs select category.
     *
     * @param label - label value.
     */
    selectCategory(label: string) {
        this.selectedCategory.set(label);
        this.selectedMenuItem.set(null);
        this.first.set(0);
    }

    /**
     * Runs toggle star.
     *
     * @param emailId - email id value.
     */
    toggleStar(emailId: number) {
        this.mailService.toggleStar(emailId);
    }

    /**
     * Runs toggle important.
     *
     * @param emailId - email id value.
     */
    toggleImportant(emailId: number) {
        this.mailService.toggleImportant(emailId);
    }

    /**
     * Runs archive email.
     *
     * @param emailId - email id value.
     */
    archiveEmail(emailId: number) {
        this.mailService.archiveEmail(emailId);
    }

    /**
     * Runs unarchive email.
     *
     * @param emailId - email id value.
     */
    unarchiveEmail(emailId: number) {
        this.mailService.unarchiveEmail(emailId);
    }

    /**
     * Runs mark as spam.
     *
     * @param emailId - email id value.
     */
    markAsSpam(emailId: number) {
        this.mailService.markAsSpam(emailId);
    }

    /**
     * Runs delete email.
     *
     * @param emailId - email id value.
     */
    deleteEmail(emailId: number) {
        this.mailService.deleteEmail(emailId);
    }

    /**
     * Runs recover email.
     *
     * @param emailId - email id value.
     */
    recoverEmail(emailId: number) {
        this.mailService.recoverEmail(emailId);
    }

    /**
     * Runs bulk mark as read.
     */
    bulkMarkAsRead() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsRead(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk mark as unread.
     */
    bulkMarkAsUnread() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsUnread(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk toggle star.
     *
     * @param starred - starred value.
     */
    bulkToggleStar(starred: boolean) {
        this.selectedEmails().forEach((selected) => {
            this.mailService.updateEmail(selected.id, { starred });
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk toggle important.
     *
     * @param important - important value.
     */
    bulkToggleImportant(important: boolean) {
        this.selectedEmails().forEach((selected) => {
            this.mailService.updateEmail(selected.id, { important });
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk archive.
     */
    bulkArchive() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.archiveEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk unarchive.
     */
    bulkUnarchive() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.unarchiveEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk mark as spam.
     */
    bulkMarkAsSpam() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.markAsSpam(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk delete.
     */
    bulkDelete() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.deleteEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }

    /**
     * Runs bulk recover.
     */
    bulkRecover() {
        this.selectedEmails().forEach((selected) => {
            this.mailService.recoverEmail(selected.id);
        });
        this.selectedEmails.set([]);
    }
}
