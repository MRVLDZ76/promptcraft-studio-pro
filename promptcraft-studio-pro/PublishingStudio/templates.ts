/**
 * Book Templates
 * Pre-designed templates with fonts, colors, and layouts
 */

export interface BookTemplate {
  id: string;
  name: string;
  description: string;
  category: 'modern' | 'classic' | 'bold' | 'professional' | 'technical' | 'children' | 'business' | 'academic' | 'literary' | 'lifestyle' | 'fiction';
  thumbnail: string;
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textLight: string;
    background: string;
  };
  layout: {
    pageWidth: string;
    margins: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    lineHeight: number;
    paragraphSpacing: string;
  };
}

export const BOOK_TEMPLATES: BookTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, contemporary design with lots of whitespace',
    category: 'modern',
    thumbnail: '/templates/modern-minimal.png',
    fonts: {
      heading: 'Inter',
      body: 'Inter',
      accent: 'Inter',
    },
    colors: {
      primary: '#1f2937',
      secondary: '#6366f1',
      accent: '#8b5cf6',
      text: '#374151',
      textLight: '#6b7280',
      background: '#ffffff',
    },
    layout: {
      pageWidth: '42rem',
      margins: {
        top: '3rem',
        right: '2.5rem',
        bottom: '3rem',
        left: '2.5rem',
      },
      lineHeight: 1.8,
      paragraphSpacing: '1.5rem',
    },
  },
  {
    id: 'classic-novel',
    name: 'Classic Novel',
    description: 'Timeless serif typography, perfect for literature',
    category: 'classic',
    thumbnail: '/templates/classic-novel.png',
    fonts: {
      heading: 'Playfair Display',
      body: 'Merriweather',
      accent: 'Playfair Display',
    },
    colors: {
      primary: '#1c1917',
      secondary: '#78716c',
      accent: '#a8a29e',
      text: '#292524',
      textLight: '#57534e',
      background: '#fafaf9',
    },
    layout: {
      pageWidth: '38rem',
      margins: {
        top: '4rem',
        right: '3rem',
        bottom: '4rem',
        left: '3rem',
      },
      lineHeight: 1.9,
      paragraphSpacing: '1.75rem',
    },
  },
  {
    id: 'bold-dynamic',
    name: 'Bold & Dynamic',
    description: 'Eye-catching design with vibrant colors and large text',
    category: 'bold',
    thumbnail: '/templates/bold-dynamic.png',
    fonts: {
      heading: 'Poppins',
      body: 'Open Sans',
      accent: 'Poppins',
    },
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#f59e0b',
      text: '#111827',
      textLight: '#4b5563',
      background: '#ffffff',
    },
    layout: {
      pageWidth: '44rem',
      margins: {
        top: '2.5rem',
        right: '2rem',
        bottom: '2.5rem',
        left: '2rem',
      },
      lineHeight: 1.7,
      paragraphSpacing: '1.25rem',
    },
  },
  {
    id: 'elegant-serif',
    name: 'Elegant Serif',
    description: 'Sophisticated serif typography for premium publications',
    category: 'classic',
    thumbnail: '/templates/elegant-serif.png',
    fonts: {
      heading: 'Crimson Text',
      body: 'Crimson Text',
      accent: 'Lora',
    },
    colors: {
      primary: '#2c1810',
      secondary: '#8b6f47',
      accent: '#c9a66b',
      text: '#3d2817',
      textLight: '#6b5840',
      background: '#fffef8',
    },
    layout: {
      pageWidth: '40rem',
      margins: {
        top: '3.5rem',
        right: '3rem',
        bottom: '3.5rem',
        left: '3rem',
      },
      lineHeight: 1.85,
      paragraphSpacing: '1.6rem',
    },
  },
  {
    id: 'tech-manual',
    name: 'Tech Manual',
    description: 'Clean technical layout for documentation and guides',
    category: 'technical',
    thumbnail: '/templates/tech-manual.png',
    fonts: {
      heading: 'Roboto Mono',
      body: 'Roboto',
      accent: 'Roboto Mono',
    },
    colors: {
      primary: '#0f172a',
      secondary: '#3b82f6',
      accent: '#06b6d4',
      text: '#1e293b',
      textLight: '#475569',
      background: '#f8fafc',
    },
    layout: {
      pageWidth: '48rem',
      margins: {
        top: '2rem',
        right: '2rem',
        bottom: '2rem',
        left: '2rem',
      },
      lineHeight: 1.75,
      paragraphSpacing: '1.25rem',
    },
  },
  {
    id: 'children-bright',
    name: 'Children\'s Bright',
    description: 'Playful colorful design for children\'s books',
    category: 'children',
    thumbnail: '/templates/children-bright.png',
    fonts: {
      heading: 'Comic Neue',
      body: 'Nunito',
      accent: 'Fredoka One',
    },
    colors: {
      primary: '#dc2626',
      secondary: '#f59e0b',
      accent: '#10b981',
      text: '#1f2937',
      textLight: '#4b5563',
      background: '#fffbeb',
    },
    layout: {
      pageWidth: '36rem',
      margins: {
        top: '2rem',
        right: '2rem',
        bottom: '2rem',
        left: '2rem',
      },
      lineHeight: 1.9,
      paragraphSpacing: '2rem',
    },
  },
  {
    id: 'business-pro',
    name: 'Business Professional',
    description: 'Corporate design for business books and reports',
    category: 'business',
    thumbnail: '/templates/business-pro.png',
    fonts: {
      heading: 'Montserrat',
      body: 'Source Sans Pro',
      accent: 'Montserrat',
    },
    colors: {
      primary: '#1e3a8a',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      text: '#1f2937',
      textLight: '#6b7280',
      background: '#ffffff',
    },
    layout: {
      pageWidth: '45rem',
      margins: {
        top: '2.5rem',
        right: '2.5rem',
        bottom: '2.5rem',
        left: '2.5rem',
      },
      lineHeight: 1.7,
      paragraphSpacing: '1.4rem',
    },
  },
  {
    id: 'vintage-typewriter',
    name: 'Vintage Typewriter',
    description: 'Nostalgic typewriter aesthetic for creative writing',
    category: 'classic',
    thumbnail: '/templates/vintage-typewriter.png',
    fonts: {
      heading: 'Courier Prime',
      body: 'Courier Prime',
      accent: 'Special Elite',
    },
    colors: {
      primary: '#2d2d2d',
      secondary: '#4a4a4a',
      accent: '#6b6b6b',
      text: '#3a3a3a',
      textLight: '#5a5a5a',
      background: '#f5f1e8',
    },
    layout: {
      pageWidth: '38rem',
      margins: {
        top: '3rem',
        right: '2.5rem',
        bottom: '3rem',
        left: '2.5rem',
      },
      lineHeight: 2.0,
      paragraphSpacing: '1.5rem',
    },
  },
  {
    id: 'magazine-style',
    name: 'Magazine Style',
    description: 'Contemporary magazine layout with visual emphasis',
    category: 'modern',
    thumbnail: '/templates/magazine-style.png',
    fonts: {
      heading: 'Oswald',
      body: 'PT Sans',
      accent: 'Bebas Neue',
    },
    colors: {
      primary: '#000000',
      secondary: '#dc2626',
      accent: '#fbbf24',
      text: '#262626',
      textLight: '#525252',
      background: '#ffffff',
    },
    layout: {
      pageWidth: '50rem',
      margins: {
        top: '2rem',
        right: '3rem',
        bottom: '2rem',
        left: '3rem',
      },
      lineHeight: 1.65,
      paragraphSpacing: '1.2rem',
    },
  },
  {
    id: 'academic-paper',
    name: 'Academic Paper',
    description: 'Traditional academic format for scholarly work',
    category: 'academic',
    thumbnail: '/templates/academic-paper.png',
    fonts: {
      heading: 'Times New Roman',
      body: 'Times New Roman',
      accent: 'Georgia',
    },
    colors: {
      primary: '#000000',
      secondary: '#1a1a1a',
      accent: '#4a4a4a',
      text: '#000000',
      textLight: '#333333',
      background: '#ffffff',
    },
    layout: {
      pageWidth: '40rem',
      margins: {
        top: '4rem',
        right: '3rem',
        bottom: '4rem',
        left: '3rem',
      },
      lineHeight: 2.0,
      paragraphSpacing: '1.5rem',
    },
  },
  {
    id: 'poetry-collection',
    name: 'Poetry Collection',
    description: 'Elegant layout for poetry and verse',
    category: 'literary',
    thumbnail: '/templates/poetry-collection.png',
    fonts: {
      heading: 'EB Garamond',
      body: 'EB Garamond',
      accent: 'Libre Baskerville',
    },
    colors: {
      primary: '#3f3f46',
      secondary: '#71717a',
      accent: '#a1a1aa',
      text: '#27272a',
      textLight: '#52525b',
      background: '#fafafa',
    },
    layout: {
      pageWidth: '32rem',
      margins: {
        top: '5rem',
        right: '3rem',
        bottom: '5rem',
        left: '3rem',
      },
      lineHeight: 2.2,
      paragraphSpacing: '2.5rem',
    },
  },
  {
    id: 'cookbook-recipe',
    name: 'Cookbook Recipe',
    description: 'Warm inviting design for cookbooks and recipes',
    category: 'lifestyle',
    thumbnail: '/templates/cookbook-recipe.png',
    fonts: {
      heading: 'Satisfy',
      body: 'Lato',
      accent: 'Pacifico',
    },
    colors: {
      primary: '#7c2d12',
      secondary: '#ea580c',
      accent: '#fb923c',
      text: '#451a03',
      textLight: '#78350f',
      background: '#fff7ed',
    },
    layout: {
      pageWidth: '42rem',
      margins: {
        top: '3rem',
        right: '2.5rem',
        bottom: '3rem',
        left: '2.5rem',
      },
      lineHeight: 1.8,
      paragraphSpacing: '1.5rem',
    },
  },
  {
    id: 'thriller-noir',
    name: 'Thriller Noir',
    description: 'Dark moody design for thrillers and mysteries',
    category: 'fiction',
    thumbnail: '/templates/thriller-noir.png',
    fonts: {
      heading: 'Bebas Neue',
      body: 'Roboto Condensed',
      accent: 'Anton',
    },
    colors: {
      primary: '#18181b',
      secondary: '#dc2626',
      accent: '#991b1b',
      text: '#27272a',
      textLight: '#52525b',
      background: '#fafafa',
    },
    layout: {
      pageWidth: '40rem',
      margins: {
        top: '2.5rem',
        right: '2rem',
        bottom: '2.5rem',
        left: '2rem',
      },
      lineHeight: 1.75,
      paragraphSpacing: '1.4rem',
    },
  },
  {
    id: 'romance-script',
    name: 'Romance Script',
    description: 'Romantic flowing design for love stories',
    category: 'fiction',
    thumbnail: '/templates/romance-script.png',
    fonts: {
      heading: 'Dancing Script',
      body: 'Libre Baskerville',
      accent: 'Great Vibes',
    },
    colors: {
      primary: '#9f1239',
      secondary: '#e11d48',
      accent: '#fb7185',
      text: '#4c0519',
      textLight: '#881337',
      background: '#fff1f2',
    },
    layout: {
      pageWidth: '38rem',
      margins: {
        top: '3.5rem',
        right: '2.5rem',
        bottom: '3.5rem',
        left: '2.5rem',
      },
      lineHeight: 1.9,
      paragraphSpacing: '1.7rem',
    },
  },
  {
    id: 'scifi-futuristic',
    name: 'Sci-Fi Futuristic',
    description: 'Sleek futuristic design for science fiction',
    category: 'fiction',
    thumbnail: '/templates/scifi-futuristic.png',
    fonts: {
      heading: 'Orbitron',
      body: 'Exo 2',
      accent: 'Audiowide',
    },
    colors: {
      primary: '#0c4a6e',
      secondary: '#0ea5e9',
      accent: '#22d3ee',
      text: '#0f172a',
      textLight: '#334155',
      background: '#f0f9ff',
    },
    layout: {
      pageWidth: '44rem',
      margins: {
        top: '2.5rem',
        right: '2rem',
        bottom: '2.5rem',
        left: '2rem',
      },
      lineHeight: 1.7,
      paragraphSpacing: '1.3rem',
    },
  },
];

