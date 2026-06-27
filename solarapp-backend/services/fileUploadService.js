/**
 * File Upload Service - Handles document & image uploads
 * Supports: AWS S3, Google Cloud Storage, Azure Blob Storage, Local Storage
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class FileUploadService {
  constructor() {
    this.provider = process.env.STORAGE_PROVIDER || 'local';
    this.initializeStorage();
    this.setupMulter();
  }

  initializeStorage() {
    if (this.provider === 's3') {
      const AWS = require('aws-sdk');
      this.s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      this.bucket = process.env.AWS_S3_BUCKET;
    } else if (this.provider === 'gcs') {
      const { Storage } = require('@google-cloud/storage');
      this.gcs = new Storage({
        projectId: process.env.GCS_PROJECT_ID,
        keyFilename: process.env.GCS_KEY_FILE
      });
      this.bucket = this.gcs.bucket(process.env.GCS_BUCKET);
    } else if (this.provider === 'azure') {
      const { BlobServiceClient } = require('@azure/storage-blob');
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING
      );
      this.containerClient = this.blobServiceClient.getContainerClient(
        process.env.AZURE_CONTAINER_NAME
      );
    } else {
      // Local storage
      this.uploadDir = process.env.UPLOAD_DIR || './uploads';
      this.ensureUploadDir();
    }
  }

  setupMulter() {
    const storage = multer.memoryStorage();
    
    // File type restrictions
    const fileFilter = (req, file, cb) => {
      const allowedMimes = {
        'kyc': ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        'photo': ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'],
        'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'all': ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword']
      };

      const fileType = req.body?.fileType || 'all';
      const allowed = allowedMimes[fileType] || allowedMimes['all'];

      if (allowed.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Invalid file type: ${file.mimetype}`));
      }
    };

    this.multer = multer({
      storage: storage,
      fileFilter: fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
      }
    });
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName, prefix = '') {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext).replace(/\s+/g, '_');
    
    return `${prefix}${timestamp}-${random}${ext}`;
  }

  /**
   * Upload KYC document
   */
  async uploadKYCDocument(file, userId, documentType) {
    if (!file) throw new Error('No file provided');

    const filename = this.generateFilename(file.originalname, `kyc-${userId}-${documentType}-`);
    
    try {
      const fileUrl = await this.upload(file, filename, 'kyc');
      
      return {
        success: true,
        filename: filename,
        url: fileUrl,
        documentType: documentType,
        uploadedAt: new Date(),
        fileSize: file.size
      };
    } catch (error) {
      throw new Error(`Failed to upload KYC document: ${error.message}`);
    }
  }

  /**
   * Upload installation photo
   */
  async uploadInstallationPhoto(file, orderId, photoType) {
    if (!file) throw new Error('No file provided');

    const filename = this.generateFilename(file.originalname, `installation-${orderId}-${photoType}-`);
    
    try {
      const fileUrl = await this.upload(file, filename, 'photo');
      
      return {
        success: true,
        filename: filename,
        url: fileUrl,
        photoType: photoType,
        uploadedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to upload installation photo: ${error.message}`);
    }
  }

  /**
   * Upload service ticket photo
   */
  async uploadTicketPhoto(file, ticketId) {
    if (!file) throw new Error('No file provided');

    const filename = this.generateFilename(file.originalname, `ticket-${ticketId}-`);
    
    try {
      const fileUrl = await this.upload(file, filename, 'photo');
      
      return {
        success: true,
        filename: filename,
        url: fileUrl,
        uploadedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to upload ticket photo: ${error.message}`);
    }
  }

  /**
   * Upload expense bill
   */
  async uploadExpenseBill(file, expenseId) {
    if (!file) throw new Error('No file provided');

    const filename = this.generateFilename(file.originalname, `expense-${expenseId}-`);
    
    try {
      const fileUrl = await this.upload(file, filename, 'document');
      
      return {
        success: true,
        filename: filename,
        url: fileUrl,
        uploadedAt: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to upload expense bill: ${error.message}`);
    }
  }

  /**
   * Core upload method
   */
  async upload(file, filename, folder = 'general') {
    try {
      if (this.provider === 's3') {
        return await this.uploadToS3(file, filename, folder);
      } else if (this.provider === 'gcs') {
        return await this.uploadToGCS(file, filename, folder);
      } else if (this.provider === 'azure') {
        return await this.uploadToAzure(file, filename, folder);
      } else {
        return await this.uploadLocal(file, filename, folder);
      }
    } catch (error) {
      console.error(`Upload error (${this.provider}):`, error);
      throw error;
    }
  }

  /**
   * Upload to AWS S3
   */
  async uploadToS3(file, filename, folder) {
    const key = `${folder}/${filename}`;
    
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
      Metadata: {
        'original-name': file.originalname,
        'upload-date': new Date().toISOString()
      }
    };

    try {
      await this.s3.upload(params).promise();
      
      // Generate signed URL (expires in 24 hours)
      const signedUrl = this.s3.getSignedUrl('getObject', {
        Bucket: this.bucket,
        Key: key,
        Expires: 86400
      });
      
      return signedUrl;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload to Google Cloud Storage
   */
  async uploadToGCS(file, filename, folder) {
    const filepath = `${folder}/${filename}`;
    const fileObj = this.bucket.file(filepath);

    try {
      await fileObj.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            'original-name': file.originalname
          }
        }
      });

      // Generate signed URL
      const [signedUrl] = await fileObj.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });

      return signedUrl;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload to Azure Blob Storage
   */
  async uploadToAzure(file, filename, folder) {
    const blobName = `${folder}/${filename}`;
    const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: file.mimetype
        },
        metadata: {
          'original-name': file.originalname
        }
      });

      return blockBlobClient.url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload to local storage
   */
  async uploadLocal(file, filename, folder) {
    const folderPath = path.join(this.uploadDir, folder);
    const filePath = path.join(folderPath, filename);

    try {
      await fs.mkdir(folderPath, { recursive: true });
      await fs.writeFile(filePath, file.buffer);

      // Return relative URL
      const url = `/uploads/${folder}/${filename}`;
      return url;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download file
   */
  async download(fileUrl, filename) {
    try {
      if (this.provider === 's3') {
        return await this.downloadFromS3(fileUrl);
      } else if (this.provider === 'gcs') {
        return await this.downloadFromGCS(fileUrl);
      } else if (this.provider === 'azure') {
        return await this.downloadFromAzure(fileUrl);
      } else {
        return await this.downloadLocal(fileUrl);
      }
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete file
   */
  async delete(fileUrl) {
    try {
      if (this.provider === 's3') {
        return await this.deleteFromS3(fileUrl);
      } else if (this.provider === 'gcs') {
        return await this.deleteFromGCS(fileUrl);
      } else if (this.provider === 'azure') {
        return await this.deleteFromAzure(fileUrl);
      } else {
        return await this.deleteLocal(fileUrl);
      }
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete local file
   */
  async deleteLocal(fileUrl) {
    const filePath = path.join(this.uploadDir, fileUrl.replace('/uploads/', ''));
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Scan file for virus/malware (using ClamAV)
   */
  async scanFile(file) {
    if (process.env.ENABLE_VIRUS_SCAN !== 'true') {
      return { safe: true };
    }

    try {
      const NodeClam = require('clamscan');
      const clamscan = await new NodeClam().init({
        clamdscan: {
          host: process.env.CLAMAV_HOST || 'localhost',
          port: process.env.CLAMAV_PORT || 3310
        }
      });

      const { isInfected, viruses } = await clamscan.scanBuffer(file.buffer);

      if (isInfected) {
        return { 
          safe: false, 
          threats: viruses,
          message: 'Malware detected in file'
        };
      }

      return { safe: true };
    } catch (error) {
      console.warn('Virus scan unavailable:', error.message);
      return { safe: true };
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileUrl) {
    try {
      if (this.provider === 's3') {
        const key = fileUrl.split(`${this.bucket}/`)[1];
        const response = await this.s3.headObject({
          Bucket: this.bucket,
          Key: key
        }).promise();

        return {
          size: response.ContentLength,
          type: response.ContentType,
          lastModified: response.LastModified,
          url: fileUrl
        };
      } else if (this.provider === 'local') {
        const filePath = path.join(this.uploadDir, fileUrl.replace('/uploads/', ''));
        const stats = await fs.stat(filePath);
        
        return {
          size: stats.size,
          lastModified: stats.mtime,
          url: fileUrl
        };
      }
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}

module.exports = new FileUploadService();
