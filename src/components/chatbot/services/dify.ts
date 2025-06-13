import { env } from '@/lib/env-adapter'

export interface DifyMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface DifyStreamResponse {
  event: 'message' | 'agent_message' | 'message_end' | 'message_replace' | 'error' | 'ping'
  message_id?: string
  conversation_id?: string
  answer?: string
  created_at?: number
  task_id?: string
  data?: {
    id: string
    answer: string
    created_at: number
    conversation_id: string
    metadata?: {
      usage?: {
        prompt_tokens: number
        completion_tokens: number
        total_tokens: number
      }
    }
  }
  metadata?: {
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    retriever_resources?: Array<{
      position: number
      dataset_id: string
      dataset_name: string
      document_id: string
      document_name: string
      data_source_type: string
      segment_id: string
      score: number
      content: string
    }>
  }
}

export interface DifyCompletionRequest {
  query: string
  inputs?: Record<string, any>
  response_mode: 'streaming' | 'blocking'
  conversation_id?: string
  user: string
  auto_generate_name?: boolean
}

export interface DifyCompletionResponse {
  message_id: string
  conversation_id: string
  mode: string
  answer: string
  metadata: {
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    retriever_resources?: Array<{
      position: number
      dataset_id: string
      dataset_name: string
      document_id: string
      document_name: string
      data_source_type: string
      segment_id: string
      score: number
      content: string
    }>
  }
  created_at: number
}

export interface DifyFollowUpResponse {
  result: string
  data: string[]
}

export interface DifyError {
  code: string
  message: string
  status: number
}

export class DifyService {
  private apiKey: string
  private apiUrl: string

  private userId: string

  constructor() {
    const apiKey = env.VITE_DIFY_API_KEY

    if (!apiKey) {
      throw new Error('VITE_DIFY_API_KEY is required when using Dify service')
    }

    this.apiKey = apiKey
    // Use the proxied endpoint in development, direct URL in production
    // Priority: VITE_DIFY_API_ENDPOINT (proxy) > VITE_DIFY_API_URL (direct)
    this.apiUrl =
      env.VITE_DIFY_API_ENDPOINT || `${env.VITE_DIFY_API_URL}/v1` || 'https://api.dify.ai/v1'
    this.userId = env.VITE_DIFY_USER_ID || 'opencas-user'
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    }
  }

  async sendMessage(
    query: string,
    conversationId?: string,
    inputs?: Record<string, any>
  ): Promise<{
    response: string
    conversationId: string
    messageId: string
    followUps?: string[]
  }> {
    const requestBody: DifyCompletionRequest = {
      query,
      inputs: inputs || {},
      response_mode: 'blocking',
      conversation_id: conversationId,
      user: this.userId,
      auto_generate_name: true,
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: DifyError = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: DifyCompletionResponse = await response.json()

      // Get follow-up suggestions
      const followUps = await this.getFollowUpSuggestions(data.message_id, data.conversation_id)

      return {
        response: data.answer,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        followUps,
      }
    } catch (error) {
      console.error('Dify API Error:', error)
      throw error
    }
  }

  async *sendMessageStream(
    query: string,
    conversationId?: string,
    inputs?: Record<string, any>,
    signal?: AbortSignal
  ): AsyncGenerator<
    {
      content: string
      isComplete: boolean
      conversationId?: string
      messageId?: string
      followUps?: string[]
    },
    void,
    unknown
  > {
    const requestBody: DifyCompletionRequest = {
      query,
      inputs: inputs || {},
      response_mode: 'streaming',
      conversation_id: conversationId,
      user: this.userId,
      auto_generate_name: true,
    }

    try {
      const response = await fetch(`${this.apiUrl}/chat-messages`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
        signal,
      })

      if (!response.ok) {
        const errorData: DifyError = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let finalConversationId = ''
      let finalMessageId = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) continue

            try {
              const jsonStr = trimmedLine.slice(6)
              if (jsonStr === '[DONE]') continue

              const data: DifyStreamResponse = JSON.parse(jsonStr)

              if (data.event === 'message' && data.answer) {
                yield {
                  content: data.answer,
                  isComplete: false,
                  conversationId: data.conversation_id,
                  messageId: data.message_id,
                }

                if (data.conversation_id) finalConversationId = data.conversation_id
                if (data.message_id) finalMessageId = data.message_id
              } else if (data.event === 'message_end') {
                // Get follow-up suggestions when message is complete
                const followUps =
                  finalMessageId && finalConversationId
                    ? await this.getFollowUpSuggestions(finalMessageId, finalConversationId)
                    : undefined

                yield {
                  content: '',
                  isComplete: true,
                  conversationId: finalConversationId,
                  messageId: finalMessageId,
                  followUps,
                }
              } else if (data.event === 'error') {
                throw new Error(`Dify Stream Error: ${JSON.stringify(data)}`)
              }
            } catch (parseError) {
              console.warn('Failed to parse Dify SSE data:', parseError)
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
      console.error('Dify Stream Error:', error)
      throw error
    }
  }

  async getFollowUpSuggestions(
    messageId: string,
    conversationId: string
  ): Promise<string[] | undefined> {
    try {
      const response = await fetch(
        `${this.apiUrl}/messages/${messageId}/suggested?user=${this.userId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        console.warn('Failed to get follow-up suggestions:', response.statusText)
        return undefined
      }

      const data: DifyFollowUpResponse = await response.json()

      // Check if the request was successful and has data
      if (data.result === 'success' && data.data && data.data.length > 0) {
        return data.data
      }

      return undefined
    } catch (error) {
      console.warn('Error getting follow-up suggestions:', error)
      return undefined
    }
  }

  async getConversationHistory(conversationId: string): Promise<DifyMessage[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/conversations/${conversationId}?user=${this.userId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Error getting conversation history:', error)
      throw error
    }
  }

  // 将聊天历史转换为 Dify 格式
  static convertChatHistoryToDify(
    messages: Array<{ question?: string; answer?: string }>
  ): DifyMessage[] {
    const difyMessages: DifyMessage[] = []

    for (const message of messages) {
      if (message.question) {
        difyMessages.push({
          role: 'user',
          content: message.question,
        })
      }
      if (message.answer) {
        difyMessages.push({
          role: 'assistant',
          content: message.answer,
        })
      }
    }

    return difyMessages
  }
}
