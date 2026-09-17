import cloudinary from './cloudinary.js';
import fs from 'fs';

/**
 * Process an uploaded file buffer or disk file and return an accessible URL or Data URI.
 * 1. If Cloudinary credentials exist, upload directly to Cloudinary and return HTTPS URL.
 * 2. If Cloudinary is not configured or fails, fallback to Base64 Data URI (works natively in React Native & Web).
 * 3. Also supports fallback from disk file if available.
 */
export const processUploadedFile = async (file, folder = 'sanchari_uploads') => {
    if (!file) return null;

    const isCloudinaryConfigured = Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );

    // 1. Try Cloudinary if configured
    if (isCloudinaryConfigured) {
        try {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type: 'auto',
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                if (file.buffer) {
                    stream.end(file.buffer);
                } else if (file.path && fs.existsSync(file.path)) {
                    fs.createReadStream(file.path).pipe(stream);
                } else {
                    reject(new Error('No file buffer or file path found'));
                }
            });

            if (uploadResult && uploadResult.secure_url) {
                return uploadResult.secure_url;
            }
        } catch (cloudinaryErr) {
            console.warn('Cloudinary upload failed, falling back to Base64:', cloudinaryErr.message);
        }
    }

    // 2. Fallback: Base64 Data URI (Self-contained, works everywhere without cloud storage dependencies)
    if (file.buffer) {
        const mime = file.mimetype || 'image/jpeg';
        const base64Data = file.buffer.toString('base64');
        return `data:${mime};base64,${base64Data}`;
    }

    // 3. Fallback from disk file
    if (file.path && fs.existsSync(file.path)) {
        const fileBuffer = fs.readFileSync(file.path);
        const mime = file.mimetype || 'image/jpeg';
        return `data:${mime};base64,${fileBuffer.toString('base64')}`;
    }

    if (file.filename) {
        return `/uploads/${file.filename}`;
    }

    return null;
};
