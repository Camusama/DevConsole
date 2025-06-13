import type { RoutePromptConfig, PromptEngineConfig } from './types'

// 路由特定的 prompt 配置
export const routeConfigs: RoutePromptConfig[] = [
  {
    route: '/manage',
    title: 'OpenCAS Assistant',
    placeholder: 'Ask me about OpenCAS management...',
    suggestionTags: [
      'What can I manage here?',
      'Show me the overview',
      'How to get started?',
      'What are the main features?'
    ],
    initialPrompt: ''
  },
  {
    route: '/manage/staff',
    title: 'Staff Management Assistant',
    placeholder: 'Ask me about staff management...',
    suggestionTags: [
      'How to add new staff?',
      'How to manage roles?',
      'How to edit staff info?',
      'How to deactivate staff?'
    ]
  },
  {
    route: '/manage/test-users',
    title: 'Test Users Assistant',
    placeholder: 'Ask me about test users...',
    suggestionTags: [
      'How to create test users?',
      'How to manage test data?',
      'How to reset test users?',
      'What are test user limits?'
    ]
  },
  {
    route: '/manage/saml-apps',
    title: 'SAML Apps Assistant',
    placeholder: 'Ask me about SAML configuration...',
    suggestionTags: [
      'How to configure SAML?',
      'How to add new SAML app?',
      'How to test SAML login?',
      'SAML troubleshooting tips?'
    ]
  },
  {
    route: '/manage/apps',
    title: 'OAuth2 Apps Assistant',
    placeholder: 'Ask me about OAuth2 applications...',
    suggestionTags: [
      'How to create OAuth2 app?',
      'How to manage client secrets?',
      'How to configure scopes?',
      'OAuth2 best practices?'
    ]
  },
  {
    route: '/manage/profile',
    title: 'Profile Assistant',
    placeholder: 'Ask me about profile settings...',
    suggestionTags: [
      'How to update my profile?',
      'How to change password?',
      'How to manage preferences?',
      'How to enable 2FA?'
    ]
  },
  {
    route: '/manage/jwt-tools',
    title: 'JWT Tools Assistant',
    placeholder: 'Ask me about JWT tools...',
    suggestionTags: [
      'How to decode JWT?',
      'How to validate JWT?',
      'How to generate JWT?',
      'JWT security tips?'
    ]
  },
  {
    route: '/manage/todos',
    title: 'Tasks Assistant',
    placeholder: 'Ask me about task management...',
    suggestionTags: [
      'How to create tasks?',
      'How to assign tasks?',
      'How to track progress?',
      'How to set priorities?'
    ]
  },
  {
    route: '/manage/zoom-account',
    title: 'Zoom Account Assistant',
    placeholder: 'Ask me about Zoom integration...',
    suggestionTags: [
      'How to connect Zoom?',
      'How to manage meetings?',
      'How to configure settings?',
      'Zoom troubleshooting?'
    ]
  },
  {
    route: '/manage/chatbot-demo',
    title: 'Chatbot Demo Assistant',
    placeholder: 'Ask me about chatbot features...',
    suggestionTags: [
      'How to configure chatbot?',
      'How to customize responses?',
      'How to test chatbot?',
      'What are the features?'
    ]
  }
]

// 默认配置
export const defaultRouteConfig: RoutePromptConfig = {
  route: '*',
  title: 'OpenCAS Assistant',
  placeholder: 'Ask me anything about OpenCAS...',
  suggestionTags: [
    'How to get started?',
    'What can I do here?',
    'Show me the features',
    'Need help with setup?'
  ]
}

// 完整的 prompt 引擎配置
export const promptEngineConfig: PromptEngineConfig = {
  routes: routeConfigs,
  defaultConfig: defaultRouteConfig
}
