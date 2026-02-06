const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

if (OPENAI_API_KEY) {
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  /**
   * Summarize text using an OpenAI model (chat).
   * Returns a short summary string.
   */
  async function summarizeWithLLM(text) {
    if (!text || text.length < 20) return '';
    const prompt = `Summarize the following web page content in 3-6 concise bullet points (one sentence each):\n\n${text.slice(0, 4000)}`;
    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini', // replace with a model you have access to
      messages: [
        { role: 'system', content: 'You are a helpful summarization assistant.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.3
    });
    if (resp && resp.choices && resp.choices[0] && resp.choices[0].message) {
      return resp.choices[0].message.content;
    }
    return '';
  }

  module.exports = { summarizeWithLLM };
} else {
  async function summarizeWithLLM() {
    throw new Error('OPENAI_API_KEY not set. Set it in environment to enable summarization.');
  }
  module.exports = { summarizeWithLLM };
}