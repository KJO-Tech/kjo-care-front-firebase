import { Component, inject } from '@angular/core';
import { EmergencyResourceService } from '../../../../core/services/emergency-resource.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'resources-emergency',
  templateUrl: './resources-emergency.component.html',
  imports: [],
})
export default class ResourcesEmergencyComponent {
  private resourcesService = inject(EmergencyResourceService);
  private toastService = inject(ToastService);

  resources = rxResource({
    loader: () => this.resourcesService.getAllActive(),
  });

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    this.toastService.addToast({
      type: 'success',
      message: 'Copiado al portapapeles',
      duration: 2000,
    });
  }

  reload() {
    this.resources.reload();
  }
}
