export interface AppTheme {
  id: string;
  name: string;
  premium: boolean;
  preview: [string, string]; // gradient preview
  colors: {
    bg: string;
    bgGradient: [string, string];
    primary: string;
    accent: string;
    alexa: string;
    buttonBg: string;
    buttonPressed: string;
    border: string;
    text: string;
    subtext: string;
    gray: string;
    card: string;
    tabBar: string;
    orange: string;
    green: string;
    red: string;
  };
}

export const THEMES: Record<string, AppTheme> = {
  default: {
    id: 'default', name: 'Amazon Dark', premium: false,
    preview: ['#131921', '#232F3E'],
    colors: {
      bg: '#131921', bgGradient: ['#131921', '#1A2535'], primary: '#232F3E',
      accent: '#FF9900', alexa: '#00CAFF', buttonBg: '#2D3B4E',
      buttonPressed: '#3D4F63', border: '#3A4A5C', text: '#FFFFFF',
      subtext: '#CCCCCC', gray: '#888888', card: '#1E2D3D',
      tabBar: '#232F3E', orange: '#FF9900', green: '#1DB954', red: '#E8272C',
    },
  },
  alexa_blue: {
    id: 'alexa_blue', name: 'Alexa Blue', premium: true,
    preview: ['#001A2E', '#003A5C'],
    colors: {
      bg: '#001A2E', bgGradient: ['#001A2E', '#003A5C'], primary: '#00273D',
      accent: '#00CAFF', alexa: '#00EAFF', buttonBg: '#00304A',
      buttonPressed: '#004060', border: '#00507A', text: '#FFFFFF',
      subtext: '#AAE8FF', gray: '#6699AA', card: '#002840',
      tabBar: '#001A2E', orange: '#00CAFF', green: '#00E5A0', red: '#FF4466',
    },
  },
  midnight: {
    id: 'midnight', name: 'Midnight Black', premium: true,
    preview: ['#000000', '#0D0D0D'],
    colors: {
      bg: '#000000', bgGradient: ['#000000', '#111111'], primary: '#111111',
      accent: '#FFFFFF', alexa: '#00CAFF', buttonBg: '#1A1A1A',
      buttonPressed: '#2A2A2A', border: '#333333', text: '#FFFFFF',
      subtext: '#CCCCCC', gray: '#666666', card: '#141414',
      tabBar: '#0A0A0A', orange: '#FF9900', green: '#1DB954', red: '#E8272C',
    },
  },
  amazon_orange: {
    id: 'amazon_orange', name: 'Amazon Orange', premium: true,
    preview: ['#1A0A00', '#3D1A00'],
    colors: {
      bg: '#1A0A00', bgGradient: ['#1A0A00', '#3D1A00'], primary: '#2D1500',
      accent: '#FF9900', alexa: '#FFB84D', buttonBg: '#3D1F00',
      buttonPressed: '#502800', border: '#6B3800', text: '#FFFFFF',
      subtext: '#FFD699', gray: '#AA7733', card: '#2A1200',
      tabBar: '#1A0A00', orange: '#FF9900', green: '#4CAF50', red: '#FF4444',
    },
  },
  emerald: {
    id: 'emerald', name: 'Emerald', premium: true,
    preview: ['#001A0D', '#003320'],
    colors: {
      bg: '#001A0D', bgGradient: ['#001A0D', '#003320'], primary: '#002210',
      accent: '#00E676', alexa: '#00E5FF', buttonBg: '#002D15',
      buttonPressed: '#003D1E', border: '#005528', text: '#FFFFFF',
      subtext: '#AAFFCC', gray: '#55AA77', card: '#002515',
      tabBar: '#001A0D', orange: '#FFB300', green: '#00E676', red: '#FF4444',
    },
  },
  royal_purple: {
    id: 'royal_purple', name: 'Royal Purple', premium: true,
    preview: ['#0D0020', '#200040'],
    colors: {
      bg: '#0D0020', bgGradient: ['#0D0020', '#1A0040'], primary: '#130030',
      accent: '#AA44FF', alexa: '#CC88FF', buttonBg: '#1A0040',
      buttonPressed: '#250055', border: '#3D0080', text: '#FFFFFF',
      subtext: '#DDAAFF', gray: '#8855AA', card: '#160035',
      tabBar: '#0D0020', orange: '#FF9900', green: '#44FF88', red: '#FF4466',
    },
  },
  neon_cyber: {
    id: 'neon_cyber', name: 'Neon Cyber', premium: true,
    preview: ['#050510', '#0A0A20'],
    colors: {
      bg: '#050510', bgGradient: ['#050510', '#0A0A25'], primary: '#080820',
      accent: '#00FF88', alexa: '#FF00AA', buttonBg: '#0F0F2A',
      buttonPressed: '#151535', border: '#00FF8844', text: '#00FF88',
      subtext: '#FF00AA', gray: '#445566', card: '#0A0A1E',
      tabBar: '#050510', orange: '#FFCC00', green: '#00FF88', red: '#FF0044',
    },
  },
  minimal_white: {
    id: 'minimal_white', name: 'Minimal White', premium: true,
    preview: ['#F5F5F5', '#EEEEEE'],
    colors: {
      bg: '#F5F5F5', bgGradient: ['#F5F5F5', '#E8E8E8'], primary: '#FFFFFF',
      accent: '#232F3E', alexa: '#0095C5', buttonBg: '#FFFFFF',
      buttonPressed: '#E0E0E0', border: '#DDDDDD', text: '#111111',
      subtext: '#555555', gray: '#999999', card: '#FFFFFF',
      tabBar: '#FFFFFF', orange: '#FF9900', green: '#1DB954', red: '#E8272C',
    },
  },
};

export const THEME_ORDER = [
  'default', 'alexa_blue', 'midnight', 'amazon_orange',
  'emerald', 'royal_purple', 'neon_cyber', 'minimal_white',
];
