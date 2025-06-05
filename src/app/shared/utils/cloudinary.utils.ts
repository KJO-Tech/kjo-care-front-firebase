
export function detectResourceType(file: File): 'image' | 'video' | 'auto' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  return 'auto';
}

export function getFolder(BASE_FOLDER: string, resourceType: 'image' | 'video' | 'auto'): string {
  const subFolder = resourceType === 'video' ? 'videos' : 'images';
  return `${BASE_FOLDER}/${subFolder}`;
}
