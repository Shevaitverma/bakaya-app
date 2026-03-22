const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Firebase v11 uses package.json "exports" which requires the "import"
// condition to resolve correctly in Metro.
config.resolver.unstable_conditionNames = [
  ...config.resolver.unstable_conditionNames,
  "import",
];

module.exports = config;
