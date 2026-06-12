import { Component, inject, OnInit, signal } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { FormsModule } from '@angular/forms';
import { TreeTableModule } from 'primeng/treetable';
import { Card } from 'primeng/card';
import { NodeService } from '@otwld/ng-dashboard/core';

interface TreeTableColumn {
  field: string;
  header: string;
}

interface TreeTableSelectionState {
  partialChecked: boolean;
  checked: boolean;
}

/**
 * Demonstrates PrimeNG Tree and TreeTable selection with hierarchical data.
 */
@Component({
  selector: 'app-tree-demo',
  imports: [FormsModule, TreeModule, TreeTableModule, Card],
  templateUrl: './treedemo.html',
  providers: [NodeService],
})
export class TreeDemo implements OnInit {
  protected readonly treeValue = signal<TreeNode[]>([]);

  protected readonly treeTableValue = signal<TreeNode[]>([]);

  protected selectedTreeValue: TreeNode[] = [];

  protected selectedTreeTableValue: Record<string, TreeTableSelectionState> = {};

  protected cols: TreeTableColumn[] = [];

  private readonly nodeService = inject(NodeService);

  /**
   * Loads sample tree data and initializes default TreeTable selection.
   */
  ngOnInit(): void {
    this.nodeService.getFiles().then((files) => this.treeValue.set(files));
    this.nodeService.getTreeTableNodes().then((files) => this.treeTableValue.set(files));

    this.cols = [
      { field: 'name', header: 'Name' },
      { field: 'size', header: 'Size' },
      { field: 'type', header: 'Type' },
    ];

    this.selectedTreeTableValue = {
      '0-0': {
        partialChecked: false,
        checked: true,
      },
    };
  }
}
