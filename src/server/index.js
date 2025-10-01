const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - these run on EVERY request
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Import routes
const helloRoutes = require('./routes/hello');

// Use routes
app.use('/', helloRoutes);

// Error handling middleware (catches any unhandled errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Try: curl http://localhost:${PORT}/hello_world`);
});

module.exports = app; // Export for testing
