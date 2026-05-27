import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';

/**
 * Demonstrates PrimeNG toast notifications and inline message states.
 */
@Component({
  selector: 'app-messages-demo',
  imports: [ToastModule, ButtonModule, InputTextModule, MessageModule, FormsModule],
  templateUrl: './messagesdemo.html',
  providers: [MessageService],
})
export class MessagesDemo {
  protected username: string | undefined;

  protected email: string | undefined;

  protected readonly pt = {
    contentWrapper: 'flex items-center',
  };

  private readonly service = inject(MessageService);

  /**
   * Shows an informational toast.
   */
  protected showInfoViaToast(): void {
    this.service.add({
      severity: 'info',
      summary: 'Info Message',
      detail: 'PrimeNG rocks',
    });
  }

  /**
   * Shows a warning toast.
   */
  protected showWarnViaToast(): void {
    this.service.add({
      severity: 'warn',
      summary: 'Warn Message',
      detail: 'There are unsaved changes',
    });
  }

  /**
   * Shows an error toast.
   */
  protected showErrorViaToast(): void {
    this.service.add({
      severity: 'error',
      summary: 'Error Message',
      detail: 'Validation failed',
    });
  }

  /**
   * Shows a success toast.
   */
  protected showSuccessViaToast(): void {
    this.service.add({
      severity: 'success',
      summary: 'Success Message',
      detail: 'Message sent',
    });
  }
}
