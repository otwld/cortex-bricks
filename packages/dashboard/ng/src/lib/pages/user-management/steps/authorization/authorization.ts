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
    roleOptions: UserRole[] = [
        { name: 'member', permissions: [] },
        { name: 'manager', permissions: ['read:Dashboard', 'read:User'] },
        { name: 'admin', permissions: ['manage:User'] },
    ];
    permissionOptions: UserPermission[] = ['read:Dashboard', 'read:User', 'manage:User', 'read:Finance', 'use:Api'];

    private readonly router = inject(Router);
    private readonly formStateService = inject(FormStateService);

    /**
     * Runs form state.
     *
     * @returns The authorization form state result.
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
     * Runs set role.
     *
     * @param role - role value.
     */
    setRole(role: UserRole) {
        this.formStateService.updateField('roles', [role]);
    }

    /**
     * Runs is role selected.
     *
     * @param role - role value.
     *
     * @returns The authorization is role selected result.
     */
    isRoleSelected(role: UserRole): boolean {
        return this.formState().roles.some((selected) => selected.name === role.name);
    }

    /**
     * Runs has permission.
     *
     * @param permission - permission value.
     *
     * @returns The authorization has permission result.
     */
    hasPermission(permission: UserPermission): boolean {
        return this.formState().permissions.includes(permission);
    }

    /**
     * Runs set permission.
     *
     * @param permission - permission value.
     *
     * @param enabled - enabled value.
     */
    setPermission(permission: UserPermission, enabled: boolean) {
        const permissions = this.formState().permissions;
        this.formStateService.updateField('permissions', enabled ? [...new Set([...permissions, permission])] : permissions.filter((item) => item !== permission));
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
        this.router.navigate(['/dashboard/profile/create/account-status']);
    }
}
