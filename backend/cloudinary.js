const dotenv = require("dotenv");
dotenv.config();

const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  cloud_name: process.env.CLOUD_NAME,
});


const uploadMedia = async (file) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    return uploadResponse;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    throw err;
  }
};


const deleteMediaFromClodinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary Delete Error:", err);
    throw err;
  }
};

module.exports = { cloudinary, uploadMedia, deleteMediaFromClodinary };
