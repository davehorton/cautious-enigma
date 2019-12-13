const express = require('express');
const router = express.Router();

// Conferences
router.get   ('/conf',     require('./conferences/get-all'));
router.post  ('/conf',     require('./conferences/create'));
router.get   ('/conf/:id', require('./conferences/get-one'));
router.put   ('/conf/:id', require('./conferences/update'));
router.delete('/conf/:id', require('./conferences/delete'));

module.exports = router;
