const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for the @ alias from tsconfig.json
config.resolver.alias = {
  ...(config.resolver.alias || {}),
  '@': __dirname,
};

module.exports = config;
