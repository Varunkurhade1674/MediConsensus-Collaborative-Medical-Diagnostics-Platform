const Comment = require('../models/Comment');
const ActivityLog = require('../models/ActivityLog');

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ reportId: req.params.reportId })
      .populate('authorId', 'name email avatar role hospital')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { text, parentId } = req.body;
    const { reportId } = req.params;

    if (!text) return res.status(400).json({ error: 'Comment text is required.' });

    // Simple mention parsing (e.g. @Dr. Smith)
    const mentionRegex = /@\[?([^\]]+)\]?/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }

    const comment = new Comment({
      reportId,
      authorId: req.user.id,
      text,
      parentId: parentId || null,
      mentions
    });

    await comment.save();
    
    // Log Activity
    await new ActivityLog({
      userId: req.user.id,
      action: 'ADD_COMMENT',
      details: `Added collaboration note to report ${reportId}`
    }).save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('authorId', 'name email avatar role hospital');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
