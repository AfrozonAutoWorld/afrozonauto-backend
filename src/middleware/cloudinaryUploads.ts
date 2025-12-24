import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { CloudinaryFile, AuthenticatedRequest } from "../types/customRequest";
import { NextFunction, Response } from "express";
import { CLOUDINARY_FOLDER, CLOUDINARY_NAME, CLOUDINARY_SECRET, CLOUDINARY_API_KEY } from "../secrets";
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';


cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_SECRET,
  secure: true
});

export const uploadToCloudinary = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (typeof req.body.variants === 'string') {
    try { req.body.variants = JSON.parse(req.body.variants); } catch { }
  }
  if (typeof req.body.address === 'string') {
    try { req.body.address = JSON.parse(req.body.address); } catch { }
  }

  if (typeof req.body.variantImageIndexes === 'string') {
    req.body.variantImageIndexes = JSON.parse(req.body.variantImageIndexes);
  }
  const documentNames: string[] = req.body.documentName || [];



  let files: CloudinaryFile[] = [];

  if (Array.isArray(req.files)) {
    files = req.files as CloudinaryFile[];
  } else if (req.files && typeof req.files === 'object') {
    files = Object.values(req.files).flat() as CloudinaryFile[];
  }
  
  // If no files were uploaded, skip upload logic
  if (!files.length) {
    req.body.uploadedFiles = [];
    return next();
  }
  

  const variantImageIndexes: Record<string, number[]> = req.body.variantImageIndexes || {};

  const uploadedFilesInfo: any[] = [];
  const uploadPromises = files.map((file, index) => {
    return new Promise<void>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: CLOUDINARY_FOLDER,
        },
        (err: any, result:any) => {
          if (err || !result) return reject(ApiError.badRequest(`Upload failed for ${file.originalname}`));

          const fileInfo = {
            publicId: result.public_id,
            imageName: file.originalname,
            documentName: documentNames?.[index],
            url: result.secure_url,
            fileType: result.resource_type,
            format: result.format,
            fileSize: Math.round(result.bytes / 1024),
            uploadIndex: index + 1,
          };

          uploadedFilesInfo.push(fileInfo);
          resolve();
        }
      );
      uploadStream.end(file.buffer);
    });
  });

  await Promise.all(uploadPromises);

  // Separate main and variant images
  const variantImages: Record<string, any[]> = {};

  for (const [key, indices] of Object.entries(variantImageIndexes)) {
    variantImages[key] = uploadedFilesInfo.filter(file => indices.includes(file.uploadIndex));
  }

  const mainImages = uploadedFilesInfo.filter(
    f => !Object.values(variantImageIndexes).flat().includes(f.uploadIndex)
  );

  // Attach variant images back to their options
  if (req.body.variants && Object.keys(variantImages).length > 0) {
    req.body.variants = req.body.variants.map((group: any, groupIndex: number) => {
      group.options = group.options.map((option: any, optionIndex: number) => {
        const key = `${groupIndex}-${optionIndex}`;
        return { ...option, images: variantImages[key] || [] };
      });
      return group;
    });
  }

  req.body.uploadedFiles = mainImages;
  next();
});