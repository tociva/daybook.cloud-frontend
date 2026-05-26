import { Injectable } from '@angular/core';

export type SignedUrlUploadProgress = Readonly<{
  loaded: number;
  total: number;
  progress: number;
}>;

@Injectable({ providedIn: 'root' })
export class SignedUrlUploadService {
  uploadFileToSignedUrl(
    putUrl: string,
    file: File,
    onProgress?: (event: SignedUrlUploadProgress) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('PUT', putUrl);
      request.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      request.upload.onprogress = (event): void => {
        if (!event.lengthComputable) return;
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          progress: Math.round((event.loaded / event.total) * 100),
        });
      };

      request.onload = (): void => {
        if (request.status >= 200 && request.status < 300) {
          onProgress?.({ loaded: file.size, total: file.size, progress: 100 });
          resolve();
          return;
        }

        reject(new Error(`File upload failed: ${request.status} ${request.statusText}`));
      };

      request.onerror = (): void => {
        reject(new Error(`File upload failed for ${file.name}.`));
      };

      request.send(file);
    });
  }
}
