
import { VisualIngredient } from './types';

export const CAMERAS: VisualIngredient[] = [
  { id: 'cam_35', label: '35mm Prime', value: 'Shot on 35mm lens, f/1.8, natural depth of field', desc: 'Versatile, human eye perspective' },
  { id: 'cam_85', label: '85mm Portrait', value: 'Shot on 85mm lens, f/1.4, strong bokeh', desc: 'Isolates subject, creamy background' },
  { id: 'cam_16', label: '16mm Wide', value: 'Shot on 16mm wide angle lens, slight distortion', desc: 'Dynamic, expansive, action' },
  { id: 'cam_macro', label: '100mm Macro', value: 'Macro photography, extreme close-up detail', desc: 'Texture, eyes, tiny objects' }
];

export const LIGHTING: VisualIngredient[] = [
  { id: 'lit_gold', label: 'Golden Hour', value: 'Golden hour lighting, warm sun flare, rim light', desc: 'Sunset/Sunrise magic' },
  { id: 'lit_soft', label: 'Soft Studio', value: 'Softbox diffused lighting, even illumination', desc: 'Clean, flattering, commercial' },
  { id: 'lit_neon', label: 'Neon Cyber', value: 'Neon lighting, cyan and magenta highlights, dark shadows', desc: 'Sci-fi, futuristic, urban' },
  { id: 'lit_vol', label: 'Volumetric', value: 'Volumetric lighting, god rays, atmospheric fog, cinematic haze', desc: 'Moody, depth, dusty' }
];

export const FILMS: VisualIngredient[] = [
  { id: 'fm_ptra', label: 'Kodak Portra', value: 'Kodak Portra 400 film stock, fine grain, warm tones', desc: 'Classic analog warmth' },
  { id: 'fm_bw', label: 'Tri-X B&W', value: 'Kodak Tri-X 400, high contrast black and white', desc: 'Gritty monochrome' },
  { id: 'fm_digi', label: 'Digital 8K', value: 'Unreal Engine 5 render, 8k resolution, octane render, sharp', desc: 'Ultra-modern, clean' },
  { id: 'fm_vhs', label: 'VHS Tape', value: 'VHS aesthetic, chromatic aberration, scan lines, 1990s', desc: 'Retro glitchy' }
];

export const COMPOSITIONS = [
  { value: '', label: 'Unspecified', desc: 'No specific framing - Let AI decide composition' },
  { value: 'Wide shot, establishing composition', label: 'Wide / Establishing', desc: 'Show full scene - Context and environment' },
  { value: 'Medium shot, clear subject framing', label: 'Medium', desc: 'Waist-up framing - Balanced view of subject' },
  { value: 'Close-up, intimate framing', label: 'Close-up', desc: 'Face or detail focus - Emotional connection' },
  { value: 'Extreme close-up, macro-level framing', label: 'Extreme Close-up', desc: 'Eyes or tiny details - Maximum intimacy' },
  { value: 'Over-the-shoulder shot, cinematic blocking', label: 'Over-the-shoulder', desc: 'Viewer perspective - Immersive dialogue scenes' },
  { value: 'POV shot, first-person perspective', label: 'POV', desc: 'First-person view - See through character eyes' },
  { value: 'Aerial shot, top-down or drone perspective', label: 'Aerial / Top-down', desc: 'Bird\'s eye view - Grand scale and patterns' }
];

export const MOODS = [
  { value: '', label: 'Unspecified', desc: 'No specific mood - Natural emotional tone' },
  { value: 'calm, contemplative mood', label: 'Calm', desc: 'Peaceful and serene - Quiet reflection' },
  { value: 'ominous, tense mood', label: 'Ominous', desc: 'Dark and foreboding - Suspense and danger' },
  { value: 'dreamy, ethereal mood', label: 'Dreamy', desc: 'Soft and otherworldly - Fantasy atmosphere' },
  { value: 'energetic, high-adrenaline mood', label: 'Energetic', desc: 'Dynamic and exciting - Action and movement' }
];

export const PALETTES = [
  { value: '', label: 'Unspecified', desc: 'Natural colors - No specific color grading' },
  { value: 'teal and orange cinematic grading', label: 'Teal & Orange', desc: 'Hollywood blockbuster - Warm skin tones, cool shadows' },
  { value: 'neon cyberpunk palette', label: 'Neon', desc: 'Vibrant sci-fi - Electric blues, magentas, and cyans' },
  { value: 'high-contrast monochrome', label: 'Monochrome', desc: 'Black and white - Dramatic contrast and shadows' }
];

