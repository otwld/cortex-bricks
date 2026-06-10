import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { UserEmploymentType } from '@otwld/ts-users';
import { FormStateService } from '../../form-state.service';

/** Business information step of the user creation wizard. */
@Component({
    selector: 'app-business-information',
    imports: [FormsModule, ButtonModule, InputTextModule, SelectModule, SelectButtonModule, ToggleSwitchModule],
    templateUrl: './business-information.html',
})
export class BusinessInformation {
    /**
     * Department options shown in the business information step.
     */
    departmentOptions = ['Sales', 'HR', 'Marketing', 'Engineering', 'Finance'];

    /**
     * Position options shown in the business information step.
     */
    positionOptions = ['Admin', 'Manager', 'Employee'];

    /**
     * Employment type options shown in the business information step.
     */
    employmentTypeOptions: { label: string; value: UserEmploymentType }[] = [
        { label: 'Full-time', value: 'full-time' },
        { label: 'Part-time', value: 'part-time' },
        { label: 'Contractor', value: 'contractor' },
        { label: 'Intern', value: 'intern' },
        { label: 'Temporary', value: 'temporary' },
    ];

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
     * Cancels user creation and returns to the user list.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Advances to the location information step.
     */
    next() {
        this.router.navigate(['/dashboard/profile/create/location-information']);
    }
}
