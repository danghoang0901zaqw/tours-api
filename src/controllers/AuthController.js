const jsonwebtoken = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');

const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Email = require('../utils/email');

const genToken = (id) => {
  return jsonwebtoken.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.EXPIRED_IN,
  });
};
const correctPassword = (candidatePass, userPassword) => {
  return bcryptjs.compare(candidatePass, userPassword);
};
const filterObj = (obj, allowedFields) => {
  return Object.keys(obj).reduce((acc, el, i) => {
    if (allowedFields.includes(el)) acc[el] = obj[el];
    return acc;
  }, {});
};

class AuthController {
  signUp = catchAsync(async function (req, res) {
    const user = await User.create(req.body);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(user, url).sendWelcome();
    const token = genToken(user._id);
    return res.status(201).json({
      status: 'Success',
      data: {
        token,
        user,
      },
    });
  });
  async signIn(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new AppError('Please provide email and password', 500));
      }
      const user = await User.findOne({ email: req.body.email }).select(
        '+password'
      );
      if (!user || !(await correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
      }
      const token = genToken(user._id);
      return res.status(200).json({
        status: 'Success',
        data: {
          token,
          user,
        },
      });
    } catch (error) {}
  }

  forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    // 1 Get user based on POST email
    const user = await User.findOne({ email });
    if (!user) return next(new App('There is no user with email address', 404));

    // 2 Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    user.save({ validateBeforeSave: false });

    // 3 Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/v1/users/reset-password/${resetToken}`;
    try {
      await new Email(user, resetURL).sendResetPassword();
      return res.status(200).json({
        status: 'Success',
        message: 'Token sent to email',
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new AppError('There was an error sending the email', 500));
    }
  });
  resetPassword = catchAsync(async (req, res, next) => {
    // 1 Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // 2 If token has not expired, and there is user, set the new password
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    // 3 Update changedPasswordAt property for the given user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    const token = genToken(user._id);
    return res.status(200).json({
      status: 'Success',
      data: {
        token,
      },
    });
  });
  updatePassword = catchAsync(async (req, res, next) => {
    // 1 Get user from collection
    const user = await User.findOne({ _id: req.user.id }).select('+password');

    // 2 Check if POSTed current password is correct
    if (!(await correctPassword(req.body.currentPassword, user.password))) {
      return next(new AppError('Your current password is wrong', 401));
    }
    // 3 If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4 Log user in, send JWT
    const token = genToken(user._id);
    return res.status(200).json({
      status: 'Success',
      data: {
        token,
      },
    });
  });

  updateProfile = catchAsync(async (req, res, next) => {
    // 1 Create error if user POSTs password data
    const { password, passwordConfirm } = req.body;
    if (password || passwordConfirm) {
      return next(new AppError('', 400));
    }

    // 2 Update user document
    const filteredBody = filterObj(req.body, ['name', 'email']);
    if (req.file) filteredBody.photo = req.file.filename;
    const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: 'Success',
      data: {
        user,
      },
    });
  });

  closeAccount = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    return res.status(204).json({
      status: 'Success',
      data: true,
    });
  });
}
module.exports = new AuthController();
