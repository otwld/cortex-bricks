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
    departmentOptions = ['Sales', 'HR', 'Marketing', 'Engineering', 'Finance'];

    positionOptions = ['Admin', 'Manager', 'Employee'];
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
     * Runs form state.
     *
     * @returns The business information form state result.
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
     * Runs cancel.
     */
    cancel() {
        this.router.navigate(['/dashboard/profile/list']);
    }

    /**
     * Runs next.
     */
    next() {
        this.router.navigate(['/dashboard/profile/create/location-information']);
    }
}
