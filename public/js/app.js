const API = 'http://localhost:5000/api';
let currentDocId = null;

// Handle PDF upload
async function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const statusEl = document.getElementById('upload-status');
  statusEl.innerHTML = `<div class="status-loading"><span class="spinner"></span> Processing PDF, please wait...</div>`;

  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const res = await fetch(`${API}/pdf/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.innerHTML = `<div class="status-error">${data.message}</div>`;
      return;
    }

    currentDocId = data.docId;

    statusEl.innerHTML = `<div class="status-success">PDF processed successfully</div>`;

    // Show doc info
    document.getElementById('doc-name').textContent = data.fileName;
    document.getElementById('doc-chunks').textContent = `${data.totalChunks} sections indexed`;
    document.getElementById('doc-info').style.display = 'block';

    // Enable chat
    document.getElementById('question-input').disabled = false;
    document.getElementById('send-btn').disabled = false;
    document.getElementById('question-input').focus();

    // Clear welcome message
    document.getElementById('chat-messages').innerHTML = '';

    addMessage('ai', `I have read "${data.fileName}". You can now ask me anything about this document.`);

  } catch (err) {
    statusEl.innerHTML = `<div class="status-error">Upload failed. Try again.</div>`;
  }
}

// Send message
async function sendMessage() {
  const input = document.getElementById('question-input');
  const question = input.value.trim();
  if (!question || !currentDocId) return;

  input.value = '';
  addMessage('user', question);

  // Show typing indicator
  const typingId = showTyping();

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId: currentDocId, question })
    });

    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok) {
      addMessage('ai', 'Something went wrong. Please try again.');
      return;
    }

    addMessage('ai', data.answer);

  } catch (err) {
    removeTyping(typingId);
    addMessage('ai', 'Something went wrong. Please try again.');
  }
}

// Add message to chat
function addMessage(role, text) {
  const container = document.getElementById('chat-messages');

  const div = document.createElement('div');
  div.className = `message ${role}`;

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = role === 'user' ? 'You' : 'AI';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = text.replace(/\n/g, '<br/>');

  div.appendChild(label);
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// Typing indicator
function showTyping() {
  const container = document.getElementById('chat-messages');
  const id = 'typing-' + Date.now();

  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = id;

  const label = document.createElement('div');
  label.className = 'message-label';
  label.textContent = 'AI';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;

  div.appendChild(label);
  div.appendChild(indicator);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// Reset document
function resetDocument() {
  currentDocId = null;
  document.getElementById('doc-info').style.display = 'none';
  document.getElementById('upload-status').innerHTML = '';
  document.getElementById('pdf-input').value = '';
  document.getElementById('question-input').disabled = true;
  document.getElementById('send-btn').disabled = true;
  document.getElementById('chat-messages').innerHTML = `
    <div class="welcome-message">
      <div class="welcome-icon">💬</div>
      <h3>Upload a PDF to get started</h3>
      <p>Once uploaded, you can ask any question about the document content.</p>
    </div>`;
}