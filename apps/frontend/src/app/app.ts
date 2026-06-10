import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Root Angular component that hosts routed frontend app views.
 */
@Component({
  imports: [RouterModule],
  selector: 'app-root',
  template: `<router-outlet />`,
})
export class App {}
