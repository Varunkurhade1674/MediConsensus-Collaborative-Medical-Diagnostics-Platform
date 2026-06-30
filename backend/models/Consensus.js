const mongoose = require('mongoose');

const ConsensusSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  consensusScore: { type: Number, default: 0 }, // 0 to 100
  agreementScore: { type: Number, default: 0 }, // 0 to 100
  findingsMatch: [{
    finding: { type: String },
    agreeingModels: [{ type: String }],
    disagreeingModels: [{ type: String }]
  }],
  disagreements: [{
    topic: { type: String },
    description: { type: String }
  }],
  missingFindings: [{ type: String }],
  medicalRisks: [{ type: String }],
  recommendations: { type: String, default: '' },
  doctorOverride: { type: String, default: '' },
  status: { type: String, enum: ['automatic', 'overridden'], default: 'automatic' },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Consensus', ConsensusSchema);
