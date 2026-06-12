import { Component, OnInit, inject, signal } from '@angular/core';
import { AiToolDescriptor } from '@otwld/ts-ai';
import { AiToolService } from '@otwld/ng-ai';
import { TableModule } from 'primeng/table';
import { Card } from 'primeng/card';

/**
 * Displays registered AI tool descriptors in a dashboard table.
 */
@Component({
  selector: 'app-ai-tools-page',
  imports: [TableModule, Card],
  templateUrl: './ai-tools.page.html',
})
export class AiToolsPage implements OnInit {
  private readonly toolsService = inject(AiToolService);

  /**
   * Tool descriptors loaded from the shared AI tool service.
   */
  readonly tools = signal<AiToolDescriptor[]>([]);

  /**
   * Loads registered AI tool descriptors for display.
   */
  async ngOnInit(): Promise<void> {
    this.tools.set(await this.toolsService.list());
  }
}
