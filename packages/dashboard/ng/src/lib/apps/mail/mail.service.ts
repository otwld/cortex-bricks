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
 * Provides mail service behavior.
 */
@Injectable({
    providedIn: 'root'
})
export class MailService {
    private _emailsData = signal<Email[]>([]);
    private _loaded = signal(false);

    emailsData = this._emailsData.asReadonly();
    loaded = this._loaded.asReadonly();

    /**
     * Runs load emails.
     */
    async loadEmails() {
        if (this._loaded()) return;

        const response = await fetch('/demo/data/emailData.json');
        const data = await response.json();
        this._emailsData.set(data.emails);
        this._loaded.set(true);
    }

    /**
     * Runs get email by id.
     *
     * @param id - id value.
     *
     * @returns The mail service get email by id result.
     */
    getEmailById(id: number): Email | null {
        return this._emailsData().find((email) => email.id === id) ?? null;
    }

    /**
     * Runs update email.
     *
     * @param id - id value.
     *
     * @param updates - updates value.
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
     * Runs mark as read.
     *
     * @param id - id value.
     */
    markAsRead(id: number) {
        this.updateEmail(id, { read: true });
    }

    /**
     * Runs mark as unread.
     *
     * @param id - id value.
     */
    markAsUnread(id: number) {
        this.updateEmail(id, { read: false });
    }

    /**
     * Runs toggle star.
     *
     * @param id - id value.
     */
    toggleStar(id: number) {
        const email = this.getEmailById(id);
        if (email) {
            this.updateEmail(id, { starred: !email.starred });
        }
    }

    /**
     * Runs toggle important.
     *
     * @param id - id value.
     */
    toggleImportant(id: number) {
        const email = this.getEmailById(id);
        if (email) {
            this.updateEmail(id, { important: !email.important });
        }
    }

    /**
     * Runs archive email.
     *
     * @param id - id value.
     */
    archiveEmail(id: number) {
        this.updateEmail(id, { archived: true });
    }

    /**
     * Runs unarchive email.
     *
     * @param id - id value.
     */
    unarchiveEmail(id: number) {
        this.updateEmail(id, { archived: false });
    }

    /**
     * Runs mark as spam.
     *
     * @param id - id value.
     */
    markAsSpam(id: number) {
        this.updateEmail(id, { spam: true });
    }

    /**
     * Runs delete email.
     *
     * @param id - id value.
     */
    deleteEmail(id: number) {
        this.updateEmail(id, { deleted: true });
    }

    /**
     * Runs recover email.
     *
     * @param id - id value.
     */
    recoverEmail(id: number) {
        this.updateEmail(id, { deleted: false, spam: false });
    }
}
