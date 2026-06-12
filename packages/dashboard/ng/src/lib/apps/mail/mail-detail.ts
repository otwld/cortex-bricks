import { Component, OnInit, signal, computed, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { Menu } from 'primeng/menu';
import { PopoverModule } from 'primeng/popover';
import { Popover } from 'primeng/popover';
import { TextareaModule } from 'primeng/textarea';
import { MenuItem } from 'primeng/api';
import { Card } from 'primeng/card';
import { MailService } from './mail.service';

/** Mail detail view with reply composer and message actions. */
@Component({
    selector: 'app-mail-detail',
    imports: [CommonModule, FormsModule, ButtonModule, AvatarModule, MenuModule, PopoverModule, TextareaModule, Card],
    styles: [
        `
            .flip-icon-horizontal {
                transform: scaleX(-1);
            }
        `
    ],
    templateUrl: './mail-detail.html',
})
export class MailDetail implements OnInit {
    /**
     * Popup menu used for actions on the current email.
     */
    @ViewChild('actionMenu') actionMenu!: Menu;

    /**
     * Popover used to display recipient details.
     */
    @ViewChild('recipientPanel') recipientPanel!: Popover;

    private mailService = inject(MailService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    /**
     * Email id parsed from the current route.
     */
    emailId = signal<number | null>(null);

    /**
     * Mail folder or category used when navigating back to the inbox.
     */
    fromView = signal<string>('Inbox');

    /**
     * Draft reply body typed in the reply editor.
     */
    replyMessage = '';

    /**
     * Whether the inline reply editor is visible.
     */
    showReplyEditor = false;

    /**
     * Loads mail data and initializes the current email id from route state.
     */
    async ngOnInit() {
        await this.mailService.loadEmails();

        const id = this.route.snapshot.params['id'];
        this.emailId.set(parseInt(id));
        this.fromView.set(this.route.snapshot.queryParams['from'] || 'Inbox');
    }

    /**
     * Current email record resolved from the loaded mail collection.
     */
    currentEmail = computed(() => {
        const id = this.emailId();
        if (!id) return null;
        return this.mailService.getEmailById(id);
    });

    /**
     * Action menu items available for the current email state.
     */
    actionMenuItems = computed<MenuItem[]>(() => {
        const email = this.currentEmail();
        const isInTrash = email?.deleted;

        if (isInTrash) {
            return [{ label: 'Recover', icon: 'pi pi-replay', command: () => this.recoverEmail() }];
        }

        return [
            { label: 'Forward', icon: 'pi pi-reply', disabled: true },
            {
                label: email?.archived ? 'Unarchive' : 'Archive',
                icon: email?.archived ? 'pi pi-replay' : 'pi pi-inbox',
                command: () => (email?.archived ? this.unarchiveEmail() : this.archiveEmail())
            },
            { label: 'Mark as Spam', icon: 'pi pi-ban', command: () => this.markAsSpam() },
            { label: 'Delete', icon: 'pi pi-trash', command: () => this.deleteEmail() }
        ];
    });

    /**
     * Builds uppercase initials for the sender avatar fallback.
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
     * Navigates back to the inbox with the originating folder or category in query params.
     */
    goBack() {
        this.router.navigate(['/apps/mail/inbox'], { queryParams: { view: this.fromView() } });
    }

    /**
     * Toggles the inline reply editor.
     */
    toggleReply() {
        this.showReplyEditor = !this.showReplyEditor;
    }

    /**
     * Clears the draft reply and hides the editor.
     */
    sendReply() {
        this.showReplyEditor = false;
        this.replyMessage = '';
    }

    /**
     * Toggles the starred state for the current email.
     */
    toggleStar() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.toggleStar(email.id);
        }
    }

    /**
     * Toggles the important state for the current email.
     */
    toggleImportant() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.toggleImportant(email.id);
        }
    }

    /**
     * Archives the current email and returns to the inbox.
     */
    archiveEmail() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.archiveEmail(email.id);
            this.goBack();
        }
    }

    /**
     * Restores the current email from the archive.
     */
    unarchiveEmail() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.unarchiveEmail(email.id);
        }
    }

    /**
     * Moves the current email to spam and returns to the inbox.
     */
    markAsSpam() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.markAsSpam(email.id);
            this.goBack();
        }
    }

    /**
     * Moves the current email to trash and returns to the inbox.
     */
    deleteEmail() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.deleteEmail(email.id);
            this.goBack();
        }
    }

    /**
     * Recovers the current email from trash and returns to the inbox.
     */
    recoverEmail() {
        const email = this.currentEmail();
        if (email) {
            this.mailService.recoverEmail(email.id);
            this.goBack();
        }
    }

    /**
     * Opens the current email action menu.
     *
     * @param event - Browser event used to anchor the popup menu.
     */
    showActionMenu(event: Event) {
        this.actionMenu.toggle(event);
    }

    /**
     * Opens or closes the recipient detail popover.
     *
     * @param event - Browser event used to anchor the popover.
     */
    showRecipientDetails(event: Event) {
        this.recipientPanel.toggle(event);
    }
}
