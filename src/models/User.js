const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    interests: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

// login lookup + no duplicate emails
userSchema.index({ email: 1 }, { unique: true });
// for the group by interests aggregation (it's an array so this is multikey)
userSchema.index({ interests: 1 });
// profile, admin get user and admin list users all go through _id so no other index needed

// hash only when password changes
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// don't send the hash back
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
