import { env } from '@/env'

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenAIStreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

export interface OpenAICompletionRequest {
  model: string
  messages: OpenAIMessage[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface OpenAIError {
  error: {
    message: string
    type: string
    code?: string
  }
}

export class OpenAIService {
  private apiKey: string
  private apiUrl: string
  private defaultModel = 'gpt-4o-mini'

  constructor() {
    const apiKey = env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error(
        'VITE_OPENAI_API_KEY is required when not using mock data',
      )
    }

    this.apiKey = apiKey
    this.apiUrl = env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1'
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }
  }

  private getSystemMessage(): OpenAIMessage {
    return {
      role: 'system',
      content:
        'You are a helpful AI assistant. Please provide accurate and helpful responses to user questions.',
    }
  }

  private getSuggestionPrompt(
    userQuestion: string,
    assistantResponse: string,
  ): OpenAIMessage[] {
    return [
      {
        role: 'system',
        content: `Based on the following conversation, generate 3 relevant follow-up questions that the user might want to ask. The questions should be:
1. Related to the topic discussed
2. Helpful for deeper understanding
3. Concise (under 10 words each)
4. Different from each other

Return only the questions as a JSON array of strings, nothing else.

Example format: ["Question 1?", "Question 2?", "Question 3?"]`,
      },
      {
        role: 'user',
        content: userQuestion,
      },
      {
        role: 'assistant',
        content: assistantResponse,
      },
      {
        role: 'user',
        content: 'Generate 3 follow-up questions based on our conversation.',
      },
    ]
  }

  async sendMessage(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = [],
    options: Partial<OpenAICompletionRequest> = {},
  ): Promise<string> {
    const messages: OpenAIMessage[] = [
      this.getSystemMessage(),
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ]

    const requestBody: OpenAICompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      stream: false,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
      ...options,
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: OpenAIError = await response.json()
        throw new Error(
          errorData.error.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No response received'
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw error
    }
  }

  async *sendMessageStream(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = [],
    options: Partial<OpenAICompletionRequest> = {},
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, unknown> {
    const messages: OpenAIMessage[] = [
      this.getSystemMessage(),
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ]

    const requestBody: OpenAICompletionRequest = {
      model: options.model || this.defaultModel,
      messages,
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
      ...options,
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal,
      })

      if (!response.ok) {
        const errorData: OpenAIError = await response.json()
        throw new Error(
          errorData.error.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue

            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonStr = trimmedLine.slice(6)
                const data: OpenAIStreamResponse = JSON.parse(jsonStr)
                const content = data.choices[0]?.delta?.content
                if (content) {
                  yield content
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      // Check if the error is due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, exit silently
        return
      }
      console.error('OpenAI Stream Error:', error)
      throw error
    }
  }

  async generateFollowUpSuggestions(
    userQuestion: string,
    assistantResponse: string,
  ): Promise<string[] | undefined> {
    try {
      const messages = this.getSuggestionPrompt(userQuestion, assistantResponse)

      const requestBody: OpenAICompletionRequest = {
        model: this.defaultModel,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 200,
      }

      const response = await fetch(`${this.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        console.warn(
          'Failed to generate follow-up suggestions:',
          response.statusText,
        )
        return undefined
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        return undefined
      }

      try {
        // Parse the JSON response
        const suggestions = JSON.parse(content.trim())
        if (Array.isArray(suggestions) && suggestions.length > 0) {
          return suggestions.slice(0, 3) // Limit to 3 suggestions
        }
      } catch (parseError) {
        console.warn('Failed to parse follow-up suggestions JSON:', parseError)
        // Fallback: try to extract questions from text
        const lines = content.split('\n').filter((line) => line.trim())
        const questions = lines
          .filter((line) => line.includes('?'))
          .map((line) =>
            line
              .replace(/^\d+\.\s*/, '')
              .replace(/^[-*]\s*/, '')
              .trim(),
          )
          .slice(0, 3)

        return questions.length > 0 ? questions : undefined
      }

      return undefined
    } catch (error) {
      console.warn('Error generating follow-up suggestions:', error)
      return undefined
    }
  }

  static convertChatHistoryToOpenAI(
    messages: Array<{ question?: string; answer?: string }>,
  ): OpenAIMessage[] {
    const openAIMessages: OpenAIMessage[] = []

    for (const message of messages) {
      if (message.question) {
        openAIMessages.push({
          role: 'user',
          content: message.question,
        })
      }
      if (message.answer) {
        openAIMessages.push({
          role: 'assistant',
          content: message.answer,
        })
      }
    }

    return openAIMessages
  }
}
