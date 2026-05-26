import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#dceee6',
          500: '#2d6a4f',
          600: '#1b4332',
          700: '#081c15',
        },
      },
    },
  },
  plugins: [],
};

export default config;
