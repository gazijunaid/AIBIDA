const express = require("express");
const router = express.Router();
const ai = require("../controllers/aiController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.post("/ask", ai.ask);
router.get("/recommendations", ai.recommendations);
router.post("/reports", ai.generateReport);

module.exports = router;
