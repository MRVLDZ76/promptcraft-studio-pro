/**
 * Create Book Wizard
 * Multi-step form for creating a new book project
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  PlayIcon, 
  StopIcon, 
  PhotoIcon,
  BookOpenIcon,
  AcademicCapIcon,
  LightBulbIcon,
  UserIcon,
  SparklesIcon,
  WrenchIcon,
  PuzzlePieceIcon,
  DocumentTextIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  BoltIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  ProjectType,
  ProcessingMode,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_DESCRIPTIONS,
  PROCESSING_MODE_LABELS,
  PROCESSING_MODE_DESCRIPTIONS,
  PROCESSING_MODE_COSTS,
  VOICE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
} from '../types';
import { createBookProject } from '../services/publishingService';
import { useAutoSave } from '../hooks/useAutoSave';
import SaveStatusIndicator from '../../components/SaveStatusIndicator';

// Processing Mode Icons mapping
const PROCESSING_MODE_ICONS: Record<ProcessingMode, any> = {
  [ProcessingMode.PRESERVE]: ShieldCheckIcon,
  [ProcessingMode.POLISH]: PaintBrushIcon,
  [ProcessingMode.ENHANCE]: BoltIcon,
  [ProcessingMode.CREATIVE]: SparklesIcon,
  [ProcessingMode.REIMAGINE]: ArrowPathIcon,
};

// Cover Design Presets with tooltips
const COVER_DESIGN_PRESETS = [
  { 
    label: 'Minimalist',
    tooltip: 'Clean, simple design with bold typography',
    prompt: 'Minimalist book cover design with clean lines, bold sans-serif typography, single focal image or abstract geometric shapes, ample white space, professional and modern aesthetic'
  },
  { 
    label: 'Cinematic',
    tooltip: 'Movie-poster style with dramatic lighting',
    prompt: 'Cinematic book cover with dramatic lighting, movie-poster composition, photorealistic elements, atmospheric depth, bold title treatment with subtle glow effects'
  },
  { 
    label: 'Illustrated',
    tooltip: 'Hand-drawn or digital art style',
    prompt: 'Beautifully illustrated book cover with detailed artistic rendering, rich colors, fantasy art style, ornate borders or decorative elements, hand-lettered title'
  },
  { 
    label: 'Vintage',
    tooltip: 'Classic, retro aesthetic with aged textures',
    prompt: 'Vintage-style book cover with aged paper texture, classic typography, muted color palette, nostalgic imagery, elegant serif fonts, subtle distressed effects'
  },
  { 
    label: 'Dark & Moody',
    tooltip: 'Mysterious with deep shadows and contrast',
    prompt: 'Dark moody book cover with deep shadows, high contrast, mysterious atmosphere, noir-inspired imagery, dramatic spotlight effects, elegant dark typography'
  },
  { 
    label: 'Bright & Colorful',
    tooltip: 'Vibrant colors, playful energy',
    prompt: 'Bright colorful book cover with vibrant palette, playful composition, energetic design, modern flat illustration style, bold saturated colors, fun typography'
  },
];

// Back Cover Blurb Templates
const BLURB_TEMPLATES = [
  {
    label: 'The Hook + Stakes',
    tooltip: 'Start with intrigue, raise the stakes',
    template: `[Hook question or dramatic statement that captures attention]

[Protagonist name] has always [describe their ordinary world]. But when [inciting incident], everything changes.

Now, [describe the challenge/conflict]. With [what's at stake], [protagonist] must [what they need to do]. 

But [twist or complication] threatens to destroy everything.

[Final tagline or question that leaves readers wanting more]`
  },
  {
    label: 'The Journey',
    tooltip: 'Focus on transformation and discovery',
    template: `From the [setting/world], comes a story of [theme: courage, love, discovery, etc.].

[Protagonist] never expected to [key plot point]. Yet when [catalyst event], they find themselves on a journey that will [outcome/change].

Along the way, [describe key relationships or challenges]. But the greatest challenge lies ahead: [climactic choice/conflict].

A [genre] tale about [deeper themes] that will stay with you long after the last page.`
  },
  {
    label: 'The Question',
    tooltip: 'Pose compelling questions to intrigue readers',
    template: `What would you do if [provocative scenario]?

For [protagonist], this isn't hypothetical. When [inciting incident], they must choose between [choice A] and [choice B].

Set in [setting], this [genre] explores what happens when [theme/concept]. 

Some questions don't have easy answers. Some choices change everything.

[Title] is a story about [final thematic statement].`
  },
];

// Author Bio Templates
const BIO_TEMPLATES = [
  {
    label: 'First-Time Author',
    tooltip: 'Perfect for debut writers',
    template: `[Your Name] is a [profession/background] turned author, bringing years of [relevant experience] to their writing. When not crafting stories, they enjoy [hobbies/interests]. [Title] is their debut novel. They live in [location] with [family/pets].`
  },
  {
    label: 'Established Writer',
    tooltip: 'For authors with previous works',
    template: `[Your Name] is the author of [previous books/awards]. Their work has been featured in [publications/recognition]. With a background in [relevant experience], they bring authenticity and depth to their stories. They live in [location] and are currently working on their next book.`
  },
  {
    label: 'Professional Expert',
    tooltip: 'For non-fiction or industry experts',
    template: `[Your Name] has spent [X years] in [industry/field], working with [notable clients/companies]. They hold [degrees/certifications] and have been featured in [publications/media]. This book distills their expertise into actionable insights for [target audience].`
  },
];

// Dedication Templates
const DEDICATION_TEMPLATES = [
  { label: 'Family', template: 'For [name], who believed in this story before anyone else.' },
  { label: 'Inspirational', template: 'To everyone who dared to dream—this is for you.' },
  { label: 'Memorial', template: 'In loving memory of [name], whose spirit lives on in these pages.' },
  { label: 'Simple', template: 'For [name]. Always.' },
];

// Global Context Templates
const CONTEXT_TEMPLATES = [
  {
    label: 'Character-Focused',
    tooltip: 'Define your main character in detail',
    template: `PROTAGONIST:
- Name: [Full Name] (nickname: [Nick])
- Age: [X years old]
- Appearance: [height, build, hair color, eye color, distinguishing features]
- Personality: [3-5 key traits]
- Background: [brief history]
- Goal: [what they want]
- Flaw: [internal conflict/weakness]

SUPPORTING CAST:
- [Name]: [brief description and relationship to protagonist]
- [Name]: [brief description and relationship to protagonist]`
  },
  {
    label: 'World-Building',
    tooltip: 'Establish your setting and atmosphere',
    template: `SETTING:
- World: [name/type of world]
- Time Period: [when the story takes place]
- Key Locations: [list main settings]
- Technology Level: [medieval, modern, futuristic, etc.]
- Magic/Special Elements: [if applicable]

TONE & ATMOSPHERE:
- Overall mood: [dark, hopeful, mysterious, etc.]
- Visual style: [cinematic reference or art style]
- Themes: [love, redemption, power, etc.]`
  },
  {
    label: 'Complete Guide',
    tooltip: 'Comprehensive character and setting details',
    template: `VISUAL STYLE: [Art direction - e.g., "Blade Runner meets The Martian"]

MAIN CHARACTER:
- [Name]: [Age], [physical description], [personality]. [Key detail to remember]

SETTING:
- [Location name]: [Description, atmosphere, key features]

IMPORTANT RULES:
- Always refer to [character] as [specific name/title]
- [Character] never [limitation]
- The [item/place] is always described as [specific way]

RECURRING ELEMENTS:
- [Symbol/motif that appears throughout]
- [Catchphrase or recurring dialogue]`
  },
];

// Custom Image Style Presets
const IMAGE_STYLE_PRESETS = [
  { label: 'Studio Ghibli', prompt: 'Studio Ghibli inspired, soft watercolors, dreamlike atmosphere, warm lighting, whimsical details' },
  { label: 'Noir', prompt: 'Film noir style, high contrast black and white, dramatic shadows, 1940s aesthetic, moody atmosphere' },
  { label: 'Concept Art', prompt: 'Professional concept art, detailed environments, cinematic composition, digital painting, AAA game quality' },
  { label: 'Storybook', prompt: 'Classic storybook illustration, warm colors, gentle linework, nostalgic feel, hand-painted textures' },
  { label: 'Sci-Fi', prompt: 'Sci-fi concept art, futuristic technology, sleek design, neon accents, Syd Mead inspired' },
  { label: 'Painterly', prompt: 'Oil painting style, rich textures, impressionistic brushstrokes, classical composition, museum quality' },
];

// Starter prompt templates by project type
const PROMPT_TEMPLATES: Record<ProjectType, { label: string; prompt: string }[]> = {
  [ProjectType.NOVEL]: [
    { label: 'Fantasy Epic', prompt: 'Create a 12-chapter fantasy novel about a young apprentice who discovers they are the last heir to a forgotten magical kingdom. Include rich world-building, complex characters, and an epic battle between light and darkness. Target audience: Young Adult readers.' },
    { label: 'Mystery Thriller', prompt: 'Write a 10-chapter mystery thriller set in a small coastal town. A detective must solve a series of mysterious disappearances that are connected to an old lighthouse. Include red herrings, plot twists, and a surprising revelation at the end.' },
    { label: 'Romance Story', prompt: 'Create an 8-chapter contemporary romance novel about two rival business owners who are forced to work together on a community project. Include witty banter, emotional depth, and a heartwarming conclusion.' },
  ],
  [ProjectType.COURSE]: [
    { label: 'Language Course', prompt: 'Create a 10-chapter language learning course for beginners. Each chapter should include vocabulary, grammar rules, practical exercises, and cultural notes. Progress from basic greetings to conversational fluency.' },
    { label: 'Programming Course', prompt: 'Design a 12-chapter programming course for absolute beginners. Start with fundamental concepts, progress through data structures, and end with building a complete project. Include code examples and exercises.' },
    { label: 'Business Skills', prompt: 'Develop an 8-chapter business skills course covering leadership, communication, project management, and strategic thinking. Include case studies, practical exercises, and actionable frameworks.' },
  ],
  [ProjectType.GUIDE]: [
    { label: 'How-To Guide', prompt: 'Create a comprehensive 6-chapter practical guide on [topic]. Include step-by-step instructions, troubleshooting tips, best practices, and real-world examples. Target audience: beginners to intermediate practitioners.' },
    { label: 'Ultimate Reference', prompt: 'Write an 8-chapter definitive guide covering everything about [topic]. Include history, current best practices, advanced techniques, and future trends. Make it the go-to resource for professionals.' },
  ],
  [ProjectType.MEMOIR]: [
    { label: 'Life Journey', prompt: 'Write a 10-chapter memoir chronicling key life experiences, lessons learned, and personal growth. Focus on pivotal moments, relationships, and insights that shaped who you are today.' },
    { label: 'Professional Memoir', prompt: 'Create an 8-chapter memoir about a career journey in [industry]. Share challenges overcome, mentors encountered, major projects, and wisdom gained over decades of experience.' },
  ],
  [ProjectType.CHILDREN]: [
    { label: 'Picture Book Story', prompt: 'Write a charming children\'s picture book story (32 pages) about [theme]. Use simple, rhythmic language suitable for ages 3-6. Include opportunities for colorful illustrations on each spread.' },
    { label: 'Chapter Book', prompt: 'Create a 10-chapter early reader chapter book for ages 7-10. Include adventure, humor, relatable characters, and gentle life lessons. Each chapter should be 8-10 pages.' },
  ],
  [ProjectType.TECHNICAL]: [
    { label: 'Technical Manual', prompt: 'Create a comprehensive technical documentation for [system/product]. Include architecture overview, installation guides, API reference, troubleshooting, and best practices. Target audience: developers and system administrators.' },
    { label: 'Research Report', prompt: 'Write a detailed research report on [topic]. Include literature review, methodology, findings, analysis, and recommendations. Follow academic standards with proper citations.' },
  ],
  [ProjectType.CUSTOM]: [
    { label: 'Start from Scratch', prompt: 'Describe your unique book project here. Be specific about the structure, content, audience, and goals. The more detail you provide, the better the AI can help bring your vision to life.' },
  ],
};

interface CreateBookWizardProps {
  onClose: () => void;
  onBookCreated: (bookId: number) => void;
}

const CreateBookWizard: React.FC<CreateBookWizardProps> = ({ onClose, onBookCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: '',
    subtitle: '',
    author_name: '',
    description: '',
    project_type: ProjectType.NOVEL,

    // Step 2: Cover & Publishing
    cover_prompt: '',
    back_cover_text: '',
    author_bio: '',
    dedication: '',
    acknowledgments: '',
    isbn: '',
    publisher: '',
    copyright_year: new Date().getFullYear(),
    edition: '1st Edition',

    // Step 3: AI Configuration
    default_processing_mode: ProcessingMode.CREATIVE,
    global_context: '',
    enable_images: true,
    enable_audio: false,
    image_style: 'minimalist',
    image_style_custom: '',
    reference_images: [] as string[],
    voice_model: 'alloy',

    // Step 4: Output Formats
    generate_pdf: true,
    generate_epub: true,
    generate_html: true,
    generate_audiobook: false,
    
    // Step 4.5: Marketplace & Print Specs (NEW)
    marketplace: 'amazon_kdp',
    trim_size: 'kdp_6x9',
    paper_type: 'kdp_white',
    include_bleed: true,
    color_interior: false,
    
    // Step 4.6: Audiobook Marketplace Specs (NEW)
    audiobook_marketplace: 'acx_audible',
    audio_format: 'mp3_acx',
    audio_bitrate: 192,
    audio_mono_stereo: 'stereo',
    include_chapter_markers: true,
    include_opening_credits: true,
    include_closing_credits: true,
    generate_retail_sample: true,

    // Step 5: Prompt
    user_prompt: '',
  });

  // Auto-save hook
  const { saveStatus, lastSaved, errorMessage, saveNow } = useAutoSave(bookId, formData, {
    debounceMs: 1000,
    enableLocalStorage: true,
    localStorageKey: 'publishing_studio_draft'
  });

  // Manual save to local storage (for when no bookId exists)
  const saveToLocalStorageNow = useCallback(() => {
    try {
      const storageData = {
        data: formData,
        timestamp: new Date().toISOString(),
        step: step
      };
      localStorage.setItem('publishing_studio_draft', JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  }, [formData, step]);

  // Save on step change
  const handleStepChange = (newStep: number) => {
    // Save current state before changing step
    saveToLocalStorageNow();
    setStep(newStep);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Create draft on mount & check for unsaved work
  useEffect(() => {
    const initializeDraft = async () => {
      // Check for unsaved draft
      const savedDraft = localStorage.getItem('publishing_studio_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setShowDraftRestore(true);
          
          // Auto-restore after 10 seconds if user doesn't decide
          setTimeout(() => {
            if (showDraftRestore) {
              restoreDraft(draft);
            }
          }, 10000);
        } catch (e) {
          localStorage.removeItem('publishing_studio_draft');
        }
      }
      // Note: We no longer auto-create a draft on mount - drafts are created only when the user 
      // reaches step 5 or explicitly starts content generation. This prevents 401 errors and
      // unnecessary API calls for users who are just browsing the wizard.
    };
    
    initializeDraft();
  }, []);

  const restoreDraft = (draft: any) => {
    if (draft.bookId) {
      setBookId(draft.bookId);
    }
    if (draft.data) {
      setFormData(draft.data);
    }
    if (draft.step && draft.step >= 1 && draft.step <= 5) {
      setStep(draft.step);
    }
    setShowDraftRestore(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('publishing_studio_draft');
    setShowDraftRestore(false);
  };

  const handleVoicePreview = (voiceValue: string) => {
    if (playingVoice === voiceValue) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingVoice(null);
    } else {
      // Play voice sample
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(`/audio-samples/${voiceValue}.mp3`);
      audioRef.current = audio;
      setPlayingVoice(voiceValue);
      
      audio.play().catch(err => {
        // Silent fail - audio samples not available yet
        setPlayingVoice(null);
        audioRef.current = null;
        // Show user-friendly message instead of console error
        alert(`Voice preview not available yet. Audio samples need to be generated.\n\nSee PublishingStudio/public/audio-samples/README.md for instructions.`);
      });
      
      audio.onended = () => {
        setPlayingVoice(null);
        audioRef.current = null;
      };
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileUrls: string[] = [];
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          fileUrls.push(reader.result as string);
          if (fileUrls.length === files.length) {
            updateFormData('reference_images', [...formData.reference_images, ...fileUrls]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Handle text file upload for book description
  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        updateFormData('user_prompt', content);
      };
      reader.readAsText(file);
    }
  };

  const removeReferenceImage = (index: number) => {
    const newImages = formData.reference_images.filter((_, i) => i !== index);
    updateFormData('reference_images', newImages);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await createBookProject(formData);
      
      // Check if book was created as draft due to Celery unavailability
      if (response.status === 'DRAFT' && response.description?.includes('Pending generation')) {
        // Show alert about services needed
        alert(
          '📚 Book Created as Draft\n\n' +
          'Your book has been saved, but the AI generation service is currently unavailable.\n\n' +
          'To start generation, please:\n' +
          '1. Start Redis: docker-compose up -d redis\n' +
          '2. Start Celery worker: .\\start_celery_worker.ps1\n' +
          '3. Click "Regenerate" in the book editor\n\n' +
          'See START_SERVICES.md in the backend folder for detailed instructions.'
        );
      }
      
      onBookCreated(response.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create book');
      console.error('Error creating book:', err);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.author_name.trim();
      case 2:
        return true; // Cover & publishing info is optional
      case 3:
        return true; // AI config has defaults
      case 4:
        return true; // Output formats have defaults
      case 5:
        return formData.user_prompt.trim().length >= 50;
      default:
        return false;
    }
  };

  const renderStep1 = () => {
    const projectTypeIcons: Record<ProjectType, any> = {
      [ProjectType.NOVEL]: BookOpenIcon,
      [ProjectType.COURSE]: AcademicCapIcon,
      [ProjectType.GUIDE]: LightBulbIcon,
      [ProjectType.MEMOIR]: UserIcon,
      [ProjectType.CHILDREN]: SparklesIcon,
      [ProjectType.TECHNICAL]: WrenchIcon,
      [ProjectType.CUSTOM]: PuzzlePieceIcon,
    };

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>

        {/* Project Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Project Type *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => {
              const Icon = projectTypeIcons[value as ProjectType];
              const isSelected = formData.project_type === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateFormData('project_type', value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-6 h-6 flex-shrink-0 ${
                      isSelected 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        isSelected 
                          ? 'text-purple-900 dark:text-purple-100' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {label}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isSelected 
                          ? 'text-purple-700 dark:text-purple-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {PROJECT_TYPE_DESCRIPTIONS[value as ProjectType]}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Subtitle Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              placeholder="The Epic Journey"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subtitle (optional)
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => updateFormData('subtitle', e.target.value)}
              placeholder="A tale of courage and discovery"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Author Name & Description Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Author Name *
            </label>
            <input
              type="text"
              value={formData.author_name}
              onChange={(e) => updateFormData('author_name', e.target.value)}
              placeholder="Your Name"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Brief synopsis or overview..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Processing Mode Selection - Visible across all steps */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Default Processing Mode *
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Choose how the AI should handle your content. This setting applies to all chapters.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(PROCESSING_MODE_LABELS).map(([value, label]) => {
              const Icon = PROCESSING_MODE_ICONS[value as ProcessingMode];
              const isSelected = formData.default_processing_mode === value;
              const cost = PROCESSING_MODE_COSTS[value as ProcessingMode];
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateFormData('default_processing_mode', value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-500/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      isSelected 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          isSelected 
                            ? 'text-purple-900 dark:text-purple-100' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {label.split(' - ')[0]}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          cost === 0 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {cost === 0 ? 'Free' : `${cost} cr`}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 ${
                        isSelected 
                          ? 'text-purple-700 dark:text-purple-300' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {PROCESSING_MODE_DESCRIPTIONS[value as ProcessingMode]}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
    </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cover & Publishing Details
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        All fields are optional but recommended for professional output.
      </p>

      {/* Cover Design */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <PhotoIcon className="w-4 h-4 text-purple-500" />
          Book Cover
        </h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Start: Choose a Style
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COVER_DESIGN_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => updateFormData('cover_prompt', formData.cover_prompt 
                  ? `${formData.cover_prompt}\n\n${preset.prompt}` 
                  : preset.prompt
                )}
                className="group relative px-3 py-1.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
              >
                {preset.label}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {preset.tooltip}
                </span>
              </button>
            ))}
          </div>
          
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cover Design Prompt
          </label>
          <textarea
            value={formData.cover_prompt}
            onChange={(e) => updateFormData('cover_prompt', e.target.value)}
            placeholder="Describe your ideal cover: style, imagery, colors, mood...&#10;&#10;Click a style above to get started, then customize with your specific imagery."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              AI will generate a professional cover based on this description
            </p>
            {formData.cover_prompt && (
              <button
                type="button"
                onClick={() => updateFormData('cover_prompt', '')}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Back Cover */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4 text-purple-500" />
          Back Cover Content
        </h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Start: Choose a Structure
          </label>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {BLURB_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => updateFormData('back_cover_text', template.template)}
                className="group relative p-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-left"
              >
                <span className="block font-medium">{template.label}</span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{template.tooltip}</span>
              </button>
            ))}
          </div>
          
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Back Cover Blurb
          </label>
          <textarea
            value={formData.back_cover_text}
            onChange={(e) => updateFormData('back_cover_text', e.target.value)}
            placeholder="Compelling description for the back cover (150-250 words)...&#10;&#10;Choose a template above, then fill in the [bracketed sections] with your book's details."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
          />
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Replace [bracketed text] with your book's specifics
            </p>
            {formData.back_cover_text && (
              <button
                type="button"
                onClick={() => updateFormData('back_cover_text', '')}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Author Bio
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {BIO_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => updateFormData('author_bio', template.template)}
                className="group relative px-2.5 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
              >
                {template.label}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {template.tooltip}
                </span>
              </button>
            ))}
          </div>
          <textarea
            value={formData.author_bio}
            onChange={(e) => updateFormData('author_bio', e.target.value)}
            placeholder="Brief author biography for back cover (50-100 words)...&#10;&#10;Choose a template above or write your own."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>

      {/* Front Matter */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Front Matter
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dedication
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEDICATION_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  onClick={() => updateFormData('dedication', template.template)}
                  className="px-2.5 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
                >
                  {template.label}
                </button>
              ))}
            </div>
            <textarea
              value={formData.dedication}
              onChange={(e) => updateFormData('dedication', e.target.value)}
              placeholder="For [name], who believed in this story from the beginning..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Acknowledgments
            </label>
            <textarea
              value={formData.acknowledgments}
              onChange={(e) => updateFormData('acknowledgments', e.target.value)}
              placeholder="Thank you to my editor Sarah, beta readers, and..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Publishing Info */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Publishing Information
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ISBN (optional)
            </label>
            <input
              type="text"
              value={formData.isbn}
              onChange={(e) => updateFormData('isbn', e.target.value)}
              placeholder="978-1-234567-89-0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Publisher
            </label>
            <input
              type="text"
              value={formData.publisher}
              onChange={(e) => updateFormData('publisher', e.target.value)}
              placeholder="Independent / Publisher Name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Copyright Year
            </label>
            <input
              type="number"
              value={formData.copyright_year}
              onChange={(e) => updateFormData('copyright_year', parseInt(e.target.value))}
              min="1900"
              max="2100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Edition
            </label>
            <input
              type="text"
              value={formData.edition}
              onChange={(e) => updateFormData('edition', e.target.value)}
              placeholder="1st Edition"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">
          Professional Touch
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          These details make your book look professional and ready for publishing. ISBN can be obtained from ISBN agencies. All fields are optional but recommended for commercial releases.
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        AI Configuration
      </h3>

      {/* Processing Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Default Processing Mode
        </label>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(PROCESSING_MODE_LABELS).map(([value, label]) => {
            const isSelected = formData.default_processing_mode === value;
            const cost = PROCESSING_MODE_COSTS[value as ProcessingMode];
            return (
              <button
                key={value}
                type="button"
                onClick={() => updateFormData('default_processing_mode', value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isSelected 
                        ? 'text-purple-900 dark:text-purple-100' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {label}
                    </p>
                    <p className={`text-xs mt-1 ${
                      isSelected 
                        ? 'text-purple-700 dark:text-purple-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {PROCESSING_MODE_DESCRIPTIONS[value as ProcessingMode]}
                    </p>
                  </div>
                  <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                    isSelected
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-200'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {cost} {cost === 1 ? 'credit' : 'credits'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Global Context */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Global Context (Consistency Guide)
        </label>
        
        <div className="mb-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick Start: Choose a template structure</p>
          <div className="grid grid-cols-3 gap-2">
            {CONTEXT_TEMPLATES.map((template) => (
              <button
                key={template.label}
                type="button"
                onClick={() => updateFormData('global_context', template.template)}
                className="group relative p-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-left"
              >
                <span className="block font-medium">{template.label}</span>
                <span className="block text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{template.tooltip}</span>
              </button>
            ))}
          </div>
        </div>
        
        <textarea
          value={formData.global_context}
          onChange={(e) => updateFormData('global_context', e.target.value)}
          placeholder="Choose a template above, or describe your characters, setting, and visual style...&#10;&#10;This information helps AI maintain consistency across all chapters."
          rows={7}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This context is injected into every chapter for consistency
          </p>
          {formData.global_context && (
            <button
              type="button"
              onClick={() => updateFormData('global_context', '')}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-medium mb-1">Pro Tip:</p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Fill in the [bracketed sections] with your specific details. Include character appearances, 
            personality traits, setting details, and visual style. This prevents "narrative amnesia" 
            where AI forgets key details between chapters.
          </p>
        </div>
      </div>

      {/* Image Generation */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start space-x-3 mb-4">
          <input
            type="checkbox"
            checked={formData.enable_images}
            onChange={(e) => updateFormData('enable_images', e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Image Generation
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate AI illustrations for content blocks (+10 credits per image)
            </p>
          </div>
        </div>

        {formData.enable_images && (
          <div className="ml-6 space-y-4">
            {/* Image Style Preset - Compact Pills with Tooltips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Style
              </label>
              <div className="flex flex-wrap gap-2">
                {IMAGE_STYLE_OPTIONS.map((style) => {
                  const isSelected = formData.image_style === style.value;
                  return (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => updateFormData('image_style', style.value)}
                      className={`group relative px-3 py-1.5 text-sm font-medium rounded-full border-2 transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                          : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      {style.label}
                      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {style.tooltip}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Style Description - Only show when custom is selected */}
            {formData.image_style === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Describe Your Style
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {IMAGE_STYLE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => updateFormData('image_style_custom', preset.prompt)}
                      className="px-2 py-0.5 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-600 dark:text-gray-400 hover:text-purple-700 dark:hover:text-purple-300 transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.image_style_custom}
                  onChange={(e) => updateFormData('image_style_custom', e.target.value)}
                  placeholder="e.g., Studio Ghibli inspired, soft watercolors, dreamlike atmosphere..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
                />
              </div>
            )}

            {/* Reference Images - Compact */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reference Images
                </label>
                <span className="text-xs text-gray-400">Optional</span>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="reference-images"
                />
                <label
                  htmlFor="reference-images"
                  className="cursor-pointer flex items-center justify-center gap-2"
                >
                  <PhotoIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Upload style references
                  </span>
                </label>
              </div>

              {/* Display uploaded reference images */}
              {formData.reference_images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {formData.reference_images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Reference ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        onClick={() => removeReferenceImage(index)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Compact tip - Character Consistency */}
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
              Character consistency enabled — same seed used across all images
            </p>
          </div>
        )}
      </div>

      {/* Audio Generation */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-start space-x-3 mb-4">
          <input
            type="checkbox"
            checked={formData.enable_audio}
            onChange={(e) => updateFormData('enable_audio', e.target.checked)}
            className="mt-1"
          />
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enable Audio Generation
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Generate TTS narration for content blocks (+5 credits per block)
            </p>
          </div>
        </div>

        {formData.enable_audio && (
          <div className="ml-6 space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Voice Model
            </label>
            
            {/* Compact Voice Grid */}
            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = formData.voice_model === voice.value;
                const voiceDescriptions: Record<string, string> = {
                  'alloy': 'Neutral, balanced',
                  'echo': 'Clear male narrator',
                  'fable': 'British storyteller',
                  'onyx': 'Deep authoritative',
                  'nova': 'Friendly female',
                  'shimmer': 'Warm engaging',
                };
                return (
                  <div
                    key={voice.value}
                    className={`group relative flex items-center justify-between p-2.5 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => updateFormData('voice_model', voice.value)}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => updateFormData('voice_model', voice.value)}
                        className="w-3.5 h-3.5"
                      />
                      <span className={`text-sm font-medium ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                        {voice.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVoicePreview(voice.value);
                      }}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {playingVoice === voice.value ? (
                        <StopIcon className="w-4 h-4 text-red-500" />
                      ) : (
                        <PlayIcon className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                    {/* Tooltip */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {voiceDescriptions[voice.value]}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Click play icons to preview voices • ~150 words/min narration speed
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Output Formats
      </h3>

      {/* Compact 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'generate_html', label: 'HTML', desc: 'Web page', cost: 'Free', checked: formData.generate_html },
          { key: 'generate_pdf', label: 'PDF', desc: 'Print-ready', cost: '+5 cr', checked: formData.generate_pdf },
          { key: 'generate_epub', label: 'EPUB', desc: 'E-readers', cost: '+5 cr', checked: formData.generate_epub },
          { key: 'generate_audiobook', label: 'Audiobook', desc: 'Full MP3', cost: '+50 cr', checked: formData.generate_audiobook },
        ].map((format) => (
          <label
            key={format.key}
            className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
              format.checked
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={format.checked}
                onChange={(e) => updateFormData(format.key, e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <div>
                <span className={`text-sm font-medium ${format.checked ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                  {format.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">{format.desc}</span>
              </div>
            </div>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              format.cost === 'Free' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {format.cost}
            </span>
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        HTML is always generated. Other formats are processed after content generation.
      </p>
      
      {/* Marketplace & Print Specifications (NEW) */}
      {formData.generate_pdf && (
        <div className="mt-6 p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Print-Ready PDF Specifications
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Marketplace Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marketplace
              </label>
              <select
                value={formData.marketplace}
                onChange={(e) => updateFormData('marketplace', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="amazon_kdp">Amazon KDP</option>
                <option value="ingram_spark">IngramSpark</option>
                <option value="barnes_noble">Barnes & Noble Press</option>
                <option value="lulu">Lulu</option>
                <option value="universal">Universal (All Platforms)</option>
              </select>
            </div>
            
            {/* Trim Size Selector */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Book Size (Trim)
              </label>
              <select
                value={formData.trim_size}
                onChange={(e) => updateFormData('trim_size', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="kdp_6x9">6" × 9" (Standard Fiction)</option>
                <option value="kdp_5x8">5" × 8" (Compact)</option>
                <option value="kdp_5.5x8.5">5.5" × 8.5" (Digest)</option>
                <option value="kdp_5.25x8">5.25" × 8" (Mass Market)</option>
                <option value="kdp_7x10">7" × 10" (Large Format)</option>
                <option value="kdp_8x10">8" × 10" (Premium)</option>
                <option value="kdp_8.5x11">8.5" × 11" (Letter/Workbook)</option>
                <option value="ingram_8.5x8.5">8.5" × 8.5" (Square)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Paper Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Paper Type
              </label>
              <select
                value={formData.paper_type}
                onChange={(e) => updateFormData('paper_type', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="kdp_white">White Paper (Standard)</option>
                <option value="kdp_cream">Cream Paper (Classic)</option>
                <option value="ingram_50lb">50lb White (IngramSpark)</option>
                <option value="ingram_70lb">70lb Premium (IngramSpark)</option>
              </select>
            </div>
            
            {/* Color Options */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.color_interior}
                  onChange={(e) => {
                    updateFormData('color_interior', e.target.checked);
                    // Auto-enable bleed for color interiors
                    if (e.target.checked) {
                      updateFormData('include_bleed', true);
                    }
                  }}
                  className="w-3 h-3 rounded"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">Color Interior (+$$$)</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.include_bleed}
                  onChange={(e) => updateFormData('include_bleed', e.target.checked)}
                  className="w-3 h-3 rounded"
                  disabled={formData.color_interior}
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Include Bleed (0.125")
                  {formData.color_interior && <span className="text-purple-600"> Required</span>}
                </span>
              </label>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {formData.marketplace === 'amazon_kdp' && '📦 Amazon KDP specifications will be applied. Min 24 pages, max 828 pages.'}
            {formData.marketplace === 'ingram_spark' && '📦 IngramSpark specs: Professional distribution, requires ISBN.'}
            {formData.marketplace === 'barnes_noble' && '📦 Barnes & Noble Press specs: Free ISBN provided.'}
            {formData.marketplace === 'lulu' && '📦 Lulu specs: Flexible self-publishing platform.'}
            {formData.marketplace === 'universal' && '📦 Universal specs: Compatible with most platforms.'}
          </p>
        </div>
      )}
      
      {/* Audiobook Marketplace Specifications (NEW) */}
      {formData.generate_audiobook && (
        <div className="mt-6 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Audiobook Specifications (ACX/Audible)
          </h4>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Audiobook Marketplace */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                value={formData.audiobook_marketplace}
                onChange={(e) => updateFormData('audiobook_marketplace', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="acx_audible">ACX/Audible (Amazon)</option>
                <option value="findaway_voices">Findaway Voices (Wide)</option>
                <option value="authors_republic">Author's Republic</option>
                <option value="google_play">Google Play Audiobooks</option>
                <option value="spotify_audiobooks">Spotify Audiobooks</option>
              </select>
            </div>
            
            {/* Audio Format */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Audio Format
              </label>
              <select
                value={formData.audio_format}
                onChange={(e) => {
                  updateFormData('audio_format', e.target.value);
                  // Auto-set bitrate based on format
                  if (e.target.value === 'mp3_acx') updateFormData('audio_bitrate', 192);
                  if (e.target.value === 'mp3_standard') updateFormData('audio_bitrate', 128);
                  if (e.target.value === 'm4b') updateFormData('audio_bitrate', 64);
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="mp3_acx">MP3 192kbps (ACX Standard)</option>
                <option value="mp3_standard">MP3 128kbps (Standard)</option>
                <option value="mp3_high">MP3 320kbps (High Quality)</option>
                <option value="m4b">M4B 64kbps (Apple/Mobile)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Channel Configuration */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Channel
              </label>
              <select
                value={formData.audio_mono_stereo}
                onChange={(e) => updateFormData('audio_mono_stereo', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="stereo">Stereo (Recommended)</option>
                <option value="mono">Mono (Smaller File)</option>
              </select>
            </div>
            
            {/* Bitrate Display */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bitrate
              </label>
              <div className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
                {formData.audio_bitrate} kbps
              </div>
            </div>
          </div>
          
          {/* Audiobook Options */}
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.include_chapter_markers}
                onChange={(e) => updateFormData('include_chapter_markers', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Chapter Markers</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.include_opening_credits}
                onChange={(e) => updateFormData('include_opening_credits', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Opening Credits</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.include_closing_credits}
                onChange={(e) => updateFormData('include_closing_credits', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Closing Credits</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.generate_retail_sample}
                onChange={(e) => updateFormData('generate_retail_sample', e.target.checked)}
                className="w-3 h-3 rounded"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Retail Sample (5 min)</span>
            </label>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            {formData.audiobook_marketplace === 'acx_audible' && '🎧 ACX/Audible: 192kbps MP3, 40% royalty (exclusive) or 25% (non-exclusive).'}
            {formData.audiobook_marketplace === 'findaway_voices' && '🎧 Findaway: 80% royalty, distributes to 40+ platforms including Spotify.'}
            {formData.audiobook_marketplace === 'authors_republic' && '🎧 Author\'s Republic: 70% royalty, 24+ retailers.'}
            {formData.audiobook_marketplace === 'google_play' && '🎧 Google Play: 70% royalty, Android-focused.'}
            {formData.audiobook_marketplace === 'spotify_audiobooks' && '🎧 Spotify: Distributed via Findaway Voices.'}
          </p>
        </div>
      )}
    </div>
  );

  const renderStep5 = () => {
    const templates = PROMPT_TEMPLATES[formData.project_type as ProjectType] || PROMPT_TEMPLATES[ProjectType.CUSTOM];
    const ModeIcon = PROCESSING_MODE_ICONS[formData.default_processing_mode as ProcessingMode];
    
    return (
    <div className="space-y-6">
      {/* Current Settings Summary */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModeIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Processing Mode: {PROCESSING_MODE_LABELS[formData.default_processing_mode as ProcessingMode]?.split(' - ')[0]}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {PROCESSING_MODE_DESCRIPTIONS[formData.default_processing_mode as ProcessingMode]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Change
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Content Generation Prompt
      </h3>

      {/* Starter Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Quick Start Templates
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => updateFormData('user_prompt', template.prompt)}
              className={`p-3 rounded-lg border text-left transition-all hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 ${
                formData.user_prompt === template.prompt
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">{template.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{template.prompt.substring(0, 100)}...</p>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" />
            Or upload a text file
          </label>
        </div>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
          <input
            type="file"
            accept=".txt,.md,.doc,.docx"
            onChange={handleTextFileUpload}
            className="hidden"
            id="prompt-file-upload"
          />
          <label
            htmlFor="prompt-file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <DocumentTextIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Click to upload your book outline or manuscript
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Supports TXT, MD, DOC, DOCX
            </span>
          </label>
        </div>
      </div>

      {/* Main Prompt Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Describe your book *
        </label>
        <textarea
          value={formData.user_prompt}
          onChange={(e) => updateFormData('user_prompt', e.target.value)}
          placeholder="Create a 10-chapter German language course with daily lessons. Each chapter should cover grammar, vocabulary, and practical conversation exercises. Start with basic greetings and numbers, progress to everyday situations..."
          rows={10}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white text-sm"
        />
        <div className="flex justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Minimum 50 characters. Be specific about structure, chapters, and content.
          </p>
          <p className={`text-xs ${formData.user_prompt.length >= 50 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {formData.user_prompt.length} / 50 min
          </p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <LightBulbIcon className="w-4 h-4 text-amber-500" />
          Tips for better results
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Specify the number of chapters you want</li>
          <li>Describe the target audience and difficulty level</li>
          <li>Mention key topics or themes to cover</li>
          <li>Include any specific structure or format preferences</li>
        </ul>
      </div>
    </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl xl:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Draft Restore Banner */}
        {showDraftRestore && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-900 dark:text-blue-100">
                You have unsaved changes. Restore them?
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const draft = JSON.parse(localStorage.getItem('publishing_studio_draft') || '{}');
                  restoreDraft(draft);
                }}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Restore
              </button>
              <button
                onClick={discardDraft}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Discard
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Book - Step {step} of 5
          </h2>
          <div className="flex items-center space-x-4">
            <SaveStatusIndicator
              status={saveStatus}
              lastSaved={lastSaved}
              errorMessage={errorMessage}
            />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 shrink-0">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Processing Mode Indicator - Visible across all steps */}
        {step > 1 && (
          <div className="px-6 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Project:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {PROJECT_TYPE_LABELS[formData.project_type as ProjectType]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 dark:text-gray-400">Mode:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  {React.createElement(PROCESSING_MODE_ICONS[formData.default_processing_mode as ProcessingMode], { className: 'w-3.5 h-3.5' })}
                  {PROCESSING_MODE_LABELS[formData.default_processing_mode as ProcessingMode]?.split(' - ')[0]}
                </span>
              </div>
              {formData.title && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">Title:</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                    {formData.title}
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
            >
              Edit
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => step > 1 && handleStepChange(step - 1)}
              disabled={step === 1}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>
            
            {/* Save Status Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {saveStatus === 'saving' && (
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  Draft saved locally
                </span>
              )}
              {saveStatus === 'idle' && lastSaved && (
                <span className="text-gray-500 dark:text-gray-400">
                  Last saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={saveToLocalStorageNow}
                className="text-purple-600 dark:text-purple-400 hover:underline ml-2"
                title="Save draft now"
              >
                Save Draft
              </button>
            </div>
          </div>

          {step < 5 ? (
            <button
              onClick={() => canProceed() && handleStepChange(step + 1)}
              disabled={!canProceed()}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Book'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBookWizard;
