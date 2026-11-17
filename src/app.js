const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
// frontend is on a different domain (netlify) so cors is needed
app.use(cors({ origin: process.env.CLIENT_URL || '*' }));

app.get('/', (req, res) => res.json({ message: 'Secure Notes API is running' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// turn mongoose / json errors into proper status codes
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.CastError) return res.status(400).json({ message: `Invalid ${err.path}` });
  if (err instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: err.message });
  if (err.code === 11000) return res.status(409).json({ message: 'Email already exists' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
