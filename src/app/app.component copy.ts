import { Component, inject, signal } from '@angular/core';
import { CloudinaryService } from './core/services/cloudinary.service';
import { CloudinaryResponse, CloudinaryUploadParams } from './core/interfaces/cloudinary.interface';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule, CommonModule],
  template: `
     <div class="min-h-screen bg-base-200 p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">Gestión de Medios</h1>

        <div class="card bg-base-100 shadow-xl mb-8">
          <div class="card-body">
            <h2 class="card-title">Subir Archivo</h2>
            <div class="form-control">
              <input
                type="file"
                (change)="onFileSelected($event)"
                class="file-input file-input-bordered w-full max-w-xs"
              />
            </div>

            <div class="form-control w-full max-w-xs mt-2">
              <label class="label">
                <span class="label-text">Tipo de archivo</span>
              </label>
              <select [(ngModel)]="isImage" class="select select-bordered">
                <option [value]="true">Imagen</option>
                <option [value]="false">Video</option>
              </select>
            </div>

            <div class="mt-4">
              <button
                (click)="uploadFile()"
                [disabled]="cloudinary.isUploading()"
                class="btn btn-primary"
              >
                {{ cloudinary.isUploading() ? 'Cargando...' : 'Cargar' }}
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (asset of cloudinary.assets(); track asset.public_id) {
            <div class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
              <figure class="p-4">
                @if (asset.resource_type === 'video') {
                  <video [src]="cloudinary.getAssetUrl(asset.public_id)" controls class="w-full rounded-lg"></video>
                } @else {
                  <img [src]="cloudinary.getAssetUrl(asset.public_id)" alt="Asset" class="w-full rounded-lg" />
                }
              </figure>
              <div class="card-body p-4">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-mono">{{ asset.public_id }}</span>
                  <button
                    (click)="deleteAsset(asset)"
                    class="btn btn-sm btn-error btn-outline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AppComponent {
  cloudinary = inject(CloudinaryService)
  selectedFile = signal<File | null>(null)
  isImage = true

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    if (input.files?.length) {
      this.selectedFile.set(input.files[0])
    }
  }

  uploadFile(): void {
    const file = this.selectedFile();
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const params: CloudinaryUploadParams = {
      file,
      resourceType
    };

    this.cloudinary.uploadFile(params).subscribe();
  }

  deleteAsset(asset: CloudinaryResponse): void {
    const resourceType = asset.resource_type === 'video' ? 'video' : 'image';
    this.cloudinary.deleteAsset(asset.public_id, resourceType);
  }

}