import { GoogleGenAI, Type, VideoGenerationReferenceType } from "@google/genai";
import { Character, Scene, StoryStyle, ProjectCategory } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper: Clean and Parse JSON from AI response
 * Handles markdown blocks and partial cleaning
 */
const cleanAndParseJson = (text: string | undefined, defaultValue: any) => {
  if (!text) return defaultValue;
  try {
    // 1. Try direct parse
    return JSON.parse(text);
  } catch (e) {
    // 2. Try stripping markdown code blocks
    let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // 3. Heuristic: Find first { or [ and last } or ]
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let start = -1;
    
    if (firstBrace > -1 && firstBracket > -1) start = Math.min(firstBrace, firstBracket);
    else if (firstBrace > -1) start = firstBrace;
    else if (firstBracket > -1) start = firstBracket;

    const lastBrace = clean.lastIndexOf('}');
    const lastBracket = clean.lastIndexOf(']');
    let end = -1;
    
    if (lastBrace > -1 && lastBracket > -1) end = Math.max(lastBrace, lastBracket);
    else if (lastBrace > -1) end = lastBrace;
    else if (lastBracket > -1) end = lastBracket;

    if (start > -1 && end > -1) {
        clean = clean.substring(start, end + 1);
        try {
          return JSON.parse(clean);
        } catch (e2) {
          console.error("Failed to parse cleaned JSON", e2);
        }
    }
    
    console.error("JSON Parse failed completely on text length:", text.length);
    return defaultValue;
  }
};

/**
 * Helper: Get detailed visual description for a style
 */
const getStyleDescription = (style: StoryStyle): string => {
  switch (style) {
    case StoryStyle.ANIMATED_STYLIZED:
      return 'High end 3D animation style, Pixar/Dreamworks quality, expressive lighting, smooth textures, vibrant color palette';
    case StoryStyle.RETRO_FUTURISM:
      return 'Retro-futurism, 1980s synthwave aesthetic, neon lights, chrome reflections, analog video artifacts, sci-fi noir, laser beams';
    case StoryStyle.GRITTY_REALISM:
      return 'Gritty realism, desaturated colors, high contrast, handheld camera feel, raw film grain, dramatic shadows, realistic textures, weathered surfaces';
    case StoryStyle.FAIRYTALE:
      return 'Fairytale illustration style brought to life, soft focus, magical lighting, ethereal atmosphere, storybook texture, golden hour, sparkling particles';
    case StoryStyle.LOW_POLY_3D:
      return 'Low poly 3D art style, flat shading, geometric shapes, vibrant colors, PS1 retro aesthetic, minimalist, charming blocky characters';
    case StoryStyle.DOCUMENTARY:
      return 'Documentary style, natural lighting, archival footage look, 16mm film grain, handheld stabilization, authentic period details';
    case StoryStyle.VINTAGE_KODACHROME:
      return '1960s Kodachrome film aesthetic, rich saturated reds and greens, slight halation, vintage lens flares, mid-century cinematic look';
    case StoryStyle.SURREAL_DREAMSCAPE:
      return 'Surrealism, magic realism, melting textures, dream-like transitions, non-euclidean architecture, vivid and unexpected color combinations, high art aesthetic';
    case StoryStyle.PENCIL_SKETCH:
      return 'Animated charcoal and pencil sketch, visible paper texture, dynamic hatching, monochrome with occasional splash of color, artistic and expressive strokes';
    case StoryStyle.NEO_NOIR:
      return 'Neo-Noir aesthetic, wet streets, high-contrast chiaroscuro lighting, deep blacks, rain, cynical atmosphere, moody blues and sharp highlights';
    case StoryStyle.CINEMATIC_DRAMA:
    default:
      return 'Historical drama, 8k resolution, cinematic photorealism, dramatic lighting, shallow depth of field, ARRI Alexa, anamorphic lens, high production value';
  }
};

/**
 * Helper: Research Historical Content
 */
