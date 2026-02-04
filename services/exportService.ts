// services/exportService.ts
// Phase 4: Report Export Service
// Generates PDF and JSON exports of analysis results

import { AnalysisResult, VerifiedClaim, DetectedFallacy, FALLACY_DISPLAY_NAMES } from './scoringEngine';
import { FactVerificationReport, EnhancedFactCheckResult } from './factVerificationService';
import { DiarizationResult, DiarizedSegment } from './speakerDiarizationService';

// ═══════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════

export type ExportFormat = 'pdf' | 'json' | 'csv' | 'markdown';

export interface ExportConfig {
  format: ExportFormat;
  includeSections: {
    summary: boolean;
    participants: boolean;
    claims: boolean;
    fallacies: boolean;
    factVerification: boolean;
    diarization: boolean;
    auditLog: boolean;
    rawTranscript: boolean;
  };
  branding: {
    title: string;
    subtitle?: string;
    logo?: string;
    footer?: string;
    color: string;
  };
  metadata: {
    generatedBy: string;
    version: string;
    timestamp: Date;
  };
}

export interface ExportData {
  analysis: {
    mode: 'arena' | 'solo';
    timestamp: Date;
    duration?: number;
    videoUrl?: string;
  };
  participants: {
    A: { name: string; score: number; truthDensity: number };
    B?: { name: string; score: number; truthDensity: number };
  };
  scoringResult?: AnalysisResult;
  factVerification?: FactVerificationReport;
  diarization?: DiarizationResult;
  transcript?: string;
  calibration?: {
    country: string;
    year: string;
    persona: string;
    marginOfError: number;
    wsdcWeights: { content: number; style: number; strategy: number };
  };
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  filename: string;
  data: Blob | string;
  size: number;
  downloadUrl?: string;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: ExportConfig = {
  format: 'pdf',
  includeSections: {
    summary: true,
    participants: true,
    claims: true,
    fallacies: true,
    factVerification: true,
    diarization: false,
    auditLog: false,
    rawTranscript: false
  },
  branding: {
    title: 'PromptCraft Studio Pro',
    subtitle: 'Logic Analysis Report',
    color: '#6366f1'
  },
  metadata: {
    generatedBy: 'PromptCraft Studio Pro',
    version: '1.0.0',
    timestamp: new Date()
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class ExportService {
  private config: ExportConfig;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, config);
  }

  private mergeConfig(defaults: ExportConfig, overrides: Partial<ExportConfig>): ExportConfig {
    return {
      ...defaults,
      ...overrides,
      includeSections: { ...defaults.includeSections, ...overrides.includeSections },
      branding: { ...defaults.branding, ...overrides.branding },
      metadata: { ...defaults.metadata, ...overrides.metadata, timestamp: new Date() }
    };
  }

  /**
   * Export analysis results in the specified format
   */
  async export(data: ExportData, format?: ExportFormat): Promise<ExportResult> {
    const exportFormat = format || this.config.format;
    
    switch (exportFormat) {
      case 'json':
        return this.exportJSON(data);
      case 'csv':
        return this.exportCSV(data);
      case 'markdown':
        return this.exportMarkdown(data);
      case 'pdf':
      default:
        return this.exportPDF(data);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // JSON EXPORT
  // ═══════════════════════════════════════════════════════════════

  private exportJSON(data: ExportData): ExportResult {
    const exportObj = this.buildExportObject(data);
    const jsonString = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const filename = this.generateFilename('json', data);

    return {
      success: true,
      format: 'json',
      filename,
      data: blob,
      size: blob.size,
      downloadUrl: URL.createObjectURL(blob)
    };
  }

  private buildExportObject(data: ExportData): any {
    const obj: any = {
      metadata: {
        ...this.config.metadata,
        exportedAt: new Date().toISOString(),
        format: 'json'
      },
      analysis: data.analysis
    };

    if (this.config.includeSections.participants) {
      obj.participants = data.participants;
    }

    if (this.config.includeSections.summary && data.scoringResult) {
      obj.summary = {
        winner: data.scoringResult.winner,
        winMargin: data.scoringResult.winMargin,
        overallTruthDensity: data.scoringResult.overallTruthDensity,
        totalClaims: data.scoringResult.claims.length,
        totalFallacies: data.scoringResult.fallacies.length
      };
    }

    if (this.config.includeSections.claims && data.scoringResult) {
      obj.claims = data.scoringResult.claims.map(c => ({
        text: c.text,
        speaker: c.speaker,
        category: c.category,
        verificationStatus: c.verificationStatus,
        confidence: c.confidence,
        pointValue: c.pointValue,
        sources: c.sources
      }));
    }

    if (this.config.includeSections.fallacies && data.scoringResult) {
      obj.fallacies = data.scoringResult.fallacies.map(f => ({
        type: f.type,
        displayName: FALLACY_DISPLAY_NAMES[f.type] || f.type,
        speaker: f.speaker,
        severity: f.severity,
        quote: f.quote,
        explanation: f.explanation,
        penalty: f.penalty,
        withinMarginOfError: f.withinMarginOfError
      }));
    }

    if (this.config.includeSections.factVerification && data.factVerification) {
      obj.factVerification = {
        summary: data.factVerification.summary,
        claims: data.factVerification.claims.map(c => ({
          claim: c.claim,
          verdict: c.verdict,
          confidence: c.confidence,
          explanation: c.explanation,
          sources: c.sources.map(s => ({ title: s.title, url: s.url, authority: s.authority }))
        }))
      };
    }

    if (this.config.includeSections.diarization && data.diarization) {
      obj.diarization = {
        speakers: data.diarization.speakers,
        speakingTimeRatio: data.diarization.speakingTimeRatio,
        transitions: data.diarization.speakerTransitions
      };
    }

    if (this.config.includeSections.auditLog && data.scoringResult) {
      obj.auditLog = data.scoringResult.auditLog;
    }

    if (this.config.includeSections.rawTranscript && data.transcript) {
      obj.transcript = data.transcript;
    }

    if (data.calibration) {
      obj.calibration = data.calibration;
    }

    return obj;
  }

  // ═══════════════════════════════════════════════════════════════
  // CSV EXPORT
  // ═══════════════════════════════════════════════════════════════

  private exportCSV(data: ExportData): ExportResult {
    const lines: string[] = [];
    
    // Header
    lines.push('PromptCraft Studio Pro - Analysis Export');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');

    // Summary
    if (data.scoringResult) {
      lines.push('=== SUMMARY ===');
      lines.push(`Winner,${data.scoringResult.winner}`);
      lines.push(`Win Margin,${data.scoringResult.winMargin.toFixed(1)}`);
      lines.push(`Truth Density,${data.scoringResult.overallTruthDensity.toFixed(1)}%`);
      lines.push('');
    }

    // Participants
    lines.push('=== PARTICIPANTS ===');
    lines.push('Name,Score,Truth Density,Role');
    lines.push(`${data.participants.A.name},${data.participants.A.score},${data.participants.A.truthDensity}%,A`);
    if (data.participants.B) {
      lines.push(`${data.participants.B.name},${data.participants.B.score},${data.participants.B.truthDensity}%,B`);
    }
    lines.push('');

    // Claims
    if (this.config.includeSections.claims && data.scoringResult) {
      lines.push('=== CLAIMS ===');
      lines.push('Speaker,Text,Category,Status,Confidence,Points');
      for (const c of data.scoringResult.claims) {
        const text = c.text.replace(/"/g, '""').substring(0, 200);
        lines.push(`${c.speaker},"${text}",${c.category},${c.verificationStatus},${c.confidence.toFixed(2)},${c.pointValue}`);
      }
      lines.push('');
    }

    // Fallacies
    if (this.config.includeSections.fallacies && data.scoringResult) {
      lines.push('=== FALLACIES ===');
      lines.push('Speaker,Type,Severity,Penalty,Waived,Quote');
      for (const f of data.scoringResult.fallacies) {
        const quote = f.quote.replace(/"/g, '""').substring(0, 100);
        lines.push(`${f.speaker},${f.type},${f.severity},${f.penalty},${f.withinMarginOfError},"${quote}"`);
      }
      lines.push('');
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = this.generateFilename('csv', data);

    return {
      success: true,
      format: 'csv',
      filename,
      data: blob,
      size: blob.size,
      downloadUrl: URL.createObjectURL(blob)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MARKDOWN EXPORT
  // ═══════════════════════════════════════════════════════════════

  private exportMarkdown(data: ExportData): ExportResult {
    const lines: string[] = [];

    // Title
    lines.push(`# ${this.config.branding.title}`);
    if (this.config.branding.subtitle) {
      lines.push(`## ${this.config.branding.subtitle}`);
    }
    lines.push('');
    lines.push(`**Generated:** ${new Date().toLocaleString()}`);
    lines.push(`**Mode:** ${data.analysis.mode === 'arena' ? 'Debate Arena' : 'Solo Analysis'}`);
    lines.push('');

    // Summary
    if (this.config.includeSections.summary && data.scoringResult) {
      lines.push('---');
      lines.push('## 📊 Summary');
      lines.push('');
      lines.push(`| Metric | Value |`);
      lines.push(`|--------|-------|`);
      lines.push(`| Winner | **${data.scoringResult.winner}** |`);
      lines.push(`| Win Margin | ${data.scoringResult.winMargin.toFixed(1)} points |`);
      lines.push(`| Truth Density | ${data.scoringResult.overallTruthDensity.toFixed(1)}% |`);
      lines.push(`| Total Claims | ${data.scoringResult.claims.length} |`);
      lines.push(`| Total Fallacies | ${data.scoringResult.fallacies.length} |`);
      lines.push('');
    }

    // Participants
    if (this.config.includeSections.participants) {
      lines.push('---');
      lines.push('## 👥 Participants');
      lines.push('');
      
      lines.push(`### ${data.participants.A.name} (A)`);
      lines.push(`- **Score:** ${data.participants.A.score}`);
      lines.push(`- **Truth Density:** ${data.participants.A.truthDensity.toFixed(1)}%`);
      lines.push('');

      if (data.participants.B) {
        lines.push(`### ${data.participants.B.name} (B)`);
        lines.push(`- **Score:** ${data.participants.B.score}`);
        lines.push(`- **Truth Density:** ${data.participants.B.truthDensity.toFixed(1)}%`);
        lines.push('');
      }
    }

    // Claims
    if (this.config.includeSections.claims && data.scoringResult) {
      lines.push('---');
      lines.push('## ✓ Verified Claims');
      lines.push('');
      
      const verified = data.scoringResult.claims.filter(c => c.verificationStatus === 'verified');
      const falseClaims = data.scoringResult.claims.filter(c => c.verificationStatus === 'false');
      
      if (verified.length > 0) {
        lines.push('### ✅ Verified True');
        for (const c of verified.slice(0, 10)) {
          lines.push(`- **[${c.speaker}]** ${c.text.substring(0, 150)}... (+${c.pointValue} pts)`);
        }
        lines.push('');
      }

      if (falseClaims.length > 0) {
        lines.push('### ❌ Verified False');
        for (const c of falseClaims.slice(0, 10)) {
          lines.push(`- **[${c.speaker}]** ${c.text.substring(0, 150)}... (${c.pointValue} pts)`);
        }
        lines.push('');
      }
    }

    // Fallacies
    if (this.config.includeSections.fallacies && data.scoringResult && data.scoringResult.fallacies.length > 0) {
      lines.push('---');
      lines.push('## ⚠️ Detected Fallacies');
      lines.push('');

      for (const f of data.scoringResult.fallacies) {
        const displayName = FALLACY_DISPLAY_NAMES[f.type] || f.type;
        const waived = f.withinMarginOfError ? ' *(waived)*' : '';
        lines.push(`### [${f.speaker}] ${displayName}${waived}`);
        lines.push(`- **Severity:** ${f.severity}/10`);
        lines.push(`- **Penalty:** -${f.penalty} points`);
        lines.push(`- **Quote:** "${f.quote}"`);
        lines.push(`- **Explanation:** ${f.explanation}`);
        lines.push('');
      }
    }

    // Fact Verification
    if (this.config.includeSections.factVerification && data.factVerification) {
      lines.push('---');
      lines.push('## 🔍 Fact Verification Report');
      lines.push('');
      lines.push(`| Verdict | Count |`);
      lines.push(`|---------|-------|`);
      lines.push(`| ✓ Verified True | ${data.factVerification.summary.verified} |`);
      lines.push(`| ✗ False | ${data.factVerification.summary.false} |`);
      lines.push(`| ◐ Partially True | ${data.factVerification.summary.partiallyTrue} |`);
      lines.push(`| ⚠ Misleading | ${data.factVerification.summary.misleading} |`);
      lines.push(`| ? Unverified | ${data.factVerification.summary.unverified} |`);
      lines.push('');
    }

    // Calibration
    if (data.calibration) {
      lines.push('---');
      lines.push('## ⚙️ Calibration Settings');
      lines.push('');
      lines.push(`- **Region:** ${data.calibration.country}`);
      lines.push(`- **Year:** ${data.calibration.year}`);
      lines.push(`- **Persona:** ${data.calibration.persona}`);
      lines.push(`- **Margin of Error:** ${data.calibration.marginOfError}%`);
      lines.push(`- **WSDC Weights:** Content ${data.calibration.wsdcWeights.content}% / Style ${data.calibration.wsdcWeights.style}% / Strategy ${data.calibration.wsdcWeights.strategy}%`);
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push(`*Generated by ${this.config.metadata.generatedBy} v${this.config.metadata.version}*`);

    const mdContent = lines.join('\n');
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const filename = this.generateFilename('md', data);

    return {
      success: true,
      format: 'markdown',
      filename,
      data: blob,
      size: blob.size,
      downloadUrl: URL.createObjectURL(blob)
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PDF EXPORT (HTML-based, uses browser print)
  // ═══════════════════════════════════════════════════════════════

  private exportPDF(data: ExportData): ExportResult {
    // Generate HTML content for PDF
    const htmlContent = this.generatePDFHTML(data);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const filename = this.generateFilename('html', data);

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    document.body.appendChild(iframe);
    
    iframe.contentDocument?.write(htmlContent);
    iframe.contentDocument?.close();

    // Trigger print dialog after content loads
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };

    return {
      success: true,
      format: 'pdf',
      filename: filename.replace('.html', '.pdf'),
      data: blob,
      size: blob.size
    };
  }

  private generatePDFHTML(data: ExportData): string {
    const styles = `
      <style>
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body {
          font-family: 'Segoe UI', system-ui, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          color: #1e293b;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid ${this.config.branding.color};
        }
        .header h1 {
          color: ${this.config.branding.color};
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header h2 {
          color: #64748b;
          margin: 0;
          font-size: 18px;
          font-weight: 400;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: ${this.config.branding.color};
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e2e8f0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }
        .summary-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: ${this.config.branding.color};
        }
        .summary-label {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .participant-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 10px;
        }
        .participant-name {
          font-weight: 700;
          font-size: 16px;
        }
        .participant-score {
          font-size: 24px;
          font-weight: 700;
          color: ${this.config.branding.color};
        }
        .claim-item, .fallacy-item {
          padding: 12px;
          border-left: 3px solid #e2e8f0;
          margin-bottom: 10px;
          background: #fafafa;
        }
        .claim-verified { border-left-color: #22c55e; }
        .claim-false { border-left-color: #ef4444; }
        .fallacy-item { border-left-color: #f59e0b; }
        .speaker-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
          margin-right: 8px;
        }
        .speaker-a { background: #e0e7ff; color: #4338ca; }
        .speaker-b { background: #fce7f3; color: #be185d; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        th {
          background: #f1f5f9;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
        }
      </style>
    `;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${this.config.branding.title} - Analysis Report</title>
        ${styles}
      </head>
      <body>
        <div class="header">
          <h1>${this.config.branding.title}</h1>
          <h2>${this.config.branding.subtitle || 'Logic Analysis Report'}</h2>
          <p style="color: #94a3b8; font-size: 14px;">Generated: ${new Date().toLocaleString()}</p>
        </div>
    `;

    // Summary Section
    if (data.scoringResult) {
      html += `
        <div class="section">
          <div class="section-title">📊 Analysis Summary</div>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-value">${data.scoringResult.winner}</div>
              <div class="summary-label">Winner</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${data.scoringResult.overallTruthDensity.toFixed(0)}%</div>
              <div class="summary-label">Truth Density</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${data.scoringResult.claims.length}</div>
              <div class="summary-label">Claims Analyzed</div>
            </div>
          </div>
        </div>
      `;
    }

    // Participants
    html += `
      <div class="section">
        <div class="section-title">👥 Participants</div>
        <div class="participant-row">
          <div>
            <span class="speaker-badge speaker-a">A</span>
            <span class="participant-name">${data.participants.A.name}</span>
          </div>
          <div class="participant-score">${data.participants.A.score} pts</div>
        </div>
    `;
    
    if (data.participants.B) {
      html += `
        <div class="participant-row">
          <div>
            <span class="speaker-badge speaker-b">B</span>
            <span class="participant-name">${data.participants.B.name}</span>
          </div>
          <div class="participant-score">${data.participants.B.score} pts</div>
        </div>
      `;
    }
    html += '</div>';

    // Claims
    if (this.config.includeSections.claims && data.scoringResult && data.scoringResult.claims.length > 0) {
      const topClaims = data.scoringResult.claims.slice(0, 10);
      html += `
        <div class="section">
          <div class="section-title">✓ Key Claims (${data.scoringResult.claims.length} total)</div>
      `;
      
      for (const c of topClaims) {
        const statusClass = c.verificationStatus === 'verified' ? 'claim-verified' : 
                           c.verificationStatus === 'false' ? 'claim-false' : '';
        html += `
          <div class="claim-item ${statusClass}">
            <span class="speaker-badge speaker-${c.speaker.toLowerCase()}">${c.speaker}</span>
            ${c.text.substring(0, 150)}...
            <span style="float: right; color: ${c.pointValue >= 0 ? '#22c55e' : '#ef4444'}; font-weight: 700;">
              ${c.pointValue >= 0 ? '+' : ''}${c.pointValue} pts
            </span>
          </div>
        `;
      }
      html += '</div>';
    }

    // Fallacies
    if (this.config.includeSections.fallacies && data.scoringResult && data.scoringResult.fallacies.length > 0) {
      html += `
        <div class="section">
          <div class="section-title">⚠️ Detected Fallacies (${data.scoringResult.fallacies.length})</div>
      `;
      
      for (const f of data.scoringResult.fallacies.slice(0, 8)) {
        const displayName = FALLACY_DISPLAY_NAMES[f.type] || f.type;
        html += `
          <div class="fallacy-item">
            <span class="speaker-badge speaker-${f.speaker.toLowerCase()}">${f.speaker}</span>
            <strong>${displayName}</strong>
            ${f.withinMarginOfError ? '<span style="color: #22c55e; font-size: 11px;"> (waived)</span>' : ''}
            <span style="float: right; color: #ef4444; font-weight: 700;">-${f.penalty} pts</span>
            <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">"${f.quote.substring(0, 100)}..."</p>
          </div>
        `;
      }
      html += '</div>';
    }

    // Footer
    html += `
        <div class="footer">
          ${this.config.branding.footer || `Generated by ${this.config.metadata.generatedBy} v${this.config.metadata.version}`}
        </div>
      </body>
      </html>
    `;

    return html;
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  private generateFilename(extension: string, data: ExportData): string {
    const date = new Date().toISOString().split('T')[0];
    const participantA = data.participants.A.name.replace(/\s+/g, '_').substring(0, 20);
    const participantB = data.participants.B?.name.replace(/\s+/g, '_').substring(0, 20);
    
    const baseName = data.participants.B 
      ? `analysis_${participantA}_vs_${participantB}_${date}`
      : `analysis_${participantA}_${date}`;
    
    return `${baseName}.${extension}`;
  }

  /**
   * Download the exported file
   */
  download(result: ExportResult): void {
    if (result.format === 'pdf') {
      // PDF uses print dialog, no download needed
      return;
    }

    const url = result.downloadUrl || URL.createObjectURL(result.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    if (!result.downloadUrl) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Get available export formats
   */
  static getAvailableFormats(): Array<{ id: ExportFormat; label: string; icon: string }> {
    return [
      { id: 'pdf', label: 'PDF Report', icon: '📄' },
      { id: 'json', label: 'JSON Data', icon: '{ }' },
      { id: 'markdown', label: 'Markdown', icon: '📝' },
      { id: 'csv', label: 'CSV Spreadsheet', icon: '📊' }
    ];
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

let serviceInstance: ExportService | null = null;

export function getExportService(config?: Partial<ExportConfig>): ExportService {
  if (!serviceInstance || config) {
    serviceInstance = new ExportService(config);
  }
  return serviceInstance;
}
