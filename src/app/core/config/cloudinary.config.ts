import { InjectionToken } from "@angular/core";
import { CloudinaryConfig } from "../interfaces/cloudinary.interface";

export const CLOUDINARY_CONFIG = new InjectionToken<CloudinaryConfig>('CloudinaryConfig');