import { Component, inject, computed, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { AvatarGroupModule } from 'primeng/avatargroup';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TaskDrawer } from './task-drawer';

interface Member {
    name?: string;
    image: string;
}

interface Task {
    id: number;
    title: string;
    description: string | null;
    status: string;
    completed: boolean;
    startDate: string | null;
    endDate: string | null;
    members: Member[];
}

type TaskSaveData = Omit<Task, 'id'> & { id: number | null };

/** Task list application with filters, grouped task sections, and editor drawer. */
@Component({
    selector: 'app-tasklist',
    imports: [CommonModule, FormsModule, ButtonModule, CheckboxModule, InputTextModule, IconFieldModule, InputIconModule, TagModule, DividerModule, AvatarModule, AvatarGroupModule, AccordionModule, ConfirmDialogModule, TaskDrawer],
    providers: [ConfirmationService],
    templateUrl: './tasklist.page.html',
})
export class TaskListPage {
    activeFilter = signal<string>('All Tasks');
    searchQuery = model<string>('');
    openPanels = ['0', '1', '2'];
    isDrawerVisible = false;
    selectedTask: Task | null = null;
    drawerMode: 'create' | 'edit' = 'create';

    filterOptions = [
        { key: 'All Tasks', label: 'All', fullLabel: 'All Tasks', icon: 'pi pi-list', countKey: 'all' as const },
        { key: 'Pending', label: 'Pending', fullLabel: 'Pending', icon: 'pi pi-inbox', countKey: 'inbox' as const },
        { key: 'In Progress', label: 'In Progress', fullLabel: 'In Progress', icon: 'pi pi-clock', countKey: 'inProgress' as const },
        { key: 'Completed', label: 'Completed', fullLabel: 'Completed', icon: 'pi pi-check-circle', countKey: 'completed' as const }
    ];

    taskData = signal<Task[]>([
        { id: 1, title: 'Design a SaaS Platform UI', description: null, status: 'pending', completed: false, startDate: '12.01.2025', endDate: '24.01.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        { id: 2, title: 'Create an E-Commerce Landing Page', description: null, status: 'pending', completed: false, startDate: '02.01.2025', endDate: '28.01.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        {
            id: 3,
            title: 'Build an Educational Website UI',
            description: 'A clean, professional and fast information access interface will be designed for an education-oriented website.',
            status: 'pending',
            completed: false,
            startDate: '02.02.2025',
            endDate: '06.02.2025',
            members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }, { image: 'asiyajavayant.png' }, { image: 'bernardodominic.png' }]
        },
        { id: 4, title: 'Develop a Tech Startup Landing Page', description: null, status: 'pending', completed: false, startDate: '12.02.2025', endDate: '27.02.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        { id: 5, title: 'Design a Healthcare Landing Page', description: null, status: 'pending', completed: false, startDate: '09.02.2025', endDate: '17.02.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        { id: 6, title: 'Create a Finance Dashboard UI', description: null, status: 'in-progress', completed: false, startDate: '15.02.2025', endDate: '28.03.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        { id: 7, title: 'Design a Fashion Landing Page', description: null, status: 'in-progress', completed: false, startDate: '12.02.2025', endDate: '19.02.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        {
            id: 8,
            title: 'Develop a Gaming Platform UI',
            description: null,
            status: 'completed',
            completed: true,
            startDate: '02.02.2025',
            endDate: '06.02.2025',
            members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }, { image: 'asiyajavayant.png' }, { image: 'bernardodominic.png' }]
        },
        { id: 9, title: 'Create a Corporate Website Landing Page', description: null, status: 'completed', completed: true, startDate: '12.02.2025', endDate: '27.02.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] },
        { id: 10, title: 'Design a Personal Blog Landing Page', description: null, status: 'completed', completed: true, startDate: '12.01.2025', endDate: '24.01.2025', members: [{ image: 'amyelsner.png' }, { image: 'annafali.png' }] }
    ]);

