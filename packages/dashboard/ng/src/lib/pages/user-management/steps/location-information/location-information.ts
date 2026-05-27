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
    countryOptions = ['United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'India', 'Brazil'];

    private readonly router = inject(Router);
    private readonly formStateService = inject(FormStateService);

    /**
     * Runs form state.
     *
     * @returns The location information form state result.
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
        this.router.navigate(['/dashboard/profile/create/authorization']);
    }
}
