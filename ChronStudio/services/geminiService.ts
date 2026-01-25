import { GoogleGenAI, Type, VideoGenerationReferenceType } from "@google/genai";
import { Character, Scene, StoryStyle, ProjectCategory } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Progress callback type for streaming scene generation
 */
export type SceneProgressCallback = (update: {
  phase: 'analyzing' | 'chunking' | 'generating' | 'complete' | 'error';
  chunkIndex?: number;
  totalChunks?: number;
  scenesGenerated?: number;
  currentScene?: Scene;
  message: string;
}) => void;

/**
 * Narrative chunk for processing
 */
interface NarrativeChunk {
  index: number;
  title: string;
  content: string;
  wordCount: number;
}

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
 * Helper: Split narrative into logical chunks for progressive processing
 * Identifies blocks, parts, sections, or falls back to paragraph splitting
 */
const splitNarrativeIntoChunks = (content: string): NarrativeChunk[] => {
  const chunks: NarrativeChunk[] = [];
  
  // Pattern 1: Explicit blocks (Block 1:, Block 2:, etc.)
  const blockPattern = /(?:^|\n)((?:Block|Part|Section|Chapter|Scene)\s*\d*[:\-.]?\s*[^\n]*)\n([\s\S]*?)(?=(?:\n(?:Block|Part|Section|Chapter|Scene)\s*\d)|$)/gi;
  let matches = [...content.matchAll(blockPattern)];
  
  if (matches.length >= 2) {
    matches.forEach((match, idx) => {
      const title = match[1].trim();
      const body = match[2].trim();
      if (body.length > 50) {
        chunks.push({
          index: idx,
          title: title,
          content: body,
          wordCount: body.split(/\s+/).length
        });
      }
    });
    if (chunks.length >= 2) return chunks;
  }
  
  // Pattern 2: Double newline paragraph groups (min 3 paragraphs per chunk)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 30);
  
  if (paragraphs.length >= 3) {
    const chunkSize = Math.ceil(paragraphs.length / Math.min(4, Math.ceil(paragraphs.length / 3)));
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      const group = paragraphs.slice(i, i + chunkSize);
      const body = group.join('\n\n');
      chunks.push({
        index: chunks.length,
        title: `Segment ${chunks.length + 1}`,
        content: body,
        wordCount: body.split(/\s+/).length
      });
    }
    if (chunks.length >= 2) return chunks;
  }
  
  // Pattern 3: Fallback - split by character count (~1500 chars per chunk)
  const CHUNK_SIZE = 1500;
  let remaining = content;
  let idx = 0;
  
  while (remaining.length > 0) {
    let splitPoint = Math.min(CHUNK_SIZE, remaining.length);
    
    // Try to split at sentence boundary
    if (splitPoint < remaining.length) {
      const sentenceEnd = remaining.lastIndexOf('. ', splitPoint);
      if (sentenceEnd > CHUNK_SIZE * 0.5) splitPoint = sentenceEnd + 1;
    }
    
    const chunk = remaining.substring(0, splitPoint).trim();
    remaining = remaining.substring(splitPoint).trim();
    
    if (chunk.length > 50) {
      chunks.push({
        index: idx++,
        title: `Segment ${idx}`,
        content: chunk,
        wordCount: chunk.split(/\s+/).length
      });
    }
  }
  
  return chunks.length > 0 ? chunks : [{
    index: 0,
    title: 'Full Narrative',
    content: content,
    wordCount: content.split(/\s+/).length
  }];
};

/**
 * Helper: Calculate scenes per chunk based on word count
 */
