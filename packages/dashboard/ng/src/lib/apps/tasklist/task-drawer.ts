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
     * Runs visible.
     */
    @Input() visible = false;
    /**
     * Runs task.
     */
    @Input() task: Task | null = null;
    /**
     * Runs mode.
     */
    @Input() mode: 'create' | 'edit' = 'create';
    /**
     * Runs visible change.
     */
    @Output() visibleChange = new EventEmitter<boolean>();
    /**
     * Runs save.
     */
    @Output() save = new EventEmitter<Task>();
    /**
     * Runs cancelled.
     */
    @Output() cancelled = new EventEmitter<void>();

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

    statusOptions: StatusOption[] = [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' }
    ];

    filteredMembers: Member[] = [];

    availableMembers: Member[] = [
        { name: 'Amy Elsner', image: 'amyelsner.png' },
        { name: 'Anna Fali', image: 'annafali.png' },
        { name: 'Asiya Javayant', image: 'asiyajavayant.png' },
        { name: 'Bernardo Dominic', image: 'bernardodominic.png' }
    ];

    /**
     * Runs drawer title.
     *
     * @returns The task drawer drawer title result.
     */
    get drawerTitle(): string {
        return this.mode === 'create' ? 'Create New Task' : 'Edit Task';
    }

    /**
     * Runs ng on changes.
     *
     * @param changes - changes value.
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
     * Runs parse date.
     *
     * @param dateStr - date str value.
     *
     * @returns The task drawer parse date result.
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
     * Runs reset form.
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
     * Runs filter members.
     *
     * @param event - event value.
     */
    filterMembers(event: AutoCompleteCompleteEvent) {
        if (!event.query) {
            this.filteredMembers = this.availableMembers;
            return;
        }

        this.filteredMembers = this.availableMembers.filter((member) => member.name?.toLowerCase().includes(event.query.toLowerCase()));
    }

    /**
     * Runs format date for save.
     *
     * @param date - date value.
     *
     * @returns The task drawer format date for save result.
     */
    formatDateForSave(date: Date | null): string | null {
        if (!date) return null;
        const d = new Date(date);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    }

    /**
     * Runs handle save.
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
     * Runs handle cancel.
     */
    handleCancel() {
        this.resetForm();
        this.cancelled.emit();
        this.visible = false;
        this.visibleChange.emit(false);
    }

    /**
     * Runs on hide.
     */
    onHide() {
        this.handleCancel();
    }
}
