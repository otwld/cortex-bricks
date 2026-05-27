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
    readonly avatarMaxSize = 1_000_000;
    readonly uploadStatus = UploadStatus;
    readonly avatarTask = signal<UploadTask | null>(null);
    readonly avatarUploadError = signal<string | null>(null);
    readonly avatarUploading = computed(() => {
        const task = this.avatarTask();
        return task?.status() === UploadStatus.Pending || task?.status() === UploadStatus.Active;
    });

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
     * Runs form state.
     *
     * @returns The basic information form state result.
     */
    get formState() {
        return this.formStateService.formState;
    }

    /**
     * Runs update field.
     *
     * @param field - field value.
     *
     * @param value - value value.
     */
    updateField<K extends keyof ReturnType<typeof this.formState>>(field: K, value: ReturnType<typeof this.formState>[K]) {
        this.formStateService.updateField(field, value);
    }

    /**
     * Runs upload avatar.
     *
     * @param event - event value.
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
     * Runs clear avatar.
     */
    clearAvatar() {
        this.avatarUploadEffect?.destroy();
        this.avatarTask.set(null);
        this.avatarUploadError.set(null);
        this.updateField('avatar', '');
    }

    /**
     * Runs is storage avatar.
     *
     * @param value - value value.
     *
     * @returns The basic information is storage avatar result.
     */
    isStorageAvatar(value: string | undefined | null): boolean {
        return Boolean(value && !/^(https?:|data:|blob:|\/)/i.test(value));
    }

    /**
     * Runs cancel.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Runs next.
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
