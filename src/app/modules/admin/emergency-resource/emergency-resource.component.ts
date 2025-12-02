import { Component, inject } from '@angular/core';
import { ModalOpenButtonComponent } from '../../../shared/components/modal-open-button/modal-open-button.component';
import { EmergencyResourceTableComponent } from './components/emergency-resource-table/emergency-resource-table.component';
import { ResourceStatsComponent } from './components/resource-stats/resource-stats.component';
import { EmergencyResourceService } from '../../../core/services/emergency-resource.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { ResourceDetailComponent } from './components/resource-detail/resource-detail.component';
import { DialogComponent } from '../../../shared/components/dialog/dialog.component';
import { EmergencyResourceModalComponent } from './components/emergency-resource-modal/emergency-resource-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-emergency-resource',
  templateUrl: './emergency-resource.component.html',
  imports: [
    ModalOpenButtonComponent,
    EmergencyResourceTableComponent,
    ResourceStatsComponent,
    ResourceDetailComponent,
    DialogComponent,
    EmergencyResourceModalComponent,
  ],
})
export default class EmergencyResourceComponent {
  resourceService = inject(EmergencyResourceService);
  toastService = inject(ToastService);

  resources = rxResource({
    loader: () => this.resourceService.getAll(),
  });

  stats = rxResource({
    loader: () => this.resourceService.getStats(),
  });

  reload() {
    this.resources.reload();
    this.stats.reload();
  }

  deleteResource() {
    const id = this.resourceService.selectedResource()?.id;
    if (!id) return;

    this.resourceService.delete(id).subscribe({
      next: () => {
        this.reload();
        this.toastService.addToast({
          type: 'success',
          message: 'The emergency resource has been deleted successfully.',
          duration: 4000,
        });
        this.resourceService.selectedResource.set(undefined);
      },
      error: (error) => {
        console.error(error);
        this.toastService.addToast({
          type: 'error',
          message: 'An error occurred while deleting the emergency resource.',
          duration: 4000,
        });
      },
    });
  }

  clearSelectedResource() {
    this.resourceService.selectedResource.set(undefined);
  }
}
