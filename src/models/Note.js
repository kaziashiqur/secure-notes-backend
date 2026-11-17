const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

// my notes list -> filter by user, sort newest first (equality first then sort field)
// single note get/update/delete and admin all notes just use the default _id index
noteSchema.index({ user: 1, _id: -1 });

module.exports = mongoose.model('Note', noteSchema);
