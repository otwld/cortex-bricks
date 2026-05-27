import { Component, OnInit, inject, signal } from '@angular/core';
import { AiToolDescriptor } from '@otwld/ts-ai';
import { AiToolService } from '@otwld/ng-ai';
import { TableModule } from 'primeng/table';

/**
 * Provides ai tools page behavior.
 */
@Component({
  selector: 'app-ai-tools-page',
  imports: [TableModule],
  templateUrl: './ai-tools.page.html',
})
export class AiToolsPage implements OnInit {
  private readonly toolsService = inject(AiToolService);
  readonly tools = signal<AiToolDescriptor[]>([]);

  /**
   * Runs ng on init.
   */
  async ngOnInit(): Promise<void> {
    this.tools.set(await this.toolsService.list());
  }
}
