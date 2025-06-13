import type { RoutePromptConfig, PromptEngineConfig } from './types'

// 路由特定的 prompt 配置
export const routeConfigs: RoutePromptConfig[] = [
  {
    route: '/monitor',
    title: 'DevConsole Assistant',
    placeholder: 'Ask me about infrastructure monitoring...',
    suggestionTags: [
      'What can I monitor here?',
      'Show me the overview',
      'How to get started?',
      'What are the main features?',
    ],
    initialPrompt: '',
  },
  {
    route: '/monitor/S3-storage',
    title: 'S3 Storage Assistant',
    placeholder: 'Ask me about S3 storage management...',
    suggestionTags: [
      'How to upload files?',
      'How to create folders?',
      'How to manage permissions?',
      'How to delete files safely?',
    ],
  },
  {
    route: '/monitor/deploy',
    title: 'Deployment Assistant',
    placeholder: 'Ask me about script deployment...',
    suggestionTags: [
      'How to add deployment scripts?',
      'How to execute scripts?',
      'How to view execution history?',
      'Script troubleshooting tips?',
    ],
  },
  {
    route: '/monitor/esxi',
    title: 'ESXi Monitoring Assistant',
    placeholder: 'Ask me about ESXi virtualization...',
    suggestionTags: [
      'How to monitor VMs?',
      'How to check resource usage?',
      'ESXi performance tips?',
      'VM troubleshooting guide?',
    ],
  },
  {
    route: '/monitor/global-edge',
    title: 'Global Edge Assistant',
    placeholder: 'Ask me about edge node monitoring...',
    suggestionTags: [
      'How to monitor edge nodes?',
      'How to check latency?',
      'Edge performance optimization?',
      'Global CDN status?',
    ],
  },
  {
    route: '/monitor/nezha',
    title: 'Nezha Monitoring Assistant',
    placeholder: 'Ask me about server monitoring...',
    suggestionTags: [
      'How to read server metrics?',
      'How to set up alerts?',
      'Server performance analysis?',
      'Monitoring best practices?',
    ],
  },
  {
    route: '/monitor/notes',
    title: 'Notes Management Assistant',
    placeholder: 'Ask me about documentation...',
    suggestionTags: [
      'How to create notes?',
      'How to organize documentation?',
      'How to search notes?',
      'Markdown formatting tips?',
    ],
  },
  {
    route: '/monitor/self-host',
    title: 'Self-Host Assistant',
    placeholder: 'Ask me about self-hosted services...',
    suggestionTags: [
      'How to monitor services?',
      'How to manage containers?',
      'Self-hosting best practices?',
      'Service troubleshooting?',
    ],
  },
  {
    route: '/monitor/uptime-kuma',
    title: 'Uptime Monitoring Assistant',
    placeholder: 'Ask me about service uptime...',
    suggestionTags: [
      'How to set up monitoring?',
      'How to configure alerts?',
      'How to check service status?',
      'Uptime optimization tips?',
    ],
  },
]

// 默认配置
export const defaultRouteConfig: RoutePromptConfig = {
  route: '*',
  title: 'DevConsole Assistant',
  placeholder: 'Ask me anything about DevConsole...',
  suggestionTags: [
    'How to get started?',
    'What can I monitor here?',
    'Show me the features',
    'Need help with infrastructure?',
  ],
}

// 完整的 prompt 引擎配置
export const promptEngineConfig: PromptEngineConfig = {
  routes: routeConfigs,
  defaultConfig: defaultRouteConfig,
}
