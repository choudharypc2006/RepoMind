import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    repositoryName: {
      type: String,
      required: [true, 'Repository name is required'],
      trim: true,
    },
    repositoryUrl: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: String,
      trim: true,
      default: '',
    },
    selectedFile: {
      type: String,
      required: [true, 'Selected file path is required'],
      trim: true,
    },
    language: {
      type: String,
      trim: true,
      default: 'text',
    },
    explanation: {
      type: String,
      required: [true, 'Explanation content is required'],
    },
    analysisData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

analysisSchema.index({ userId: 1, repositoryName: 1, selectedFile: 1 });
analysisSchema.index({ userId: 1, createdAt: -1 });

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
