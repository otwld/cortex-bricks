import { Component } from '@angular/core';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Card } from 'primeng/card';

/** Help center page with category cards and search bar. */
@Component({
  selector: 'app-help-page',
  imports: [IconFieldModule, InputIconModule, InputTextModule, Card],
  templateUrl: './help.page.html'
})
export class HelpPage {}
