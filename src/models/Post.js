const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
  },
  { timestamps: true }
);

// used by the $lookup in user posts (match author + sort by _id)
// public posts list sorts by _id so default index is enough there
postSchema.index({ author: 1, _id: -1 });

module.exports = mongoose.model('Post', postSchema);
