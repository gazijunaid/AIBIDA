const express = require("express");
const router = express.Router();
const notif = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", notif.list);
router.patch("/:id/read", notif.markRead);
router.patch("/read-all", notif.markAllRead);

module.exports = router;
