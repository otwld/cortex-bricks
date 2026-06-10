import { Injectable, signal } from '@angular/core';

/**
 * Describes thread message values.
 */
export interface ThreadMessage {
    id: number;
    sender: string;
    email: string;
    avatar?: string;
    time: string;
    content?: string;
}

/**
 * Describes email values.
 */
export interface Email {
    id: number;
    sender: string;
    email: string;
    avatar?: string;
    subject: string;
    preview: string;
    time: string;
    tag?: string;
    read: boolean;
    starred: boolean;
    important: boolean;
    archived: boolean;
    spam: boolean;
    deleted: boolean;
    category?: string;
    thread?: ThreadMessage[];
    fullContent?: string;
}

/**
 * Loads demo mail data and applies local message state changes for mail pages.
 */
@Injectable({
    providedIn: 'root'
})
export class MailService {
    private _emailsData = signal<Email[]>([]);
    private _loaded = signal(false);

    /**
     * Readonly email collection consumed by inbox and detail views.
     */
    emailsData = this._emailsData.asReadonly();

    /**
     * Whether demo email data has already been fetched.
     */
    loaded = this._loaded.asReadonly();

    /**
     * Loads demo email data once and caches it in service state.
     */
    async loadEmails() {
        if (this._loaded()) return;

        const response = await fetch('/demo/data/emailData.json');
        const data = await response.json();
        this._emailsData.set(data.emails);
        this._loaded.set(true);
    }

    /**
     * Finds one email in the cached collection.
     *
     * @param id - Email id to look up.
     * @returns Matching email, or null when it is not loaded.
     */
    getEmailById(id: number): Email | null {
        return this._emailsData().find((email) => email.id === id) ?? null;
    }

    /**
     * Merges partial state into one cached email record.
     *
     * @param id - Email id to update.
     * @param updates - Partial email fields to merge.
     */
    updateEmail(id: number, updates: Partial<Email>) {
        const emails = this._emailsData();
        const emailIndex = emails.findIndex((e) => e.id === id);
        if (emailIndex !== -1) {
            emails[emailIndex] = { ...emails[emailIndex], ...updates };
            this._emailsData.set([...emails]);
        }
    }

    /**
     * Marks one email as read.
     *
     * @param id - Email id to update.
     */
    markAsRead(id: number) {
        this.updateEmail(id, { read: true });
    }

    /**
     * Marks one email as unread.
     *
     * @param id - Email id to update.
     */
    markAsUnread(id: number) {
        this.updateEmail(id, { read: false });
    }

    /**
     * Toggles the starred state for one email.
     *
     * @param id - Email id to update.
     */
    toggleStar(id: number) {
        const email = this.getEmailById(id);
        if (email) {
            this.updateEmail(id, { starred: !email.starred });
        }
    }

    /**
     * Toggles the important state for one email.
     *
     * @param id - Email id to update.
     */
    toggleImportant(id: number) {
        const email = this.getEmailById(id);
        if (email) {
            this.updateEmail(id, { important: !email.important });
        }
    }

    /**
     * Marks one email as archived.
     *
     * @param id - Email id to update.
     */
    archiveEmail(id: number) {
        this.updateEmail(id, { archived: true });
    }

    /**
     * Removes the archived state from one email.
     *
     * @param id - Email id to update.
     */
    unarchiveEmail(id: number) {
        this.updateEmail(id, { archived: false });
    }

    /**
     * Marks one email as spam.
     *
     * @param id - Email id to update.
     */
    markAsSpam(id: number) {
        this.updateEmail(id, { spam: true });
    }

    /**
     * Moves one email to trash.
     *
     * @param id - Email id to update.
     */
    deleteEmail(id: number) {
        this.updateEmail(id, { deleted: true });
    }

    /**
     * Recovers one email from trash or spam.
     *
     * @param id - Email id to update.
     */
    recoverEmail(id: number) {
        this.updateEmail(id, { deleted: false, spam: false });
    }
}
