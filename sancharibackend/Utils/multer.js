import multer from 'multer';
import path from 'path';

// Use memoryStorage so file buffers are preserved in memory for Cloudinary / Base64 conversion
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif|svg\+xml|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype || extname) {
            return cb(null, true);
        }
        cb(new Error("Only image files (jpeg, jpg, png, webp, gif, pdf) are allowed"));
    }
});

export default upload;
