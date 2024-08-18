// **** static application configuration ****

// Default Public Github API version
export const GITHUB_API_VERSION = '2022-11-28'

// Default max tokens for OpenAI
export const MAX_TOKENS = 384

// Default max recursion for OpenAI Job mode
export const MAX_RECURSION_OPENAI_REQUEST_JOB = 2

// Default max recursion for OpenAI PR mode
export const MAX_RECURSION_OPENAI_REQUEST_PR = 2

// Default max word count for OpenAI PR mode
export const MAX_WORD_COUNT_REPLY_PR = 300

// Default max word count for OpenAI JOB mode
export const MAX_WORD_COUNT_REPLY_JOB = 500

// Wait time in seconds before starting
export const WAIT_TIME = '1'

// Max input length for github action logs
export const MAX_INPUT_LOG_LENGTH = 2000

// Max input length for files
export const MAX_INPUT_FILES_LENGTH = MAX_INPUT_LOG_LENGTH

// Max number of regex patterns that user is allowed to provide
export const MAX_REGEX_PATTERNS = 5

// Words to strip from the job output
export const STRIP_WORDS_FROM_JOB = [':debug::', ':notice::', ':info::']

// Lines to strip from the job output
export const STRIP_LINES_FROM_JOB = ['::group::', '::endgroup::']

// Secerts to mask in the job output
export const MASK_CONTEXT_SECRETS = [
  'ghToken',
  'azOpenaiDeployment',
  'azOpenaiKey'
]

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
