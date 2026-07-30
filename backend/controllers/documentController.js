const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");
const Document = require("../models/Document");
const Notification = require("../models/Notification");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const detectFileType = (mime, ext) => {
  if (mime?.startsWith("image/")) return "image";
  if (ext === ".pdf") return "pdf";
  if ([".docx", ".doc"].includes(ext)) return "docx";
  if ([".xlsx", ".xls"].includes(ext)) return "xlsx";
  if (ext === ".csv") return "csv";
  return "other";
};

// Calls the Python AI service to run OCR + entity extraction + embedding indexing.
// Runs asynchronously after the upload response has already been sent to the client.
async function processDocumentWithAI(doc) {
  try {
    doc.status = "Processing";
    await doc.save();

    const form = new FormData();
    form.append("file", fs.createReadStream(doc.filePath), doc.originalName);
    form.append("document_id", doc._id.toString());
    form.append("file_type", doc.fileType);

    const response = await fetch(`${AI_SERVICE_URL}/api/process-document`, {
      method: "POST",
      body: form,
    });

    if (!response.ok) {
      throw new Error(`AI service responded with ${response.status}`);
    }

    const result = await response.json();
    // Expected shape:
    // { ocr_text, category, extracted_data: {...}, embedding: { indexed, chunk_count, collection, is_duplicate, duplicate_of } }

    doc.ocrText = result.ocr_text || "";
    doc.category = result.category || doc.category;
    doc.extractedData = {
      ...result.extracted_data,
      raw: result.extracted_data,
    };
    doc.embeddingStatus = result.embedding?.indexed ? "Indexed" : "Failed";
    doc.chunkCount = result.embedding?.chunk_count || 0;
    doc.vectorCollection = result.embedding?.collection || doc.vectorCollection;
    if (result.embedding?.is_duplicate) {
      doc.duplicateOf = result.embedding.duplicate_of;
    }
    doc.status = "Processed";
    await doc.save();

    await Notification.create({
      user: doc.uploadedBy,
      type: "DOCUMENT_PROCESSED",
      title: "Document processed",
      message: `"${doc.originalName}" has finished AI processing and is ready to search.`,
      relatedDocument: doc._id,
    });
  } catch (err) {
    console.error("[AI Processing Error]", err.message);
    doc.status = "Failed";
    await doc.save();
    await Notification.create({
      user: doc.uploadedBy,
      type: "SYSTEM",
      title: "Document processing failed",
      message: `"${doc.originalName}" could not be processed: ${err.message}`,
      relatedDocument: doc._id,
    });
  }
}

// @desc  Upload one or more business documents
// @route POST /api/documents/upload
exports.uploadDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files were uploaded" });
    }

    const created = [];
    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const doc = await Document.create({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileType: detectFileType(file.mimetype, ext),
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id,
        category: req.body.category || "Other",
        versions: [
          {
            fileName: file.filename,
            filePath: file.path,
            size: file.size,
            uploadedBy: req.user._id,
          },
        ],
      });
      created.push(doc);
      // Fire and forget - do not block the HTTP response on AI processing
      processDocumentWithAI(doc);
    }

    return res.status(201).json({
      success: true,
      message: `${created.length} document(s) uploaded and queued for AI processing`,
      documents: created,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  List / search documents (with pagination, category & status filters)
// @route GET /api/documents
exports.listDocuments = async (req, res) => {
  try {
    const { q, category, status, page = 1, limit = 20 } = req.query;
    const filter = { isDeleted: false };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const skip = (Number(page) - 1) * Number(limit);
    const [documents, total] = await Promise.all([
      Document.find(filter)
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Document.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      documents,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single document (preview + extracted data)
// @route GET /api/documents/:id
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isDeleted: false }).populate(
      "uploadedBy",
      "name email"
    );
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Download / preview raw file
// @route GET /api/documents/:id/file
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    return res.download(doc.filePath, doc.originalName);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Upload a new version of an existing document
// @route POST /api/documents/:id/version
exports.addVersion = async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, isDeleted: false });
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    doc.versions.push({
      fileName: req.file.filename,
      filePath: req.file.path,
      size: req.file.size,
      uploadedBy: req.user._id,
    });
    doc.filePath = req.file.path;
    doc.fileName = req.file.filename;
    doc.size = req.file.size;
    doc.status = "Uploaded";
    await doc.save();

    processDocumentWithAI(doc);

    return res.json({ success: true, message: "New version uploaded and queued for processing", document: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Soft delete a document
// @route DELETE /api/documents/:id
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    doc.isDeleted = true;
    doc.deletedAt = new Date();
    await doc.save();
    return res.json({ success: true, message: "Document moved to trash" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Restore a soft-deleted document
// @route POST /api/documents/:id/restore
exports.restoreDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    doc.isDeleted = false;
    doc.deletedAt = undefined;
    await doc.save();
    return res.json({ success: true, message: "Document restored", document: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Update metadata (category, tags)
// @route PATCH /api/documents/:id
exports.updateMetadata = async (req, res) => {
  try {
    const { category, tags } = req.body;
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Document not found" });
    if (category) doc.category = category;
    if (tags) doc.tags = tags;
    await doc.save();
    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
