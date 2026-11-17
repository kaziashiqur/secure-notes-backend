require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Note = require('../src/models/Note');
const Post = require('../src/models/Post');

// wipes the db and adds some test data
async function seed() {
  await Promise.all([User.deleteMany({}), Note.deleteMany({}), Post.deleteMany({})]);
  // syncIndexes also drops any index that isn't in the schema
  await Promise.all([User.syncIndexes(), Note.syncIndexes(), Post.syncIndexes()]);

  const admin = await User.create({ name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin', interests: ['chess', 'coding'] });
  const alice = await User.create({ name: 'Alice', email: 'alice@test.com', password: 'alice123', interests: ['chess', 'reading'] });
  const bob = await User.create({ name: 'Bob', email: 'bob@test.com', password: 'bob12345', interests: ['reading', 'music', 'coding'] });
  const carol = await User.create({ name: 'Carol', email: 'carol@test.com', password: 'carol123', interests: [] });

  await Note.insertMany([
    { user: alice._id, title: 'Alice note 1', content: 'Buy milk' },
    { user: alice._id, title: 'Alice note 2', content: 'Practice openings' },
    { user: bob._id, title: 'Bob note 1', content: 'Guitar chords' },
    { user: admin._id, title: 'Admin note', content: 'Review users' },
  ]);
  await Post.insertMany([
    { author: alice._id, title: 'My favourite chess opening', body: 'Sicilian Defence' },
    { author: alice._id, title: 'Book review', body: 'Great book' },
    { author: bob._id, title: 'Hello world', body: 'First post' },
  ]);

  return { admin, alice, bob, carol };
}

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(seed)
    .then(() => {
      console.log('Seeded. Logins: admin@test.com/admin123, alice@test.com/alice123, bob@test.com/bob12345, carol@test.com/carol123');
      return mongoose.disconnect();
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = seed;
