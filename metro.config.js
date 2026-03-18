const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const {
    resolver: { sourceExts, assetExts },
} = config;

config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
    ...config.resolver,
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    unstable_enablePackageExports: true,
};

module.exports = withNativeWind(config, { input: './global.css' });
