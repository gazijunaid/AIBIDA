const Document = require("../models/Document");

// @desc  Dashboard summary + KPIs (Module 7 & 10)
// @route GET /api/analytics/dashboard
exports.dashboardSummary = async (req, res) => {
  try {
    const [totalDocuments, processed, processing, failed] = await Promise.all([
      Document.countDocuments({ isDeleted: false }),
      Document.countDocuments({ isDeleted: false, status: "Processed" }),
      Document.countDocuments({ isDeleted: false, status: "Processing" }),
      Document.countDocuments({ isDeleted: false, status: "Failed" }),
    ]);

    const revenueAgg = await Document.aggregate([
      { $match: { isDeleted: false, category: { $in: ["Invoice", "Receipt"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$extractedData.totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const pendingAgg = await Document.aggregate([
      {
        $match: {
          isDeleted: false,
          category: "Invoice",
          "extractedData.paymentStatus": { $in: ["Unpaid", "Partially Paid"] },
        },
      },
      { $group: { _id: null, pendingAmount: { $sum: "$extractedData.totalAmount" }, count: { $sum: 1 } } },
    ]);

    const recentUploads = await Document.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("originalName category status createdAt");

    return res.json({
      success: true,
      summary: {
        totalDocuments,
        processed,
        processing,
        failed,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
        revenueDocumentCount: revenueAgg[0]?.count || 0,
        pendingPayments: pendingAgg[0]?.pendingAmount || 0,
        pendingInvoiceCount: pendingAgg[0]?.count || 0,
        recentUploads,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Top customers by total invoiced amount
// @route GET /api/analytics/top-customers
exports.topCustomers = async (req, res) => {
  try {
    const results = await Document.aggregate([
      { $match: { isDeleted: false, category: "Invoice", "extractedData.customerName": { $ne: null } } },
      {
        $group: {
          _id: "$extractedData.customerName",
          totalSpent: { $sum: "$extractedData.totalAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);
    return res.json({ success: true, topCustomers: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Monthly revenue trend (for line/bar charts)
// @route GET /api/analytics/monthly-trend
exports.monthlyTrend = async (req, res) => {
  try {
    const results = await Document.aggregate([
      { $match: { isDeleted: false, category: { $in: ["Invoice", "Receipt"] } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$extractedData.totalAmount" },
          documentCount: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    return res.json({ success: true, monthlyTrend: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Category-wise document breakdown
// @route GET /api/analytics/category-breakdown
exports.categoryBreakdown = async (req, res) => {
  try {
    const results = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({ success: true, categoryBreakdown: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
