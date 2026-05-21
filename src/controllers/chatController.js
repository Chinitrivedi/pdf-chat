const { getModel } = require('../config/gemini');
const { documentStore, getEmbedding, cosineSimilarity } = require('./pdfController');

const chat = async (req, res) => {
  try {
    const { docId, question } = req.body;

    if (!docId || !question) {
      return res.status(400).json({ message: 'docId and question are required' });
    }

    const doc = documentStore[docId];
    if (!doc) {
      return res.status(404).json({ message: 'Document not found. Please upload again.' });
    }

    // Get embedding for the question
    const questionEmbedding = await getEmbedding(question);

    // Find most similar chunks
    const similarities = doc.embeddings.map((embedding, index) => ({
      index,
      score: cosineSimilarity(questionEmbedding, embedding)
    }));

    similarities.sort((a, b) => b.score - a.score);
    const topChunks = similarities.slice(0, 4).map(s => doc.chunks[s.index]);

    // Build context
    const context = topChunks.join('\n\n');

    // Ask Gemini
    const model = getModel();
    const prompt = `You are a helpful assistant. Answer the question based ONLY on the provided context. 
If the answer is not in the context, say "I could not find that information in the document."

Context:
${context}

Question: ${question}

Answer:`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({
      question,
      answer,
      sourceChunks: topChunks.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { chat };