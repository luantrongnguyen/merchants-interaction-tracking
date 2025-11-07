import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Log AI configuration on startup
  console.log('\n=== AI Configuration ===');
  console.log('AI_PROVIDER:', process.env.AI_PROVIDER || 'not set (default: rule-based)');
  console.log('GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 15)}...` : 'not set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'not set');
  console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? 'set' : 'not set');
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
