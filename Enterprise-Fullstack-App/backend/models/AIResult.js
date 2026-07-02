const mongoose = require('mongoose');

const AIResultSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  modelName: { type: String, required: true },
  diagnosis: { type: String, required: true },
  probability: { type: Number, default: 0.0 }, // 0 to 100
  confidence: { type: Number, default: 0.0 }, // 0 to 100
  reasoningSummary: { type: String, default: '' },
  treatmentSuggestion: { type: String, default: '' },
  evidence: { type: String, default: '' },
  references: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIResult', AIResultSchema);
