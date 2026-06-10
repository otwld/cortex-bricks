import { Component, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsersService } from '@otwld/ng-users/core';
import { UserAccountStatus, UserInvitationResult, UserProfile } from '@otwld/ts-users';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { FormStateService } from '../../form-state.service';

/** Account status step of the user creation wizard. */
@Component({
    selector: 'app-account-status',
    imports: [FormsModule, ButtonModule, CheckboxModule, SelectModule, TagModule, TextareaModule],
    templateUrl: './account-status.html',
})
export class AccountStatus {
    /**
     * Whether the create-user request is currently in flight.
     */
    readonly saving = signal(false);

    /**
     * User-facing error message from validation or API failure.
     */
    readonly error = signal<string | null>(null);

    /**
     * User profile returned after a successful create request.
     */
    readonly createdUser = signal<UserProfile | null>(null);

    /**
     * Invitation result returned after creating a user.
     */
    readonly invitation = signal<UserInvitationResult | null>(null);

    /**
     * Whether the invitation link has been copied in this session.
     */
    readonly copied = signal(false);

    /**
     * Account status options shown in the final wizard step.
     */
    accountStatusOptions = [
        { label: 'Active', value: UserAccountStatus.Active },
        { label: 'Inactive', value: UserAccountStatus.Inactive },
        { label: 'Suspended', value: UserAccountStatus.Suspended },
    ];

    private readonly router = inject(Router);
    private readonly formStateService = inject(FormStateService);
    private readonly usersService = inject(UsersService);

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
     * Cancels user creation and returns to the user list.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Navigates to the user list after user creation.
     */
    goToList() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Creates the user from wizard state and stores the returned invitation data.
     */
    save() {
        if (!this.formState().email.trim()) {
            this.error.set('Email is required to create a user.');
            return;
        }

        this.saving.set(true);
        this.error.set(null);
        this.createdUser.set(null);
        this.invitation.set(null);
        this.copied.set(false);

        this.usersService.create(this.formStateService.toCreateUserRequest()).subscribe({
            next: (response) => {
                this.createdUser.set(response.user);
                this.invitation.set(response.invitation ?? this.legacyInvitation(response));
                this.formStateService.reset();
                this.saving.set(false);
            },
            error: (error) => {
                this.error.set(error?.status === 409 ? 'A user with this email already exists.' : 'Unable to create user.');
                this.saving.set(false);
            },
        });
    }

    /**
     * Copies the generated invitation link to the clipboard with a DOM fallback.
     */
    async copyInvitationLink() {
        const link = this.invitation()?.link;
        if (!link) return;

        try {
            await navigator.clipboard?.writeText(link);
        } catch {
            this.copyWithFallback(link);
        }
        this.copied.set(true);
    }

    /**
     * Opens the generated invitation link in a new tab when available.
     */
    openInvitationLink() {
        const link = this.invitation()?.link;
        if (!link) return;
        window.open(link, '_blank', 'noopener,noreferrer');
    }

    private legacyInvitation(response: { invitationLink?: string; invitationExpiresAt?: string }): UserInvitationResult | null {
        if (!response.invitationLink || !response.invitationExpiresAt) return null;
        return {
            link: response.invitationLink,
            expiresAt: response.invitationExpiresAt,
            deliveryStatus: 'not-requested',
        };
    }

    private copyWithFallback(link: string) {
        const input = document.createElement('textarea');
        input.value = link;
        input.setAttribute('readonly', 'true');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
    }
}
