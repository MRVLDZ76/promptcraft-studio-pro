# UI Enhancements Quick Reference (v2.1.0)

## 🎯 Arbiter Tuning Parameter

### What it does
Directs LLM analysis focus and methodology. Acts as specific instruction layer on top of auto-generated Supervisor Intelligence Directive.

### How it affects final analysis
```
User Input (Arbiter Tuning) + Supervisor Directive → LLM System Prompt → Analysis Results
```

### Available Presets
1. **Comprehensive Analysis** - Balanced all-around evaluation
2. **Fallacy Detection Focus** - Intensive logical fallacy identification  
3. **Evidence Quality Audit** - Source credibility & fact-checking
4. **Toulmin Structure Analysis** - Argument deconstruction framework
5. **Comparative Strength Analysis** - Head-to-head participant comparison
6. **Fact-Checking Protocol** - Truth verification emphasis
7. **Custom Query** - User-defined instructions

### Usage Tips
- Select preset matching your analysis goal
- Edit preset templates for fine-tuning
- More specific prompts = better results
- Changes only affect next analysis run

---

## 💾 Active Fallacy Log

### What changed
- **Before**: Ephemeral display of current analysis fallacies only
- **After**: Persistent storage with full metadata across all analyses

### New Features
- ✅ localStorage persistence (survives refresh)
- ✅ Timestamp tracking for each violation
- ✅ Speaker identification (A vs B)
- ✅ Score impact tracking (-5 pts, etc.)
- ✅ Export to JSON for external analysis
- ✅ Clear history button
- ✅ Total fallacy counter badge

### Exported Data Format
```json
[
  {
    "timestamp": "2026-01-11T14:23:45.123Z",
    "fallacy": "Ad Hominem attack without addressing argument",
    "speaker": "Participant A",
    "impact": "-5"
  }
]
```

### Usage Tips
- Export logs regularly to avoid localStorage limits
- Use exported JSON for trend analysis
- Clear history when starting new analysis sessions
- Sort newest-first for quick review

---

## 📊 Visual Logical Adjudication Matrix

### Display Modes

#### Visual Mode (👁️)
**Best for**: Quick insights, presentations, non-technical audiences

**Components**:
- 🏆 Winner announcement card (gold theme)
- 📊 WSDC score breakdown (animated progress bars)
- ⚡ Strongest argument card (green theme)
- ⚠️ Weakest argument card (red theme)
- 📈 Critical fallacies card (orange theme)
- 📝 Executive summary (indigo theme)

#### Raw Text Mode (📄)
**Best for**: Detailed review, copying text, full narrative

**Components**:
- Complete prose analysis
- Unformatted LLM output
- Copy-paste friendly

### Toggle Switcher
- Eye icon = Visual mode
- Document icon = Raw text mode
- Instant switching, no reload needed

### Color Coding
- **Indigo/Cyan** = Participant A
- **Pink/Fuchsia** = Participant B  
- **Amber/Gold** = Winner/achievements
- **Green** = Positive/strong
- **Red** = Fallacies/weak
- **Orange** = Warnings

---

## 🚀 Quick Start Guide

### First Time Setup
1. Load video or input content
2. Select Arbiter Tuning preset (try "Comprehensive Analysis")
3. Configure Logic Calibrator settings
4. Run analysis

### Reviewing Results
1. Check Visual Mode for quick insights
2. Toggle to Raw Text for detailed narrative
3. Scroll Fallacy Log for violation timeline
4. Export fallacy log for record-keeping

### Advanced Usage
1. Write custom Arbiter Tuning prompts
2. Compare multiple analyses side-by-side
3. Analyze fallacy trends from exported JSON
4. Fine-tune WSDC weights based on visual score breakdown

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Fallacy log empty after refresh | Check localStorage enabled (not incognito mode) |
| Visual mode blank | Ensure Gemini returns structured JSON output |
| Export button not working | Check browser pop-up/download blocker |
| Preset not applying | Ensure "Custom" not selected when choosing preset |

---

## 📈 Storage Limits

| Metric | Limit |
|--------|-------|
| localStorage capacity | ~5-10 MB (browser-dependent) |
| Fallacy entries per MB | ~2,000-5,000 |
| Recommended export frequency | Every 50-100 analyses |

---

## 🎨 UI Conventions

### Icons
- 👁️ Eye = Visual display mode
- 📄 Document = Raw text mode
- ⬇️ Download = Export functionality
- 🗑️ Trash = Clear/delete action
- ⚙️ Gear = Settings/configuration
- 🏆 Trophy = Winner/achievement

### Status Indicators
- 🟢 Green dot = Active/live
- 🔴 Red badge = Violations/issues
- 🟡 Yellow = Warnings
- 🔵 Blue = Information

---

## 💡 Pro Tips

### Arbiter Tuning
- Combine preset templates for hybrid analysis
- Add specific constraints: "Limit response to 500 words"
- Reference external frameworks: "Apply CRAAP test to sources"
- Specify output format: "Provide bullet-point summary"

### Fallacy Log
- Export weekly for trend analysis
- Use speaker field to compare participants
- Track impact scores to measure severity
- Cross-reference with video timestamps

### Visual Mode
- Screenshot winner cards for presentations
- Use score bars to identify close matches
- Review key insights cards before reading full analysis
- Toggle modes to verify visual summary accuracy

---

## 🔗 Related Documentation

- **Full Documentation**: [ENHANCEMENTS_DOCUMENTATION.md](ENHANCEMENTS_DOCUMENTATION.md)
- **Backend Integration**: [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)
- **Main README**: [README.md](README.md)
- **Type Definitions**: [types.ts](types.ts)

---

## 📊 Version Info

**Current Version**: 2.1.0  
**Release Date**: January 11, 2026  
**Changes**:
- ✅ Arbiter Tuning presets
- ✅ Persistent fallacy logging
- ✅ Visual/text toggle for results

---

## 🆘 Support

For issues or questions:
1. Check DevTools console for errors
2. Verify localStorage in Application tab
3. Inspect `extractedJSON` state for structured data
4. Review full documentation for detailed explanations
