import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CloudinaryUploadParams, CloudinaryResponse } from '../interfaces/cloudinary.interface';
import { catchError, Observable, OperatorFunction, tap, throwError } from 'rxjs';
import { CLOUDINARY_CONFIG } from '../config/cloudinary.config';
import { detectResourceType, getFolder } from '../../shared/utils/cloudinary.utils';
import { ToastService } from './toast.service';
import CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly http = inject(HttpClient);
  private readonly toastService = inject(ToastService);
  private readonly config = inject(CLOUDINARY_CONFIG);
  private readonly CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1';
  private readonly BASE_FOLDER = 'blog';

  private uploadingSignal = signal(false);
  readonly isUploading = computed(() => this.uploadingSignal());

  private assetsSignal = signal<CloudinaryResponse[]>([]);
  readonly assets = computed(() => this.assetsSignal());



  uploadFile(params: CloudinaryUploadParams): Observable<CloudinaryResponse> {
    const formData = new FormData();
    const resourceType = params.resourceType || detectResourceType(params.file) || 'auto';
    const folder = getFolder(this.BASE_FOLDER, resourceType);

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

  deleteAsset(publicId: string, resourceType: 'image' | 'video'): void {
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${this.config.apiSecret}`;
    const signature = CryptoJS.SHA1(stringToSign).toString();
    const url = `${this.CLOUDINARY_URL}/${this.config.cloudName}/${resourceType}/destroy`;
    this.http.post(url, {
      public_id: publicId,
      signature,
      timestamp,
      api_key: this.config.apiKey
    }).pipe(
      this.handleCloudinaryError()
    ).subscribe(() => {
      this.assetsSignal.update(assets =>
        assets.filter(a => a.public_id !== publicId)
      );
    });
  }

  handleCloudinaryError<T>(): OperatorFunction<T, T> {
    return catchError(error => {

      let userMessage = 'Ocurrió un error al procesar el archivo.';

      switch (error.status) {
        case 400:
          userMessage = 'Solicitud inválida. Verifica los datos e inténtalo nuevamente.';
          break;
        case 401:
          userMessage = 'No autorizado. Verifica la configuración de Cloudinary.';
          break;
        case 403:
          userMessage = 'Acceso denegado. No tienes permisos para esta acción.';
          break;
        case 404:
          userMessage = 'Recurso no encontrado. Verifica la URL o el archivo.';
          break;
        case 500:
          userMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        default:
          userMessage = 'Ocurrió un error al procesar el archivo.';
      }
      this.toastService.addToast({
        message: userMessage,
        type: 'error',
        duration: 5000
      });

      return throwError(() => new Error(userMessage));
    });
  }


  getAssetUrl(publicId: string, transformation?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}`;
    return transformation
      ? `${baseUrl}/image/upload/${transformation}/${publicId}`
      : `${baseUrl}/image/upload/${publicId}`;
  }

}