const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadPDF, getDocuments } = require('../controllers/pdfController');

router.post('/upload', upload.single('pdf'), uploadPDF);
router.get('/documents', getDocuments);

module.exports = router;