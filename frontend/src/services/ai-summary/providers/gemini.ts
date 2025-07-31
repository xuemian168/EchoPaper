import { BaseAISummaryProvider } from './base'
import { AISummaryResult } from '../types'

export class GeminiSummaryProvider extends BaseAISummaryProvider {
  name = 'Gemini Summary'
  protected model = 'gemini-1.5-flash'

  constructor(apiKey?: string, model?: string, maxKeywords?: number, summaryLength?: 'short' | 'medium' | 'long') {
    super(apiKey, model, maxKeywords, summaryLength)
    if (model) this.model = model
  }

  async generateSummary(content: string, language: string): Promise<AISummaryResult> {
    if (!this.isConfigured()) {
      throw this.createError('Gemini API key not configured', 'NOT_CONFIGURED')
    }

    this.validateLanguage(language)
    const cleanedContent = this.cleanContent(content)
    const languageName = this.getLanguageName(language)
    const summaryLengthPrompt = this.getSummaryLengthPrompt()

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert content analyst and SEO specialist. Analyze the provided article content and generate:
1. An engaging, SEO-optimized title (max 60 characters)
2. A compelling summary (${summaryLengthPrompt})
3. SEO keywords (${this.maxKeywords} keywords/phrases, comma-separated)

Respond in ${languageName} language with the following JSON format:
{
  "title": "Generated title here",
  "summary": "Generated summary here",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Focus on:
- Main topics and key points
- Technical concepts and important terms
- Target audience interests
- Search engine optimization
- Readability and engagement

Article content to analyze:
${cleanedContent}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw this.createError(
          error.error?.message || 'AI summary generation failed',
          error.error?.code || 'SUMMARY_ERROR'
        )
      }

      const data = await response.json()
      
      if (!data.candidates || data.candidates.length === 0) {
        throw this.createError('No AI summary result returned', 'NO_RESULT')
      }
      
      const resultText = data.candidates[0].content.parts[0].text.trim()

      // Parse JSON response
      let result: any
      try {
        // Clean up the response to extract JSON
        const jsonMatch = resultText.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? jsonMatch[0] : resultText
        result = JSON.parse(jsonText)
      } catch (parseError) {
        // Fallback parsing if JSON is malformed
        const titleMatch = resultText.match(/"title":\s*"([^"]+)"/i)
        const summaryMatch = resultText.match(/"summary":\s*"([^"]+)"/i)
        const keywordsMatch = resultText.match(/"keywords":\s*\[(.*?)\]/i)
        
        result = {
          title: titleMatch ? titleMatch[1] : 'Generated Title',
          summary: summaryMatch ? summaryMatch[1] : 'Generated summary...',
          keywords: keywordsMatch ? 
            keywordsMatch[1].split(',').map((k: string) => k.trim().replace(/"/g, '')) : 
            ['keyword1', 'keyword2', 'keyword3']
        }
      }

      // Extract token usage if available
      const inputTokens = data.usageMetadata?.promptTokenCount || 0
      const outputTokens = data.usageMetadata?.candidatesTokenCount || 0
      const totalTokens = data.usageMetadata?.totalTokenCount || inputTokens + outputTokens
      
      // Gemini pricing as of 2024 (per 1M tokens)
      const pricing: Record<string, { input: number, output: number }> = {
        'gemini-1.5-flash': { input: 0.075, output: 0.30 },
        'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },
        'gemini-1.5-pro': { input: 3.50, output: 10.50 },
        'gemini-1.0-pro': { input: 0.50, output: 1.50 }
      }
      
      const modelPricing = pricing[this.model] || pricing['gemini-1.5-flash']
      const estimatedCost = (inputTokens / 1000000) * modelPricing.input + (outputTokens / 1000000) * modelPricing.output

      return {
        title: result.title || 'Generated Title',
        summary: result.summary || 'Generated summary...',
        keywords: Array.isArray(result.keywords) ? result.keywords : ['keyword1', 'keyword2'],
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
          currency: 'USD'
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createError(
        `Gemini AI summary error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PROVIDER_ERROR'
      )
    }
  }

  async generateSEOKeywords(content: string, language: string): Promise<string[]> {
    const result = await this.generateSummary(content, language)
    return result.keywords
  }

  async generateTitle(content: string, language: string): Promise<string> {
    const result = await this.generateSummary(content, language)
    return result.title
  }

  getSupportedLanguages(): string[] {
    // Gemini supports all major languages
    return [
      'zh', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'ar', 'pt',
      'it', 'nl', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'sk', 'hu',
      'ro', 'bg', 'hr', 'sr', 'sl', 'et', 'lv', 'lt', 'uk', 'be',
      'tr', 'he', 'fa', 'ur', 'hi', 'bn', 'ta', 'te', 'ml', 'kn',
      'gu', 'pa', 'mr', 'ne', 'si', 'my', 'km', 'lo', 'ka', 'am',
      'sw', 'zu', 'af', 'sq', 'hy', 'az', 'eu', 'ca', 'cy', 'ga',
      'is', 'mt', 'vi', 'th', 'id', 'ms', 'tl', 'haw', 'mi', 'sm',
      'to', 'fj'
    ]
  }
}