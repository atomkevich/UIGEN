interface ToolContext {
  userRequest: string;
  componentType: string;
  operationPhase: 'creating' | 'styling' | 'enhancing' | 'organizing';
  toolName: string;
  operation?: string;
}

interface ToolDisplayInfo {
  message: string;
  emoji: string;
  color: string;
}

const COMPONENT_PATTERNS = {
  card: /card|panel|tile/i,
  button: /button|btn|click|cta/i,
  form: /form|input|field|contact|signup|login/i,
  nav: /nav|menu|header|navigation/i,
  modal: /modal|dialog|popup|overlay/i,
  table: /table|grid|list|data/i,
  chart: /chart|graph|dashboard|analytics/i,
  gallery: /gallery|carousel|slider|image/i,
  sidebar: /sidebar|drawer|menu/i,
  hero: /hero|banner|jumbotron/i,
  footer: /footer|bottom/i,
  layout: /layout|container|wrapper|grid/i,
} as const;

const INTENT_PATTERNS = {
  elegant: /elegant|sophisticated|clean|minimal/i,
  modern: /modern|sleek|contemporary/i,
  professional: /professional|business|corporate/i,
  fun: /fun|playful|colorful|vibrant/i,
  dark: /dark|night|black/i,
  responsive: /responsive|mobile|adaptive/i,
  interactive: /interactive|hover|animate|click/i,
} as const;

export function detectComponentType(userMessage: string): string {
  for (const [type, pattern] of Object.entries(COMPONENT_PATTERNS)) {
    if (pattern.test(userMessage)) {
      return type;
    }
  }
  return 'component';
}

export function detectIntent(userMessage: string): string[] {
  const intents: string[] = [];
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(userMessage)) {
      intents.push(intent);
    }
  }
  return intents;
}

export function getOperationType(toolName: string, args: any): string {
  if (toolName === 'str_replace_editor') {
    if (args?.command === 'create') return 'create';
    if (args?.command === 'str_replace') return 'modify';
    if (args?.command === 'insert') return 'enhance';
  }
  if (toolName === 'file_manager') {
    if (args?.command === 'rename') return 'organize';
    if (args?.command === 'delete') return 'cleanup';
  }
  return 'process';
}

export function generateToolMessage(context: ToolContext): ToolDisplayInfo {
  const { userRequest, componentType, toolName, operation } = context;
  const intents = detectIntent(userRequest);
  
  // Special handling for str_replace_editor
  if (toolName === 'str_replace_editor') {
    return getEditorMessage(componentType, operation, intents);
  }
  
  // Special handling for file_manager
  if (toolName === 'file_manager') {
    return getFileManagerMessage(operation);
  }
  
  // Fallback
  return {
    message: `Working on your ${componentType}...`,
    emoji: '⚡',
    color: 'text-blue-600'
  };
}

function getEditorMessage(componentType: string, operation?: string, intents: string[] = []): ToolDisplayInfo {
  const intentModifier = getIntentModifier(intents);
  
  switch (operation) {
    case 'create':
      return {
        message: `Crafting your ${intentModifier}${componentType}...`,
        emoji: '🚀',
        color: 'text-blue-600'
      };
    
    case 'modify':
      return {
        message: `Perfecting your ${componentType}...`,
        emoji: '🔧',
        color: 'text-amber-600'
      };
    
    case 'enhance':
      return {
        message: `Adding finishing touches...`,
        emoji: '✨',
        color: 'text-purple-600'
      };
    
    default:
      return {
        message: `Bringing your ${componentType} to life...`,
        emoji: '🎨',
        color: 'text-blue-600'
      };
  }
}

function getFileManagerMessage(operation?: string): ToolDisplayInfo {
  switch (operation) {
    case 'organize':
      return {
        message: 'Organizing your project...',
        emoji: '📁',
        color: 'text-green-600'
      };
    
    case 'cleanup':
      return {
        message: 'Cleaning up files...',
        emoji: '🧹',
        color: 'text-gray-600'
      };
    
    default:
      return {
        message: 'Managing files...',
        emoji: '📂',
        color: 'text-blue-600'
      };
  }
}

function getIntentModifier(intents: string[]): string {
  if (intents.includes('elegant')) return 'elegant ';
  if (intents.includes('modern')) return 'modern ';
  if (intents.includes('professional')) return 'professional ';
  if (intents.includes('fun')) return 'playful ';
  if (intents.includes('interactive')) return 'interactive ';
  return '';
}

// Helper to get user-friendly tool display for the UI
export function getToolDisplayInfo(toolName: string, userRequest: string, toolArgs?: any): ToolDisplayInfo {
  const componentType = detectComponentType(userRequest);
  const operation = getOperationType(toolName, toolArgs);
  
  const context: ToolContext = {
    userRequest,
    componentType,
    operationPhase: 'creating', // We can enhance this later
    toolName,
    operation
  };
  
  return generateToolMessage(context);
}