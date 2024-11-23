const AppError = require('../utils/AppError');
const User = require('../models/User');
const jsonwebtoken = require('jsonwebtoken');

const changedPasswordAfter = (passwordChangedAt, jwtTimestamp) => {
  if (this.passwordChangedAt) {
    return jwtTimestamp * 1000 < new Date(passwordChangedAt).getTime();
  }
  return true;
};

const isAuthorized = async (req, res, next) => {
  const headers = req.headers;
  if (!headers || !headers?.authorization?.startsWith('Bearer')) {
    return next(new AppError('Unauthorized', 401));
  }
  const token = headers?.authorization?.slice('Bearer '.length);
  // 2) Verification token
  try {
    const decodeToken = await jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET
    );
    if (decodeToken) {
      // 3) Check if user still exists
      const freshUser = await User.findById(decodeToken.id);
      if (!freshUser) {
        return next(
          new AppError(
            'The user belonging to this token does no longer exist.',
            401
          )
        );
      }
      // 4) Check if user changed password after the token was issued
      if (
        !changedPasswordAfter(freshUser?.passwordChangedAt, decodeToken.iat)
      ) {
        return next(
          new AppError(
            'User recently changed password! Please log in again.',
            401
          )
        );
      }
      req.user = freshUser;
    }
    next();
  } catch (error) {
    let message = error.message;
    if (error.message.includes('invalid token')) {
      message = 'Unauthorized';
    }
    if (error.message.includes('jwt expired')) {
      message = 'Token expired';
    }
    return res.status(401).json({
      status: 'fail',
      message,
    });
  }
};

const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

module.exports = {
  isAuthorized,
  restrictTo,
};