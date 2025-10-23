import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all domains
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://luantrongnguyen.github.io',
      'https://luantrongnguyen.github.io/merchants-interaction-tracking',
      'https://luannguyentrong-mango.phuhoangcar.com'
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200,
  });
  
  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 Backend server running on http://localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
