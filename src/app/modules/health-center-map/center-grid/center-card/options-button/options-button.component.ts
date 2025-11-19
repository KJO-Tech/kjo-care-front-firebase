import { Component, inject, input } from '@angular/core';

import { ModalOpenButtonComponent } from '../../../../../shared/components/modal-open-button/modal-open-button.component';

import { HealthCenterResponse } from '../../../../../core/interfaces/health-center-http.interface';
import { HealthCenterService } from '../../../../../core/services/health-center.service';

@Component({
  selector: 'center-card-options-button',
  templateUrl: './options-button.component.html',
  imports: [ModalOpenButtonComponent],
})
export class OptionsButtonComponent {
  centerService = inject(HealthCenterService);

  center = input.required<HealthCenterResponse>();
}
