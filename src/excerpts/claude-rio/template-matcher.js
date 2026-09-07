// https://github.com/alex-popov-tech/claude-rio/blob/97bdef62d434cf790fef20016148bde4a084929a/matchers/UserPromptSubmit.rio.matcher.cjs#L20-L37
module.exports = function (context) {
  const prompt = context.prompt.toLowerCase();

  // TODO: Haiku fills this array with relevant keywords
  const keywords = [
    // Keywords will be inserted here by setup command
  ];

  // Count matching keywords
  const matchCount = keywords.filter((keyword) => prompt.includes(keyword)).length;

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '2.0', // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: 'skill', // TODO: Haiku sets to 'skill' or 'agent' based on context
  };
};
