const fs = require('fs').promises;
const path = require('path');

const CHAT_HISTORY_FILE = path.join(__dirname, 'chat_histories.json');

// Initialize chat histories file if it doesn't exist
async function initializeChatHistories() {
  try {
    await fs.access(CHAT_HISTORY_FILE);
  } catch {
    await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify({}));
  }
}

// Load all chat histories
async function loadChatHistories() {
  try {
    const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading chat histories:', error);
    return {};
  }
}

// Save chat histories
async function saveChatHistories(histories) {
  try {
    await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(histories, null, 2));
  } catch (error) {
    console.error('Error saving chat histories:', error);
  }
}

// Get chat history for a specific token
async function getChatHistory(token) {
  const histories = await loadChatHistories();
  return histories[token] || [];
}

// Save chat history for a specific token
async function saveChatHistory(token, messages) {
  const histories = await loadChatHistories();
  histories[token] = messages;
  await saveChatHistories(histories);
}

// List all available chat tokens
async function listChatTokens() {
  const histories = await loadChatHistories();
  return Object.keys(histories).map(token => ({
    token,
    lastMessage: histories[token][0]?.content || '',
    // lastMessage: histories[token][histories[token].length - 1]?.content || '',
    timestamp: histories[token][0]?.timestamp || ''
    // timestamp: histories[token][histories[token].length - 1]?.timestamp || ''
  }));
}

module.exports = {
  initializeChatHistories,
  getChatHistory,
  saveChatHistory,
  listChatTokens
}; 