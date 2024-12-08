const multer = require('multer');
const sharp = require('sharp');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'public/img/users');
//   },
//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not a image! Please upload only images'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const resizePhoto = catchAsync(async (req, res, next) => {
  const { imageCover, images } = req.files;
  if (!imageCover || !images) return next();
  // 1 Upload image cover
  const filenameImageCover = `${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${filenameImageCover}`);
  req.body.imageCover = filenameImageCover;

  // 2 Upload images
  req.body.images = [];
  console.time();
  // for (let i = 0; i < images.length; i++) {
  //   const filenameImage = `${req.params.id}-${Date.now()}-image-${i + 1}.jpeg`;
  //   sharp(images[i].buffer)
  //     .resize(2000, 1333)
  //     .toFormat('jpeg')
  //     .jpeg({ quality: 90 })
  //     .toFile(`public/img/tours/${filenameImage}`);
  //   req.body.images.push(filenameImage);
  // }
  await Promise.all(
    images.map(async (image, i) => {
      const filenameImage = `${req.params.id}-${Date.now()}-image-${
        i + 1
      }.jpeg`;
      sharp(image.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filenameImage}`);
      req.body.images.push(filenameImage);
    })
  );
  console.timeEnd();
  next();
});

const uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('image');
// upload.array('images', 5);
module.exports = {
  upload: uploadTourImages,
  resize: resizePhoto,
};
