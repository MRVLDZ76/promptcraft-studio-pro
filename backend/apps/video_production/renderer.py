"""
Video Renderer - Handles actual video processing using MoviePy

This module handles:
- Video concatenation
- Transition effects (fade, crossfade)
- Title card generation
- Resolution normalization
"""
import logging
import os
from typing import List, Callable, Optional, Dict
from moviepy.editor import (
    VideoFileClip, concatenate_videoclips, TextClip,
    CompositeVideoClip, ColorClip
)
import moviepy.video.fx.all as vfx

logger = logging.getLogger(__name__)


class VideoRenderer:
    """Handles video rendering operations"""
    
    def __init__(self):
        self.logger = logger
        self.default_fps = 30
        self.default_resolution = (1920, 1080)
    
    def concatenate_videos(
        self, 
        video_paths: List[str], 
        output_path: str,
        transitions: bool = True,
        normalize: bool = True,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> str:
        """
        Concatenate multiple videos into one with optional transitions
        
        Args:
            video_paths: List of local video file paths
            output_path: Where to save the final video
            transitions: Apply crossfade transitions between clips
            normalize: Resize videos to same resolution
            progress_callback: Optional callback(progress: 0.0-1.0) for progress updates
        
        Returns:
            str: Path to output video
        """
        try:
            self.logger.info(f"Concatenating {len(video_paths)} videos...")
            
            if not video_paths:
                raise ValueError("No video paths provided")
            
            # Load all clips
            clips = []
            for i, path in enumerate(video_paths):
                self.logger.info(f"Loading clip {i+1}/{len(video_paths)}: {os.path.basename(path)}")
                clip = VideoFileClip(path)
                clips.append(clip)
                
                if progress_callback:
                    progress_callback(i / len(video_paths) * 0.3)  # 0-30% for loading
            
            # Normalize resolution if needed
            if normalize:
                clips = self._normalize_clips(clips)
                if progress_callback:
                    progress_callback(0.4)  # 40% after normalization
            
            # Apply transitions
            if transitions and len(clips) > 1:
                clips = self._apply_crossfades(clips, duration=0.5)
                if progress_callback:
                    progress_callback(0.5)  # 50% after transitions
            
            # Concatenate
            self.logger.info("Concatenating clips...")
            final_video = concatenate_videoclips(clips, method="compose")
            
            if progress_callback:
                progress_callback(0.6)  # 60% after concatenation
            
            # Write output
            self.logger.info(f"Writing output to: {output_path}")
            final_video.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=self.default_fps,
                preset='medium',  # Balance quality/speed
                threads=4,
                logger=None  # Suppress MoviePy progress bars (we use callbacks)
            )
            
            if progress_callback:
                progress_callback(1.0)  # 100% complete
            
            # Cleanup
            for clip in clips:
                clip.close()
            final_video.close()
            
            output_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            self.logger.info(f"Video concatenation complete: {output_size_mb:.2f} MB")
            
            return output_path
            
        except Exception as e:
            self.logger.error(f"Video concatenation failed: {e}", exc_info=True)
            # Cleanup on error
            for clip in clips:
                try:
                    clip.close()
                except:
                    pass
            raise
    
    def _normalize_clips(self, clips: List[VideoFileClip]) -> List[VideoFileClip]:
        """
        Normalize all clips to same resolution and FPS
        
        Args:
            clips: List of video clips
            
        Returns:
            List of normalized clips
        """
        if not clips:
            return clips
        
        # Find target resolution (use largest)
        max_resolution = max(clips, key=lambda c: c.w * c.h).size
        target_fps = max(clip.fps for clip in clips)
        
        self.logger.info(f"Normalizing clips to {max_resolution} @ {target_fps} FPS")
        
        normalized = []
        for i, clip in enumerate(clips):
            if clip.size != max_resolution:
                self.logger.info(f"Resizing clip {i+1} from {clip.size} to {max_resolution}")
                clip = clip.resize(max_resolution)
            
            if clip.fps != target_fps:
                self.logger.info(f"Adjusting FPS of clip {i+1} from {clip.fps} to {target_fps}")
                # Note: FPS adjustment in MoviePy can be complex, skip for Phase 2
                pass
            
            normalized.append(clip)
        
        return normalized
    
    def _apply_crossfades(
        self, 
        clips: List[VideoFileClip], 
        duration: float = 0.5
    ) -> List[VideoFileClip]:
        """
        Apply crossfade transitions between clips
        
        Args:
            clips: List of video clips
            duration: Crossfade duration in seconds
            
        Returns:
            List of clips with crossfades
        """
        if len(clips) < 2:
            return clips
        
        self.logger.info(f"Applying {duration}s crossfade transitions to {len(clips)-1} cuts")
        
        result = [clips[0]]
        
        for i in range(1, len(clips)):
            # Apply fade out to previous clip
            result[-1] = result[-1].fadeout(duration)
            
            # Apply fade in to current clip
            current = clips[i].fadein(duration)
            result.append(current)
        
        return result
    
    def create_title_card(
        self, 
        text: str, 
        duration: float = 3.0,
        style: str = 'minimal',
        resolution: tuple = (1920, 1080)
    ) -> CompositeVideoClip:
        """
        Generate a title card clip
        
        Args:
            text: Title text
            duration: Duration in seconds
            style: Visual style ('minimal', 'cinematic', 'modern')
            resolution: Video resolution (width, height)
            
        Returns:
            CompositeVideoClip: Generated title card
        """
        self.logger.info(f"Creating title card: {text}")
        
        try:
            if style == 'minimal':
                # Black background with white text
                bg = ColorClip(size=resolution, color=(0, 0, 0), duration=duration)
                
                txt = TextClip(
                    text,
                    fontsize=70,
                    color='white',
                    font='Arial-Bold',
                    size=resolution,
                    method='caption',
                    align='center'
                )
                txt = txt.set_duration(duration).set_position('center')
                
                # Add fade in/out
                title_card = CompositeVideoClip([bg, txt])
                title_card = title_card.fadein(0.5).fadeout(0.5)
                
            elif style == 'cinematic':
                # Dark gradient with elegant text
                bg = ColorClip(size=resolution, color=(20, 20, 30), duration=duration)
                
                txt = TextClip(
                    text,
                    fontsize=90,
                    color='white',
                    font='Arial-Bold',
                    size=resolution,
                    method='caption',
                    align='center'
                )
                txt = txt.set_duration(duration).set_position('center')
                
                title_card = CompositeVideoClip([bg, txt])
                title_card = title_card.fadein(1.0).fadeout(1.0)
                
            else:  # modern
                # Blue gradient with modern text
                bg = ColorClip(size=resolution, color=(30, 50, 100), duration=duration)
                
                txt = TextClip(
                    text,
                    fontsize=80,
                    color='white',
                    font='Arial',
                    size=resolution,
                    method='caption',
                    align='center'
                )
                txt = txt.set_duration(duration).set_position('center')
                
                title_card = CompositeVideoClip([bg, txt])
                title_card = title_card.fadein(0.8).fadeout(0.8)
            
            return title_card
            
        except Exception as e:
            self.logger.error(f"Failed to create title card: {e}")
            # Return simple fallback
            bg = ColorClip(size=resolution, color=(0, 0, 0), duration=duration)
            return bg.fadein(0.5).fadeout(0.5)
    
    def render_from_edl(
        self, 
        edl: Dict, 
        scene_videos: List[str], 
        output_path: str,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> str:
        """
        Render video based on Edit Decision List (from LLM Director - Phase 3)
        
        Args:
            edl: Edit Decision List with trim/transition instructions
            scene_videos: List of scene video paths
            output_path: Output file path
            progress_callback: Optional progress callback
            
        Returns:
            str: Path to rendered video
        """
        # TODO: Implement in Phase 3 with LLM Director
        self.logger.info("EDL-based rendering not yet implemented - using simple concatenation")
        return self.concatenate_videos(
            scene_videos, 
            output_path, 
            transitions=True,
            progress_callback=progress_callback
        )    
    def extract_last_frame(self, video_path: str, output_image_path: str) -> str:
        """
        Extract the last valid frame from a video to use as reference.
        Used for daisy-chaining segment generation.
        
        Args:
            video_path: Path to video file
            output_image_path: Where to save extracted frame
            
        Returns:
            str: Path to extracted frame image
        """
        try:
            with VideoFileClip(video_path) as clip:
                # Go back 0.1s from end to avoid black frames or EOF glitches
                timestamp = max(0, clip.duration - 0.1)
                clip.save_frame(output_image_path, t=timestamp)
                
            self.logger.info(
                f"Extracted frame from {os.path.basename(video_path)} at {timestamp:.2f}s"
            )
            return output_image_path
            
        except Exception as e:
            self.logger.error(f"Frame extraction failed: {e}", exc_info=True)
            raise
    
    def merge_scene_segments(
        self, 
        segment_paths: List[str], 
        output_path: str,
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> str:
        """
        Seamlessly stitch video segments into a single scene.
        Uses hard cuts (no transitions) to maintain continuity.
        
        This is for INTRA-SCENE assembly (A.1 + A.2 = Scene_A.mp4)
        NOT for final project rendering (which uses transitions).
        
        Args:
            segment_paths: List of segment video paths in order
            output_path: Where to save merged scene
            progress_callback: Optional progress callback
            
        Returns:
            str: Path to merged video
        """
        if not segment_paths:
            raise ValueError("No segments provided")
        
        if len(segment_paths) == 1:
            # No merging needed, just copy
            import shutil
            shutil.copy(segment_paths[0], output_path)
            self.logger.info("Single segment, no merge needed")
            return output_path
        
        try:
            self.logger.info(f"Merging {len(segment_paths)} segments seamlessly...")
            
            clips = []
            for i, path in enumerate(segment_paths):
                self.logger.info(f"Loading segment {i+1}/{len(segment_paths)}: {os.path.basename(path)}")
                clip = VideoFileClip(path)
                clips.append(clip)
                
                if progress_callback:
                    progress_callback(0.3 * (i + 1) / len(segment_paths))
            
            # Normalize clips to same resolution/fps
            clips = self._normalize_clips(clips)
            
            if progress_callback:
                progress_callback(0.4)
            
            # Simple concatenation with NO transitions (method='compose' for safety)
            # method='chain' is faster but requires identical codecs
            self.logger.info("Concatenating segments with hard cuts...")
            final_clip = concatenate_videoclips(clips, method="compose")
            
            if progress_callback:
                progress_callback(0.6)
            
            # Write output
            self.logger.info(f"Writing merged scene to {output_path}")
            final_clip.write_videofile(
                output_path,
                codec='libx264',
                audio_codec='aac',
                fps=self.default_fps,
                logger=None,
                preset='medium',
                threads=4
            )
            
            if progress_callback:
                progress_callback(0.95)
            
            # Cleanup
            for clip in clips:
                clip.close()
            final_clip.close()
            
            if progress_callback:
                progress_callback(1.0)
            
            output_size_mb = os.path.getsize(output_path) / (1024 * 1024)
            self.logger.info(
                f"Seamless segment merge complete: "
                f"{len(segment_paths)} segments -> {output_size_mb:.2f} MB"
            )
            
            return output_path
            
        except Exception as e:
            self.logger.error(f"Segment merge failed: {e}", exc_info=True)
            # Cleanup on error
            for clip in clips:
                try:
                    clip.close()
                except:
                    pass
            raise