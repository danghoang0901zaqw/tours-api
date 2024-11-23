const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

class UsersController {
  getAllUser = catchAsync(async (req, res) => {
    const users = await User.find({});
    res.status(200).json({
      status: 'Success',
      data: {
        users,
      },
    });
  });

  getUser(req, res) {
    res.status(200).json({
      status: 'Success',
      data: 'User',
    });
  }
  createUser(req, res) {
    res.status(200).json({
      status: 'Success',
      data: 'User',
    });
  }

  updateUser(req, res) {
    res.status(200).json({
      status: 'Success',
      data: 'Update user',
    });
  }

  deleteUser(req, res) {
    res.status(200).json({
      status: 'Success',
      data: 'delete user',
    });
  }
}
module.exports = new UsersController();
