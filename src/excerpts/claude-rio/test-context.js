// https://github.com/alex-popov-tech/claude-rio/blob/97bdef62d434cf790fef20016148bde4a084929a/cli/utils/matcher-validator.js#L17-L40
/**
 * Create a test context for matcher validation
 * This simulates the context that matchers receive in real usage
 *
 * @returns {Object} Test context object
 */
function createTestContext() {
  return {
    prompt: 'test keywords build typescript compile check',
    cwd: process.cwd(),
    transcriptPath: '/tmp/test-transcript.jsonl',
    sessionId: 'test-session-id',
    permissionMode: 'ask',
    meta: {
      schemaVersion: '2.0',
    },
    transcript: {
      getConversationHistory: async () => [],
      getToolUsage: async () => [],
      getInitialMessage: async () => null,
      getAllMessages: async () => [],
    },
  };
}
