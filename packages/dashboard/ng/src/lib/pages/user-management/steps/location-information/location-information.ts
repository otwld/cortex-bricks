import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormStateService } from '../../form-state.service';

/** Location information step of the user creation wizard. */
@Component({
    selector: 'app-location-information',
    imports: [FormsModule, ButtonModule, InputTextModule, SelectModule],
    templateUrl: './location-information.html',
})
export class LocationInformation {
    /**
     * Country options shown in the location information step.
     */
    countryOptions = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'India', 'Brazil'];

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
     * Advances to the authorization step.
     */
    next() {
        this.router.navigate(['/dashboard/profile/create/authorization']);
    }
}
