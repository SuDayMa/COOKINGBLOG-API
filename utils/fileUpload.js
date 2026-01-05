
const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  
  const cleanPath = String(imagePath).replace(/^\/+/, "");
  const finalPath = cleanPath.startsWith("uploads/") ? cleanPath : `uploads/${cleanPath}`;

  return `${req.protocol}://${req.get("host")}/${finalPath}`;
};

module.exports = { formatImageUrl };