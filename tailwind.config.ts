/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        y: {
          base:    '#0A0A0C',
          surface: '#141417',
          raised:  '#1A1A1F',
          hover:   '#222228',
          accent:  '#FF4D00',
          'accent-2': '#E04500',
        },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', 'sans-serif'],
        jp:   ['"Noto Sans JP"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px',
        full: '9999px',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:    ['11px', '16px'],
        sm:    ['13px', '18px'],
        base:  ['14px', '20px'],
        md:    ['15px', '22px'],
        lg:    ['16px', '24px'],
        xl:    ['18px', '26px'],
        '2xl': ['22px', '30px'],
      },
    },
  },
  plugins: [],
};
