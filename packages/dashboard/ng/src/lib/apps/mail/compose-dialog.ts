import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { AvatarModule } from 'primeng/avatar';

interface ComposeData {
    to: string;
    subject: string;
    message: string;
}

/** Mail compose dialog. */
@Component({
    selector: 'app-compose-dialog',
    imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, TextareaModule, AvatarModule],
    templateUrl: './compose-dialog.html',
})
export class ComposeDialog implements OnChanges {
    /**
     * Runs visible.
     */
    @Input() visible = false;
    /**
     * Runs initial data.
     */
    @Input() initialData: ComposeData = { to: '', subject: '', message: '' };
    /**
     * Runs visible change.
     */
    @Output() visibleChange = new EventEmitter<boolean>();
    /**
     * Runs send.
     */
    @Output() send = new EventEmitter<ComposeData>();
    /**
     * Runs closed.
     */
    @Output() closed = new EventEmitter<void>();

    composeData: ComposeData = { to: '', subject: '', message: '' };

    /**
     * Runs ng on changes.
     */
    ngOnChanges() {
        this.composeData = {
            to: this.initialData.to || '',
            subject: this.initialData.subject || '',
            message: this.initialData.message || ''
        };
    }

    /**
     * Runs close compose.
     */
    closeCompose() {
        this.closed.emit();
        this.visible = false;
        this.visibleChange.emit(false);
    }

    /**
     * Runs send email.
     */
    sendEmail() {
        this.send.emit({ ...this.composeData });
        this.closeCompose();
    }

    /**
     * Runs on hide.
     */
    onHide() {
        this.closeCompose();
    }
}
