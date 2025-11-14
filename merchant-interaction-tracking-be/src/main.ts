import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Resolve database path TRƯỚC KHI import AppModule
// Để đảm bảo DATABASE_PATH được set đúng trước khi TypeORM module load
function resolveDatabasePath(): string {
  let databasePath = process.env.DATABASE_PATH;
  
  if (!databasePath) {
    // Xác định project root
    // __dirname trong dist/main.js sẽ là .../dist
    // Cần lên 1 level để đến project root
    const projectRoot = path.resolve(__dirname, '..');
    databasePath = path.resolve(projectRoot, 'data', 'notes.db');
  } else if (!path.isAbsolute(databasePath)) {
    // Nếu là relative path, resolve từ project root
    const projectRoot = path.resolve(__dirname, '..');
    databasePath = path.resolve(projectRoot, databasePath);
  }
  
  // Đảm bảo thư mục chứa database tồn tại
  const dataDir = path.dirname(databasePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`✅ Created data directory: ${dataDir}`);
  }
  
  // Set vào process.env để app.module.ts sử dụng
  process.env.DATABASE_PATH = databasePath;
  
  return databasePath;
}

// Resolve database path trước khi import AppModule
const databasePath = resolveDatabasePath();

// Import AppModule sau khi đã set DATABASE_PATH
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Log configuration on startup
  console.log('\n=== Configuration ===');
  console.log('Database Path:', databasePath);
  console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (default: rule-based)');
  console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 15)}...` : 'not set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
  console.log('OLLAMA_BASE_URL:', process.env.OLLAMA_BASE_URL || 'http://localhost:11434');
  console.log('DEEPSEEK_MODEL:', process.env.DEEPSEEK_MODEL || 'deepseek-chat');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('========================\n');
  
  // Enable CORS for all domains - Simple configuration
  app.enableCors({
    origin: '*', // Allow all origins
    methods: '*', // Allow all methods
    allowedHeaders: '*', // Allow all headers
    credentials: false, // Disable credentials for wildcard origin
  });

  // Handle preflight requests manually
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Disable cache in dev mode
    if (process.env.BYPASS_AUTH === 'true' || process.env.NODE_ENV === 'development') {
      res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.header('Pragma', 'no-cache');
      res.header('Expires', '0');
    }
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: false,
  }));
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Backend server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
