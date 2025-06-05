import { provideCloudinaryLoader } from '@angular/common';
import { environment } from '../../../environments/environment';

export const STORAGE_PROVIDERS = [
  provideCloudinaryLoader(`https://res.cloudinary.com/${environment.cloudinary.cloudName}/image/upload/`),
  provideCloudinaryLoader(`https://res.cloudinary.com/${environment.cloudinary.cloudName}/video/upload/`),
];