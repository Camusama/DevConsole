export const mockPrefix =
  'Based on your requirements, I would like to present the following features for your consideration:\n\n'

export const mockResponses = {
  users:
    mockPrefix +
    '**User Management**: Create, edit, and manage user accounts in your OpenCAS system.\n\n' +
    '**Role Assignment**: Assign different roles and permissions to users based on their responsibilities.\n\n' +
    '**Bulk Operations**: Import users from CSV files or perform bulk operations on multiple users.\n\n' +
    '**User Groups**: Organize users into groups for easier management and permission assignment.\n\n' +
    '**Activity Monitoring**: Track user login activity and system usage patterns.',

  saml:
    mockPrefix +
    '**SAML Configuration**: Set up SAML 2.0 single sign-on for your applications.\n\n' +
    '**Identity Provider Setup**: Configure your IdP settings including certificates and endpoints.\n\n' +
    '**Service Provider Settings**: Define SP metadata and assertion consumer service URLs.\n\n' +
    '**Attribute Mapping**: Map SAML attributes to user properties in your system.\n\n' +
    '**Testing Tools**: Use built-in tools to test and validate your SAML configuration.',

  oauth2:
    mockPrefix +
    '**OAuth2 Applications**: Create and manage OAuth2 client applications.\n\n' +
    '**Grant Types**: Support for Authorization Code, Client Credentials, and other grant types.\n\n' +
    '**Scope Management**: Define and control access scopes for different applications.\n\n' +
    '**Token Management**: Monitor and manage access tokens and refresh tokens.\n\n' +
    '**Security Settings**: Configure security policies including token expiration and rotation.',

  features:
    mockPrefix +
    '**Authentication**: SAML 2.0, OAuth2, and traditional login methods.\n\n' +
    '**User Management**: Comprehensive user and group management capabilities.\n\n' +
    '**Application Integration**: Easy integration with third-party applications.\n\n' +
    '**Security**: Advanced security features including MFA and audit logging.\n\n' +
    '**API Access**: RESTful APIs for programmatic access to all features.',

  default: `# How to Create Test Users

Creating test users is essential for software development, QA testing, and staging environments. Here are methods for different platforms:

## General Methods

### Manual Creation
1. Through UI: Most applications have a user registration form you can use
2. Admin interface: Many systems have admin panels to manually create users

### Automated Methods
1. Database inserts: Directly insert records into user tables
2. API calls: Use registration or user creation endpoints
3. Scripting: Write scripts to generate multiple test users

## Platform-Specific Methods

### Web Applications
\`\`\`javascript
// Example using fetch API
fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'test123'
  }),
  headers: { 'Content-Type': 'application/json' }
});
\`\`\`

### SQL Databases
\`\`\`sql
INSERT INTO users (username, email, password_hash)
VALUES ('testuser', 'test@example.com', 'hashed_password');
\`\`\`

## Best Practices
1. Use clear naming conventions (e.g., "test_user_1")
2. Document test user credentials
3. Set appropriate permissions
4. **Clean up after testing**
5. Never use production data for testing

> **Note**: Always follow your organization's security policies when creating test accounts.

For more information, visit [OpenCAS Documentation](https://docs.opencas.com).`,
}

export const defaultSuggestionTags = [
  'How to manage users?',
  'How to configure SAML?',
  'How to set up OAuth2?',
  'What are the available features?',
]

export function determineResponse(question: string): string {
  const lowerQuestion = question.toLowerCase()

  if (
    lowerQuestion.includes('user') ||
    lowerQuestion.includes('account') ||
    lowerQuestion.includes('manage')
  ) {
    return mockResponses.users
  }

  if (
    lowerQuestion.includes('saml') ||
    lowerQuestion.includes('sso') ||
    lowerQuestion.includes('single sign')
  ) {
    return mockResponses.saml
  }

  if (
    lowerQuestion.includes('oauth') ||
    lowerQuestion.includes('oauth2') ||
    lowerQuestion.includes('application')
  ) {
    return mockResponses.oauth2
  }

  if (
    lowerQuestion.includes('feature') ||
    lowerQuestion.includes('capability') ||
    lowerQuestion.includes('available')
  ) {
    return mockResponses.features
  }

  return mockResponses.default
}

export function getRandomDelay(min: number = 800, max: number = 2000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
