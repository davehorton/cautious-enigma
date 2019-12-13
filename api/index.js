const express = require('express');
const router = express.Router();

// Conferences
router.get   ('/conf',     require('./conferences/get-all'));
router.post  ('/conf',     require('./conferences/create'));
router.get   ('/conf/:id', require('./conferences/get-one'));
router.put   ('/conf/:id', require('./conferences/update'));
router.delete('/conf/:id', require('./conferences/delete'));

// Transcriptions
router.get   ('/conf/:id/trans', require('./transcriptions/get-all'));
router.get   ('/trans/:id',      require('./transcriptions/get-one'));
router.delete('/trans/:id',      require('./transcriptions/delete'));

// Utterances
router.get ('/trans/:id/utter', require('./utterances/get-all'));

module.exports = router;
