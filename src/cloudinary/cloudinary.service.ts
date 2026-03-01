import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';
import { Express } from 'express'; // For Multer file type

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      if (!file) {
        this.logger.error('No file provided for upload to Cloudinary.');
        reject(
          new InternalServerErrorException('No file provided for upload.'),
        );
        return;
      }

      const uploadOptions: any = {
        resource_type: 'auto',
        timeout: 60000, // 60 secondes timeout pour l'upload
      };
      if (folder) {
        uploadOptions.folder = folder;
      }
      // Optionnel : définir un public_id pour contrôler le nom du fichier sur Cloudinary
      // Par exemple, pour éviter les conflits de noms ou pour organiser par utilisateur/type
      // uploadOptions.public_id = `avatars/${file.originalname}-${Date.now()}`.replace(/\s+/g, '_');

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              'Cloudinary Upload Error:',
              error.message,
              error.stack,
            );
            reject(
              new InternalServerErrorException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            this.logger.error('Cloudinary Upload Error: No result returned.');
            reject(
              new InternalServerErrorException(
                'Cloudinary upload failed: No result returned.',
              ),
            );
            return;
          }
          this.logger.log(
            `File uploaded successfully to Cloudinary: ${result.secure_url}`,
          );
          resolve(result);
        },
      );
      // Pipe the file buffer to the upload stream
      uploadStream.end(file.buffer);
    });
  }

  async uploadRawFileFromPath(
    filePath: string,
    folder?: string,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      if (!filePath) {
        this.logger.error(
          'No file path provided for raw upload to Cloudinary.',
        );
        reject(
          new InternalServerErrorException('No file path provided for upload.'),
        );
        return;
      }

      const uploadOptions: any = {
        resource_type: 'raw',
        timeout: 600000, // 10 minutes timeout for large dumps
      };

      if (folder) {
        uploadOptions.folder = folder;
      }

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      cloudinary.uploader.upload(
        filePath,
        uploadOptions,
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            this.logger.error(
              'Cloudinary Raw Upload Error:',
              error.message,
              error.stack,
            );
            reject(
              new InternalServerErrorException(
                `Cloudinary raw upload failed: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            this.logger.error(
              'Cloudinary Raw Upload Error: No result returned.',
            );
            reject(
              new InternalServerErrorException(
                'Cloudinary raw upload failed: No result returned.',
              ),
            );
            return;
          }
          this.logger.log(
            `Raw file uploaded successfully to Cloudinary: ${result.secure_url}`,
          );
          resolve(result);
        },
      );
    });
  }

  /**
   * Copie une image existante vers un nouveau dossier sur Cloudinary
   * @param sourceUrl URL de l'image source
   * @param targetFolder Dossier de destination (ex: 'students')
   * @returns Nouvelle URL et nouveau public_id
   */
  async copyImageToFolder(
    sourceUrl: string,
    targetFolder: string,
  ): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      if (!sourceUrl) {
        this.logger.warn('No source URL provided for copy.');
        reject(
          new InternalServerErrorException('No source URL provided for copy.'),
        );
        return;
      }

      cloudinary.uploader.upload(
        sourceUrl,
        {
          folder: targetFolder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Failed to copy image to ${targetFolder}: ${error.message}`,
            );
            reject(
              new InternalServerErrorException(
                `Failed to copy image: ${error.message}`,
              ),
            );
            return;
          }
          if (!result) {
            this.logger.error('Cloudinary copy failed: No result returned.');
            reject(
              new InternalServerErrorException(
                'Cloudinary copy failed: No result returned.',
              ),
            );
            return;
          }
          this.logger.log(
            `Image copied successfully to ${targetFolder}: ${result.secure_url}`,
          );
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      if (!publicId) {
        this.logger.warn('No publicId provided for deletion.');
        // Resolve rather than reject to not break the flow if publicId is missing
        resolve({ result: 'No publicId provided' });
        return;
      }
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          this.logger.error(
            `Failed to delete image from Cloudinary. Public ID: ${publicId}`,
            error.message,
            error.stack,
          );
          reject(
            new InternalServerErrorException(
              `Failed to delete image: ${error.message}`,
            ),
          );
          return;
        }
        if (result && result.result === 'ok') {
          this.logger.log(
            `Image deleted successfully from Cloudinary. Public ID: ${publicId}`,
          );
        } else if (result && result.result === 'not found') {
          this.logger.warn(
            `Image not found on Cloudinary for deletion. Public ID: ${publicId}`,
          );
        } else {
          this.logger.warn(
            `Unexpected result from Cloudinary deletion. Public ID: ${publicId}`,
            result,
          );
        }
        resolve(result as { result: string }); // Cast to expected type
      });
    });
  }

  async deleteRawFile(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      if (!publicId) {
        this.logger.warn('No publicId provided for raw deletion.');
        resolve({ result: 'No publicId provided' });
        return;
      }

      cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'raw' },
        (error, result) => {
          if (error) {
            this.logger.error(
              `Failed to delete raw file from Cloudinary. Public ID: ${publicId}`,
              error.message,
              error.stack,
            );
            reject(
              new InternalServerErrorException(
                `Failed to delete raw file: ${error.message}`,
              ),
            );
            return;
          }
          if (result && result.result === 'ok') {
            this.logger.log(
              `Raw file deleted successfully from Cloudinary. Public ID: ${publicId}`,
            );
          } else if (result && result.result === 'not found') {
            this.logger.warn(
              `Raw file not found on Cloudinary for deletion. Public ID: ${publicId}`,
            );
          } else {
            this.logger.warn(
              `Unexpected result from Cloudinary raw deletion. Public ID: ${publicId}`,
              result,
            );
          }
          resolve(result as { result: string });
        },
      );
    });
  }
}
