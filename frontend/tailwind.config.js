/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: {
          DEFAULT: "rgba(var(--border))",
          hover: "rgba(var(--border-hover))",
        },
        input: "rgba(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Glass-specific backgrounds
        'bg-base': "hsl(var(--bg-base))",
        'bg-glass': "rgba(var(--bg-glass))",
        'bg-glass-hover': "rgba(var(--bg-glass-hover))",

        // Updated monochromatic accent colors
        'accent-primary': "hsl(var(--accent-primary))", // White #FFFFFF
        'accent-primary-hover': "hsl(var(--accent-primary-hover))", // Light Gray
        'accent-secondary': "hsl(var(--accent-secondary))", // Gray #888888
        'highlight-pink': "hsl(var(--highlight-pink))", // Optional Pink #FF5E78

        // Button-specific colors
        'btn-primary-bg': "hsl(var(--btn-primary-bg))", // White button background
        'btn-primary-text': "hsl(var(--btn-primary-text))", // Gray button text
        'btn-secondary-bg': "hsl(var(--btn-secondary-bg))", // Dark button background
        'btn-secondary-text': "hsl(var(--btn-secondary-text))", // White button text

        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          muted: "hsl(var(--primary-muted))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          hover: "hsl(var(--destructive-hover))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgba(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "rgba(var(--card-hover))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
      },
      borderRadius: {
        'sm': "var(--radius-sm)",
        'md': "var(--radius-md)",
        'lg': "var(--radius-lg)",
        'xl': "var(--radius-xl)",
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Space Grotesk', 'Inter', 'sans-serif'],
        'heading': ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'DEFAULT': 'var(--shadow)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'glass': 'var(--shadow-glass)',
        'glass-lg': 'var(--shadow-glass-lg)',
        'white': 'var(--shadow-white)',
        'white-lg': 'var(--shadow-white-lg)',
        'gray': 'var(--shadow-gray)',
        'pink': 'var(--shadow-pink)',
      },
      backdropBlur: {
        'sm': 'var(--blur-sm)',
        'md': 'var(--blur-md)',
        'lg': 'var(--blur-lg)',
        'xl': 'var(--blur-xl)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-hero': 'var(--gradient-hero)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        // Removed performance-heavy animations
        // 'slide-in-left': 'slideInLeft 0.5s ease-out',
        // 'slide-in-right': 'slideInRight 0.5s ease-out',
        // 'scale-in-bounce': 'scaleInBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        // 'shimmer': 'shimmer 2s infinite',
        // 'pulse-slow': 'pulse 3s ease-in-out infinite',
        // 'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        // 'breathe': 'breathe 4s ease-in-out infinite',
        // 'float': 'float 3s ease-in-out infinite',
        // 'float-slow': 'floatSlow 6s ease-in-out infinite',
        // 'tilt': 'tilt 0.6s ease-in-out',
        // 'tilt-3d': 'tilt3D 1s ease-in-out',
        // 'ripple': 'ripple 0.6s ease-out',
        // 'drink-splash': 'drinkSplash 0.8s ease-out',
        // 'glass-shatter': 'glassShatter 0.5s ease-out',
        // 'modal-slide-in': 'modalSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        // 'nav-float': 'navFloat 4s ease-in-out infinite',
        // 'card-hover-lift': 'cardHoverLift 0.3s ease-out',
        // 'glow': 'glow 2s ease-in-out infinite',
        // 'glow-gold': 'glowGold 2s ease-in-out infinite',
        // 'glow-pink': 'glowPink 2s ease-in-out infinite',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
    },
  },
  plugins: [],
}