import api from './api';

/**
 * Sprint 6: AI Chatbot API Services
 */

/**
 * Sends a user message to the AI Chatbot backend.
 * @param {string} message - The text message from the user
 * @param {Array} history - Optional recent conversation history
 */
export async function sendChatMessage(message, history = []) {
  const response = await api.post('/chatbot/', {
    message,
    history,
  });
  return response.data;
}

/**
 * Fetches initial chatbot status, greeting, and suggested queries.
 */
export async function getChatbotInfo() {
  const response = await api.get('/chatbot/');
  return response.data;
}
