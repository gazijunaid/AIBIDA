const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    fileName: String,
    filePath: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true }, // stored name on disk
    filePath: { type: String, required: true },
    fileType: { type: String, required: true }, // pdf, docx, xlsx, csv, image
    mimeType: String,
    size: Number,

    category: {
      type: String,
      enum: [
        "Invoice",
        "Quotation",
        "Purchase Order",
        "Contract",
        "Report",
        "Receipt",
        "Business Card",
        "Spreadsheet",
        "Other",
      ],
      default: "Other",
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      enum: ["Uploaded", "Processing", "Processed", "Failed"],
      default: "Uploaded",
    },

    ocrText: { type: String, default: "" },

    // Structured entities extracted by the AI service (Module 4)
    extractedData: {
      companyName: String,
      customerName: String,
      invoiceNumber: String,
      invoiceDate: String,
      purchaseOrderNumber: String,
      gstNumber: String,
      products: [
        {
          name: String,
          quantity: Number,
          unitPrice: Number,
          total: Number,
        },
      ],
      totalAmount: Number,
      taxAmount: Number,
      paymentStatus: { type: String, enum: ["Paid", "Unpaid", "Partially Paid", "Unknown"], default: "Unknown" },
      vendorDetails: String,
      contactInformation: String,
      raw: mongoose.Schema.Types.Mixed, // full raw JSON from AI service
    },

    // Vector DB linkage (Module 5)
    embeddingStatus: {
      type: String,
      enum: ["Pending", "Indexed", "Failed"],
      default: "Pending",
    },
    vectorCollection: { type: String, default: "aibida_documents" },
    chunkCount: { type: Number, default: 0 },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },

    versions: [versionSchema],

    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,

    tags: [String],
  },
  { timestamps: true }
);

documentSchema.index({ originalName: "text", ocrText: "text" });

module.exports = mongoose.model("Document", documentSchema);
