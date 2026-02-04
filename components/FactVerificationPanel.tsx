// components/FactVerificationPanel.tsx
// Phase 3: Enhanced Fact Verification UI Component
// Displays claim-by-claim verification with sources and confidence

import React, { useState, useMemo } from 'react';
import {
  FactVerificationReport,
  EnhancedFactCheckResult,
  VerificationSource,
  getVerdictColorClass,
  getVerdictIcon,
  getSourceTypeIcon,
  formatConfidence,
  formatVerificationDuration
} from '../services/factVerificationService';

// Icons (using similar pattern as AnalysisStudio)
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertTriangle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ExternalLink = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const Filter = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface FactVerificationPanelProps {
  report: FactVerificationReport | null;
  isLoading?: boolean;
  progress?: number;
  currentClaim?: string;
  onRetryVerification?: () => void;
}

type VerdictFilter = 'all' | 'TRUE' | 'FALSE' | 'PARTIALLY_TRUE' | 'MISLEADING' | 'UNVERIFIED' | 'OPINION' | 'PREDICTION';
type SpeakerFilter = 'all' | 'A' | 'B';

export const FactVerificationPanel: React.FC<FactVerificationPanelProps> = ({
  report,
  isLoading = false,
  progress = 0,
  currentClaim = '',
  onRetryVerification
}) => {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>('all');
  const [speakerFilter, setSpeakerFilter] = useState<SpeakerFilter>('all');
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());
  const [showSources, setShowSources] = useState(false);
  const [sortBy, setSortBy] = useState<'confidence' | 'time' | 'verdict'>('confidence');

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    if (!report) return [];
    
    let claims = [...report.claims];
    
    // Apply verdict filter
    if (verdictFilter !== 'all') {
      claims = claims.filter(c => c.verdict === verdictFilter);
    }
    
    // Apply speaker filter
    if (speakerFilter !== 'all') {
      claims = claims.filter(c => c.speaker === speakerFilter);
    }
    
    // Sort
    switch (sortBy) {
      case 'confidence':
        claims.sort((a, b) => b.confidence - a.confidence);
        break;
      case 'time':
        claims.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        break;
      case 'verdict':
        const verdictOrder = { TRUE: 0, FALSE: 1, MISLEADING: 2, PARTIALLY_TRUE: 3, UNVERIFIED: 4, OPINION: 5, PREDICTION: 6 };
        claims.sort((a, b) => (verdictOrder[a.verdict] || 99) - (verdictOrder[b.verdict] || 99));
        break;
    }
    
    return claims;
  }, [report, verdictFilter, speakerFilter, sortBy]);

  // Toggle claim expansion
  const toggleClaimExpansion = (claimId: string) => {
    setExpandedClaims(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  // Get all unique sources from the report
  const allSources = useMemo(() => {
    if (!report) return [];
    const sources = report.claims.flatMap(c => c.sources);
    const uniqueMap = new Map<string, VerificationSource>();
    sources.forEach(s => {
      if (!uniqueMap.has(s.url)) {
        uniqueMap.set(s.url, s);
      }
    });
    return Array.from(uniqueMap.values()).sort((a, b) => b.authority - a.authority);
  }, [report]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-blue-200 dark:border-blue-500/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
          <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">
            Verifying Claims...
          </h4>
          <span className="text-xs text-blue-600 dark:text-blue-300 ml-auto">{progress}%</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Current claim */}
        {currentClaim && (
          <p className="text-xs text-blue-600 dark:text-blue-400 italic truncate">
            Checking: "{currentClaim}"
          </p>
        )}
      </div>
    );
  }

  // No report state
  if (!report) {
    return (
      <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-600 p-6 text-center">
        <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No fact verification data available.
        </p>
        {onRetryVerification && (
          <button
            onClick={onRetryVerification}
            className="mt-3 px-4 py-2 text-xs font-bold bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
          >
            Run Verification
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SUMMARY HEADER */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-500/30 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-xs font-black text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Fact Verification Report (Phase 3)
          </h4>
          <span className="text-[8px] font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded">
            {formatVerificationDuration(report.metadata.totalDuration)}
          </span>
        </div>

        {/* Summary Stats Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
          <SummaryCard 
            label="Total" 
            value={report.summary.totalClaims} 
            color="slate"
          />
          <SummaryCard 
            label="Verified" 
            value={report.summary.verified} 
            color="green"
            icon="✓"
          />
          <SummaryCard 
            label="False" 
            value={report.summary.false} 
            color="red"
            icon="✗"
          />
          <SummaryCard 
            label="Partial" 
            value={report.summary.partiallyTrue} 
            color="yellow"
            icon="◐"
          />
          <SummaryCard 
            label="Misleading" 
            value={report.summary.misleading} 
            color="orange"
            icon="⚠"
          />
          <SummaryCard 
            label="Unverified" 
            value={report.summary.unverified} 
            color="slate"
            icon="?"
          />
          <SummaryCard 
            label="Opinions" 
            value={report.summary.opinions} 
            color="purple"
            icon="💭"
          />
          <SummaryCard 
            label="Predictions" 
            value={report.summary.predictions} 
            color="indigo"
            icon="🔮"
          />
        </div>

        {/* Truth Density Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase">
              Truth Density
            </span>
            <span className="text-sm font-black text-green-600 dark:text-green-400">
              {report.summary.truthDensity.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                report.summary.truthDensity >= 70 ? 'bg-green-500' :
                report.summary.truthDensity >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, report.summary.truthDensity)}%` }}
            />
          </div>
        </div>

        {/* Participant Breakdown */}
        {report.participantBreakdown.B && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-500/20">
            <ParticipantStats 
              stats={report.participantBreakdown.A} 
              color="indigo"
            />
            <ParticipantStats 
              stats={report.participantBreakdown.B} 
              color="pink"
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* FILTERS & CONTROLS */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2 px-1">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-neutral-400" />
          <span className="text-[9px] font-bold text-neutral-500 uppercase">Filters:</span>
        </div>
        
        {/* Verdict filter */}
        <select
          value={verdictFilter}
          onChange={(e) => setVerdictFilter(e.target.value as VerdictFilter)}
          className="text-[9px] font-bold px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300"
        >
          <option value="all">All Verdicts</option>
          <option value="TRUE">✓ Verified True</option>
          <option value="FALSE">✗ False</option>
          <option value="PARTIALLY_TRUE">◐ Partially True</option>
          <option value="MISLEADING">⚠ Misleading</option>
          <option value="UNVERIFIED">? Unverified</option>
          <option value="OPINION">💭 Opinions</option>
          <option value="PREDICTION">🔮 Predictions</option>
        </select>

        {/* Speaker filter */}
        {report.participantBreakdown.B && (
          <select
            value={speakerFilter}
            onChange={(e) => setSpeakerFilter(e.target.value as SpeakerFilter)}
            className="text-[9px] font-bold px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300"
          >
            <option value="all">All Speakers</option>
            <option value="A">[A] {report.participantBreakdown.A.name}</option>
            <option value="B">[B] {report.participantBreakdown.B.name}</option>
          </select>
        )}

        {/* Sort by */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="text-[9px] font-bold px-2 py-1 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300"
        >
          <option value="confidence">Sort: Confidence</option>
          <option value="verdict">Sort: Verdict</option>
          <option value="time">Sort: Timeline</option>
        </select>

        {/* Toggle sources view */}
        <button
          onClick={() => setShowSources(!showSources)}
          className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
            showSources 
              ? 'bg-neutral-700 text-white' 
              : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300'
          }`}
        >
          {showSources ? 'Hide' : 'Show'} All Sources ({allSources.length})
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ALL SOURCES VIEW */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showSources && (
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-600 p-4">
          <h5 className="text-[10px] font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-3">
            Verification Sources ({allSources.length} unique)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {allSources.slice(0, 20).map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* CLAIMS LIST */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredClaims.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">
            <p className="text-sm">No claims match the current filters</p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <ClaimCard
              key={claim.claimId}
              claim={claim}
              isExpanded={expandedClaims.has(claim.claimId)}
              onToggle={() => toggleClaimExpansion(claim.claimId)}
              participantAName={report.participantBreakdown.A.name}
              participantBName={report.participantBreakdown.B?.name}
            />
          ))
        )}
      </div>

      {/* Showing count */}
      <div className="text-center text-[9px] text-neutral-400">
        Showing {filteredClaims.length} of {report.claims.length} claims
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

const SummaryCard: React.FC<{
  label: string;
  value: number;
  color: string;
  icon?: string;
}> = ({ label, value, color, icon }) => {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-100 dark:bg-green-500/10 text-green-600',
    red: 'bg-red-100 dark:bg-red-500/10 text-red-600',
    yellow: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600',
    orange: 'bg-orange-100 dark:bg-orange-500/10 text-orange-600',
    purple: 'bg-neutral-100 dark:bg-neutral-500/10 text-neutral-600',
    indigo: 'bg-neutral-100 dark:bg-neutral-700/10 text-neutral-600',
    slate: 'bg-neutral-100 dark:bg-neutral-500/10 text-neutral-600',
  };

  return (
    <div className={`text-center p-2 rounded ${colorClasses[color]}`}>
      <div className="text-lg font-black flex items-center justify-center gap-1">
        {icon && <span className="text-xs">{icon}</span>}
        {value}
      </div>
      <div className="text-[8px] font-bold uppercase">{label}</div>
    </div>
  );
};

const ParticipantStats: React.FC<{
  stats: FactVerificationReport['participantBreakdown']['A'];
  color: 'indigo' | 'pink';
}> = ({ stats, color }) => {
  const colorClasses = color === 'indigo' 
    ? 'border-neutral-200 dark:border-neutral-500/30 bg-neutral-50 dark:bg-neutral-700/5'
    : 'border-neutral-200 dark:border-neutral-500/30 bg-neutral-50 dark:bg-neutral-500/5';
  const textColor = color === 'indigo' 
    ? 'text-neutral-600 dark:text-neutral-400' 
    : 'text-neutral-600 dark:text-neutral-400';

  return (
    <div className={`rounded-lg border p-3 ${colorClasses}`}>
      <h5 className={`text-[10px] font-black uppercase mb-2 ${textColor}`}>
        {stats.name}
      </h5>
      <div className="grid grid-cols-2 gap-1 text-[9px]">
        <div className="flex justify-between">
          <span className="text-neutral-500">Claims:</span>
          <span className="font-bold">{stats.totalClaims}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-500">✓ True:</span>
          <span className="font-bold text-green-600">{stats.verified}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-red-500">✗ False:</span>
          <span className="font-bold text-red-600">{stats.false}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Truth %:</span>
          <span className={`font-bold ${stats.truthDensity >= 50 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.truthDensity.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

const ClaimCard: React.FC<{
  claim: EnhancedFactCheckResult;
  isExpanded: boolean;
  onToggle: () => void;
  participantAName: string;
  participantBName?: string;
}> = ({ claim, isExpanded, onToggle, participantAName, participantBName }) => {
  const speakerName = claim.speaker === 'A' ? participantAName : (participantBName || 'B');
  const speakerColor = claim.speaker === 'A' 
    ? 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700/20' 
    : 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-500/20';

  return (
    <div 
      className={`rounded-lg border transition-all ${
        isExpanded ? 'border-neutral-300 dark:border-neutral-500/50' : 'border-neutral-200 dark:border-neutral-600'
      } bg-white dark:bg-neutral-800/50 overflow-hidden`}
    >
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-3 flex items-start gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
      >
        {/* Verdict badge */}
        <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-black uppercase ${getVerdictColorClass(claim.verdict)}`}>
          {getVerdictIcon(claim.verdict)} {claim.verdict.replace('_', ' ')}
        </span>

        {/* Speaker badge */}
        <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded ${speakerColor}`}>
          [{claim.speaker}]
        </span>

        {/* Claim text */}
        <span className="flex-1 text-[10px] text-neutral-700 dark:text-neutral-300 line-clamp-2">
          {claim.claim}
        </span>

        {/* Confidence + expand */}
        <div className="shrink-0 flex items-center gap-2">
          <span className={`text-[9px] font-bold ${
            claim.confidence >= 0.7 ? 'text-green-600' :
            claim.confidence >= 0.4 ? 'text-yellow-600' :
            'text-neutral-400'
          }`}>
            {formatConfidence(claim.confidence)}
          </span>
          <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-700 p-3 space-y-3 bg-neutral-50 dark:bg-neutral-900/50">
          {/* Category & timing */}
          <div className="flex flex-wrap gap-2 text-[9px]">
            <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400 font-bold uppercase">
              {claim.category}
            </span>
            {claim.timestamp && (
              <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400">
                @ {Math.floor(claim.timestamp / 60)}:{(claim.timestamp % 60).toString().padStart(2, '0')}
              </span>
            )}
            <span className="px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400">
              Verified in {formatVerificationDuration(claim.verificationTime)}
            </span>
          </div>

          {/* Explanation */}
          <div className="text-[10px] text-neutral-600 dark:text-neutral-400">
            <span className="font-bold text-neutral-700 dark:text-neutral-300">Explanation: </span>
            {claim.explanation}
          </div>

          {/* Reasoning steps */}
          {claim.reasoning.length > 1 && (
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">Reasoning:</span>
              <ul className="text-[9px] text-neutral-600 dark:text-neutral-400 list-disc list-inside space-y-0.5">
                {claim.reasoning.slice(0, 5).map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          {claim.sources.length > 0 && (
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-neutral-500 uppercase">
                Sources ({claim.sources.length}):
              </span>
              <div className="grid grid-cols-1 gap-1">
                {claim.sources.slice(0, 3).map((source, i) => (
                  <SourceCard key={i} source={source} compact />
                ))}
              </div>
            </div>
          )}

          {/* Search queries used */}
          {claim.searchQueries.length > 0 && (
            <div className="text-[9px] text-neutral-400 italic">
              Searches: {claim.searchQueries.join(' | ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SourceCard: React.FC<{
  source: VerificationSource;
  compact?: boolean;
}> = ({ source, compact = false }) => {
  const authorityColor = source.authority >= 70 ? 'text-green-600' :
                         source.authority >= 40 ? 'text-yellow-600' :
                         'text-neutral-500';

  if (compact) {
    return (
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors group"
      >
        <span className="text-xs">{getSourceTypeIcon(source.sourceType)}</span>
        <span className="flex-1 text-[9px] text-neutral-600 dark:text-neutral-400 truncate group-hover:text-neutral-600 dark:group-hover:text-neutral-400">
          {source.domain}
        </span>
        <span className={`text-[8px] font-bold ${authorityColor}`}>
          {source.authority}
        </span>
        <ExternalLink className="w-3 h-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    );
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500 transition-colors group"
    >
      <div className="flex items-start gap-2 mb-1">
        <span className="text-sm">{getSourceTypeIcon(source.sourceType)}</span>
        <span className="flex-1 text-[10px] font-bold text-neutral-700 dark:text-neutral-300 line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-400">
          {source.title || source.domain}
        </span>
        <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
      </div>
      <div className="flex items-center gap-2 text-[9px] text-neutral-500 mb-2">
        <span>{source.domain}</span>
        <span>•</span>
        <span className={`font-bold ${authorityColor}`}>Authority: {source.authority}/100</span>
        <span>•</span>
        <span>Relevance: {Math.round(source.relevance * 100)}%</span>
      </div>
      {source.excerpt && (
        <p className="text-[9px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {source.excerpt}
        </p>
      )}
    </a>
  );
};

export default FactVerificationPanel;
