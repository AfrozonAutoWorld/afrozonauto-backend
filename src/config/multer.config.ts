import multer, { Multer } from 'multer';
const storage = multer.memoryStorage();


export const upload: Multer = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
 });