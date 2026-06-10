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
     * Whether the compose dialog is visible.
     */
    @Input() visible = false;

    /**
     * Initial recipient, subject, and message values copied into the form.
     */
    @Input() initialData: ComposeData = { to: '', subject: '', message: '' };

    /**
     * Emits dialog visibility changes for two-way binding.
     */
    @Output() visibleChange = new EventEmitter<boolean>();

    /**
     * Emits the composed email payload when the user sends.
     */
    @Output() send = new EventEmitter<ComposeData>();

    /**
     * Emits when the dialog closes without requiring a send.
     */
    @Output() closed = new EventEmitter<void>();

    /**
     * Mutable compose form data shown inside the dialog.
     */
    composeData: ComposeData = { to: '', subject: '', message: '' };

    /**
     * Copies input data into the mutable compose form whenever inputs change.
     */
    ngOnChanges() {
        this.composeData = {
            to: this.initialData.to || '',
            subject: this.initialData.subject || '',
            message: this.initialData.message || ''
        };
    }

    /**
     * Closes the dialog and emits the corresponding close events.
     */
    closeCompose() {
        this.closed.emit();
        this.visible = false;
        this.visibleChange.emit(false);
    }

    /**
     * Emits a copy of the compose form data and closes the dialog.
     */
    sendEmail() {
        this.send.emit({ ...this.composeData });
        this.closeCompose();
    }

    /**
     * Handles the PrimeNG dialog hide event by closing the compose flow.
     */
    onHide() {
        this.closeCompose();
    }
}
