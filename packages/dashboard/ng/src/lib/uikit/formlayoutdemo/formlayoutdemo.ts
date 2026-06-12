import { Component } from '@angular/core';
import { FluidModule } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { Card } from 'primeng/card';

interface FormLayoutOption {
  name: string;
  code: string;
}

/**
 * Shows PrimeNG form layout patterns for vertical, horizontal, inline, and advanced forms.
 */
@Component({
  selector: 'app-formlayout-demo',
  imports: [InputTextModule, FluidModule, ButtonModule, SelectModule, FormsModule, TextareaModule, Card],
  templateUrl: './formlayoutdemo.html',
})
export class FormLayoutDemo {
  protected readonly dropdownItems: FormLayoutOption[] = [
    { name: 'Option 1', code: 'Option 1' },
    { name: 'Option 2', code: 'Option 2' },
    { name: 'Option 3', code: 'Option 3' },
  ];

  protected dropdownItem: FormLayoutOption | null = null;
}
