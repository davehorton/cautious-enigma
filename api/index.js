const express = require('express');
const router = express.Router();
const YAML = require('yamljs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load(path.resolve(__dirname, '../api/swagger.yaml'));

// API Docs
router.use('/docs', swaggerUi.serve);
router.get('/docs', swaggerUi.setup(swaggerDocument));

// Web: Conferences
router.get   ('/conf',     require('./conferences/get-all'));
router.post  ('/conf',     require('./conferences/create'));
router.get   ('/conf/:id', require('./conferences/get-one'));
router.put   ('/conf/:id', require('./conferences/update'));
router.delete('/conf/:id', require('./conferences/delete'));

// Web: Transcriptions
router.get   ('/conf/:id/trans', require('./transcriptions/get-all'));
router.get   ('/trans/:id',      require('./transcriptions/get-one'));
router.delete('/trans/:id',      require('./transcriptions/delete'));

// Web: Utterances
router.get ('/trans/:id/utter', require('./utterances/get-all'));

// VoIP
router.post('/voip/start-transcription/:pin', require('./voip/start-transcription'));
router.put ('/voip/end-transcription/:pin',   require('./voip/end-transcription'));
router.post('/voip/add-utterance/:pin',       require('./voip/add-utterance'));

module.exports = router;
