const router = require('express').Router();
const User = require('../models/User');
const Note = require('../models/Note');
const { auth, authorize } = require('../middleware/auth');
const { getPagination, pageResult } = require('../utils/paginate');

router.use(auth, authorize('admin'));

// sorted by _id so the default index handles it
router.get('/users', async (req, res) => {
  const p = getPagination(req.query);
  const [data, total] = await Promise.all([
    User.find().sort({ _id: -1 }).skip(p.skip).limit(p.limit),
    User.estimatedDocumentCount(),
  ]);
  res.json(pageResult(data, total, p));
});

router.post('/users', async (req, res) => {
  const { name, email, password, role, interests } = req.body;
  const user = await User.create({ name, email, password, role, interests });
  res.status(201).json(user);
});

// scenario 1: single aggregate() call, $facet gives the page and total together
function interestsPipeline(interestList, { skip, limit }) {
  // $gt '' means at least one interest, still uses the interests index and skips users with none
  const match = interestList.length ? { interests: { $in: interestList } } : { interests: { $gt: '' } };
  return [
    { $match: match },
    { $project: { name: 1, email: 1, interests: 1 } },
    { $unwind: '$interests' },
    // after unwind, drop interests that were not asked for
    ...(interestList.length ? [{ $match: { interests: { $in: interestList } } }] : []),
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: { $push: { _id: '$_id', name: '$name', email: '$email' } },
      },
    },
    { $sort: { count: -1, _id: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } }],
        total: [{ $count: 'count' }],
      },
    },
  ];
}

router.get('/users/by-interest', async (req, res) => {
  const p = getPagination(req.query);
  const list = String(req.query.interests || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const [result] = await User.aggregate(interestsPipeline(list, p));
  res.json(pageResult(result.data, result.total[0]?.count || 0, p));
});

router.get('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// findById + save (not findOneAndUpdate) so the password hash hook runs
router.put('/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  for (const field of ['name', 'email', 'password', 'role', 'interests']) {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  }
  await user.save();
  res.json(user);
});

router.delete('/users/:id', async (req, res) => {
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot delete yourself' });
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  // clean up their notes too
  await Note.deleteMany({ user: user._id });
  res.json({ message: 'User deleted' });
});

// everyone's notes, optional ?userId= filter
router.get('/notes', async (req, res) => {
  const p = getPagination(req.query);
  const filter = req.query.userId ? { user: req.query.userId } : {};
  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(p.skip).limit(p.limit).populate('user', 'name email'),
    req.query.userId ? Note.countDocuments(filter) : Note.estimatedDocumentCount(),
  ]);
  res.json(pageResult(data, total, p));
});

module.exports = router;
module.exports.interestsPipeline = interestsPipeline;