/**
 * Get CSS string for a template with optional custom layout overrides
 */
export const getTemplateCSS = (
  template: BookTemplate,
  customLayout?: {
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    columns?: number;
    columnGap?: number;
    dropCap?: boolean;
    pageBreakBefore?: boolean;
  }
): string => {
  // Use custom layout values if provided, otherwise use template defaults
  const marginTop = customLayout?.marginTop !== undefined 
    ? `${customLayout.marginTop}mm` 
    : template.layout.margins.top;
  const marginRight = customLayout?.marginRight !== undefined 
    ? `${customLayout.marginRight}mm` 
    : template.layout.margins.right;
  const marginBottom = customLayout?.marginBottom !== undefined 
    ? `${customLayout.marginBottom}mm` 
    : template.layout.margins.bottom;
  const marginLeft = customLayout?.marginLeft !== undefined 
    ? `${customLayout.marginLeft}mm` 
    : template.layout.margins.left;
  
  const columns = customLayout?.columns || 1;
  const columnGap = customLayout?.columnGap ? `${customLayout.columnGap}px` : '20px';
  const dropCap = customLayout?.dropCap !== undefined ? customLayout.dropCap : false;
  const pageBreak = customLayout?.pageBreakBefore !== undefined ? customLayout.pageBreakBefore : false;

  return `
    .book-preview {
      font-family: ${template.fonts.body}, serif;
      color: ${template.colors.text};
      background-color: ${template.colors.background};
      max-width: ${template.layout.pageWidth};
      padding: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft};
      line-height: ${template.layout.lineHeight};
      ${columns > 1 ? `
      column-count: ${columns};
      column-gap: ${columnGap};
      ` : ''}
      ${pageBreak ? 'page-break-before: always;' : ''}
    }
    
    .book-preview h1 {
      font-family: ${template.fonts.heading}, serif;
      color: ${template.colors.primary};
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    
    .book-preview h2 {
      font-family: ${template.fonts.heading}, serif;
      color: ${template.colors.primary};
      font-size: 2rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .book-preview h3 {
      font-family: ${template.fonts.accent}, serif;
      color: ${template.colors.secondary};
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }
    
    .book-preview p {
      margin-bottom: ${template.layout.paragraphSpacing};
      text-align: justify;
    }
    
    ${dropCap ? `
    .book-preview .chapter-content > p:first-of-type::first-letter {
      font-size: 3em;
      float: left;
      line-height: 0.9;
      margin: 0.1em 0.15em 0 0;
      font-weight: bold;
      color: ${template.colors.primary};
    }
    ` : ''}
    
    .book-preview .chapter-number {
      font-family: ${template.fonts.accent}, serif;
      color: ${template.colors.accent};
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }
    
    .book-preview .chapter-image {
      width: 100%;
      max-width: 600px;
      margin: 2rem auto;
      border-radius: 0.5rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    .book-preview blockquote {
      border-left: 4px solid ${template.colors.accent};
      padding-left: 1.5rem;
      margin: 2rem 0;
      font-style: italic;
      color: ${template.colors.textLight};
    }
  `;
};

/**
 * Get template by ID
 */
export const getTemplate = (templateId: string): BookTemplate => {
  return BOOK_TEMPLATES.find(t => t.id === templateId) || BOOK_TEMPLATES[0];
};
