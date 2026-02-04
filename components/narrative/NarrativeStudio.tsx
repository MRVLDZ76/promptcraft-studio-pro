import React from 'react';
// Import the full ChronStudio app (complete implementation)
import ChronStudioApp from '../../ChronStudio/App';

/**
 * NarrativeStudio - Wrapper component for the ChronStudio narrative video production workflow
 * This component renders the complete ChronStudio application within the main app
 */
export const NarrativeStudio: React.FC = () => {
  return <ChronStudioApp />;
};

export default NarrativeStudio;
