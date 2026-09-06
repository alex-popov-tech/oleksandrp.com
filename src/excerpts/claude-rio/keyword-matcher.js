// https://github.com/alex-popov-tech/claude-rio/blob/97bdef62d434cf790fef20016148bde4a084929a/examples/keyword/UserPromptSubmit.rio.matcher.cjs#L39-L64
module.exports = function (context) {
  // Keywords for a Docker helper skill
  // In your matcher, replace these with keywords relevant to your skill
  const keywords = [
    'docker',
    'container',
    'dockerfile',
    'docker-compose',
    'compose',
    'image',
    'containerize',
  ];

  // Convert prompt to lowercase for case-insensitive matching
  const prompt = context.prompt.toLowerCase();

  // Count how many keywords are present in the prompt
  const matchCount = keywords.filter((keyword) => prompt.includes(keyword)).length;

  // IMPORTANT: All fields are MANDATORY and must not be undefined/null
  return {
    version: '2.0', // Required: always "2.0"
    matchCount: matchCount, // Required: number of matches (0+)
    type: 'skill', // Required: "skill" or "agent"
  };
};
