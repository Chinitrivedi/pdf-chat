const fs = require('fs');
const pdfParse = require('pdf-parse');
const { getEmbeddingModel } = require('../config/gemini');

// In-memory store (simple, no DB needed)
const documentStore = {};

// Split text into chunks
const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  return chunks;
};

// Get embedding for a text
const getEmbedding = async (text) => {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// Cosine similarity between two vectors
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
};

// Upload and process PDF
const uploadPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text from PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from PDF' });
    }

    // Split into chunks
    const chunks = chunkText(text);
    console.log(`Processing ${chunks.length} chunks...`);

    // Get embeddings for all chunks
    const embeddings = [];
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk);
      embeddings.push(embedding);
    }

    // Store in memory
    const docId = Date.now().toString();
    documentStore[docId] = {
      fileName,
      chunks,
      embeddings,
      uploadedAt: new Date()
    };

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      docId,
      fileName,
      totalChunks: chunks.length,
      message: 'PDF processed successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// Get all uploaded documents
const getDocuments = (req, res) => {
  const docs = Object.entries(documentStore).map(([id, doc]) => ({
    docId: id,
    fileName: doc.fileName,
    totalChunks: doc.chunks.length,
    uploadedAt: doc.uploadedAt
  }));
  res.json(docs);
};

module.exports = { uploadPDF, getDocuments, documentStore, getEmbedding, cosineSimilarity };