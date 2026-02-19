const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const IMAGE_MESSAGE_PREFIX = "[image]";

const getCloudinaryUploadUrl = () => {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.");
  }

  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
};

const getUploadPreset = () => {
  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Missing NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  return CLOUDINARY_UPLOAD_PRESET;
};

export const createImageMessageContent = (url: string) =>
  `${IMAGE_MESSAGE_PREFIX}${url}`;

export const getImageMessageUrl = (content: string) =>
  content.startsWith(IMAGE_MESSAGE_PREFIX)
    ? content.slice(IMAGE_MESSAGE_PREFIX.length).trim()
    : null;

export const uploadImageToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", getUploadPreset());

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { secure_url?: string; error?: { message?: string } };

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Failed to upload image to Cloudinary.");
  }

  return data.secure_url;
};
