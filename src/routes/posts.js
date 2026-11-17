const router = require('express').Router();
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { getPagination, pageResult } = require('../utils/paginate');

router.use(auth);

// posts are public, everyone sees all of them
router.get('/', async (req, res) => {
  const p = getPagination(req.query);
  const [data, total] = await Promise.all([
    Post.find().sort({ _id: -1 }).skip(p.skip).limit(p.limit).populate('author', 'name'),
    Post.estimatedDocumentCount(),
  ]);
  res.json(pageResult(data, total, p));
});

router.post('/', async (req, res) => {
  const post = await Post.create({ author: req.user._id, title: req.body.title, body: req.body.body });
  res.status(201).json(post);
});

// scenario 2: start from the user then $lookup their posts
function userPostsPipeline(userId, { skip, limit }) {
  return [
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    { $project: { name: 1, email: 1 } },
    {
      $lookup: {
        from: 'posts',
        localField: '_id',
        foreignField: 'author',
        pipeline: [
          // author + _id index covers this sort
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { title: 1, body: 1, createdAt: 1 } },
        ],
        as: 'posts',
      },
    },
  ];
}

router.get('/user/:userId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ message: 'Invalid user id' });
  const p = getPagination(req.query);
  const [result] = await User.aggregate(userPostsPipeline(req.params.userId, p));
  if (!result) return res.status(404).json({ message: 'User not found' });
  res.json({ user: { _id: result._id, name: result.name, email: result.email }, page: p.page, limit: p.limit, posts: result.posts });
});

module.exports = router;
module.exports.userPostsPipeline = userPostsPipeline;
