import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIInsightDto } from './dto/ai-insight.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { appConfig } from '../config/app.config';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(private readonly aiService: AIService) {}

  @Get('config')
  getConfig() {
    // Return current AI configuration (without exposing full API keys)
    return {
      provider: appConfig.aiProvider,
      hasOpenAIKey: !!appConfig.openaiApiKey,
      hasClaudeKey: !!appConfig.anthropicApiKey,
      hasGeminiKey: !!appConfig.googleApiKey,
      geminiKeyPreview: appConfig.googleApiKey ? `${appConfig.googleApiKey.substring(0, 15)}...` : 'not set',
    };
  }

  @Post('insight')
  async getInsight(@Body() dto: AIInsightDto, @Req() req: any) {
    // Backend will fetch merchant data itself, so we don't need merchantData from frontend
    const insight = await this.aiService.generateInsight(dto.question);
    
    return {
      insight,
      timestamp: new Date().toISOString(),
    };
  }
}

