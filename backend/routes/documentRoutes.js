const express = require("express");
const router = express.Router();
const doc = require("../controllers/documentController");
const upload = require("../middleware/upload");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

router.post("/upload", upload.array("files", 20), doc.uploadDocuments); // bulk upload supported
router.get("/", doc.listDocuments);
router.get("/:id", doc.getDocument);
router.get("/:id/file", doc.downloadDocument);
router.post("/:id/version", upload.single("file"), doc.addVersion);
router.patch("/:id", doc.updateMetadata);
router.delete("/:id", authorize("Admin", "Manager"), doc.deleteDocument);
router.post("/:id/restore", authorize("Admin", "Manager"), doc.restoreDocument);

module.exports = router;
