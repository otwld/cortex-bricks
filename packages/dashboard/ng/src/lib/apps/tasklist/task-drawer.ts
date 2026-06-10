import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DividerModule } from 'primeng/divider';

interface Member {
    name?: string;
    image: string;
}

interface Task {
    id: number | null;
    title: string;
    description: string | null;
    status: string;
    completed: boolean;
    startDate: string | null;
    endDate: string | null;
    members: Member[];
}

interface FormData {
    id: number | null;
    title: string;
    description: string;
    status: string;
    completed: boolean;
    startDate: Date | null;
    endDate: Date | null;
    members: Member[];
}

interface StatusOption {
    label: string;
    value: string;
}

/** Task create and edit drawer. */
@Component({
    selector: 'app-task-drawer',
    imports: [FormsModule, ButtonModule, DrawerModule, InputTextModule, TextareaModule, SelectModule, DatePickerModule, AutoCompleteModule, DividerModule],
    templateUrl: './task-drawer.html',
})
export class TaskDrawer implements OnChanges {
    /**
     * Whether the drawer is visible.
     */
    @Input() visible = false;

    /**
     * Task loaded into the form when editing.
     */
    @Input() task: Task | null = null;

    /**
     * Drawer mode that determines create or edit copy.
     */
    @Input() mode: 'create' | 'edit' = 'create';

    /**
     * Emits drawer visibility changes for two-way binding.
     */
    @Output() visibleChange = new EventEmitter<boolean>();

    /**
     * Emits normalized task data when the drawer form is saved.
     */
    @Output() save = new EventEmitter<Task>();

    /**
     * Emits when the drawer is cancelled or hidden.
     */
    @Output() cancelled = new EventEmitter<void>();

    /**
     * Mutable drawer form state used for create and edit flows.
     */
    formData: FormData = {
        id: null,
        title: '',
        description: '',
        status: 'pending',
        completed: false,
        startDate: null,
        endDate: null,
        members: []
    };

    /**
     * Status options available in the task status selector.
     */
    statusOptions: StatusOption[] = [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' }
    ];

    /**
     * Member autocomplete results for the current query.
     */
    filteredMembers: Member[] = [];

    /**
     * Demo members available for task assignment.
     */
    availableMembers: Member[] = [
        { name: 'Amy Elsner', image: 'amyelsner.png' },
        { name: 'Anna Fali', image: 'annafali.png' },
        { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
        { name: 'Bernardo Dominic', image: 'bernardodominic.png' }
    ];

    /**
     * Title shown in the drawer header for the active mode.
     *
     * @returns Create or edit drawer title.
     */
    get drawerTitle(): string {
        return this.mode === 'create' ? 'Create New Task' : 'Edit Task';
    }

    /**
     * Synchronizes the drawer form when the selected task changes.
     *
     * @param changes - Angular input changes for the drawer.
     */
    ngOnChanges(changes: SimpleChanges) {
        if (changes['task']) {
            const newTask = changes['task'].currentValue;
            if (newTask) {
                this.formData = {
                    id: newTask.id,
                    title: newTask.title || '',
                    description: newTask.description || '',
                    status: newTask.status || 'pending',
                    completed: newTask.completed || false,
                    startDate: newTask.startDate ? this.parseDate(newTask.startDate) : null,
                    endDate: newTask.endDate ? this.parseDate(newTask.endDate) : null,
                    members: newTask.members || []
                };
            } else {
                this.resetForm();
            }
        }
    }

    /**
     * Parses a `dd.mm.yyyy` task date into a Date instance.
     *
     * @param dateStr - Date string stored on task records.
     * @returns Parsed Date, or null when the value is empty or malformed.
     */
    parseDate(dateStr: string): Date | null {
        if (!dateStr) return null;
        const parts = dateStr.split('.');
        if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    }

    /**
     * Resets the drawer form to a new pending task draft.
     */
    resetForm() {
        this.formData = {
            id: null,
            title: '',
            description: '',
            status: 'pending',
            completed: false,
            startDate: null,
            endDate: null,
            members: []
        };
    }

    /**
     * Filters available members for the autocomplete query.
     *
     * @param event - PrimeNG autocomplete event containing the query.
     */
    filterMembers(event: AutoCompleteCompleteEvent) {
        if (!event.query) {
            this.filteredMembers = this.availableMembers;
            return;
        }

        this.filteredMembers = this.availableMembers.filter((member) => member.name?.toLowerCase().includes(event.query.toLowerCase()));
    }

    /**
     * Formats a Date for storage on task records.
     *
     * @param date - Date value selected in the drawer.
     * @returns `dd.mm.yyyy` string, or null when no date is selected.
     */
    formatDateForSave(date: Date | null): string | null {
        if (!date) return null;
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    }

    /**
     * Emits normalized task data and closes the drawer.
     */
    handleSave() {
        const taskData: Task = {
            id: this.formData.id,
            title: this.formData.title,
            description: this.formData.description || null,
            status: this.formData.status,
            completed: this.formData.status === 'completed',
            startDate: this.formatDateForSave(this.formData.startDate),
            endDate: this.formatDateForSave(this.formData.endDate),
            members: this.formData.members
        };

        this.save.emit(taskData);
        this.handleCancel();
    }

    /**
     * Resets form state and closes the drawer without saving.
     */
    handleCancel() {
        this.resetForm();
        this.cancelled.emit();
        this.visible = false;
        this.visibleChange.emit(false);
    }

    /**
     * Handles the drawer hide event by cancelling the current edit flow.
     */
    onHide() {
        this.handleCancel();
    }
}
