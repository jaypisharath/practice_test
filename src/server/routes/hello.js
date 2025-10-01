const express = require('express');
const router = express.Router();

// GET /hello_world endpoint
router.get('/hello_world', (req, res) => {
  // Return the exact response specified in requirements
  res.status(200).json({ hello: "world" });
});

module.exports = router;
