export interface ThemeColor {
  id: string;
  name: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
}

export const themeColors: ThemeColor[] = [
  {
    id: 'rose',
    name: '玫红',
    primary: '#e91e63',
    primaryLight: '#f06292',
    primaryDark: '#c2185b',
    secondary: '#ff4081',
    secondaryLight: '#ff79b0',
    secondaryDark: '#c60055',
  },
  {
    id: 'blue',
    name: '海蓝',
    primary: '#2196f3',
    primaryLight: '#64b5f6',
    primaryDark: '#1976d2',
    secondary: '#03a9f4',
    secondaryLight: '#4fc3f7',
    secondaryDark: '#0288d1',
  },
  {
    id: 'purple',
    name: '紫罗兰',
    primary: '#9c27b0',
    primaryLight: '#ba68c8',
    primaryDark: '#7b1fa2',
    secondary: '#e91e63',
    secondaryLight: '#f06292',
    secondaryDark: '#c2185b',
  },
  {
    id: 'teal',
    name: '青绿',
    primary: '#009688',
    primaryLight: '#4db6ac',
    primaryDark: '#00796b',
    secondary: '#26a69a',
    secondaryLight: '#80cbc4',
    secondaryDark: '#00695c',
  },
  {
    id: 'orange',
    name: '橙色',
    primary: '#ff9800',
    primaryLight: '#ffb74d',
    primaryDark: '#f57c00',
    secondary: '#ff5722',
    secondaryLight: '#ff8a65',
    secondaryDark: '#e64a19',
  },
  {
    id: 'indigo',
    name: '靛蓝',
    primary: '#3f51b5',
    primaryLight: '#7986cb',
    primaryDark: '#303f9f',
    secondary: '#5c6bc0',
    secondaryLight: '#9fa8da',
    secondaryDark: '#3949ab',
  },
  {
    id: 'green',
    name: '翠绿',
    primary: '#4caf50',
    primaryLight: '#81c784',
    primaryDark: '#388e3c',
    secondary: '#8bc34a',
    secondaryLight: '#aed581',
    secondaryDark: '#689f38',
  },
  {
    id: 'amber',
    name: '琥珀',
    primary: '#ffc107',
    primaryLight: '#ffecb3',
    primaryDark: '#ff8f00',
    secondary: '#ffab00',
    secondaryLight: '#ffd54f',
    secondaryDark: '#ff6f00',
  },
];

export const getThemeColorById = (id: string): ThemeColor => {
  return themeColors.find(color => color.id === id) || themeColors[0];
};