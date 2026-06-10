import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { UserPermission, UserRole } from '@otwld/ts-users';
import { FormStateService } from '../../form-state.service';

/** Authorization step of the user creation wizard. */
@Component({
    selector: 'app-authorization',
    imports: [FormsModule, ButtonModule, CheckboxModule],
    templateUrl: './authorization.html',
})
export class Authorization {
    /**
     * Role presets available for the new user.
     */
    roleOptions: UserRole[] = [
        { name: 'member', permissions: [] },
        { name: 'manager', permissions: ['read:Dashboard', 'read:User'] },
        { name: 'admin', permissions: ['manage:User'] },
    ];

    /**
     * Permission options that can be assigned directly to the new user.
     */
    permissionOptions: UserPermission[] = ['read:Dashboard', 'read:User', 'manage:User', 'read:Finance', 'use:Api'];

    private readonly router = inject(Router);
    private readonly formStateService = inject(FormStateService);

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
     * Replaces the selected role list with one role preset.
     *
     * @param role - Role preset to select.
     */
    setRole(role: UserRole) {
        this.formStateService.updateField('roles', [role]);
    }

    /**
     * Checks whether a role preset is selected.
     *
     * @param role - Role preset to inspect.
     * @returns True when the role name is selected.
     */
    isRoleSelected(role: UserRole): boolean {
        return this.formState().roles.some((selected) => selected.name === role.name);
    }

    /**
     * Checks whether a direct permission is selected.
     *
     * @param permission - Permission to inspect.
     * @returns True when the permission is selected.
     */
    hasPermission(permission: UserPermission): boolean {
        return this.formState().permissions.includes(permission);
    }

    /**
     * Adds or removes one direct permission from the wizard state.
     *
     * @param permission - Permission to update.
     * @param enabled - Whether the permission should be selected.
     */
    setPermission(permission: UserPermission, enabled: boolean) {
        const permissions = this.formState().permissions;
        this.formStateService.updateField('permissions', enabled ? [...new Set([...permissions, permission])] : permissions.filter((item) => item !== permission));
    }

    /**
     * Cancels user creation and returns to the user list.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Advances to the account status step.
     */
    next() {
        this.router.navigate(['/dashboard/profile/create/account-status']);
    }
}
