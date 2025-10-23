export const CONFIG = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001',
  PASSSCODE: '130398',
  GOOGLE_CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || '525761389673-20k4bk13mnl18664fkqurfrso6h4a9k7.apps.googleusercontent.com',
} as const;
