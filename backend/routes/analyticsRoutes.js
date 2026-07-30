const express = require("express");
const router = express.Router();
const analytics = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/dashboard", analytics.dashboardSummary);
router.get("/top-customers", analytics.topCustomers);
router.get("/monthly-trend", analytics.monthlyTrend);
router.get("/category-breakdown", analytics.categoryBreakdown);

module.exports = router;