    filteredTasks = computed(() => {
        let tasks = this.taskData();

        if (this.searchQuery().trim()) {
            tasks = tasks.filter((task) => task.title.toLowerCase().includes(this.searchQuery().toLowerCase()));
        }

        switch (this.activeFilter()) {
            case 'Pending':
                return tasks.filter((task) => task.status === 'pending');
            case 'In Progress':
                return tasks.filter((task) => task.status === 'in-progress');
            case 'Completed':
                return tasks.filter((task) => task.status === 'completed');
            default:
                return tasks;
        }
    });

    taskCounts = computed(() => ({
        all: this.taskData().length,
        inbox: this.taskData().filter((task) => task.status === 'pending').length,
        inProgress: this.taskData().filter((task) => task.status === 'in-progress').length,
        completed: this.taskData().filter((task) => task.status === 'completed').length
    }));

    pendingTasks = computed(() => this.filteredTasks().filter((task) => task.status === 'pending'));
    inProgressTasks = computed(() => this.filteredTasks().filter((task) => task.status === 'in-progress'));
    completedTasks = computed(() => this.filteredTasks().filter((task) => task.status === 'completed'));
    private readonly confirmationService = inject(ConfirmationService);

    /**
     * Runs toggle task completion.
     *
     * @param task - task value.
     *
     * @param completed - completed value.
     */
    toggleTaskCompletion(task: Task, completed: boolean) {
        setTimeout(() => {
            const tasks = this.taskData();
            const taskIndex = tasks.findIndex((t) => t.id === task.id);
            if (taskIndex !== -1) {
                const updatedTask = { ...tasks[taskIndex], status: completed ? 'completed' : 'pending', completed };
                const remainingTasks = tasks.filter((t) => t.id !== task.id);
                this.taskData.set([updatedTask, ...remainingTasks]);
            }
        }, 400);
    }

    /**
     * Runs delete task.
     *
     * @param taskId - task id value.
     */
    deleteTask(taskId: number) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this task?',
            header: 'Delete Confirmation',
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
                const tasks = this.taskData().filter((task) => task.id !== taskId);
                this.taskData.set(tasks);
            }
        });
    }

    /**
     * Runs open new task drawer.
     */
    openNewTaskDrawer() {
        this.selectedTask = null;
        this.drawerMode = 'create';
        this.isDrawerVisible = true;
    }

    /**
     * Runs open edit task drawer.
     *
     * @param task - task value.
     */
    openEditTaskDrawer(task: Task) {
        this.selectedTask = task;
        this.drawerMode = 'edit';
        this.isDrawerVisible = true;
    }

    /**
     * Runs handle drawer save.
     *
     * @param newTaskData - new task data value.
     */
    handleDrawerSave(newTaskData: TaskSaveData) {
        if (this.drawerMode === 'create') {
            const tasks = this.taskData();
            const newId = Math.max(...tasks.map((t) => t.id), 0) + 1;
            const newTask: Task = {
                id: newId,
                title: newTaskData.title || '',
                description: newTaskData.description || null,
                status: newTaskData.status || 'pending',
                completed: newTaskData.completed || false,
                startDate: newTaskData.startDate || null,
                endDate: newTaskData.endDate || null,
                members: newTaskData.members || []
            };
            this.taskData.set([newTask, ...tasks]);
        } else {
            const tasks = this.taskData();
            const taskIndex = tasks.findIndex((t) => t.id === newTaskData.id);
            if (taskIndex !== -1) {
                tasks[taskIndex] = {
                    ...tasks[taskIndex],
                    ...newTaskData,
                    id: tasks[taskIndex].id
                };
                this.taskData.set([...tasks]);
            }
        }
        this.isDrawerVisible = false;
    }

    /**
     * Runs handle drawer cancel.
     */
    handleDrawerCancel() {
        this.isDrawerVisible = false;
        this.selectedTask = null;
    }
}
