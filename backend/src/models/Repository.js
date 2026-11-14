import mongoose from 'mongoose';

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoId: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      default: '',
    },
    owner: {
      type: String,
      default: '',
    },
    ownerAvatar: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    stars: {
      type: Number,
      default: 0,
    },
    forks: {
      type: Number,
      default: 0,
    },
    watchers: {
      type: Number,
      default: 0,
    },
    openIssues: {
      type: Number,
      default: 0,
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    primaryLanguage: {
      type: String,
      default: 'JavaScript',
    },
    license: {
      type: String,
      default: 'MIT',
    },
    url: {
      type: String,
      default: '',
    },
    size: {
      type: mongoose.Schema.Types.Mixed,
      default: '0 MB',
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
    analysisStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    files: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    isLiveRepo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One unique record per user per repository fullName
repositorySchema.index({ userId: 1, fullName: 1 }, { unique: true });

const Repository = mongoose.model('Repository', repositorySchema);

export default Repository;

