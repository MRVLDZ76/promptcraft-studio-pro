// components/TimestampLink.tsx
// Phase 4: Timestamp Linking Component
// Click on claims/fallacies to jump to video timestamps

import React, { useCallback } from 'react';
import { DiarizedSegment, formatTimeRange, getSpeakerColor } from '../services/speakerDiarizationService';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface TimestampLinkProps {
  timestamp: number; // seconds
  onSeek: (time: number) => void;
  children?: React.ReactNode;
  showIcon?: boolean;
  style?: 'inline' | 'badge' | 'button';
}

export interface TranscriptTimelineProps {
  segments: DiarizedSegment[];
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  highlightedTimestamp?: number;
}

export interface SeekableClaimProps {
  text: string;
  speaker: 'A' | 'B';
  timestamp?: number;
  verificationStatus: 'verified' | 'false' | 'partial' | 'unverified' | 'pending';
  pointValue: number;
  onSeek?: (time: number) => void;
}

export interface SeekableFallacyProps {
  type: string;
  displayName: string;
  speaker: 'A' | 'B';
  timestamp?: number;
  severity: number;
  quote: string;
  explanation: string;
  penalty: number;
  withinMarginOfError: boolean;
  onSeek?: (time: number) => void;
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════
// TIMESTAMP LINK COMPONENT
// ═══════════════════════════════════════════════════════════════

export const TimestampLink: React.FC<TimestampLinkProps> = ({
  timestamp,
  onSeek,
  children,
  showIcon = true,
  style = 'inline'
}) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSeek(timestamp);
  }, [timestamp, onSeek]);

  const timeStr = formatTimestamp(timestamp);

  const baseStyles: React.CSSProperties = {
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const styles: Record<string, React.CSSProperties> = {
    inline: {
      ...baseStyles,
      color: '#6366f1',
      textDecoration: 'underline',
      textDecorationStyle: 'dotted',
      fontFamily: 'monospace',
      fontSize: '0.9em'
    },
    badge: {
      ...baseStyles,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      color: '#6366f1',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 500,
      fontFamily: 'monospace'
    },
    button: {
      ...baseStyles,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 12px',
      backgroundColor: '#6366f1',
      color: 'white',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 600,
      border: 'none'
    }
  };

  return (
    <span
      onClick={handleClick}
      style={styles[style]}
      title={`Jump to ${timeStr}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e as any)}
    >
      {showIcon && <span>⏱️</span>}
      {children || timeStr}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════
// TRANSCRIPT TIMELINE COMPONENT
// ═══════════════════════════════════════════════════════════════

export const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({
  segments,
  currentTime,
  totalDuration,
  onSeek,
  highlightedTimestamp
}) => {
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * totalDuration;
    onSeek(Math.max(0, Math.min(seekTime, totalDuration)));
  }, [totalDuration, onSeek]);

  const currentPosition = (currentTime / totalDuration) * 100;

  return (
    <div style={{
      width: '100%',
      marginBottom: '16px'
    }}>
      {/* Timeline Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <span>0:00</span>
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          Current: {formatTimestamp(currentTime)}
        </span>
        <span>{formatTimestamp(totalDuration)}</span>
      </div>

      {/* Timeline Bar */}
      <div
        onClick={handleTimelineClick}
        style={{
          width: '100%',
          height: '40px',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
      >
        {/* Speaker Segments */}
        {segments.map((segment, idx) => {
          const left = (segment.startTime / totalDuration) * 100;
          const width = ((segment.endTime - segment.startTime) / totalDuration) * 100;
          const color = getSpeakerColor(segment.speaker);
          const isHighlighted = highlightedTimestamp !== undefined && 
            segment.startTime <= highlightedTimestamp && 
            segment.endTime >= highlightedTimestamp;

          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                height: '100%',
                backgroundColor: color,
                opacity: isHighlighted ? 1 : 0.6,
                borderRight: '1px solid rgba(255,255,255,0.3)',
                transition: 'opacity 0.2s ease'
              }}
              title={`${segment.speaker}: ${formatTimeRange(segment.startTime, segment.endTime)}`}
            />
          );
        })}

        {/* Current Time Indicator */}
        <div
          style={{
            position: 'absolute',
            left: `${currentPosition}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#1e293b',
            zIndex: 10,
            boxShadow: '0 0 4px rgba(0,0,0,0.3)'
          }}
        />

        {/* Highlighted Timestamp Marker */}
        {highlightedTimestamp !== undefined && (
          <div
            style={{
              position: 'absolute',
              left: `${(highlightedTimestamp / totalDuration) * 100}%`,
              top: '-4px',
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
              transform: 'translateX(-50%)',
              zIndex: 15,
              boxShadow: '0 0 6px rgba(239, 68, 68, 0.5)'
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginTop: '8px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#6366f1', borderRadius: '2px' }} />
          <span>Speaker A</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '12px', height: '12px', backgroundColor: '#ec4899', borderRadius: '2px' }} />
          <span>Speaker B</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SEEKABLE CLAIM COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SeekableClaim: React.FC<SeekableClaimProps> = ({
  text,
  speaker,
  timestamp,
  verificationStatus,
  pointValue,
  onSeek
}) => {
  const statusColors = {
    verified: { bg: '#dcfce7', border: '#22c55e', icon: '✓' },
    false: { bg: '#fee2e2', border: '#ef4444', icon: '✗' },
    partial: { bg: '#fef3c7', border: '#f59e0b', icon: '◐' },
    unverified: { bg: '#f1f5f9', border: '#94a3b8', icon: '?' },
    pending: { bg: '#e0e7ff', border: '#6366f1', icon: '⏳' }
  };

  const { bg, border, icon } = statusColors[verificationStatus];

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: bg,
        borderLeft: `4px solid ${border}`,
        borderRadius: '0 8px 8px 0',
        marginBottom: '8px',
        cursor: timestamp !== undefined && onSeek ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onClick={() => timestamp !== undefined && onSeek?.(timestamp)}
      onMouseEnter={(e) => {
        if (timestamp !== undefined && onSeek) {
          e.currentTarget.style.transform = 'translateX(4px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '2px 8px',
            backgroundColor: speaker === 'A' ? '#e0e7ff' : '#fce7f3',
            color: speaker === 'A' ? '#4338ca' : '#be185d',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {speaker}
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: border
          }}>
            {icon}
          </span>
          {timestamp !== undefined && onSeek && (
            <TimestampLink
              timestamp={timestamp}
              onSeek={onSeek}
              style="badge"
              showIcon={false}
            />
          )}
        </div>
        <span style={{
          fontWeight: 700,
          fontSize: '14px',
          color: pointValue >= 0 ? '#22c55e' : '#ef4444'
        }}>
          {pointValue >= 0 ? '+' : ''}{pointValue} pts
        </span>
      </div>
      <p style={{
        margin: 0,
        fontSize: '13px',
        color: '#1e293b',
        lineHeight: 1.5
      }}>
        {text}
      </p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SEEKABLE FALLACY COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SeekableFallacy: React.FC<SeekableFallacyProps> = ({
  type,
  displayName,
  speaker,
  timestamp,
  severity,
  quote,
  explanation,
  penalty,
  withinMarginOfError,
  onSeek
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const severityColor = severity >= 7 ? '#ef4444' : severity >= 4 ? '#f59e0b' : '#22c55e';

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: withinMarginOfError ? '#f8fafc' : '#fef2f2',
        borderLeft: `4px solid ${withinMarginOfError ? '#94a3b8' : '#ef4444'}`,
        borderRadius: '0 8px 8px 0',
        marginBottom: '8px',
        opacity: withinMarginOfError ? 0.7 : 1
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 8px',
            backgroundColor: speaker === 'A' ? '#e0e7ff' : '#fce7f3',
            color: speaker === 'A' ? '#4338ca' : '#be185d',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 700
          }}>
            {speaker}
          </span>
          <span style={{
            fontWeight: 700,
            color: '#1e293b'
          }}>
            {displayName}
          </span>
          {withinMarginOfError && (
            <span style={{
              padding: '2px 6px',
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600
            }}>
              WAIVED
            </span>
          )}
          {timestamp !== undefined && onSeek && (
            <TimestampLink
              timestamp={timestamp}
              onSeek={onSeek}
              style="badge"
              showIcon
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Severity Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: '12px',
                  backgroundColor: i < severity ? severityColor : '#e2e8f0',
                  borderRadius: '2px'
                }}
              />
            ))}
          </div>
          <span style={{
            fontWeight: 700,
            fontSize: '14px',
            color: withinMarginOfError ? '#94a3b8' : '#ef4444',
            textDecoration: withinMarginOfError ? 'line-through' : 'none'
          }}>
            -{penalty} pts
          </span>
        </div>
      </div>

      {/* Quote */}
      <div
        style={{
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '8px 12px',
          borderRadius: '6px',
          marginBottom: '8px',
          cursor: timestamp !== undefined && onSeek ? 'pointer' : 'default'
        }}
        onClick={() => timestamp !== undefined && onSeek?.(timestamp)}
      >
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontStyle: 'italic',
          color: '#475569',
          lineHeight: 1.5
        }}>
          "{quote}"
        </p>
      </div>

      {/* Expandable Explanation */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px 0',
          color: '#6366f1',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {expanded ? '▼' : '▶'} {expanded ? 'Hide' : 'Show'} explanation
      </button>

      {expanded && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '13px',
          color: '#64748b',
          lineHeight: 1.6,
          paddingLeft: '16px',
          borderLeft: '2px solid #e2e8f0'
        }}>
          {explanation}
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// DIARIZATION PANEL COMPONENT
// ═══════════════════════════════════════════════════════════════

