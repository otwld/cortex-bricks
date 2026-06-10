import { AsyncPipe } from '@angular/common';
import { Component, EffectRef, computed, effect, inject, Injector, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UploadStatus } from '@otwld/ts-storage';
import { StorageService, StoSignedUrlPipe, UploadTask } from '@otwld/ng-storage';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { FileUploadHandlerEvent } from 'primeng/types/fileupload';
import { UserGender } from '@otwld/ts-users';
import { FormStateService } from '../../form-state.service';

/** Basic information step of the user creation wizard. */
@Component({
    selector: 'app-basic-information',
    imports: [AsyncPipe, FormsModule, ButtonModule, FileUploadModule, InputTextModule, ProgressBarModule, SelectModule, StoSignedUrlPipe, TextareaModule],
    templateUrl: './basic-information.html',
})
export class BasicInformation {
    /**
     * Maximum accepted avatar upload size in bytes.
     */
    readonly avatarMaxSize = 1_000_000;

    /**
     * Upload status enum exposed for template comparisons.
     */
    readonly uploadStatus = UploadStatus;

    /**
     * Active avatar upload task, when an upload is in progress or completed.
     */
    readonly avatarTask = signal<UploadTask | null>(null);

    /**
     * User-facing avatar upload error message.
     */
    readonly avatarUploadError = signal<string | null>(null);

    /**
     * Whether the active avatar task is pending or uploading.
     */
    readonly avatarUploading = computed(() => {
        const task = this.avatarTask();
        return task?.status() === UploadStatus.Pending || task?.status() === UploadStatus.Active;
    });

    /**
     * Gender options shown in the basic information step.
     */
    genderOptions = [
        { label: 'Female', value: UserGender.Female },
        { label: 'Male', value: UserGender.Male },
        { label: 'Non-binary', value: UserGender.NonBinary },
        { label: 'Prefer not to say', value: UserGender.PreferNotToSay },
    ];

    private readonly router = inject(Router);
    private readonly formStateService = inject(FormStateService);
    private readonly storage = inject(StorageService);
    private readonly injector = inject(Injector);
    private avatarUploadEffect?: EffectRef;

    /**
     * Shared wizard form state.
     *
     * @returns Writable signal managed by the form state service.
     */
    get formState() {
        return this.formStateService.formState;
    }

    /**
     * Updates one field in the shared wizard form state.
     *
     * @param field - Form state field to update.
     * @param value - New field value.
     */
    updateField<K extends keyof ReturnType<typeof this.formState>>(field: K, value: ReturnType<typeof this.formState>[K]) {
        this.formStateService.updateField(field, value);
    }

    /**
     * Starts an avatar image upload and syncs the completed storage key into form state.
     *
     * @param event - PrimeNG file upload event containing selected files.
     */
    uploadAvatar(event: Pick<FileUploadHandlerEvent, 'files'>) {
        const file = event.files[0];
        if (!file) return;

        this.avatarUploadEffect?.destroy();
        this.avatarUploadError.set(null);

        try {
            const task = this.storage.upload(file, {
                accept: 'image/*',
                maxSize: this.avatarMaxSize,
                metadata: {
                    source: 'dashboard-user-avatar',
                },
            });

            this.avatarTask.set(task);
            this.syncAvatarUpload(task);
            this.avatarUploadEffect = effect(() => this.syncAvatarUpload(task), { injector: this.injector });
        } catch (error) {
            this.avatarTask.set(null);
            this.avatarUploadError.set(error instanceof Error ? error.message : 'The avatar image could not be uploaded.');
        }
    }

    /**
     * Clears the avatar upload task, error state, and form avatar value.
     */
    clearAvatar() {
        this.avatarUploadEffect?.destroy();
        this.avatarTask.set(null);
        this.avatarUploadError.set(null);
        this.updateField('avatar', '');
    }

    /**
     * Determines whether an avatar value should be resolved through storage.
     *
     * @param value - Avatar URL or storage key.
     * @returns True when the value is a storage key rather than an absolute or root-relative URL.
     */
    isStorageAvatar(value: string | undefined | null): boolean {
        return Boolean(value && !/^(https?:|data:|blob:|\/)/i.test(value));
    }

    /**
     * Cancels user creation and returns to the user list.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Advances to the business information step.
     */
    next() {
        this.router.navigate(['/dashboard/profile/create/business-information']);
    }

    private syncAvatarUpload(task: UploadTask) {
        const storageFile = task.storageFile();
        if (task.status() === UploadStatus.Completed && storageFile) {
            this.updateField('avatar', storageFile.key);
            this.avatarUploadError.set(null);
            return;
        }

        const error = task.error();
        if (task.status() === UploadStatus.Failed && error) {
            this.avatarUploadError.set(error.message || 'The avatar image could not be uploaded.');
        }
    }
}
