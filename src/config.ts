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

// Default max word count for OpenAI JOB mode
export const maxWordCountJob = 500

// Wait time in seconds before starting
export const waitTime = '1'

// Max input length for github action logs
export const MAX_INPUT_LOG_LENGTH = 20000

// Max input length for files
export const MAX_INPUT_FILES_LENGTH = MAX_INPUT_LOG_LENGTH

// Max number of regex patterns that user is allowed to provide
export const MAX_REGEX_PATTERNS = 5

// Max char of  each regex pattern
export const MAX_REGEX_CHARS = 20

// The magic symbol used in openai responses
export const MAGIC_SYMBOL = '#'

// Word to use to indicate that the content of a file is needed
export const CMD_INCLUDE_FILE = `${MAGIC_SYMBOL}CMD_INCLUDE_FILE`

// Word to use to indicate that openai is stuck and can't provide a response
export const CMD_NO_SUFFICIENT_INFO = `${MAGIC_SYMBOL}CMD_NO_SUFFICIENT_INFO`

// Word to use to indicate reference to a line in a file
export const CMD_LINE = `${MAGIC_SYMBOL}L`

// TODO limit the number of files to process
// Max line length per file
// export const maxLineLengthPerFile = 5000

export const stripWords = [':debug::', ':notice::', ':info::']
export const stripLinesStartingWith = ['::group::', '::endgroup::']