const calculateScenesForChunk = (wordCount: number, style: StoryStyle): number => {
  let wordsPerScene: number;
  
  switch (style) {
    case StoryStyle.DOCUMENTARY:
      wordsPerScene = 250;
      break;
    case StoryStyle.CINEMATIC_DRAMA:
    case StoryStyle.NEO_NOIR:
      wordsPerScene = 200;
      break;
    case StoryStyle.ANIMATED_STYLIZED:
    case StoryStyle.FAIRYTALE:
      wordsPerScene = 220;
      break;
    default:
      wordsPerScene = 200;
  }
  
  const count = Math.ceil(wordCount / wordsPerScene);
  return Math.max(1, Math.min(count, 4)); // 1-4 scenes per chunk
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
 * Step 3: Create Storyboard - STREAMING CHUNKED APPROACH
 * Processes narrative in logical chunks with real-time progress updates
 * Each chunk generates 1-4 scenes independently, preventing timeouts
 */
export const generateStoryboard = async (
  content: string, 
  contextNote: string,
  characters: Character[], 
  style: StoryStyle, 
  setting: any,
  category: ProjectCategory,
  onProgress?: SceneProgressCallback
): Promise<Scene[]> => {
  const ai = getAI();
  const allScenes: Scene[] = [];

  // VALIDATION
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty. Please provide narrative text to generate sequences.');
  }

  const notify = (update: Parameters<SceneProgressCallback>[0]) => {
    if (onProgress) onProgress(update);
  };

  notify({ phase: 'analyzing', message: 'Analyzing narrative structure...' });

  // STEP 1: Split narrative into processable chunks
  const chunks = splitNarrativeIntoChunks(content);
  
  notify({ 
    phase: 'chunking', 
    totalChunks: chunks.length,
    message: `Identified ${chunks.length} narrative segments to process` 
  });

  const styleDesc = getStyleDescription(style);
  
  // Compact character context
  const charContext = characters.length > 0 
    ? characters.map(c => `${c.name}: ${c.visualDescription.substring(0, 60)}`).join(' | ').substring(0, 250)
    : 'None';

  const getCategoryGuidance = (cat: ProjectCategory): string => {
    switch(cat) {
      case ProjectCategory.BIBLICAL:
        return 'Biblical accuracy, historical reverence.';
      case ProjectCategory.HISTORICAL:
        return 'Historical accuracy, period details.';
      default:
        return 'Engaging, visually compelling.';
    }
  };

  // STEP 2: Process each chunk independently with streaming
  let globalSceneNumber = 1;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const scenesForChunk = calculateScenesForChunk(chunk.wordCount, style);
    
    notify({
      phase: 'generating',
      chunkIndex: i + 1,
      totalChunks: chunks.length,
      scenesGenerated: allScenes.length,
      message: `Processing "${chunk.title}" (${scenesForChunk} scene${scenesForChunk > 1 ? 's' : ''})...`
    });

    // Focused prompt for this chunk only
    const chunkPrompt = `Generate exactly ${scenesForChunk} scene(s) for this narrative segment.

SEGMENT: "${chunk.title}"
STYLE: ${style} - ${styleDesc.substring(0, 100)}
SETTING: ${setting.landscape || 'unspecified'}, ${setting.year || 'unspecified'}
CHARS: ${charContext}
GUIDANCE: ${getCategoryGuidance(category)}

OUTPUT FORMAT (JSON array):
[{"number": ${globalSceneNumber}, "durationSeconds": 8, "narrativeText": "1-2 sentences", "visualPrompt": "40 words max", "characterIds": []}]

NARRATIVE:
${chunk.content}

Respond with JSON array only. No markdown.`;

    try {
      // Use streaming for progressive response
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: chunkPrompt,
      });

      let fullResponse = '';
      
      for await (const partialResponse of stream) {
        const text = partialResponse.text || '';
        fullResponse += text;
      }

      // Parse scenes from this chunk
      const chunkScenes = cleanAndParseJson(fullResponse, []);
      
      if (Array.isArray(chunkScenes) && chunkScenes.length > 0) {
        for (const s of chunkScenes) {
          if (s.narrativeText?.trim() && s.visualPrompt?.trim()) {
            const scene: Scene = {
              ...s,
              id: crypto.randomUUID(),
              number: globalSceneNumber++,
              status: 'pending' as const,
              durationSeconds: Math.max(5, Math.min(15, s.durationSeconds || 8)),
              characterIds: (s.characterIds || [])
                .map((name: string) => {
                  const found = characters.find(c => 
                    name.toLowerCase().includes(c.name.toLowerCase()) ||
                    c.name.toLowerCase().includes(name.toLowerCase())
                  );
                  return found ? found.id : null;
                })
                .filter((id): id is string => id !== null)
            };
            
            allScenes.push(scene);
            
            notify({
              phase: 'generating',
              chunkIndex: i + 1,
              totalChunks: chunks.length,
              scenesGenerated: allScenes.length,
              currentScene: scene,
              message: `Scene ${scene.number} generated`
            });
          }
        }
      }

      // Small delay between chunks to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

    } catch (chunkError: any) {
      console.warn(`⚠️ Chunk ${i + 1} failed: ${chunkError.message}. Continuing...`);
      
      notify({
        phase: 'generating',
        chunkIndex: i + 1,
        totalChunks: chunks.length,
        scenesGenerated: allScenes.length,
        message: `Chunk ${i + 1} had issues, continuing with next...`
      });
      
      // Continue with other chunks even if one fails
      continue;
    }
  }

  // VALIDATION
  if (allScenes.length === 0) {
    throw new Error('No scenes were generated. Please check your narrative content and try again.');
  }

  notify({
    phase: 'complete',
    scenesGenerated: allScenes.length,
    message: `Successfully generated ${allScenes.length} scenes`
  });

  return allScenes;
};

/**
 * Step 3 Alternative: Single-shot storyboard for short content
 * Use this for narratives under 500 words
 */
export const generateStoryboardQuick = async (
  content: string,
  characters: Character[],
  style: StoryStyle,
  setting: any,
  category: ProjectCategory
): Promise<Scene[]> => {
  const ai = getAI();
  
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty.');
  }

  const wordCount = content.split(/\s+/).length;
  const sceneCount = Math.max(1, Math.min(4, Math.ceil(wordCount / 150)));
  
  const styleDesc = getStyleDescription(style);
  const charContext = characters.length > 0 
    ? characters.map(c => `${c.name}: ${c.visualDescription.substring(0, 50)}`).join(' | ')
    : 'None';

  const prompt = `Generate ${sceneCount} scenes. JSON array only.
STYLE: ${style}
SETTING: ${setting.landscape}, ${setting.year}
CHARS: ${charContext}

Format: [{"number":1,"durationSeconds":8,"narrativeText":"...","visualPrompt":"...","characterIds":[]}]

TEXT:
${content.substring(0, 2000)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const rawScenes = cleanAndParseJson(response.text, []);
  
  return rawScenes
    .filter((s: any) => s.narrativeText?.trim() && s.visualPrompt?.trim())
    .map((s: any, idx: number) => ({
      ...s,
      id: crypto.randomUUID(),
      number: idx + 1,
      status: 'pending' as const,
      durationSeconds: Math.max(5, Math.min(15, s.durationSeconds || 8)),
      characterIds: []
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