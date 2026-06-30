const Report = require('../models/Report');
const User = require('../models/User');
const Consensus = require('../models/Consensus');
const ActivityLog = require('../models/ActivityLog');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const processedReports = await Report.countDocuments({ status: 'complete' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Aggregate monthly report uploads count
    const monthlyUploads = await Report.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format monthly counts into an array corresponding to Jan-Dec
    const uploadTrends = Array(12).fill(0);
    monthlyUploads.forEach(item => {
      if (item._id >= 1 && item._id <= 12) {
        uploadTrends[item._id - 1] = item.count;
      }
    });

    // Mock disease distribution
    const diseaseDistribution = [
      { name: 'Type 2 Diabetes', count: 18 },
      { name: 'Cardiovascular Risk', count: 12 },
      { name: 'Renal Disease', count: 8 },
      { name: 'COPD/Respiratory', count: 6 },
      { name: 'General Neuropathy', count: 5 }
    ];

    // Mock AI Accuracy stats
    const aiAccuracy = [
      { model: 'GPT-4', accuracy: 96 },
      { model: 'Claude', accuracy: 94 },
      { model: 'Gemini', accuracy: 91 },
      { model: 'DeepSeek', accuracy: 93 },
      { model: 'Nemotron', accuracy: 89 },
      { model: 'Mistral', accuracy: 87 },
      { model: 'Llama', accuracy: 88 }
    ];

    const recentActivities = await ActivityLog.find()
      .populate('userId', 'name email hospital')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      summary: {
        totalReports,
        totalDoctors,
        processedReports,
        pendingReports,
        consensusRate: totalReports > 0 ? Math.round((processedReports / totalReports) * 100) : 100
      },
      diseaseDistribution,
      aiAccuracy,
      uploadTrends,
      recentActivities
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
