export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
  apiSecret: string;
}

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  asset_id: string;
  format: string;
  resource_type: string;
}

export interface CloudinaryUploadParams {
  file: File;
  folder?: string;
  resourceType?: 'image' | 'video' | 'auto';
  transformation?: string;
}