export const researchHistoricalContent = async (topic: string): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Act as a lead researcher for a high-budget historical documentary series. 
    Topic: "${topic}"
    
    Provide a comprehensive, engaging narrative overview of this topic suitable for video adaptation. 
    Focus on setting the scene, key events, major figures, and visual details.
    Format as clean prose.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "";
};

/**
 * Step 1: Analyze Text
 */
export const analyzeSourceText = async (
  category: ProjectCategory,
  title: string,
  segment: string,
  content: string,
  contextNote: string
) => {
  const ai = getAI();
  
  let categoryContext = "";
  if (category === ProjectCategory.BIBLICAL) {
    categoryContext = `This is a Biblical narrative from Book: ${title}, Chapter: ${segment}. Maintain theological accuracy and historical reverence.`;
  } else if (category === ProjectCategory.HISTORICAL) {
    categoryContext = `This is a Historical account regarding: ${title}, Segment/Date: ${segment}. Maintain historical accuracy and realism.`;
  } else {
    categoryContext = `This is a Creative/Custom project titled: ${title}, Segment: ${segment}. Adapt the tone and style based on the provided text.`;
  }

  const MAX_CHAR_LENGTH = 25000;
  let safeContent = content;
  if (content.length > MAX_CHAR_LENGTH) {
      safeContent = content.substring(0, MAX_CHAR_LENGTH) + "... [Truncated]";
  }

  const prompt = `
    Analyze the following text for video production.
    Context: ${categoryContext}
    Additional User Notes: "${contextNote}"
    Source Text: "${safeContent}"

    Extract:
    1. Summary logline.
    2. Setting (Year, Region, Landscape).
    3. Key characters with visual and voice descriptions.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          setting: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.STRING },
              region: { type: Type.STRING },
              landscape: { type: Type.STRING }
            }
          },
          characters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                visualDescription: { type: Type.STRING },
                voiceDescription: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return cleanAndParseJson(response.text, {});
};

/**
 * Helper: Build Character Prompt
 */
export const buildCharacterPrompt = (character: Character, settingDescription: string, style: StoryStyle): string => {
  const styleDesc = getStyleDescription(style);
  return `Character Concept Art. High quality. Subject: ${character.name} - ${character.visualDescription}. Setting context: ${settingDescription}. Style: ${styleDesc}. Neutral background.`;
};

/**
 * Step 2: Generate Reference Image
 */
export const generateCharacterReference = async (character: Character, settingDescription: string, style: StoryStyle): Promise<string> => {
  const ai = getAI();
  const prompt = buildCharacterPrompt(character, settingDescription, style);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

/**
 * Step 3: Create Storyboard
 * OPTIMIZED: Dynamic scene count, context-aware prompt, comprehensive edge case handling
 */
export const generateStoryboard = async (
  content: string, 
  contextNote: string,
  characters: Character[], 
  style: StoryStyle, 
  setting: any,
  category: ProjectCategory
): Promise<Scene[]> => {
  const ai = getAI();

  // EDGE CASE: Validate inputs
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty. Please provide narrative text to generate sequences.');
  }

  const styleDesc = getStyleDescription(style);

  // DYNAMIC SCENE COUNT: Adapt to content length and style with AGGRESSIVE TOKEN REDUCTION
  const calculateOptimalSceneCount = (textLength: number, styleValue: StoryStyle): { min: number; max: number; target: number } => {
    // Estimate word count (roughly 5 chars per word)
    const wordCount = Math.ceil(textLength / 5);
    
    // AGGRESSIVE reduction: fewer scenes to save tokens
    let baseCount: number;
    
    if (styleValue === StoryStyle.DOCUMENTARY) {
      // Documentary: (1 per 600-800 words)
      baseCount = Math.ceil(wordCount / 700);
    } else if (styleValue === StoryStyle.CINEMATIC_DRAMA) {
      // Drama: (1 per 800-1000 words)
      baseCount = Math.ceil(wordCount / 900);
    } else if (styleValue === StoryStyle.GRITTY_REALISM || styleValue === StoryStyle.NEO_NOIR) {
      // Intense: (1 per 700-900 words)
      baseCount = Math.ceil(wordCount / 800);
    } else if (styleValue === StoryStyle.ANIMATED_STYLIZED || styleValue === StoryStyle.FAIRYTALE) {
      // Stylized: (1 per 800-1000 words)
      baseCount = Math.ceil(wordCount / 900);
    } else {
      // Default: 1 scene per 850 words
      baseCount = Math.ceil(wordCount / 850);
    }
    
    // Enforce reasonable bounds - REDUCED MAX from 18 to 12
    const min = Math.max(2, Math.min(baseCount - 1, 12));
    const max = Math.min(baseCount + 1, 14);
    const target = Math.min(baseCount, 12);
    
    return { min, max, target };
  };

  const sceneCount = calculateOptimalSceneCount(content.length, style);
  
  const MAX_CHAR_LENGTH = 10000; // AGGRESSIVE reduction from 15000 to 10000
  let safeContent = content;
  if (content.length > MAX_CHAR_LENGTH) {
    // TRUNCATION HANDLING: Add context about truncation
    safeContent = content.substring(0, MAX_CHAR_LENGTH) + "\n[Truncated. Focus on provided text.]";
  }

  // COMPACT character context to reduce tokens
  const charContext = characters.length > 0 
    ? characters.map(c => `${c.name}: ${c.visualDescription.substring(0, 80)}`).join(' | ').substring(0, 300)
    : 'None';
  const getCategoryGuidance = (cat: ProjectCategory): string => {
    switch(cat) {
      case ProjectCategory.BIBLICAL:
        return 'Maintain biblical accuracy and historical context. Emphasize divine moments and character revelations.';
      case ProjectCategory.HISTORICAL:
        return 'Balance narrative pacing with historical accuracy. Use period-appropriate visual details and settings.';
      case ProjectCategory.CUSTOM:
        return 'Create engaging, visually compelling scenes that match the narrative tone and context.';
      default:
        return 'Create engaging, visually compelling scenes that match the narrative tone.';
    }
  };

  const getStyleTone = (styleValue: StoryStyle): string => {
    switch(styleValue) {
      case StoryStyle.DOCUMENTARY:
        return 'Clear, informative, realistic visuals with natural lighting.';
      case StoryStyle.CINEMATIC_DRAMA:
        return 'Dramatic framing, emotional lighting, character-focused composition.';
      case StoryStyle.ANIMATED_STYLIZED:
        return 'Stylized, expressive visuals with artistic flair and vibrant colors.';
      case StoryStyle.RETRO_FUTURISM:
        return 'Retro-futuristic aesthetic with 70s-80s design elements and neon tones.';
      case StoryStyle.GRITTY_REALISM:
        return 'Raw, authentic, handheld-style visuals with natural imperfections.';
      case StoryStyle.FAIRYTALE:
        return 'Whimsical, magical, storybook-like visuals with warm golden tones.';
      case StoryStyle.LOW_POLY_3D:
        return 'Geometric, low-polygon 3D aesthetic with clean lines and modern design.';
      case StoryStyle.VINTAGE_KODACHROME:
        return 'Warm, faded vintage color palette reminiscent of 1950s-60s film stock.';
      case StoryStyle.SURREAL_DREAMSCAPE:
        return 'Dreamlike, abstract, surreal visuals with warped perspectives and ethereal atmosphere.';
      case StoryStyle.PENCIL_SKETCH:
        return 'Hand-drawn pencil sketch aesthetic with detailed line work and grayscale tones.';
      case StoryStyle.NEO_NOIR:
        return 'High contrast black and white, dramatic shadows, mysterious atmospheric lighting.';
      default:
        return 'Visually compelling and emotionally resonant.';
    }
  };
  
  const prompt = `Break narrative into ${sceneCount.target} key scenes. Each: number, durationSeconds (5-15), narrativeText (1-2 sentences), visualPrompt (40 words max), characterIds.

STYLE: ${style}. ${getStyleTone(style)}
CATEGORY: ${category}. ${getCategoryGuidance(category)}
SETTING: ${setting.landscape}, ${setting.year}
CHARS: ${charContext}

FORMAT visualPrompt: "STYLE. [Key elements: X, Y. Mood: Z. Lighting: W.]"
NO negatives, NO disclaimers. Just visuals.

NARRATIVE:
${safeContent}

OUTPUT: JSON array only.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              number: { type: Type.INTEGER },
              durationSeconds: { type: Type.INTEGER },
              narrativeText: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              characterIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        }
      }
    });

    // CHECK FOR MAX_TOKENS FINISH REASON
    if ((response.candidates?.[0] as any)?.finishReason === 'MAX_TOKENS') {
      console.warn('⚠️ Gemini hit MAX_TOKENS limit. Attempting truncation recovery...');
      
      // Try to parse partial response
      let rawScenes = cleanAndParseJson(response.text, []);
      
      if (rawScenes.length === 0) {
        throw new Error('API response was truncated. Please shorten your narrative or reduce context notes and try again.');
      }
      
      // Partial recovery: validate and clean truncated scenes
      rawScenes = rawScenes.filter((s: any) => 
        s.number !== undefined && 
        s.narrativeText?.trim() && 
        s.visualPrompt?.trim()
      );
      
      if (rawScenes.length === 0) {
        throw new Error('Could not recover valid scenes from truncated response. Try with shorter content.');
      }
      
      console.log(`✓ Recovered ${rawScenes.length} scenes from partial response`);
      
      return rawScenes.map((s: any) => ({
        ...s,
        id: crypto.randomUUID(),
        status: 'pending' as const,
        durationSeconds: Math.max(5, Math.min(15, s.durationSeconds || 10)),
        characterIds: (s.characterIds || [])
          .map((name: string) => {
            const found = characters.find(c => name.toLowerCase().includes(c.name.toLowerCase()));
            return found ? found.id : null;
          })
          .filter((id): id is string => id !== null)
      }));
    }

    const rawScenes = cleanAndParseJson(response.text, []);
    
    if (rawScenes.length === 0) {
      throw new Error('No scenes were generated. Please ensure your narrative has enough detail for scene breakdown.');
    }

    // VALIDATION: Ensure all scenes meet minimum requirements
    const validScenes = rawScenes.filter((s: any) => 
      s.number !== undefined && 
      s.narrativeText?.trim() && 
      s.visualPrompt?.trim()
    );

    if (validScenes.length === 0) {
      throw new Error('Generated scenes were incomplete. Please try again with more detailed content.');
    }
    
    return validScenes.map((s: any) => ({
      ...s,
      id: crypto.randomUUID(),
      status: 'pending' as const,
      durationSeconds: Math.max(5, Math.min(15, s.durationSeconds || 10)),
      characterIds: (s.characterIds || [])
        .map((name: string) => {
          const found = characters.find(c => name.toLowerCase().includes(c.name.toLowerCase()));
          return found ? found.id : null;
        })
        .filter((id): id is string => id !== null)
    }));
    
  } catch (error: any) {
    console.error('❌ Storyboard generation error:', error.message);
    
    // EDGE CASE: Provide helpful error context
    if (error.message.includes('MAX_TOKENS') || error.message.includes('truncated')) {
      throw new Error(`${error.message} Suggestion: reduce narrative length or context notes.`);
    }
    
    throw new Error(`Failed to generate sequences: ${error.message || 'Unknown error. Try again.'}`);
  }
};

/**
 * Step 4: Generate Video
 */
export const generateVeoVideo = async (
  prompt: string, 
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getAI();

  const cleanBase64 = referenceImageBase64 ? referenceImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '') : undefined;

  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: '16:9',
  };

  if (cleanBase64) {
    config.referenceImages = [{
        image: {
            imageBytes: cleanBase64,
            mimeType: 'image/png'
        },
        referenceType: VideoGenerationReferenceType.ASSET
    }];
  }

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    prompt: prompt,
    config: config
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");

  return `${videoUri}&key=${process.env.API_KEY}`;
};