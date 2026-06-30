const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'txt', 'docx', 'png', 'jpg', 'jpeg'], required: true },
  ocrText: { type: String, default: '' },
  summary: { type: String, default: '' },
  tags: [{ type: String }],
  status: { type: String, enum: ['pending', 'processing', 'complete', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
