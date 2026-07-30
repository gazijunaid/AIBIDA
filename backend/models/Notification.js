const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: [
        "DOCUMENT_PROCESSED",
        "REPORT_GENERATED",
        "PENDING_PAYMENT",
        "LOW_INVENTORY",
        "AI_RECOMMENDATION",
        "SYSTEM",
      ],
      default: "SYSTEM",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedDocument: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
