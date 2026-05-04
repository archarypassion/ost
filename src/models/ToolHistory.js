import mongoose from 'mongoose';

const ToolHistorySchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, 'Please provide a URL.'],
  },
  toolName: {
    type: String,
    required: [true, 'Please provide the name of the tool used.'],
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ToolHistory || mongoose.model('ToolHistory', ToolHistorySchema);
