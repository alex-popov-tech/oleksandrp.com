// https://github.com/alex-popov-tech/claude-rio/blob/97bdef62d434cf790fef20016148bde4a084929a/hooks/utils/transcript.cjs#L21-L47
/**
 * Get conversation history from transcript (cached).
 * Returns array of {role: 'user'|'assistant', content: string} objects.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<Array<{role: string, content: string}>>}
 */
async function getConversationHistory(transcriptPath) {
  if (!cache.conversationHistory) {
    cache.conversationHistory = await parseConversationHistory(transcriptPath);
  }
  return cache.conversationHistory;
}

/**
 * Get tool usage from transcript (cached).
 * Returns array of {tool: string, input: object, timestamp: string} objects.
 *
 * @param {string} transcriptPath - Path to transcript file
 * @returns {Promise<Array<{tool: string, input: object, timestamp: string}>>}
 */
async function getToolUsage(transcriptPath) {
  if (!cache.toolUsage) {
    cache.toolUsage = await parseToolUsage(transcriptPath);
  }
  return cache.toolUsage;
}
