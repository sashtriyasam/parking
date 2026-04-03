import { useThemeStore } from '../store/themeStore';
import { darkTheme, lightTheme, colors as baseColors } from '../constants/colors';
import { useColorScheme } from 'react-native';

export const useThemeColors = () => {
  const theme = useThemeStore((state) => state.theme);
  const systemColorScheme = useColorScheme();

  const currentTheme = theme === 'system' 
    ? (systemColorScheme === 'dark' ? darkTheme : lightTheme)
    : (theme === 'dark' ? darkTheme : lightTheme);

  return {
    ...baseColors,
    ...currentTheme,
    isDark: (theme === 'system' ? systemColorScheme : theme) === 'dark',
  };
};
