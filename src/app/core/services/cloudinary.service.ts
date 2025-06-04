import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CloudinaryUploadParams, CloudinaryResponse } from '../interfaces/cloudinary.interface';
import { catchError, Observable, OperatorFunction, tap } from 'rxjs';
import { CLOUDINARY_CONFIG } from '../config/cloudinary.config';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';


@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(CLOUDINARY_CONFIG);
  private readonly CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1';
  private readonly BASE_FOLDER = 'blog';

  private uploadingSignal = signal(false);
  readonly isUploading = computed(() => this.uploadingSignal());

  private assetsSignal = signal<CloudinaryResponse[]>([]);
  readonly assets = computed(() => this.assetsSignal());
  readonly assets$ = toObservable(this.assets);

  constructor() { }

  uploadFile(params: CloudinaryUploadParams): Observable<CloudinaryResponse> {
    const formData = new FormData();
    const resourceType = params.resourceType || this.detectResourceType(params.file) || 'auto';
    const folder = this.getFolder(resourceType);

    formData.append('file', params.file);
    formData.append('upload_preset', this.config.uploadPreset);
    formData.append('folder', folder);

    const url = `${this.CLOUDINARY_URL}/${this.config.cloudName}/${resourceType}/upload`;

    return this.http.post<CloudinaryResponse>(url, formData).pipe(
      this.handleCloudinaryError(),
      tap(asset => {
        this.assetsSignal.update(assets => [...assets, asset]);
        this.uploadingSignal.set(false);
      })
    );
  }



  deleteAsset(publicId: string): void {
    const url = `${this.CLOUDINARY_URL}/${this.config.cloudName}/destroy`;
    this.http.post(url, { public_id: publicId }).pipe(
      this.handleCloudinaryError() // Manejo de errores [[8]]
    ).subscribe(() => {
      this.assetsSignal.update(assets =>
        assets.filter(a => a.public_id !== publicId)
      );
    });
  }

  handleCloudinaryError<T>(): OperatorFunction<T, T> {
    return catchError(error => {
      console.error('Cloudinary error:', error);
      throw error;
    });
  }
  getAssetUrl(publicId: string, transformation?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}`;
    return transformation
      ? `${baseUrl}/image/upload/${transformation}/${publicId}`
      : `${baseUrl}/image/upload/${publicId}`;
  }

  detectResourceType(file: File): 'image' | 'video' | 'auto' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'auto';
  }

  getFolder(resourceType: 'image' | 'video' | 'auto'): string {
    const subFolder = resourceType === 'video' ? 'videos' : 'images';
    return `${this.BASE_FOLDER}/${subFolder}`;
  }


}