// Log environment variables for debugging (only in development)
if (process.env.NODE_ENV !== 'production') {
  console.log('[Config] Environment variables:');
  console.log('  AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (default: rule-based)');
  console.log('  GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 10)}...` : 'not set');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
  console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
  console.log('  OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
  console.log('  DEEPSEEK_MODEL:', process.env.DEEPSEEK_MODEL || 'deepseek-chat');
}

export const appConfig = {
  spreadsheetId: '1UhHDxAi74gnflgxQhlnF8ZniWRQIC0cVNJkzP4NnA5E',
  callLogsSpreadsheetId: '1i21AL6AkF-0uluQjPwAOQhqy3-ujiqe1RiiAARyTiok',
  googleCredentialsPath: './google-credentials.json',
  port: 3001,
  passcode: process.env.PASSCODE || '130398',
  // AI Service Configuration
  aiProvider: (process.env.AI_PROVIDER || 'rule-based').toLowerCase(), // 'rule-based' | 'openai' | 'claude' | 'gemini' | 'deepseek'
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  googleApiKey: process.env.GOOGLE_AI_API_KEY || '',
  // Deepseek/Ollama Configuration
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  deepseekModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
};
