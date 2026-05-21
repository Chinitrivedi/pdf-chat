require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/pdf', require('./routes/pdf'));
app.use('/api/chat', require('./routes/chat'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'PDF Chat API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));