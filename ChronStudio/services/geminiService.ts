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
  
  const charContext = characters.map(c => `${c.name}: ${c.visualDescription}`).join('\n');
  const styleDesc = getStyleDescription(style);

  const MAX_CHAR_LENGTH = 20000;
  let safeContent = content;
  if (content.length > MAX_CHAR_LENGTH) {
      safeContent = content.substring(0, MAX_CHAR_LENGTH) + "... [Truncated]";
  }
  
  const prompt = `
    Act as a film director. Break the following text into short scenes for Veo 3.1 video generation.
    Category: ${category}
    Style: ${style} (${styleDesc})
    Setting: ${setting.landscape}, ${setting.year}.
    Notes: ${contextNote}
    
    Characters:
    ${charContext}

    Format as JSON array of objects with: number, durationSeconds, narrativeText, visualPrompt (starting with style), and characterIds.
    Text: "${safeContent}"
  `;

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

  const rawScenes = cleanAndParseJson(response.text, []);
  
  return rawScenes.map((s: any) => ({
    ...s,
    id: crypto.randomUUID(),
    status: 'pending',
    characterIds: (s.characterIds || []).map((name: string) => {
      const found = characters.find(c => name.toLowerCase().includes(c.name.toLowerCase()));
      return found ? found.id : null;
    }).filter(Boolean)
  }));
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