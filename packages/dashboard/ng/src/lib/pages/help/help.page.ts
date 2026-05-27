import { Component } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

/** Help center page with category cards and search bar. */
@Component({
  selector: 'app-help-page',
  imports: [IconFieldModule, InputIconModule, InputTextModule],
  templateUrl: './help.page.html'
})
export class HelpPage {}
