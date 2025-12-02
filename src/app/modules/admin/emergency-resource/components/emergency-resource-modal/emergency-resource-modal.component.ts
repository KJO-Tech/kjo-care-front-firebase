import { Component, effect, inject, output, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastService } from '../../../../../core/services/toast.service';
import { EmergencyResourceService } from '../../../../../core/services/emergency-resource.service';
import { FormUtils } from '../../../../../shared/utils/form-utils';

@Component({
  selector: 'emergency-resource-modal',
  templateUrl: './emergency-resource-modal.component.html',
  imports: [ReactiveFormsModule],
})
export class EmergencyResourceModalComponent {
  private fb = inject(FormBuilder);
  resourceService = inject(EmergencyResourceService);
  private toastService = inject(ToastService);

  reload = output();

  formUtils = FormUtils;

  title = signal('Add new blog');
  nameButton = signal('Save');

  resourceForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    resourceUrl: [''],
    contacts: [[''], [Validators.required]],
    links: [[''], [Validators.required]],
  });

  constructor() {
    effect(() => {
      const resource = this.resourceService.selectedResource();

      if (resource) {
        this.title.set('Edit Emergency Resource');
        this.nameButton.set('Update');

        this.resourceForm.patchValue({
          name: resource.name,
          description: resource.description,
          resourceUrl: resource.resourceUrl,
          contacts:
            resource.contacts && resource.contacts.length > 0
              ? resource.contacts
              : [''],
          links:
            resource.links && resource.links.length > 0 ? resource.links : [''],
        });
      } else {
        this.title.set('Add new Emergency Resource');
        this.nameButton.set('Save');
        this.resourceForm.reset();
        this.resourceForm.patchValue({
          contacts: [''],
          links: [''],
        });
      }
    });
  }

  onSubmit() {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    const formValue = this.resourceForm.value;
    const resourceData: any = {
      name: formValue.name!,
      description: formValue.description!,
      resourceUrl: formValue.resourceUrl || undefined,
      contacts: (formValue.contacts as string[]).filter((c) => c.trim() !== ''),
      links: (formValue.links as string[]).filter((l) => l.trim() !== ''),
      status: 'ACTIVE', // Default status
      modifiedDate: new Date().toISOString(),
      userId: 'CURRENT_USER_ID', // Placeholder, should get from auth service
    };

    const selectedResource = this.resourceService.selectedResource();

    if (selectedResource && selectedResource.id) {
      this.resourceService.update(resourceData, selectedResource.id).subscribe({
        next: () => {
          this.toastService.addToast({
            type: 'success',
            message: 'Resource updated successfully',
            duration: 3000,
          });
          this.reload.emit();
        },
        error: (err) => {
          console.error(err);
          this.toastService.addToast({
            type: 'error',
            message: 'Error updating resource',
            duration: 3000,
          });
        },
      });
    } else {
      resourceData.createdDate = new Date().toISOString();
      this.resourceService.create(resourceData).subscribe({
        next: () => {
          this.toastService.addToast({
            type: 'success',
            message: 'Resource created successfully',
            duration: 3000,
          });
          this.reload.emit();
        },
        error: (err) => {
          console.error(err);
          this.toastService.addToast({
            type: 'error',
            message: 'Error creating resource',
            duration: 3000,
          });
        },
      });
    }
  }

  addInput(event: Event, field: 'contacts' | 'links') {
    const array = this.resourceForm.value[field] as string[];
    array.push('');
    this.resourceForm.patchValue({
      [field]: array,
    });
    this.resourceForm.get(field)?.updateValueAndValidity();
  }

  removeInput(event: Event, index: number, field: 'contacts' | 'links') {
    const array = this.resourceForm.value[field] as string[];
    array.splice(index, 1);
    this.resourceForm.patchValue({
      [field]: array,
    });
    this.resourceForm.get(field)?.updateValueAndValidity();
  }

  updateInput(event: Event, index: number, field: 'contacts' | 'links') {
    const input = event.target as HTMLInputElement;
    // Allow empty string update to reflect typing, filtering happens on submit
    const array = this.resourceForm.value[field] as string[];
    array[index] = input.value;
    this.resourceForm.get(field)?.setValue(array);
    this.resourceForm.get(field)?.updateValueAndValidity();
  }
}