interface DiarizationPanelProps {
  result: {
    segments: DiarizedSegment[];
    speakers: Array<{ id: string; speakingTime: number }>;
    speakingTimeRatio: { A: number; B: number };
    speakerTransitions: number;
    totalDuration: number;
  };
  currentTime: number;
  onSeek: (time: number) => void;
}

export const DiarizationPanel: React.FC<DiarizationPanelProps> = ({
  result,
  currentTime,
  onSeek
}) => {
  const currentSegment = result.segments.find(
    s => s.startTime <= currentTime && s.endTime >= currentTime
  );

  return (
    <div style={{
      backgroundColor: '#f8fafc',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: 700,
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        🎤 Speaker Diarization
      </h3>

      {/* Speaking Time Distribution */}
      <div style={{
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '13px'
        }}>
          <span style={{ color: '#6366f1', fontWeight: 600 }}>
            Speaker A: {result.speakingTimeRatio.A.toFixed(1)}%
          </span>
          <span style={{ color: '#ec4899', fontWeight: 600 }}>
            Speaker B: {result.speakingTimeRatio.B.toFixed(1)}%
          </span>
        </div>
        <div style={{
          height: '20px',
          borderRadius: '10px',
          overflow: 'hidden',
          display: 'flex',
          backgroundColor: '#e2e8f0'
        }}>
          <div style={{
            width: `${result.speakingTimeRatio.A}%`,
            backgroundColor: '#6366f1',
            transition: 'width 0.5s ease'
          }} />
          <div style={{
            width: `${result.speakingTimeRatio.B}%`,
            backgroundColor: '#ec4899',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Timeline */}
      <TranscriptTimeline
        segments={result.segments}
        currentTime={currentTime}
        totalDuration={result.totalDuration}
        onSeek={onSeek}
      />

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginTop: '16px'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>
            {result.speakerTransitions}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
            Speaker Transitions
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#6366f1' }}>
            {result.segments.length}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>
            Total Segments
          </div>
        </div>
      </div>

      {/* Current Speaker */}
      {currentSegment && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: getSpeakerColor(currentSegment.speaker),
          borderRadius: '8px',
          color: 'white'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>
            CURRENTLY SPEAKING
          </div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>
            Speaker {currentSegment.speaker}
          </div>
          <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.9 }}>
            {currentSegment.text.substring(0, 100)}...
          </div>
        </div>
      )}
    </div>
  );
};
