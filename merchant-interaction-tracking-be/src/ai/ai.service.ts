import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { MerchantService } from '../merchant/merchant.service';
import { appConfig } from '../config/app.config';

interface MerchantData {
  name: string;
  storeId?: string;
  status?: string;
  supportLogs?: Array<{
    date: string;
    time: string;
    issue: string;
    category?: string;
    supporter: string;
  }>;
  lastInteractionDate?: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  private aiProvider: string;
  private googleApiKey: string;

  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly merchantService: MerchantService,
    private readonly configService: ConfigService,
  ) {
    // Get config from ConfigService (more reliable than direct process.env)
    this.aiProvider = (this.configService.get<string>('AI_PROVIDER') || 'rule-based').toLowerCase();
    this.googleApiKey = this.configService.get<string>('GOOGLE_AI_API_KEY') || '';
    
    // Also check appConfig as fallback
    if (!this.aiProvider || this.aiProvider === 'rule-based') {
      this.aiProvider = appConfig.aiProvider;
    }
    if (!this.googleApiKey) {
      this.googleApiKey = appConfig.googleApiKey;
    }
    
    // Log AI configuration when service is initialized
    this.logger.log(`[AIService] Initialized with provider: ${this.aiProvider}`);
    this.logger.log(`[AIService] Gemini API key present: ${!!this.googleApiKey}`);
    if (this.googleApiKey) {
      this.logger.log(`[AIService] Gemini API key preview: ${this.googleApiKey.substring(0, 15)}...`);
    }
  }

  async generateInsight(question: string): Promise<string> {
    try {
      // Get merchant data from backend (don't rely on frontend data)
      const merchants = await this.merchantService.findAll();
      
      if (!merchants || merchants.length === 0) {
        return 'I don\'t have access to merchant data at the moment. Please ensure the data is synced and try again.';
      }

      // Convert to MerchantData format and calculate status if not present
      const merchantData: MerchantData[] = merchants.map(m => {
        // Calculate status based on lastInteractionDate if not present
        let status = m.status;
        if (!status && m.lastInteractionDate) {
          const lastDate = new Date(m.lastInteractionDate);
          const now = new Date();
          const daysSinceLastInteraction = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceLastInteraction <= 30) {
            status = 'green';
          } else if (daysSinceLastInteraction <= 90) {
            status = 'orange';
          } else {
            status = 'red';
          }
        } else if (!status) {
          status = 'red'; // Default to red if no interaction date
        }

        return {
          name: m.name,
          storeId: m.storeId,
          status: status,
          supportLogs: m.supportLogs || [],
          lastInteractionDate: m.lastInteractionDate,
        };
      });

      // Analyze merchant data
      const analysis = this.analyzeMerchantData(merchantData);
      
      // Log current AI provider configuration for debugging
      this.logger.log(`[AI Service] Current provider: ${this.aiProvider}, API key present: ${!!this.googleApiKey}`);
      
      // Use AI service based on configuration
      switch (this.aiProvider) {
        case 'openai':
          const openaiKey = this.configService.get<string>('OPENAI_API_KEY') || appConfig.openaiApiKey;
          if (openaiKey) {
            this.logger.log('[AI Service] Using OpenAI');
            return await this.generateInsightWithOpenAI(question, analysis, merchantData);
          }
          this.logger.warn('[AI Service] OpenAI provider selected but API key is missing');
          break;
        case 'claude':
          const claudeKey = this.configService.get<string>('ANTHROPIC_API_KEY') || appConfig.anthropicApiKey;
          if (claudeKey) {
            this.logger.log('[AI Service] Using Claude');
            return await this.generateInsightWithClaude(question, analysis, merchantData);
          }
          this.logger.warn('[AI Service] Claude provider selected but API key is missing');
          break;
        case 'gemini':
          if (this.googleApiKey) {
            this.logger.log('[AI Service] Using Google Gemini');
            return await this.generateInsightWithGemini(question, analysis, merchantData);
          }
          this.logger.warn('[AI Service] Gemini provider selected but API key is missing');
          break;
        default:
          // Use rule-based analysis by default
          this.logger.log(`[AI Service] Using rule-based analysis (provider: ${this.aiProvider})`);
          return this.generateInsightFromAnalysis(question, analysis, merchantData);
      }
      
      // Fallback to rule-based if AI provider is configured but API key is missing
      this.logger.warn(`[AI Service] AI provider '${this.aiProvider}' is configured but API key is missing. Using rule-based analysis.`);
      return this.generateInsightFromAnalysis(question, analysis, merchantData);
    } catch (error) {
      this.logger.error('Error generating AI insight:', error);
      return 'I apologize, but I encountered an error while analyzing the data. Please try again or rephrase your question.';
    }
  }

  private async generateInsightWithOpenAI(
    question: string,
    analysis: any,
    merchants: MerchantData[]
  ): Promise<string> {
    try {
      // Check if question is about a specific merchant
      const specificMerchant = this.findSpecificMerchant(question, merchants);
      
      // Prepare summary data for OpenAI (to avoid token limits)
      const summary = {
        totalMerchants: analysis.totalMerchants,
        totalInteractions: analysis.totalInteractions,
        statusDistribution: analysis.statusCounts,
        terminalIssues: analysis.terminalIssues,
        recentInteractions: analysis.recentInteractions,
        topCategories: analysis.topCategories.slice(0, 5),
        topMerchants: analysis.merchantsByInteractions.slice(0, 10),
      };

      // Build prompt based on whether it's about a specific merchant
      let prompt: string;
      
      if (specificMerchant) {
        // Include detailed interaction data for specific merchant
        const interactions = specificMerchant.supportLogs || [];
        const interactionsText = interactions.length > 0
          ? interactions.map((log: any, idx: number) => 
              `${idx + 1}. ${log.date} ${log.time || ''} - ${log.issue}${log.category ? ` (${log.category})` : ''}${log.supporter ? ` - Supporter: ${log.supporter}` : ''}`
            ).join('\n')
          : 'No interactions found.';
        
        prompt = `Answer about merchant: ${specificMerchant.name}${specificMerchant.storeId ? ` (Store ID: ${specificMerchant.storeId})` : ''}

Merchant Details:
- Status: ${specificMerchant.status || 'unknown'}
- Last Interaction: ${specificMerchant.lastInteractionDate || 'N/A'}
- Total Interactions: ${interactions.length}

Interaction Details:
${interactionsText}

Question: ${question}

Provide detailed answer about this merchant's interactions. Use markdown formatting.`;
      } else {
        // General analysis with summary data
        prompt = `You are an AI assistant helping analyze merchant interaction data. 

Data Summary:
- Total Merchants: ${summary.totalMerchants}
- Total Interactions: ${summary.totalInteractions}
- Status Distribution: Green: ${summary.statusDistribution.green}, Orange: ${summary.statusDistribution.orange}, Red: ${summary.statusDistribution.red}
- Terminal Issues: ${summary.terminalIssues}
- Recent Interactions (7 days): ${summary.recentInteractions}
- Top Categories: ${summary.topCategories.map(([cat, count]: [string, number]) => `${cat} (${count})`).join(', ')}
- Top Merchants by Interactions: ${summary.topMerchants.map((m: any) => `${m.name} (${m.interactions})`).join(', ')}

User Question: ${question}

Please provide a helpful, insightful analysis based on this data. Be concise but informative. Use markdown formatting for better readability.`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${appConfig.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant that analyzes merchant interaction data and provides insights.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error('OpenAI API error:', errorData);
        // Fallback to rule-based analysis
        return this.generateInsightFromAnalysis(question, analysis, merchants);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || this.generateInsightFromAnalysis(question, analysis, merchants);
    } catch (error) {
      this.logger.error('Error calling OpenAI API:', error);
      // Fallback to rule-based analysis
      return this.generateInsightFromAnalysis(question, analysis, merchants);
    }
  }

  private async generateInsightWithClaude(
    question: string,
    analysis: any,
    merchants: MerchantData[]
  ): Promise<string> {
    try {
      // Check if question is about a specific merchant
      const specificMerchant = this.findSpecificMerchant(question, merchants);
      
      // Prepare summary data for Claude (to avoid token limits)
      const summary = {
        totalMerchants: analysis.totalMerchants,
        totalInteractions: analysis.totalInteractions,
        statusDistribution: analysis.statusCounts,
        terminalIssues: analysis.terminalIssues,
        recentInteractions: analysis.recentInteractions,
        topCategories: analysis.topCategories.slice(0, 5),
        topMerchants: analysis.merchantsByInteractions.slice(0, 10),
      };

      // Build prompt based on whether it's about a specific merchant
      let prompt: string;
      
      if (specificMerchant) {
        // Include detailed interaction data for specific merchant
        const interactions = specificMerchant.supportLogs || [];
        const interactionsText = interactions.length > 0
          ? interactions.map((log: any, idx: number) => 
              `${idx + 1}. ${log.date} ${log.time || ''} - ${log.issue}${log.category ? ` (${log.category})` : ''}${log.supporter ? ` - Supporter: ${log.supporter}` : ''}`
            ).join('\n')
          : 'No interactions found.';
        
        prompt = `Answer about merchant: ${specificMerchant.name}${specificMerchant.storeId ? ` (Store ID: ${specificMerchant.storeId})` : ''}

Merchant Details:
- Status: ${specificMerchant.status || 'unknown'}
- Last Interaction: ${specificMerchant.lastInteractionDate || 'N/A'}
- Total Interactions: ${interactions.length}

Interaction Details:
${interactionsText}

Question: ${question}

Provide detailed answer about this merchant's interactions. Use markdown formatting.`;
      } else {
        // General analysis with summary data
        prompt = `You are an AI assistant helping analyze merchant interaction data. 

Data Summary:
- Total Merchants: ${summary.totalMerchants}
- Total Interactions: ${summary.totalInteractions}
- Status Distribution: Green: ${summary.statusDistribution.green}, Orange: ${summary.statusDistribution.orange}, Red: ${summary.statusDistribution.red}
- Terminal Issues: ${summary.terminalIssues}
- Recent Interactions (7 days): ${summary.recentInteractions}
- Top Categories: ${summary.topCategories.map(([cat, count]: [string, number]) => `${cat} (${count})`).join(', ')}
- Top Merchants by Interactions: ${summary.topMerchants.map((m: any) => `${m.name} (${m.interactions})`).join(', ')}

User Question: ${question}

Please provide a helpful, insightful analysis based on this data. Be concise but informative. Use markdown formatting for better readability.`;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': appConfig.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error('Anthropic Claude API error:', errorData);
        // Fallback to rule-based analysis
        return this.generateInsightFromAnalysis(question, analysis, merchants);
      }

      const data = await response.json();
      return data.content[0]?.text || this.generateInsightFromAnalysis(question, analysis, merchants);
    } catch (error) {
      this.logger.error('Error calling Anthropic Claude API:', error);
      // Fallback to rule-based analysis
      return this.generateInsightFromAnalysis(question, analysis, merchants);
    }
  }

  private async generateInsightWithGemini(
    question: string,
    analysis: any,
    merchants: MerchantData[]
  ): Promise<string> {
    try {
      // Check if question is about a specific merchant
      const specificMerchant = this.findSpecificMerchant(question, merchants);
      
      // Prepare summary data for Gemini (to avoid token limits)
      const summary = {
        totalMerchants: analysis.totalMerchants,
        totalInteractions: analysis.totalInteractions,
        statusDistribution: analysis.statusCounts,
        terminalIssues: analysis.terminalIssues,
        recentInteractions: analysis.recentInteractions,
        topCategories: analysis.topCategories.slice(0, 5),
        topMerchants: analysis.merchantsByInteractions.slice(0, 5), // Reduced from 10 to 5
      };

      // Build prompt based on whether it's about a specific merchant
      let prompt: string;
      
      if (specificMerchant) {
        // Include detailed interaction data for specific merchant
        const interactions = specificMerchant.supportLogs || [];
        const interactionsText = interactions.length > 0
          ? interactions.map((log: any, idx: number) => 
              `${idx + 1}. ${log.date} ${log.time || ''} - ${log.issue}${log.category ? ` (${log.category})` : ''}${log.supporter ? ` - Supporter: ${log.supporter}` : ''}`
            ).join('\n')
          : 'No interactions found.';
        
        prompt = `Answer about merchant: ${specificMerchant.name}${specificMerchant.storeId ? ` (Store ID: ${specificMerchant.storeId})` : ''}

Merchant Details:
- Status: ${specificMerchant.status || 'unknown'}
- Last Interaction: ${specificMerchant.lastInteractionDate || 'N/A'}
- Total Interactions: ${interactions.length}

Interaction Details:
${interactionsText}

Question: ${question}

Provide detailed answer about this merchant's interactions. Use markdown formatting.`;
      } else {
        // General analysis with summary data
        prompt = `Analyze merchant data and answer concisely.

Data:
- Merchants: ${summary.totalMerchants}, Interactions: ${summary.totalInteractions}
- Status: 🟢${summary.statusDistribution.green} 🟠${summary.statusDistribution.orange} 🔴${summary.statusDistribution.red}
- Issues: ${summary.terminalIssues}, Recent 7d: ${summary.recentInteractions}
- Top Categories: ${summary.topCategories.map(([cat, count]: [string, number]) => `${cat}(${count})`).join(', ')}
- Top Merchants: ${summary.topMerchants.map((m: any) => `${m.name}(${m.interactions})`).join(', ')}

Question: ${question}

Answer in markdown. Be concise and focus on key insights.`;
      }

      // Try different models and API endpoints
      // Based on available models from Google AI Studio
      // Priority: latest stable models first, then fallback options
      const modelsToTry = [
        { model: 'gemini-2.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
        { model: 'gemini-2.5-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
        { model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
        { model: 'gemini-flash-latest', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
        { model: 'gemini-pro-latest', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' },
        { model: 'gemini-2.5-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
        { model: 'gemini-2.5-pro', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
        { model: 'gemini-2.0-flash', baseUrl: 'https://generativelanguage.googleapis.com/v1' },
      ];

      let lastError: any = null;
      let response: Response | null = null;
      let successfulModel: string | null = null;

      for (const { model, baseUrl } of modelsToTry) {
        // Extract version from baseUrl
        const version = baseUrl.includes('/v1beta') ? 'v1beta' : 'v1';
        const apiUrl = `${baseUrl}/models/${model}:generateContent?key=${this.googleApiKey}`;
        
        this.logger.log(`[Gemini] Trying model: ${model} with ${version} API`);
        
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4096, // Increased to avoid MAX_TOKENS cutoff
              },
            }),
          });

          if (response.ok) {
            successfulModel = model;
            this.logger.log(`[Gemini] ✅ Successfully using model: ${model} with ${version} API`);
            break; // Success, exit loop
          } else {
            const errorText = await response.text();
            try {
              lastError = JSON.parse(errorText);
            } catch {
              lastError = { message: errorText };
            }
            this.logger.warn(`[Gemini] Model ${model} (${version}) failed: ${response.status} - ${lastError.error?.message || lastError.message || 'Unknown error'}`);
            response = null; // Reset for next try
          }
        } catch (error) {
          this.logger.warn(`[Gemini] Error trying model ${model} (${version}):`, error);
          lastError = error;
          response = null;
        }
      }

      if (!response || !response.ok) {
        this.logger.error(`[Gemini] ❌ All models failed. Last error:`, lastError);
        this.logger.error(`[Gemini] Please check your API key and available models at: https://ai.google.dev/models`);
        // Fallback to rule-based analysis
        return this.generateInsightFromAnalysis(question, analysis, merchants);
      }

      const data = await response.json();
      
      // Handle Gemini API response structure
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const content = candidate.content;
        
        // Check for finish reason
        if (candidate.finishReason === 'MAX_TOKENS') {
          this.logger.warn(`[Gemini] Response truncated due to MAX_TOKENS limit. Consider increasing maxOutputTokens.`);
        }
        
        // Try to extract text from content.parts
        if (content && content.parts && content.parts.length > 0) {
          const text = content.parts
            .map((part: any) => part.text || '')
            .filter((text: string) => text.length > 0)
            .join('');
          
          if (text) {
            this.logger.log(`[Gemini] ✅ Successfully extracted ${text.length} characters from response`);
            return text;
          }
        }
        
        // Log full response structure for debugging if no text found
        this.logger.warn(`[Gemini] Response structure - candidate:`, JSON.stringify(candidate, null, 2));
        this.logger.warn(`[Gemini] Content structure:`, JSON.stringify(content, null, 2));
      }
      
      // If response structure is unexpected, fallback
      this.logger.warn('[Gemini] Unexpected response structure, falling back to rule-based analysis');
      this.logger.warn('[Gemini] Full response:', JSON.stringify(data, null, 2));
      return this.generateInsightFromAnalysis(question, analysis, merchants);
    } catch (error) {
      this.logger.error('Error calling Google Gemini API:', error);
      // Fallback to rule-based analysis
      return this.generateInsightFromAnalysis(question, analysis, merchants);
    }
  }

  private analyzeMerchantData(merchants: MerchantData[]) {
    const totalMerchants = merchants.length;
    const totalInteractions = merchants.reduce((sum, m) => sum + (m.supportLogs?.length || 0), 0);
    
    // Status distribution
    const statusCounts = { green: 0, orange: 0, red: 0 };
    merchants.forEach(m => {
      if (m.status === 'green') statusCounts.green++;
      else if (m.status === 'orange') statusCounts.orange++;
      else if (m.status === 'red') statusCounts.red++;
    });

    // Category analysis
    const categoryMap = new Map<string, number>();
    const terminalKeywords = ['terminal', 'disconnected', 'processing', 'connection', 'connectivity', 'network', 'offline', 'online'];
    let terminalIssues = 0;

    merchants.forEach(m => {
      (m.supportLogs || []).forEach(log => {
        const category = log.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        
        if (terminalKeywords.some(keyword => category.toLowerCase().includes(keyword))) {
          terminalIssues++;
        }
      });
    });

    // Top merchants by interactions
    const merchantsByInteractions = merchants
      .map(m => ({
        name: m.name,
        storeId: m.storeId,
        interactions: m.supportLogs?.length || 0,
      }))
      .sort((a, b) => b.interactions - a.interactions)
      .slice(0, 10);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentInteractions = merchants.reduce((sum, m) => {
      return sum + (m.supportLogs || []).filter(log => {
        const logDate = new Date(log.date);
        return logDate >= sevenDaysAgo;
      }).length;
    }, 0);

    // Category distribution
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalMerchants,
      totalInteractions,
      statusCounts,
      terminalIssues,
      merchantsByInteractions,
      recentInteractions,
      topCategories,
      categoryMap,
    };
  }

  // Find specific merchant mentioned in question
  private findSpecificMerchant(question: string, merchants: MerchantData[]): MerchantData | null {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Normalize function: remove special chars, normalize spaces, handle apostrophes
    const normalize = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[''"]/g, "'") // Normalize apostrophes
        .replace(/[_\s]+/g, ' ') // Replace underscores and multiple spaces with single space
        .trim();
    };
    
    // Extract potential identifiers from question (numbers, city names, state codes)
    const questionWords = lowerQuestion.split(/[\s_]+/);
    const questionNumbers = questionWords.filter(w => /^\d+$/.test(w));
    const questionStates = questionWords.filter(w => /^(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)$/i.test(w));
    
    this.logger.log(`[FindMerchant] Searching for merchant in question: "${question}"`);
    this.logger.log(`[FindMerchant] Extracted numbers: ${questionNumbers.join(', ')}, states: ${questionStates.join(', ')}`);
    
    // Try to find merchant by multiple strategies
    for (const merchant of merchants) {
      const merchantName = merchant.name;
      const normalizedMerchantName = normalize(merchantName);
      const normalizedQuestion = normalize(lowerQuestion);
      
      // Strategy 1: Exact normalized match (after removing underscores and normalizing)
      if (normalizedQuestion.includes(normalizedMerchantName) || normalizedMerchantName.includes(normalizedQuestion)) {
        this.logger.log(`[FindMerchant] ✅ Found by exact normalized match: "${merchantName}"`);
        return merchant;
      }
      
      // Strategy 2: Match by storeId if question contains numbers
      if (merchant.storeId && questionNumbers.length > 0) {
        const storeIdNumber = merchant.storeId.replace(/[^0-9]/g, ''); // Extract numbers from storeId
        if (storeIdNumber && questionNumbers.includes(storeIdNumber)) {
          this.logger.log(`[FindMerchant] ✅ Found by storeId match: "${merchantName}" (Store ID: ${merchant.storeId})`);
          return merchant;
        }
      }
      
      // Strategy 3: Extract parts from merchant name (format: Name_StoreID_City_State)
      const merchantParts = merchantName.split('_');
      if (merchantParts.length >= 2) {
        const merchantNamePart = normalize(merchantParts[0]); // Business name
        const merchantStoreId = merchantParts.length > 1 ? merchantParts[1].replace(/[^0-9]/g, '') : '';
        const merchantCity = merchantParts.length > 2 ? normalize(merchantParts[merchantParts.length - 2]) : '';
        const merchantState = merchantParts.length > 3 ? normalize(merchantParts[merchantParts.length - 1]) : '';
        
        // Check if question matches business name part
        if (merchantNamePart.length > 3 && (normalizedQuestion.includes(merchantNamePart) || merchantNamePart.includes(normalizedQuestion))) {
          // Also check if storeId, city, or state matches (if provided in question)
          let additionalMatch = true;
          
          if (merchantStoreId && questionNumbers.length > 0) {
            additionalMatch = questionNumbers.includes(merchantStoreId);
          }
          if (merchantCity && merchantCity.length > 2 && !normalizedQuestion.includes(merchantCity)) {
            // City mentioned but doesn't match - less likely to be correct
            additionalMatch = false;
          }
          if (merchantState && questionStates.length > 0 && !questionStates.includes(merchantState)) {
            // State mentioned but doesn't match - less likely to be correct
            additionalMatch = false;
          }
          
          if (additionalMatch) {
            this.logger.log(`[FindMerchant] ✅ Found by name part match: "${merchantName}" (matched: ${merchantNamePart})`);
            return merchant;
          }
        }
      }
      
      // Strategy 4: Fuzzy match on significant words (3+ characters)
      const merchantWords = normalizedMerchantName.split(/\s+/).filter(word => word.length >= 3);
      const questionSignificantWords = normalizedQuestion.split(/\s+/).filter(word => word.length >= 3);
      
      if (merchantWords.length > 0 && questionSignificantWords.length > 0) {
        const matches = merchantWords.filter(word => 
          questionSignificantWords.some(qw => qw.includes(word) || word.includes(qw))
        );
        
        // If 60% or more of significant words match, consider it a match
        const matchRatio = matches.length / merchantWords.length;
        if (matchRatio >= 0.6) {
          this.logger.log(`[FindMerchant] ✅ Found by fuzzy word match: "${merchantName}" (${matches.length}/${merchantWords.length} words matched)`);
          return merchant;
        }
      }
    }
    
    this.logger.warn(`[FindMerchant] ❌ No merchant found matching: "${question}"`);
    this.logger.warn(`[FindMerchant] Available merchants (first 10): ${merchants.slice(0, 10).map(m => m.name).join(', ')}`);
    
    return null;
  }

  private generateInsightFromAnalysis(
    question: string,
    analysis: any,
    merchants: MerchantData[]
  ): string {
    const lowerQuestion = question.toLowerCase();
    
    // Check if question is about a specific merchant
    const specificMerchant = this.findSpecificMerchant(question, merchants);
    
    if (specificMerchant) {
      const interactions = specificMerchant.supportLogs || [];
      if (interactions.length > 0) {
        const interactionsText = interactions.map((log: any, idx: number) => 
          `${idx + 1}. **${log.date}** ${log.time || ''} - ${log.issue}${log.category ? ` (${log.category})` : ''}${log.supporter ? ` - Supporter: ${log.supporter}` : ''}`
        ).join('\n');
        
        return `## ${specificMerchant.name}${specificMerchant.storeId ? ` (Store ID: ${specificMerchant.storeId})` : ''}\n\n` +
          `**Status:** ${specificMerchant.status || 'unknown'}\n` +
          `**Last Interaction:** ${specificMerchant.lastInteractionDate || 'N/A'}\n` +
          `**Total Interactions:** ${interactions.length}\n\n` +
          `### Interaction Details:\n\n${interactionsText}`;
      } else {
        return `## ${specificMerchant.name}${specificMerchant.storeId ? ` (Store ID: ${specificMerchant.storeId})` : ''}\n\n` +
          `**Status:** ${specificMerchant.status || 'unknown'}\n` +
          `**Last Interaction:** ${specificMerchant.lastInteractionDate || 'N/A'}\n` +
          `**Total Interactions:** 0\n\n` +
          `No interactions found for this merchant.`;
      }
    }

    // Top merchants by interactions
    if (lowerQuestion.includes('top merchant') || lowerQuestion.includes('most interaction')) {
      const top5 = analysis.merchantsByInteractions.slice(0, 5);
      if (top5.length === 0) {
        return 'No merchant interaction data available at this time.';
      }
      let response = `Here are the top ${top5.length} merchants by interactions:\n\n`;
      top5.forEach((m: any, index: number) => {
        response += `${index + 1}. **${m.name}**${m.storeId ? ` (${m.storeId})` : ''}: ${m.interactions} interactions\n`;
      });
      return response;
    }

    // Terminal issues
    if (lowerQuestion.includes('terminal') || lowerQuestion.includes('disconnect')) {
      const percentage = analysis.totalInteractions > 0 
        ? ((analysis.terminalIssues / analysis.totalInteractions) * 100).toFixed(1)
        : '0';
      return `Terminal Issues Analysis:\n\n` +
        `- Total terminal-related issues: **${analysis.terminalIssues}**\n` +
        `- Out of ${analysis.totalInteractions} total interactions (${percentage}%)\n` +
        `- This indicates ${analysis.terminalIssues > analysis.totalInteractions * 0.1 ? 'a significant' : 'a relatively low'} number of terminal connectivity problems.\n\n` +
        `Recommendation: ${analysis.terminalIssues > analysis.totalInteractions * 0.1 
          ? 'Consider investigating network infrastructure and terminal connectivity solutions.'
          : 'Current terminal issue rate is manageable, but continue monitoring.'}`;
    }

    // Categories
    if (lowerQuestion.includes('categor') || lowerQuestion.includes('issue type')) {
      if (analysis.topCategories.length === 0) {
        return 'No category data available at this time.';
      }
      let response = `Top Issue Categories:\n\n`;
      analysis.topCategories.forEach(([category, count]: [string, number], index: number) => {
        const percentage = ((count / analysis.totalInteractions) * 100).toFixed(1);
        response += `${index + 1}. **${category}**: ${count} issues (${percentage}%)\n`;
      });
      return response;
    }

    // Trends
    if (lowerQuestion.includes('trend') || lowerQuestion.includes('recent') || lowerQuestion.includes('activity')) {
      const recentPercentage = analysis.totalInteractions > 0
        ? ((analysis.recentInteractions / analysis.totalInteractions) * 100).toFixed(1)
        : '0';
      return `Recent Activity Trends (Last 7 Days):\n\n` +
        `- Recent interactions: **${analysis.recentInteractions}** out of ${analysis.totalInteractions} total\n` +
        `- Recent activity rate: ${recentPercentage}%\n` +
        `- Average interactions per merchant: ${(analysis.totalInteractions / analysis.totalMerchants).toFixed(1)}\n\n` +
        `${analysis.recentInteractions > analysis.totalInteractions * 0.3 
          ? '📈 High recent activity - suggests active customer engagement'
          : '📊 Moderate recent activity - normal engagement levels'}`;
    }

    // Status distribution
    if (lowerQuestion.includes('status') || lowerQuestion.includes('health')) {
      const greenPercentage = ((analysis.statusCounts.green / analysis.totalMerchants) * 100).toFixed(1);
      const orangePercentage = ((analysis.statusCounts.orange / analysis.totalMerchants) * 100).toFixed(1);
      const redPercentage = ((analysis.statusCounts.red / analysis.totalMerchants) * 100).toFixed(1);
      
      return `Merchant Status Distribution:\n\n` +
        `- 🟢 Green (Active): ${analysis.statusCounts.green} merchants (${greenPercentage}%)\n` +
        `- 🟠 Orange (Needs Attention): ${analysis.statusCounts.orange} merchants (${orangePercentage}%)\n` +
        `- 🔴 Red (Inactive): ${analysis.statusCounts.red} merchants (${redPercentage}%)\n\n` +
        `Overall Health: ${analysis.statusCounts.green > analysis.totalMerchants * 0.7 
          ? '✅ Excellent - Most merchants are actively engaged'
          : analysis.statusCounts.orange + analysis.statusCounts.red > analysis.totalMerchants * 0.3
          ? '⚠️ Needs Attention - Significant number of merchants require follow-up'
          : '✅ Good - Healthy merchant engagement levels'}`;
    }

    // General insights
    if (lowerQuestion.includes('insight') || lowerQuestion.includes('overview') || lowerQuestion.includes('summary')) {
      return `Merchant Data Overview:\n\n` +
        `📊 **Statistics:**\n` +
        `- Total Merchants: ${analysis.totalMerchants}\n` +
        `- Total Interactions: ${analysis.totalInteractions}\n` +
        `- Average Interactions per Merchant: ${(analysis.totalInteractions / analysis.totalMerchants).toFixed(1)}\n` +
        `- Recent Activity (7 days): ${analysis.recentInteractions} interactions\n\n` +
        `🎯 **Key Insights:**\n` +
        `- ${analysis.topCategories.length > 0 ? `Most common issue: **${analysis.topCategories[0][0]}** (${analysis.topCategories[0][1]} occurrences)` : 'No category data available'}\n` +
        `- Terminal issues: ${analysis.terminalIssues} (${analysis.totalInteractions > 0 ? ((analysis.terminalIssues / analysis.totalInteractions) * 100).toFixed(1) : '0'}% of all interactions)\n` +
        `- Status: ${analysis.statusCounts.green} active, ${analysis.statusCounts.orange} need attention, ${analysis.statusCounts.red} inactive\n\n` +
        `💡 **Recommendations:**\n` +
        `${analysis.statusCounts.orange + analysis.statusCounts.red > 0 ? `- Follow up with ${analysis.statusCounts.orange + analysis.statusCounts.red} merchants that need attention\n` : ''}` +
        `${analysis.terminalIssues > analysis.totalInteractions * 0.1 ? `- Investigate terminal connectivity issues (${analysis.terminalIssues} cases)\n` : ''}` +
        `- Continue monitoring merchant engagement and interaction patterns`;
    }

    // Default response
    return `I can help you analyze your merchant data. Here's a quick overview:\n\n` +
      `- Total Merchants: ${analysis.totalMerchants}\n` +
      `- Total Interactions: ${analysis.totalInteractions}\n` +
      `- Recent Activity (7 days): ${analysis.recentInteractions}\n\n` +
      `You can ask me about:\n` +
      `• Top merchants by interactions\n` +
      `• Terminal issues and trends\n` +
      `• Category distribution\n` +
      `• Status distribution\n` +
      `• Recent activity trends\n` +
      `• General insights and recommendations`;
  }
}

