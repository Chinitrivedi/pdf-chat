const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getModel = () => genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const getEmbeddingModel = () => genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

module.exports = { getModel, getEmbeddingModel };