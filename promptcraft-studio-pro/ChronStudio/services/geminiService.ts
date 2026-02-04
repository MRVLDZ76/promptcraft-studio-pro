import { GoogleGenAI, Type, VideoGenerationReferenceType } from "@google/genai";
import { Character, Scene, StoryStyle, ProjectCategory, ContentProcessingMode } from "../types";

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
 * CRITICAL: Must use the generated casting assets (character references) for visual consistency
 */
const generateSceneWithContext = async (
  outline: SceneOutline,
  blockContent: string,
  previousSceneSummary: string,
  nextSceneSummary: string,
  characters: Character[],
  style: StoryStyle,
  setting: any,
  productionNotes: string,
  negativePrompt?: string
): Promise<{ narrativeText: string; visualPrompt: string; durationSeconds: number }> => {
  const ai = getAI();
  
  const styleDesc = getStyleDescription(style);
  
  // Build detailed character context with reference image info - MANDATORY for visual consistency
  const charContext = characters.length > 0 
    ? characters.map(c => {
        const hasRef = c.referenceImageUrl ? '✓ HAS REFERENCE IMAGE' : 'No reference';
        return `${c.name} (${c.role}): ${c.visualDescription.substring(0, 120)} [${hasRef}]`;
      }).join('\n  ')
    : 'Narrator figure';
  
  // Get characters with reference images for mandatory inclusion
  const charactersWithRefs = characters.filter(c => c.referenceImageUrl);
  const mandatoryCharacterNote = charactersWithRefs.length > 0
    ? `\n\n⚠️ MANDATORY: The following characters have generated reference images that MUST be used for visual consistency:\n${charactersWithRefs.map(c => `  - ${c.name}: ${c.visualDescription.substring(0, 60)}...`).join('\n')}\nIncorporate these exact character appearances in your visual prompt.`
    : '';
  
  const negativePromptNote = negativePrompt 
    ? `\n\nNEGATIVE PROMPT (AVOID): ${negativePrompt}`
    : '';

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

═══════════════════════════════════════════════════════════════════
CASTING ASSETS - MANDATORY CHARACTER CONSISTENCY
═══════════════════════════════════════════════════════════════════
The following characters have been pre-designed as casting templates. 
You MUST incorporate their EXACT visual descriptions in your prompts 
to maintain character consistency across all scenes:

${charContext}
${mandatoryCharacterNote}

When a character appears in this scene, include their specific visual 
traits (clothing, features, distinctive elements) in the visualPrompt.
═══════════════════════════════════════════════════════════════════

SETTING: ${setting.landscape}, ${setting.year}
VISUAL STYLE: ${styleDesc}

PRODUCTION NOTES: ${productionNotes.substring(0, 400)}
${negativePromptNote}

BLOCK CONTENT TO VISUALIZE:
${blockContent.substring(0, 1200)}

Generate:
1. narrativeText: 1-2 sentences capturing this scene's story beat (for voiceover)
2. visualPrompt: 50 words max describing the visual (for AI video generation). 
   MUST include specific character visual traits for any character appearing in scene.
   DO NOT include: ${negativePrompt || 'text, watermarks, logos'}
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
 * Step 1: Analyze Text - Enhanced for VEO 3 compatible character descriptions
 */
export const analyzeSourceText = async (
  category: ProjectCategory,
  title: string,
  segment: string,
  content: string,
  contextNote: string,
  processingMode: ContentProcessingMode = ContentProcessingMode.CREATIVE,
  reimagineParams?: any
) => {
  const ai = getAI();
  
  // PRESERVE MODE: Skip AI analysis, return content as-is
  if (processingMode === ContentProcessingMode.PRESERVE) {
    return {
      summary: content.substring(0, 300) + (content.length > 300 ? '...' : ''),
      setting: {
        year: 'Present',
        region: 'Various',
        landscape: 'As described in content'
      },
      characters: [{
        id: 'narrator-1',
        name: 'Narrator',
        role: 'Narrator',
        visualDescription: 'Neutral perspective narrator',
        voiceDescription: 'Clear, professional narration voice'
      }]
    };
  }
  
  let categoryContext = "";
  if (category === ProjectCategory.BIBLICAL) {
    categoryContext = `This is a Biblical narrative from Book: ${title}, Chapter: ${segment}. Maintain theological accuracy and historical reverence. Characters should reflect ancient Middle Eastern appearances with period-accurate clothing and features.

⚠️ IMPORTANT FOR VEO 3 CONTENT POLICY:
For character NAMES, use GENERIC ROLE-BASED names rather than specific Biblical figure names to avoid content policy restrictions.
Examples: 
  - Instead of "David": use "Young Shepherd" or "Shepherd Leader"
  - Instead of "Moses": use "Elder Prophet" or "Staff Bearer"
  - Instead of "Goliath": use "Giant Warrior" or "Philistine Champion"
This ensures video generation will not be blocked while maintaining the narrative integrity.`;
  } else if (category === ProjectCategory.HISTORICAL) {
    categoryContext = `This is a Historical account regarding: ${title}, Segment/Date: ${segment}. Maintain historical accuracy and realism. Characters should reflect the accurate period clothing, ethnic features, and cultural details.

⚠️ IMPORTANT FOR VEO 3 CONTENT POLICY:
For character NAMES, use GENERIC DESCRIPTIVE names rather than specific historical figure names to avoid content policy restrictions.
Examples:
  - Instead of "Napoleon Bonaparte": use "French Military Commander" or "Emperor in Bicorne Hat"
  - Instead of "Cleopatra": use "Egyptian Queen" or "Royal Figure of the Nile"
  - Instead of "Julius Caesar": use "Roman General" or "Senate Leader"
This ensures video generation will not be blocked while maintaining historical authenticity.`;
  } else {
    categoryContext = `This is a Creative/Custom project titled: ${title}, Segment: ${segment}. Adapt the tone and style based on the provided text.`;
  }

  const MAX_CHAR_LENGTH = 25000;
  let safeContent = content;
  if (content.length > MAX_CHAR_LENGTH) {
      safeContent = content.substring(0, MAX_CHAR_LENGTH) + "... [Truncated]";
  }

  // Build processing mode instructions
  let processingInstructions = '';
  
  switch (processingMode) {
    case ContentProcessingMode.POLISH:
      processingInstructions = `
⚙️ PROCESSING MODE: POLISH ONLY
- FIX grammar, spelling, and typos
- IMPROVE sentence structure and flow
- MAINTAIN the exact content, ideas, and sequence
- DO NOT add new narrative elements, interpretations, or creative embellishments
- Keep the original tone and voice
      `;
      break;
      
    case ContentProcessingMode.ENHANCE:
      processingInstructions = `
⚙️ PROCESSING MODE: ENHANCE
- PRESERVE the core narrative and main ideas
- ADD contextual details and visual descriptions to enrich scenes
- EXPAND on existing elements without changing the storyline
- Maintain chronological order and key events
- Enhance character descriptions with visual details for video production
      `;
      break;
      
    case ContentProcessingMode.REIMAGINE:
      processingInstructions = `
⚙️ PROCESSING MODE: REIMAGINE
- Use the source content as INSPIRATION only
- CREATE a fresh narrative interpretation based on these parameters:
  ${reimagineParams?.tone ? `- Tone: ${reimagineParams.tone}` : ''}
  ${reimagineParams?.perspective ? `- Perspective: ${reimagineParams.perspective}` : ''}
  ${reimagineParams?.emphasis ? `- Emphasis: ${reimagineParams.emphasis}` : ''}
  ${reimagineParams?.targetLength ? `- Target Length: ${reimagineParams.targetLength}` : ''}
  ${reimagineParams?.addElements?.length ? `- Add Elements: ${reimagineParams.addElements.join(', ')}` : ''}
- Transform the story structure, pacing, and presentation
- Feel free to reinterpret characters and events creatively
      `;
      break;
      
    case ContentProcessingMode.CREATIVE:
    default:
      processingInstructions = `
⚙️ PROCESSING MODE: CREATIVE (Balanced)
- INTERPRET the source material with creative freedom
- ADD narrative elements, dramatic tension, and cinematic qualities
- ENHANCE character development and visual storytelling
- Maintain core themes while allowing creative interpretation
- Optimize for compelling video production
      `;
      break;
  }

  const prompt = `
    Analyze the following text for professional video production using VEO 3 AI video generation.
    Context: ${categoryContext}
    Additional User Notes: "${contextNote}"
    
    ${processingInstructions}
    
    Source Text: "${safeContent}"

    Extract:
    1. Summary logline (compelling, cinematic 2-3 sentences).
    2. Setting (Year, Region, Landscape with rich visual detail).
    3. Key characters with EXTREMELY DETAILED visual descriptions optimized for AI image/video generation.

    ═══════════════════════════════════════════════════════════════════
    CRITICAL: CHARACTER VISUAL DESCRIPTIONS MUST BE VEO 3 OPTIMIZED
    ═══════════════════════════════════════════════════════════════════
    
    Each character's visualDescription MUST include ALL of these elements in a cohesive paragraph:
    
    1. PHYSICAL ATTRIBUTES (mandatory):
       - Approximate age range (e.g., "mid-30s", "elderly around 70")
       - Gender and body type (tall/short, muscular/lean/stocky)
       - Skin tone (specific: olive, bronze, pale ivory, dark brown, etc.)
       - Hair color, length, texture, style (e.g., "long wavy black hair", "short cropped grey beard")
       - Eye color and shape
       - Distinctive facial features (strong jaw, high cheekbones, weathered face, etc.)
    
    2. CLOTHING & ATTIRE (mandatory):
       - Primary garments with colors and materials
       - Period-accurate or style-specific clothing details
       - Accessories (jewelry, headwear, weapons, tools)
       - Footwear if relevant
    
    3. PRESENCE & DEMEANOR (mandatory):
       - Posture and body language
       - Expression and emotional quality
       - Any signature gestures or physical mannerisms
    
    4. DISTINCTIVE FEATURES (if applicable):
       - Scars, tattoos, or markings
       - Unique identifying characteristics
       - Props or items they carry

    Example of a GOOD visualDescription:
    "A weathered man in his late 50s with deep olive skin and a long, silver-streaked black beard. Tall and lean with broad shoulders, wearing a tattered brown wool robe over a cream linen tunic, secured with a worn leather belt. His deep-set dark brown eyes carry wisdom and sorrow, framed by heavy brows and deep crow's feet. A wooden shepherd's staff in his right hand, worn leather sandals on calloused feet. His posture is stooped from years of hardship but radiates quiet dignity."

    AVOID: Generic descriptions like "a man in robes" or "elderly woman". Every detail matters for visual consistency.
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
 * Helper: Build Character Prompt - VEO 3 Optimized for Casting Reference Images
 * Creates highly detailed prompts that establish visual consistency for video production
 */
export const buildCharacterPrompt = (character: Character, settingDescription: string, style: StoryStyle): string => {
  const styleDesc = getStyleDescription(style);
  
  // VEO 3 recommended prompt structure for character reference images
  return `Professional Character Reference Sheet for Video Production.

SUBJECT: ${character.name} - ${character.role}

VISUAL DESCRIPTION:
${character.visualDescription}

SHOT COMPOSITION:
- Medium shot, three-quarter view
- Character centered in frame
- Neutral solid background (dark charcoal or soft grey gradient)
- Studio lighting: Key light at 45 degrees, soft fill light, subtle rim light for separation

TECHNICAL SPECIFICATIONS:
- Ultra-high detail, 8K quality
- Sharp focus on face and upper body
- Shallow depth of field with subject in perfect focus
- Professional portrait photography quality
- No text, no watermarks, no logos, no UI elements

ARTISTIC STYLE:
${styleDesc}

SETTING CONTEXT:
${settingDescription}

IMPORTANT REQUIREMENTS:
- Photorealistic rendering with cinematic quality
- Consistent lighting that matches the project style
- Expression should be neutral to slightly characteristic of the role
- Clothing and accessories must be clearly visible and detailed
- This image will be used as a casting reference for video generation - maintain maximum detail and consistency
- Avoid: text overlays, watermarks, multiple characters, busy backgrounds, low quality, blurry details, distorted features, extra limbs`;
};

/**
 * Helper: Enhance Character Description if too short
 * Uses AI to expand minimal descriptions into VEO 3 optimized detailed descriptions
 */
export const enhanceCharacterDescription = async (
  character: Character, 
  settingDescription: string, 
  category: ProjectCategory
): Promise<string> => {
  const ai = getAI();
  
  // If description is already detailed enough (150+ chars), return as-is
  if (character.visualDescription && character.visualDescription.length >= 150) {
    return character.visualDescription;
  }

  let contextHint = '';
  if (category === ProjectCategory.BIBLICAL) {
    contextHint = 'This is a Biblical character from ancient Middle Eastern context. Use historically accurate ancient Hebrew/Jewish clothing and features.';
  } else if (category === ProjectCategory.HISTORICAL) {
    contextHint = 'This is a historical figure. Use period-accurate clothing, hairstyles, and cultural details.';
  }

  const prompt = `Enhance this character description for professional AI video generation (VEO 3).

CHARACTER: ${character.name}
ROLE: ${character.role}
CURRENT DESCRIPTION: ${character.visualDescription || 'No description provided'}
SETTING: ${settingDescription}
${contextHint}

Create a COMPREHENSIVE visual description (150-250 words) that includes ALL of these elements:

1. PHYSICAL ATTRIBUTES:
   - Specific age (e.g., "mid-40s", "young woman in her early 20s")
   - Body type and height
   - Skin tone (be specific: olive, bronze, pale, ebony, tan, etc.)
   - Hair: color, length, texture, style
   - Eye color and distinctive facial features
   - Any scars, marks, or unique characteristics

2. CLOTHING & ACCESSORIES:
   - Primary garments with specific colors and materials
   - Layers and how they're worn
   - Jewelry, headwear, footwear
   - Any weapons, tools, or significant items

3. PRESENCE & EXPRESSION:
   - Posture and body language
   - Default expression
   - Overall demeanor

Write as a single flowing paragraph, not bullet points. Be specific with colors, textures, and details.
The description should enable consistent visual reproduction across multiple scenes.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const enhanced = response.text?.trim();
    if (enhanced && enhanced.length > 100) {
      return enhanced;
    }
  } catch (e) {
    console.warn('Character enhancement failed, using original:', e);
  }

  return character.visualDescription;
};

