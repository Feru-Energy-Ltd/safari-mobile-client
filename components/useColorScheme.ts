import { useColorScheme as _useColorScheme } from 'react-native';

export const useColorScheme = () => {
  return _useColorScheme() ?? 'light';
};
