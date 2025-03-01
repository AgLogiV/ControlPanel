const { OpenAI } = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI client
let openai = null;

// Only initialize if API key is available
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('OpenAI client initialized successfully');
  } catch (error) {
    logger.error(`Error initializing OpenAI client: ${error.message}`);
  }
} else {
  logger.warn('OPENAI_API_KEY is not set. AI script generation will return placeholder content.');
}

// Generate a script using AI
const generateScript = async (gameType, scriptType, parameters, language = 'bash') => {
  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      logger.warn('OpenAI client not initialized. Returning placeholder script.');
      return `# Placeholder ${scriptType} script for ${gameType}\n# OpenAI API key not configured\n# Please set OPENAI_API_KEY in your environment variables`;
    }
    
    logger.info(`Generating ${scriptType} script for ${gameType} game server`);
    
    // Prepare prompt based on script type
    let prompt = '';
    
    switch (scriptType) {
      case 'dockerfile':
        prompt = generateDockerfilePrompt(gameType, parameters);
        break;
      case 'config':
        prompt = generateConfigPrompt(gameType, parameters);
        break;
      case 'startup':
        prompt = generateStartupPrompt(gameType, parameters, language);
        break;
      case 'custom':
        prompt = generateCustomPrompt(gameType, parameters, language);
        break;
      default:
        throw new Error(`Invalid script type: ${scriptType}`);
    }
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in game server configuration and deployment. Your task is to generate high-quality, secure, and optimized scripts for game servers. Provide only the script content without any explanations or markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    // Extract script content from response
    const scriptContent = response.choices[0].message.content.trim();
    
    logger.info(`Generated ${scriptType} script for ${gameType} game server successfully`);
    
    return scriptContent;
  } catch (error) {
    logger.error(`Error generating script: ${error.message}`);
    throw new Error(`Failed to generate script: ${error.message}`);
  }
};

// Generate Dockerfile prompt
const generateDockerfilePrompt = (gameType, parameters) => {
  const { version = 'latest', playerCount = 10 } = parameters;
  
  return `Create a Dockerfile for a ${gameType} game server with the following specifications:
- Game version: ${version}
- Designed to support up to ${playerCount} players
- Include all necessary dependencies
- Set up proper environment variables
- Configure proper user permissions for security
- Use best practices for Docker image optimization
- Include comments explaining key steps

The Dockerfile should be production-ready and follow best practices.`;
};

// Generate config prompt
const generateConfigPrompt = (gameType, parameters) => {
  const { version = 'latest', playerCount = 10, mods = [] } = parameters;
  const modsText = mods.length > 0 ? `- Include the following mods: ${mods.join(', ')}` : '';
  
  return `Create a configuration file for a ${gameType} game server with the following specifications:
- Game version: ${version}
- Designed to support up to ${playerCount} players
${modsText}
- Optimize for performance and stability
- Include proper security settings
- Configure appropriate resource limits
- Include comments explaining key settings

The configuration should be production-ready and follow best practices for ${gameType} servers.`;
};

// Generate startup script prompt
const generateStartupPrompt = (gameType, parameters, language) => {
  const { version = 'latest', playerCount = 10 } = parameters;
  
  return `Create a ${language} startup script for a ${gameType} game server with the following specifications:
- Game version: ${version}
- Designed to support up to ${playerCount} players
- Include proper error handling
- Add health checks
- Configure automatic restarts on failure
- Set up proper logging
- Include comments explaining key steps

The script should be production-ready and follow best practices for ${gameType} servers.`;
};

// Generate custom script prompt
const generateCustomPrompt = (gameType, parameters, language) => {
  const { purpose = 'utility', description = 'A custom script' } = parameters;
  
  return `Create a ${language} script for a ${gameType} game server with the following purpose: ${purpose}
Description: ${description}

The script should:
- Be well-documented with comments
- Include proper error handling
- Follow best practices for ${language}
- Be optimized for performance
- Be secure and follow security best practices

The script should be production-ready and tailored specifically for ${gameType} servers.`;
};

module.exports = {
  generateScript,
}; 