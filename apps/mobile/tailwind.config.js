const baseConfig = require('@thirstee/config/tailwind/base.js')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  ...baseConfig,
  theme: {
    ...baseConfig.theme,
    extend: {
      ...baseConfig.theme.extend,
      // Mobile-specific theme extensions
      spacing: {
        ...baseConfig.theme.extend.spacing,
        'safe-top': '44px',
        'safe-bottom': '34px',
      }
    }
  }
}
