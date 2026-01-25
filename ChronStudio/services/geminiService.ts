import { GoogleGenAI, Type, VideoGenerationReferenceType } from "@google/genai";
import { Character, Scene, StoryStyle, ProjectCategory } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Progress callback type for streaming scene generation
 */
export type SceneProgressCallback = (update: {
  phase: 'analyzing' | 'outlining' | 'chunking' | 'generating' | 'complete' | 'error';
  chunkIndex?: number;
  totalChunks?: number;
  scenesGenerated?: number;
  currentScene?: Scene;
  message: string;
}) => void;

/**
 * Narrative structure parsed from content
 */
interface NarrativeStructure {
  title: string;
  parts: NarrativePart[];
  productionNotes?: string;
}

interface NarrativePart {
  partNumber: number;
  title: string;
  blocks: NarrativeBlock[];
}

interface NarrativeBlock {
  blockNumber: number;
  title: string;
  concept: string;
  content: string;
  wordCount: number;
}

/**
 * Scene outline for maintaining story continuity
 */
interface SceneOutline {
  sceneNumber: number;
  partTitle: string;
  blockTitle: string;
  narrativeBeat: string;
  visualConcept: string;
  emotionalTone: string;
  storyPosition: 'opening' | 'rising' | 'climax' | 'falling' | 'resolution';
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
 * PHASE 1A: Parse Structured Narrative Content
 * Recognizes Parts, Blocks, Chapters, Sections and maintains hierarchy
 */
const parseNarrativeStructure = (content: string): NarrativeStructure => {
  const structure: NarrativeStructure = {
    title: '',
    parts: [],
    productionNotes: undefined
  };

  // Extract title if present
  const titleMatch = content.match(/^(?:Project\s*Title|Title)[:\s]*([^\n]+)/im);
  if (titleMatch) structure.title = titleMatch[1].trim();

  // Extract production/director notes (at the end)
  const notesMatch = content.match(/(?:Director['']?s?\s*Notes|Production\s*Guide|Visual\s*Style)[:\s]*([\s\S]+)$/i);
  if (notesMatch) {
    structure.productionNotes = notesMatch[1].trim().substring(0, 1500);
  }

  // Parse Parts and Blocks with multiple pattern support
  const partPattern = /(?:^|\n)(?:Part\s*(\d+)[:\s]*([^\n]*)|##\s*Part\s*(\d+)[:\s]*([^\n]*))/gi;
  const blockPattern = /(?:^|\n)(?:Block\s*(\d+)[:\s]*([^\n]*)|###\s*Block\s*(\d+)[:\s]*([^\n]*))/gi;
  const conceptPattern = /(?:^|\n)Concept[:\s]*([^\n]+)/gi;

  // Split by Parts first
  const partSplits = content.split(/(?=(?:^|\n)(?:Part\s*\d+|##\s*Part\s*\d+))/i);
  
  for (const partSection of partSplits) {
    const partMatch = partSection.match(/(?:Part\s*(\d+)[:\s]*([^\n]*)|##\s*Part\s*(\d+)[:\s]*([^\n]*))/i);
    if (!partMatch) continue;

    const partNumber = parseInt(partMatch[1] || partMatch[3]) || structure.parts.length + 1;
    const partTitle = (partMatch[2] || partMatch[4] || '').trim();

    const part: NarrativePart = {
      partNumber,
      title: partTitle,
      blocks: []
    };

    // Split this part into blocks
    const blockSplits = partSection.split(/(?=(?:^|\n)(?:Block\s*\d+|###\s*Block\s*\d+))/i);
    
    for (const blockSection of blockSplits) {
      const blockMatch = blockSection.match(/(?:Block\s*(\d+)[:\s]*([^\n]*)|###\s*Block\s*(\d+)[:\s]*([^\n]*))/i);
      if (!blockMatch) continue;

      const blockNumber = parseInt(blockMatch[1] || blockMatch[3]) || part.blocks.length + 1;
      const blockTitle = (blockMatch[2] || blockMatch[4] || '').trim();
      
      // Extract concept
      const conceptMatch = blockSection.match(/Concept[:\s]*([^\n]+)/i);
      const concept = conceptMatch ? conceptMatch[1].trim() : '';
      
      // Get block content (after title and concept)
      let blockContent = blockSection
        .replace(/Block\s*\d+[:\s]*[^\n]*/i, '')
        .replace(/Concept[:\s]*[^\n]*/i, '')
        .trim();

      // Remove any sub-headers but keep content
      blockContent = blockContent.replace(/^#+\s+/gm, '');

      if (blockContent.length > 50) {
        part.blocks.push({
          blockNumber,
          title: blockTitle,
          concept,
          content: blockContent,
          wordCount: blockContent.split(/\s+/).length
        });
      }
    }

    if (part.blocks.length > 0) {
      structure.parts.push(part);
    }
  }

  // Fallback: If no parts/blocks found, create from paragraphs
  if (structure.parts.length === 0) {
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 100);
    const blocksPerPart = Math.ceil(paragraphs.length / 3);
    
    for (let i = 0; i < paragraphs.length; i += blocksPerPart) {
      const partBlocks = paragraphs.slice(i, i + blocksPerPart);
      structure.parts.push({
        partNumber: structure.parts.length + 1,
        title: `Segment ${structure.parts.length + 1}`,
        blocks: partBlocks.map((p, idx) => ({
          blockNumber: idx + 1,
          title: `Scene ${idx + 1}`,
          concept: '',
          content: p,
          wordCount: p.split(/\s+/).length
        }))
      });
    }
  }

  return structure;
};

/**
 * PHASE 1B: Generate Story Outline with Scene Beats
 * Creates a coherent scene-by-scene plan before detailed generation
 */
const generateStoryOutline = async (
  structure: NarrativeStructure,
  characters: Character[],
  style: StoryStyle,
  setting: any,
  category: ProjectCategory
): Promise<SceneOutline[]> => {
  const ai = getAI();
  
  // Build a compact summary of the narrative for outline generation
  const narrativeSummary = structure.parts.map(part => {
    const blockSummaries = part.blocks.map(block => 
      `Block ${block.blockNumber} "${block.title}": ${block.concept || block.content.substring(0, 150)}`
    ).join('\n');
    return `PART ${part.partNumber}: ${part.title}\n${blockSummaries}`;
  }).join('\n\n');

  const charNames = characters.map(c => c.name).join(', ') || 'Narrator';
  const totalBlocks = structure.parts.reduce((sum, p) => sum + p.blocks.length, 0);
  const targetScenes = Math.min(Math.max(totalBlocks, 8), 25); // 8-25 scenes

  const prompt = `You are a professional film director creating a scene-by-scene outline for a ${category} production.

PROJECT: "${structure.title || 'Untitled'}"
STYLE: ${style}
SETTING: ${setting.landscape || 'Various'}, ${setting.year || 'Present'}
CHARACTERS: ${charNames}
PRODUCTION NOTES: ${structure.productionNotes?.substring(0, 500) || 'Cinematic quality'}

NARRATIVE STRUCTURE:
${narrativeSummary.substring(0, 6000)}

Create exactly ${targetScenes} scenes that follow the NARRATIVE SEQUENCE in order. Each scene must:
1. Progress the story logically (opening → rising action → climax → resolution)
2. Correspond to specific Blocks in order
3. Have clear visual and emotional direction

OUTPUT JSON array:
[{
  "sceneNumber": 1,
  "partTitle": "Part title",
  "blockTitle": "Block title this scene covers", 
  "narrativeBeat": "What happens in this scene (1 sentence)",
  "visualConcept": "Key visual elements to show",
  "emotionalTone": "The feeling/mood",
  "storyPosition": "opening|rising|climax|falling|resolution"
}]

CRITICAL: Scenes MUST follow the Block order. Scene 1 covers Block 1, Scene 2 covers Block 2, etc.
Output ONLY valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const outline = cleanAndParseJson(response.text, []);
    
    if (!Array.isArray(outline) || outline.length === 0) {
      // Fallback: Generate basic outline from structure
      return generateFallbackOutline(structure);
    }

    return outline;
  } catch (error) {
    console.warn('Outline generation failed, using fallback:', error);
    return generateFallbackOutline(structure);
  }
};

/**
 * Fallback outline generator when AI fails
 */
const generateFallbackOutline = (structure: NarrativeStructure): SceneOutline[] => {
  const outline: SceneOutline[] = [];
  let sceneNum = 1;
  const totalBlocks = structure.parts.reduce((sum, p) => sum + p.blocks.length, 0);
  
  for (const part of structure.parts) {
    for (const block of part.blocks) {
      const progress = sceneNum / totalBlocks;
      let position: SceneOutline['storyPosition'];
      
      if (progress < 0.15) position = 'opening';
      else if (progress < 0.5) position = 'rising';
      else if (progress < 0.7) position = 'climax';
      else if (progress < 0.85) position = 'falling';
      else position = 'resolution';

      outline.push({
        sceneNumber: sceneNum++,
        partTitle: part.title,
        blockTitle: block.title,
        narrativeBeat: block.concept || block.content.substring(0, 100),
        visualConcept: 'Based on narrative content',
        emotionalTone: 'Dramatic',
        storyPosition: position
      });
    }
  }
  
  return outline;
};

/**
 * PHASE 2: Generate Individual Scene with Full Context
 * Each scene knows its position in the story and what came before
 */
const generateSceneWithContext = async (
  outline: SceneOutline,
  blockContent: string,
  previousSceneSummary: string,
  nextSceneSummary: string,
  characters: Character[],
  style: StoryStyle,
  setting: any,
  productionNotes: string
): Promise<{ narrativeText: string; visualPrompt: string; durationSeconds: number }> => {
  const ai = getAI();
  
  const styleDesc = getStyleDescription(style);
  const charContext = characters.length > 0 
    ? characters.map(c => `${c.name}: ${c.visualDescription.substring(0, 80)}`).join(' | ')
    : 'Narrator figure';

  const storyPositionGuidance = {
    'opening': 'Establish setting, introduce mystery/question. Slower pacing, atmospheric.',
    'rising': 'Build tension, develop concepts. Increase visual intensity.',
    'climax': 'Peak emotional/visual impact. Most dramatic visuals.',
    'falling': 'Consequences, reflection. Thoughtful, contemplative.',
    'resolution': 'Conclusion, call to action. Hopeful, powerful.'
  };

  const prompt = `Generate ONE scene for a professional ${style} production.

SCENE ${outline.sceneNumber}: "${outline.blockTitle}"
PART: ${outline.partTitle}
STORY POSITION: ${outline.storyPosition} - ${storyPositionGuidance[outline.storyPosition]}
EMOTIONAL TONE: ${outline.emotionalTone}

CONTINUITY:
- Previous: ${previousSceneSummary || 'This is the opening scene'}
- This scene: ${outline.narrativeBeat}
- Next: ${nextSceneSummary || 'This is the final scene'}

CHARACTERS: ${charContext}
SETTING: ${setting.landscape}, ${setting.year}
VISUAL STYLE: ${styleDesc}

PRODUCTION NOTES: ${productionNotes.substring(0, 400)}

BLOCK CONTENT TO VISUALIZE:
${blockContent.substring(0, 1200)}

Generate:
1. narrativeText: 1-2 sentences capturing this scene's story beat (for voiceover)
2. visualPrompt: 40 words max describing the visual (for AI video generation)
3. durationSeconds: 8-15 based on content density

OUTPUT JSON only:
{"narrativeText": "...", "visualPrompt": "...", "durationSeconds": 10}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const result = cleanAndParseJson(response.text, {
    narrativeText: outline.narrativeBeat,
    visualPrompt: `${style}. ${outline.visualConcept}`,
    durationSeconds: 10
  });

  return result;
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
 * Step 3: Create Storyboard - PROFESSIONAL TWO-PHASE APPROACH
 * Phase 1: Analyze structure and create story outline
 * Phase 2: Generate scenes sequentially with full context awareness
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
  const allScenes: Scene[] = [];

  // VALIDATION
  if (!content || content.trim().length === 0) {
    throw new Error('Content is empty. Please provide narrative text to generate sequences.');
  }

  const notify = (update: Parameters<SceneProgressCallback>[0]) => {
    if (onProgress) onProgress(update);
  };

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1A: Parse Narrative Structure
  // ═══════════════════════════════════════════════════════════════════
  notify({ phase: 'analyzing', message: 'Analyzing narrative structure (Parts, Blocks, Sections)...' });
  
  const structure = parseNarrativeStructure(content);
  const totalBlocks = structure.parts.reduce((sum, p) => sum + p.blocks.length, 0);
  
  console.log(`📖 Parsed: ${structure.parts.length} parts, ${totalBlocks} blocks`);

  if (totalBlocks === 0) {
    throw new Error('Could not parse narrative structure. Ensure content has clear Parts/Blocks or paragraphs.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 1B: Generate Story Outline (Scene Beats)
  // ═══════════════════════════════════════════════════════════════════
  notify({ 
    phase: 'outlining', 
    message: `Creating story outline for ${totalBlocks} narrative blocks...` 
  });

  const outline = await generateStoryOutline(structure, characters, style, setting, category);
  
  console.log(`🎬 Outline: ${outline.length} scenes planned`);

  if (outline.length === 0) {
    throw new Error('Failed to generate story outline. Please try again.');
  }

  notify({ 
    phase: 'outlining', 
    totalChunks: outline.length,
    message: `Story outline ready: ${outline.length} scenes mapped to narrative` 
  });

  // Build a flat list of all blocks for easy lookup
  const allBlocks: { partTitle: string; block: NarrativeBlock }[] = [];
  for (const part of structure.parts) {
    for (const block of part.blocks) {
      allBlocks.push({ partTitle: part.title, block });
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 2: Generate Scenes Sequentially with Context
  // ═══════════════════════════════════════════════════════════════════
  const productionNotes = structure.productionNotes || contextNote || '';

  for (let i = 0; i < outline.length; i++) {
    const sceneOutline = outline[i];
    
    // Find corresponding block content
    const blockIndex = Math.min(i, allBlocks.length - 1);
    const blockData = allBlocks[blockIndex];
    const blockContent = blockData?.block.content || '';

    // Context from adjacent scenes
    const prevSummary = i > 0 ? outline[i - 1].narrativeBeat : '';
    const nextSummary = i < outline.length - 1 ? outline[i + 1].narrativeBeat : '';

    notify({
      phase: 'generating',
      chunkIndex: i + 1,
      totalChunks: outline.length,
      scenesGenerated: allScenes.length,
      message: `Scene ${i + 1}/${outline.length}: "${sceneOutline.blockTitle}" (${sceneOutline.storyPosition})`
    });

    try {
      const sceneData = await generateSceneWithContext(
        sceneOutline,
        blockContent,
        prevSummary,
        nextSummary,
        characters,
        style,
        setting,
        productionNotes
      );

      const scene: Scene = {
        id: crypto.randomUUID(),
        number: i + 1,
        status: 'pending' as const,
        narrativeText: sceneData.narrativeText || sceneOutline.narrativeBeat,
        visualPrompt: sceneData.visualPrompt || `${style}. ${sceneOutline.visualConcept}`,
        durationSeconds: Math.max(5, Math.min(15, sceneData.durationSeconds || 10)),
        characterIds: characters
          .filter(c => 
            blockContent.toLowerCase().includes(c.name.toLowerCase()) ||
            sceneOutline.narrativeBeat.toLowerCase().includes(c.name.toLowerCase())
          )
          .map(c => c.id)
      };

      allScenes.push(scene);

      notify({
        phase: 'generating',
        chunkIndex: i + 1,
        totalChunks: outline.length,
        scenesGenerated: allScenes.length,
        currentScene: scene,
        message: `✓ Scene ${scene.number}: ${sceneOutline.blockTitle}`
      });

      // Rate limiting between scenes
      if (i < outline.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

    } catch (sceneError: any) {
      console.warn(`⚠️ Scene ${i + 1} generation failed:`, sceneError.message);
      
      // Create fallback scene from outline
      const fallbackScene: Scene = {
        id: crypto.randomUUID(),
        number: i + 1,
        status: 'pending' as const,
        narrativeText: sceneOutline.narrativeBeat,
        visualPrompt: `${style}. ${sceneOutline.visualConcept}. ${sceneOutline.emotionalTone} mood.`,
        durationSeconds: 10,
        characterIds: []
      };
      
      allScenes.push(fallbackScene);
      
      notify({
        phase: 'generating',
        chunkIndex: i + 1,
        totalChunks: outline.length,
        scenesGenerated: allScenes.length,
        message: `Scene ${i + 1} used fallback, continuing...`
      });
    }
  }

  // VALIDATION
  if (allScenes.length === 0) {
    throw new Error('No scenes were generated. Please check your narrative content.');
  }

  notify({
    phase: 'complete',
    scenesGenerated: allScenes.length,
    message: `✅ Generated ${allScenes.length} scenes following your narrative structure`
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
 * Preview Narrative Structure (for UI display)
 * Returns parsed structure without generating scenes
 */
export const previewNarrativeStructure = (content: string): {
  title: string;
  partsCount: number;
  blocksCount: number;
  estimatedScenes: number;
  structure: { part: string; blocks: string[] }[];
  hasProductionNotes: boolean;
  warnings: string[];
} => {
  const structure = parseNarrativeStructure(content);
  const warnings: string[] = [];
  
  // Calculate totals
  const blocksCount = structure.parts.reduce((sum, p) => sum + p.blocks.length, 0);
  const estimatedScenes = Math.min(Math.max(blocksCount, 8), 25);
  
  // Generate warnings
  if (structure.parts.length === 0) {
    warnings.push('No clear Parts detected. Content will be split by paragraphs.');
  }
  if (blocksCount < 3) {
    warnings.push('Very few blocks detected. Consider adding more structure for better scene mapping.');
  }
  if (content.length > 40000) {
    warnings.push('Content is very long. Consider splitting into multiple projects.');
  }
  
  return {
    title: structure.title || 'Untitled',
    partsCount: structure.parts.length,
    blocksCount,
    estimatedScenes,
    structure: structure.parts.map(p => ({
      part: p.title || `Part ${p.partNumber}`,
      blocks: p.blocks.map(b => b.title || `Block ${b.blockNumber}`)
    })),
    hasProductionNotes: !!structure.productionNotes,
    warnings
  };
};

/**
 * Regenerate a Single Scene
 * Used when user wants to regenerate just one scene without affecting others
 */
export const regenerateSingleScene = async (
  scene: Scene,
  fullContent: string,
  characters: Character[],
  style: StoryStyle,
  setting: any,
  contextNote: string
): Promise<{ narrativeText: string; visualPrompt: string; durationSeconds: number }> => {
  const ai = getAI();
  
  const styleDesc = getStyleDescription(style);
  const charContext = characters.length > 0 
    ? characters.map(c => `${c.name}: ${c.visualDescription.substring(0, 60)}`).join(' | ')
    : 'Narrator';

  // Try to find relevant content for this scene number
  const contentParts = fullContent.split(/(?=(?:Block|Part|Section)\s*\d)/i);
  const relevantContent = contentParts[Math.min(scene.number - 1, contentParts.length - 1)] || fullContent.substring(0, 1500);

  const prompt = `Regenerate this scene with fresh perspective while maintaining story consistency.

SCENE ${scene.number}
CURRENT NARRATIVE: "${scene.narrativeText}"
CURRENT VISUAL: "${scene.visualPrompt}"

STYLE: ${style} - ${styleDesc.substring(0, 100)}
SETTING: ${setting.landscape || 'unspecified'}, ${setting.year || 'unspecified'}
CHARACTERS: ${charContext}
CONTEXT: ${contextNote.substring(0, 200)}

RELEVANT CONTENT:
${relevantContent.substring(0, 1200)}

Generate an improved version:
1. narrativeText: Fresh 1-2 sentence narrative beat (different from current)
2. visualPrompt: New 40-word visual description (fresh approach)
3. durationSeconds: 8-15 based on scene complexity

OUTPUT JSON only:
{"narrativeText": "...", "visualPrompt": "...", "durationSeconds": 10}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });

  const result = cleanAndParseJson(response.text, {
    narrativeText: scene.narrativeText,
    visualPrompt: scene.visualPrompt,
    durationSeconds: scene.durationSeconds
  });

  return {
    narrativeText: result.narrativeText || scene.narrativeText,
    visualPrompt: result.visualPrompt || scene.visualPrompt,
    durationSeconds: Math.max(5, Math.min(15, result.durationSeconds || scene.durationSeconds))
  };
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