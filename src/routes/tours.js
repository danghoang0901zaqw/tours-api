const express = require("express");
const router = express.Router();
const ToursController = require("../controllers/ToursController");

router.route("/top-5-cheap").get(ToursController.tourStats);
router.route("/top-stats").get(ToursController.tourStats);
router.route("/monthly/:year").get(ToursController.monthlyPlanStats);
router
  .route("/")
  .get(ToursController.getAllTour)
  .post(ToursController.createTour);

router
  .route("/:id")
  .get(ToursController.getTour)
  .patch(ToursController.updateTour)
  .delete(ToursController.deleteTour);

module.exports = router;
