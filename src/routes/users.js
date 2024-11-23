const express = require("express");
const usersController = require("../controllers/UsersController");
const authController = require("../controllers/AuthController");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

router.route("/sign-up").post(authController.signUp);
router.route("/sign-in").post(authController.signIn);
router.route("/forgot-password").post(authController.forgotPassword);
router.route("/reset-password/:token").patch(authController.resetPassword);
router
  .route("/update-password")
  .patch(authMiddleware.isAuthorized, authController.updatePassword);
router
  .route("/update-profile")
  .patch(authMiddleware.isAuthorized, authController.updateProfile);
router
  .route("/close-account")
  .delete(authMiddleware.isAuthorized, authController.closeAccount);

router.route("/").get(usersController.getAllUser);

router
  .route("/:id")
  .get(usersController.getUser)
  .patch(usersController.updateUser)
  .delete(usersController.deleteUser);

module.exports = router;