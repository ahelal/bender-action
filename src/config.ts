// **** static application configuration ****

// Default Github API version
export const GithubAPIversion = '2022-11-28'

// Default max tokens for OpenAI
export const maxTokens = 384

// Default max recursion for OpenAI Job mode
export const maxRecursionJob = 3

// Default max recursion for OpenAI PR mode
export const maxRecursionPr = 2

// Default max word count for OpenAI PR mode
export const maxWordCountPr = 300

// Wait time in seconds before starting
export const waitTime = '1'

// Max input length for github action logs
export const MAX_INPUT_LOG_LENGTH = 20000

// Max input length for files
export const MAX_INPUT_FILES_LENGTH = MAX_INPUT_LOG_LENGTH

// Max number of regex patterns
export const MAX_REGEX_PATTERNS = 10

// WOrd to use to indicate that the content of a file is needed
export const CONTENT_OF_FILE_NEEDED = 'CONTENT_OF_FILE_NEEDED'
