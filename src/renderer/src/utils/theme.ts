import { theme as antdTheme } from 'antd';

export const lightTheme = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    fontSize: 13,
    colorPrimary: '#0284c7'
  }
};

export const darkTheme = {
  algorithm: antdTheme.darkAlgorithm,
  token: {
    fontSize: 13,
    colorPrimary: '#0284c7'
  }
};

export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};
