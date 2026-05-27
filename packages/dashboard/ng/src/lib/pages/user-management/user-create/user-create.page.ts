import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { FileUploadModule } from 'primeng/fileupload';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

interface Country {
    name: string;
    code: string;
}

/** Simple single-page user creation form. */
@Component({
    selector: 'app-user-create-page',
    imports: [FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, FileUploadModule, InputGroupModule, InputGroupAddonModule],
    templateUrl: './user-create.page.html',
})
export class UserCreatePage {
    nickname = '';
    bio = '';
    email = '';
    city = '';
    state = '';
    website = '';
    selectedCountry: Country | null = null;

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
