const router = require('express').Router();
const Note = require('../models/Note');
const { auth } = require('../middleware/auth');
const { getPagination, pageResult } = require('../utils/paginate');

router.use(auth);

// my notes, newest first
router.get('/', async (req, res) => {
  const p = getPagination(req.query);
  const filter = { user: req.user._id };
  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(p.skip).limit(p.limit),
    Note.countDocuments(filter),
  ]);
  res.json(pageResult(data, total, p));
});

router.post('/', async (req, res) => {
  const note = await Note.create({ user: req.user._id, title: req.body.title, content: req.body.content });
  res.status(201).json(note);
});

// admin can open any note, others only their own
router.get('/:id', async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const note = await Note.findOne(filter);
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// user is part of the filter so someone else's note just gives 404
router.put('/:id', async (req, res) => {
  const update = {};
  if (req.body.title !== undefined) update.title = req.body.title;
  if (req.body.content !== undefined) update.content = req.body.content;
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, update, {
    new: true,
    runValidators: true,
  });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

router.delete('/:id', async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json({ message: 'Note deleted' });
});

module.exports = router;
