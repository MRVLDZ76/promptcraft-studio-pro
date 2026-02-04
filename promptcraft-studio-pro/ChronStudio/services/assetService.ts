import { Asset } from '../types';

const API_BASE_URL = (import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1') + '/chronstudio';

/**
 * Get authentication token from localStorage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

/**
 * Create asset in backend
 */
export const createAsset = async (assetData: {
  projectId?: string;
  assetType: 'image' | 'video' | 'audio' | 'thumbnail';
  fileUrl: string;
  description?: string;
  tags?: string[];
  width?: number;
  height?: number;
  durationSeconds?: number;
}): Promise<Asset | null> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available, asset not saved to backend');
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/assets/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project: assetData.projectId,
        asset_type: assetData.assetType,
        file_url: assetData.fileUrl,
        description: assetData.description || '',
        tags: assetData.tags || [],
        width_px: assetData.width,
        height_px: assetData.height,
        duration_seconds: assetData.durationSeconds
      })
    });

    if (!response.ok) {
      console.error('Failed to create asset:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data as Asset;
  } catch (error) {
    console.error('Error creating asset:', error);
    return null;
  }
};

/**
 * Save character reference image as asset
 */
export const saveCharacterAsset = async (
  characterName: string,
  imageBase64: string,
  projectId?: string
): Promise<Asset | null> => {
  return createAsset({
    projectId,
    assetType: 'image',
    fileUrl: imageBase64,
    description: `Character reference: ${characterName}`,
    tags: ['character', 'reference', characterName.toLowerCase()]
  });
};

/**
 * Save scene video as asset
 */
export const saveVideoAsset = async (
  sceneNumber: number,
  videoUrl: string,
  duration: number,
  projectId?: string
): Promise<Asset | null> => {
  return createAsset({
    projectId,
    assetType: 'video',
    fileUrl: videoUrl,
    description: `Scene ${sceneNumber} video`,
    tags: ['scene', 'video', `scene-${sceneNumber}`],
    durationSeconds: duration
  });
};

/**
 * Get all assets for a project
 */
export const getProjectAssets = async (projectId: string): Promise<Asset[]> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/assets/?project=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch assets:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
};

/**
 * Delete asset
 */
export const deleteAsset = async (assetId: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn('No auth token available');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/assets/${assetId}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting asset:', error);
    return false;
  }
};
