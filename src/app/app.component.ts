import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateService } from './core/services/update.service';
import { ToastComponent } from './shared/components/layout/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  template: ` <router-outlet /> <app-toast /> `,
})
export class AppComponent {
  title = 'kjo-care-front-firebase';
  private updateService = inject(UpdateService);
}
