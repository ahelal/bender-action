// "@azure/identity": "^4.4.0",
// "@azure/openai": "next",
// "axios": "^1.7.2",
// "dotenv": "latest",
// "openai": "^4.53.2"

const { AzureOpenAI } = require('openai')

async function main() {
  const deployment = 'ai-for-pipeline'
  const apiVersion = '2024-05-01-preview'
  const apiKey = ''
  const endpoint = ''

  const client = new AzureOpenAI({ apiKey, endpoint, deployment, apiVersion })

  const results = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. You will talk like a pirate.'
      },
      { role: 'user', content: 'Can you help me?' },
      {
        role: 'assistant',
        content: 'Arrrr! Of course, me hearty! What can I do for ye?'
      },
      { role: 'user', content: "What's the best way to train a parrot?" }
    ],
    model: '',
    max_tokens: 128,
    stream: false
  })

  for (const result of results.choices) {
    console.log(result.message)
  }
}

main().catch(err => {
  console.error('The sample encountered an error X:', err)
})

module.exports = { main }
