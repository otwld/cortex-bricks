import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Card } from 'primeng/card';

interface Country {
    name: string;
    code: string;
}

/** Simple single-page user creation form. */
@Component({
    selector: 'app-user-create-page',
    imports: [FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, FileUploadModule, InputGroupModule, InputGroupAddonModule, Card],
    templateUrl: './user-create.page.html',
})
export class UserCreatePage {
    /**
     * Nickname value entered for the new user profile.
     */
    nickname = '';

    /**
     * Biography text entered for the new user profile.
     */
    bio = '';

    /**
     * Email address entered for the new user.
     */
    email = '';

    /**
     * City value entered for the new user's location.
     */
    city = '';

    /**
     * State or region value entered for the new user's location.
     */
    state = '';

    /**
     * Website URL entered for the new user profile.
     */
    website = '';

    /**
     * Country selected for the new user's location.
     */
    selectedCountry: Country | null = null;

    /**
     * Country options shown in the user profile form.
     */
    countries: Country[] = [
        { name: 'Australia', code: 'AU' },
        { name: 'Brazil', code: 'BR' },
        { name: 'China', code: 'CN' },
        { name: 'Egypt', code: 'EG' },
        { name: 'France', code: 'FR' },
        { name: 'Germany', code: 'DE' },
        { name: 'India', code: 'IN' },
        { name: 'Japan', code: 'JP' },
        { name: 'Spain', code: 'ES' },
        { name: 'United States', code: 'US' }
    ];
}
