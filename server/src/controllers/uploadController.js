
const cloudinary = require("../config/cloudinary");

const uploadMenuImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG, and WebP images are allowed.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "d-shawarma-station/menu",
          resource_type: "image",
        },
        (error, uploadedImage) => {
          if (error) return reject(error);
          resolve(uploadedImage);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      message: "Menu image uploaded successfully.",
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Menu image upload failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image upload failed. Please try again.",
    });
  }
};

module.exports = { uploadMenuImage };
