const sharp = require('sharp');

module.exports = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filename = `book-${Date.now()}.webp`;

  try {
    await sharp(req.file.buffer)
      .resize({ width: 800 })
      .webp({ quality: 80 })
      .toFile(`images/${filename}`);

    req.file.filename = filename;

    next();

  } catch (error) {
    return res.status(500).json({ error });
  }
};