/**
 * Step 2: Generate Reference Image - VEO 3 Optimized
 * Creates high-quality casting reference images for visual consistency
 */
export const generateCharacterReference = async (
  character: Character, 
  settingDescription: string, 
  style: StoryStyle,
  category?: ProjectCategory
): Promise<string> => {
  const ai = getAI();
  
  // Auto-enhance description if it's too short
  let enhancedCharacter = { ...character };
  if (character.visualDescription.length < 150 && category) {
    enhancedCharacter.visualDescription = await enhanceCharacterDescription(
      character, 
      settingDescription, 
      category
    );
  }
  
  const prompt = buildCharacterPrompt(enhancedCharacter, settingDescription, style);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "3:4", // Better for character portraits
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
  onProgress?: SceneProgressCallback,
  negativePrompt?: string
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
        productionNotes,
        negativePrompt
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
  contextNote: string,
  negativePrompt?: string
): Promise<{ narrativeText: string; visualPrompt: string; durationSeconds: number }> => {
  const ai = getAI();
  
  const styleDesc = getStyleDescription(style);
  
  // Build detailed character context with reference image info for consistency
  const charContext = characters.length > 0 
    ? characters.map(c => {
        const hasRef = c.referenceImageUrl ? '✓ HAS REFERENCE' : '';
        return `${c.name} (${c.role}): ${c.visualDescription.substring(0, 80)} ${hasRef}`;
      }).join('\n  ')
    : 'Narrator';

  // Get characters with reference images for mandatory inclusion
  const charactersWithRefs = characters.filter(c => c.referenceImageUrl);
  const mandatoryCharacterNote = charactersWithRefs.length > 0
    ? `\n\n⚠️ MANDATORY CHARACTER ASSETS:\n${charactersWithRefs.map(c => `  - ${c.name}: ${c.visualDescription.substring(0, 60)}...`).join('\n')}\nMust maintain visual consistency with these casting references.`
    : '';

  // Try to find relevant content for this scene number
  const contentParts = fullContent.split(/(?=(?:Block|Part|Section)\s*\d)/i);
  const relevantContent = contentParts[Math.min(scene.number - 1, contentParts.length - 1)] || fullContent.substring(0, 1500);

  const negativePromptNote = negativePrompt 
    ? `\n\nNEGATIVE PROMPT (AVOID): ${negativePrompt}`
    : '\n\nAVOID: text, watermarks, logos, titles';

  const prompt = `Regenerate this scene with fresh perspective while maintaining story consistency.

SCENE ${scene.number}
CURRENT NARRATIVE: "${scene.narrativeText}"
CURRENT VISUAL: "${scene.visualPrompt}"

STYLE: ${style} - ${styleDesc.substring(0, 100)}
SETTING: ${setting.landscape || 'unspecified'}, ${setting.year || 'unspecified'}

═══════════════════════════════════════════════════════════════════
CASTING ASSETS - MANDATORY CHARACTER CONSISTENCY
═══════════════════════════════════════════════════════════════════
${charContext}
${mandatoryCharacterNote}
═══════════════════════════════════════════════════════════════════

CONTEXT: ${contextNote.substring(0, 200)}
${negativePromptNote}

RELEVANT CONTENT:
${relevantContent.substring(0, 1200)}

Generate an improved version:
1. narrativeText: Fresh 1-2 sentence narrative beat (different from current)
2. visualPrompt: New 50-word visual description (fresh approach). 
   MUST include specific character visual traits for any character appearing.
   DO NOT include: ${negativePrompt || 'text, watermarks, logos'}
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
 * Step 4: Generate Video with Enhanced Error Handling
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

  // Check for RAI (Responsible AI) filters
  const response = operation.response as any;
  if (response?.generateVideoResponse?.raiMediaFilteredCount > 0) {
    const reasons = response.generateVideoResponse.raiMediaFilteredReasons || [];
    const errorMsg = reasons.length > 0 ? reasons[0] : 'Content filtered by safety policies';
    
    // Create a more detailed error message
    throw new Error(`VEO_SAFETY_FILTER: ${errorMsg}\n\n` +
      `💡 SOLUTIONS:\n` +
      `1. Use GENERIC descriptions (e.g., "a middle-aged shepherd" instead of specific names)\n` +
      `2. Switch to ANIMATED or STYLIZED visual style to avoid realistic depictions\n` +
      `3. Upload custom reference images that don't depict real people\n` +
      `4. Use FICTIONAL character names and descriptions\n\n` +
      `Go back to Casting (Step 2) or Storyboard (Step 3) to modify character descriptions.`
    );
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) {
    throw new Error("Video generation failed: No video URI returned. The generation may have been blocked by content policies.");
  }

  return `${videoUri}&key=${process.env.API_KEY}`;
};