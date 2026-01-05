"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const secrets_1 = require("../secrets");
const ApiError_1 = require("../utils/ApiError");
const asyncHandler_1 = require("../utils/asyncHandler");
cloudinary_1.v2.config({
    cloud_name: secrets_1.CLOUDINARY_NAME,
    api_key: secrets_1.CLOUDINARY_API_KEY,
    api_secret: secrets_1.CLOUDINARY_SECRET,
    secure: true
});
exports.uploadToCloudinary = (0, asyncHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (typeof req.body.variants === 'string') {
        try {
            req.body.variants = JSON.parse(req.body.variants);
        }
        catch (_a) { }
    }
    if (typeof req.body.address === 'string') {
        try {
            req.body.address = JSON.parse(req.body.address);
        }
        catch (_b) { }
    }
    if (typeof req.body.variantImageIndexes === 'string') {
        req.body.variantImageIndexes = JSON.parse(req.body.variantImageIndexes);
    }
    const documentNames = req.body.documentName || [];
    let files = [];
    if (Array.isArray(req.files)) {
        files = req.files;
    }
    else if (req.files && typeof req.files === 'object') {
        files = Object.values(req.files).flat();
    }
    // If no files were uploaded, skip upload logic
    if (!files.length) {
        req.body.uploadedFiles = [];
        return next();
    }
    const variantImageIndexes = req.body.variantImageIndexes || {};
    const uploadedFilesInfo = [];
    const uploadPromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'auto',
                folder: secrets_1.CLOUDINARY_FOLDER,
            }, (err, result) => {
                if (err || !result)
                    return reject(ApiError_1.ApiError.badRequest(`Upload failed for ${file.originalname}`));
                const fileInfo = {
                    publicId: result.public_id,
                    imageName: file.originalname,
                    documentName: documentNames === null || documentNames === void 0 ? void 0 : documentNames[index],
                    url: result.secure_url,
                    fileType: result.resource_type,
                    format: result.format,
                    fileSize: Math.round(result.bytes / 1024),
                    uploadIndex: index + 1,
                };
                uploadedFilesInfo.push(fileInfo);
                resolve();
            });
            uploadStream.end(file.buffer);
        });
    });
    yield Promise.all(uploadPromises);
    // Separate main and variant images
    const variantImages = {};
    for (const [key, indices] of Object.entries(variantImageIndexes)) {
        variantImages[key] = uploadedFilesInfo.filter(file => indices.includes(file.uploadIndex));
    }
    const mainImages = uploadedFilesInfo.filter(f => !Object.values(variantImageIndexes).flat().includes(f.uploadIndex));
    // Attach variant images back to their options
    if (req.body.variants && Object.keys(variantImages).length > 0) {
        req.body.variants = req.body.variants.map((group, groupIndex) => {
            group.options = group.options.map((option, optionIndex) => {
                const key = `${groupIndex}-${optionIndex}`;
                return Object.assign(Object.assign({}, option), { images: variantImages[key] || [] });
            });
            return group;
        });
    }
    req.body.uploadedFiles = mainImages;
    next();
}));
