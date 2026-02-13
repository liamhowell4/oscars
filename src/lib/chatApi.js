import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const chatCallable = functions
  ? httpsCallable(functions, 'chat', { timeout: 90000 })
  : null;

export async function sendChatMessage(messages, userContext) {
  if (!chatCallable) {
    throw new Error('Firebase Functions not initialized');
  }
  const result = await chatCallable({ messages, userContext });
  return result.data;
}

export async function resumeChat(conversationState, toolResults) {
  if (!chatCallable) {
    throw new Error('Firebase Functions not initialized');
  }
  const result = await chatCallable({ conversationState, toolResults });
  return result.data;
}
