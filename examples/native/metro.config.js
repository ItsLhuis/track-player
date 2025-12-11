const { getDefaultConfig } = require("@expo/metro-config")

const { wrapWithAudioAPIMetroConfig } = require("react-native-audio-api/metro-config")

const config = getDefaultConfig(__dirname)

// Add 'opus' to asset extensions
config.resolver.assetExts.push("opus")

module.exports = wrapWithAudioAPIMetroConfig(config)
