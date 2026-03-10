import RichEditor from "./RichEditor";
import { User, Mail, Phone, MapPin, Linkedin, Globe } from "lucide-react";

// A4 dimensions
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_PADDING = 48;

// Template configurations
const TEMPLATE_CONFIGS = {
  classic: { font: "Georgia, 'Times New Roman', serif", accent: "#1a1a2e", nameSize: 24, sectionSize: 11, bodySize: 11, nameAlign: "center" },
  modern: { font: "'Segoe UI', Calibri, Arial, sans-serif", accent: "#2563eb", nameSize: 26, sectionSize: 11, bodySize: 11, nameAlign: "left" },
  executive: { font: "'Segoe UI', Calibri, sans-serif", accent: "#d97706", nameSize: 26, sectionSize: 11, bodySize: 11, nameAlign: "left", headerBg: "#1e293b", headerColor: "#ffffff" },
  minimal: { font: "'Helvetica Neue', Helvetica, Arial, sans-serif", accent: "#6b7280", nameSize: 22, sectionSize: 10, bodySize: 11, nameAlign: "left" },
  bold: { font: "'Inter', 'Segoe UI', sans-serif", accent: "#dc2626", nameSize: 28, sectionSize: 11, bodySize: 11, nameAlign: "left" },
  elegant: { font: "Georgia, 'Palatino Linotype', serif", accent: "#0d9488", nameSize: 24, sectionSize: 11, bodySize: 11, nameAlign: "center" },
  corporate: { font: "'Segoe UI', Calibri, Arial, sans-serif", accent: "#1e3a5f", nameSize: 24, sectionSize: 11, bodySize: 11, nameAlign: "left", leftBorder: true },
  creative: { font: "'Inter', 'Segoe UI', sans-serif", accent: "#7c3aed", nameSize: 28, sectionSize: 11, bodySize: 11, nameAlign: "left" },
  professional: { font: "'Segoe UI', Calibri, Arial, sans-serif", accent: "#a78bfa", nameSize: 24, sectionSize: 10, bodySize: 10, nameAlign: "left", headerBg: "#f8f7ff", hasPhoto: true },
  "professional-blue": { font: "'Segoe UI', Calibri, Arial, sans-serif", accent: "#3b82f6", nameSize: 24, sectionSize: 10, bodySize: 10, nameAlign: "left", headerBg: "#f0f7ff", hasPhoto: true },
  "professional-minimal": { font: "'Segoe UI', Calibri, Arial, sans-serif", accent: "#64748b", nameSize: 24, sectionSize: 10, bodySize: 10, nameAlign: "left", headerBg: "#f8fafc", hasPhoto: true },
};

// Parse resume content
function parseContent(text) {
  if (!text) return { name: "", contact: "", sections: [], title: "" };
  
  const isHtml = text.includes("<") && (text.includes("<p>") || text.includes("<h2>") || text.includes("<li>"));
  
  const normalizeHtml = (html) => {
    let normalized = html.replace(/<br\s*\/?>/gi, '\n');
    normalized = normalized.replace(/<\/(p|div|h[1-6])>/gi, '\n\n');
    normalized = normalized.replace(/<li[^>]*>/gi, '\n• ');
    const div = document.createElement('div');
    div.innerHTML = normalized;
    return (div.textContent || div.innerText || '').trim();
  };
  
  const plainText = isHtml ? normalizeHtml(text) : text;
  const lines = plainText.split('\n').map(l => l.trim()).filter(l => l);
  
  const sectionPatterns = {
    'PROFESSIONAL SUMMARY': /^(SUMMARY|PROFESSIONAL\s*SUMMARY|PROFILE|ABOUT|OBJECTIVE|CAREER\s*SUMMARY)/i,
    'WORK EXPERIENCE': /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE|CAREER\s*HISTORY)/i,
    'EDUCATION': /^(EDUCATION|ACADEMIC|QUALIFICATIONS|EDUCATIONAL\s*BACKGROUND)/i,
    'SKILLS': /^(SKILLS|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|EXPERTISE|KEY\s*SKILLS)/i,
    'CERTIFICATIONS': /^(CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS)/i,
    'LANGUAGES': /^(LANGUAGES|LANGUAGE\s*SKILLS)/i,
    'PROJECTS': /^(PROJECTS|KEY\s*PROJECTS|PERSONAL\s*PROJECTS)/i,
  };
  
  // Known section header keywords - these should NOT be treated as names
  const sectionKeywords = /^(SUMMARY|PROFESSIONAL|PROFILE|ABOUT|OBJECTIVE|CAREER|EXPERIENCE|WORK|EMPLOYMENT|EDUCATION|ACADEMIC|QUALIFICATIONS|SKILLS|TECHNICAL|CORE|EXPERTISE|CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS|LANGUAGES|PROJECTS|ACHIEVEMENTS|AWARDS|PUBLICATIONS|REFERENCES|INTERESTS|HOBBIES|ACTIVITIES)/i;
  
  const isHeader = (line) => {
    // First check if it matches known section patterns
    if (Object.values(sectionPatterns).some(p => p.test(line))) return true;
    
    // Check if it's an all-caps line that looks like a section header (contains keywords)
    if (line.length < 50 && line === line.toUpperCase() && /^[A-Z][A-Z\s\/&,]+$/.test(line) && !line.includes("@")) {
      // Only treat as header if it contains section keywords
      return sectionKeywords.test(line);
    }
    return false;
  };
  
  // Check if a line looks like a person's name
  const isLikelyName = (line) => {
    // Names are typically 2-4 words, each word starts with capital
    const words = line.split(/\s+/);
    if (words.length < 1 || words.length > 5) return false;
    if (line.length < 3 || line.length > 50) return false;
    
    // Check if it contains section keywords - if so, it's not a name
    if (sectionKeywords.test(line)) return false;
    
    // Names don't typically contain these characters
    if (/[@|•\d,:]/.test(line)) return false;
    if (/\d{4}/.test(line)) return false; // Contains a year
    
    // ALL CAPS names are valid (e.g., MARIA NIKITA)
    // Mixed case names are valid (e.g., Maria Nikita)
    // Each word should look like a name component
    return words.every(w => {
      const clean = w.replace(/[.,]/g, '');
      return /^[A-Z][a-zA-Z]*$/.test(clean) || /^[A-Z]+$/.test(clean);
    });
  };
  
  // Check if a line looks like a job title (contains role keywords)
  const isJobTitle = (line) => {
    const jobKeywords = /\b(developer|engineer|manager|director|analyst|consultant|designer|specialist|lead|senior|junior|architect|administrator|coordinator|executive|associate|intern|assistant|officer|ceo|cto|cfo|vp|president|head\s+of)\b/i;
    return jobKeywords.test(line) && line.length < 60 && !line.includes("@");
  };
  
  // Check if line is contact info
  const isContactInfo = (line) => {
    return line.includes("@") || 
           line.includes("|") || 
           /\+?\d[\d\s\-()]{6,}/.test(line) ||
           /linkedin\.com/i.test(line) ||
           /github\.com/i.test(line);
  };
  
  let name = "", contact = "", title = "", contentStartIdx = 0;
  
  // First pass: Look for name in the first few lines
  // The name should be the first non-header, non-contact, non-job-title line
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    
    // Skip if it's a section header
    if (isHeader(line)) {
      contentStartIdx = i;
      break;
    }
    
    // If it's contact info, save it
    if (isContactInfo(line)) {
      if (!contact) {
        contact = line;
        contentStartIdx = i + 1;
      }
      continue;
    }
    
    // If it looks like a job title and we already have a name
    if (isJobTitle(line) && name) {
      if (!title) {
        title = line;
        contentStartIdx = i + 1;
      }
      continue;
    }
    
    // First proper line that's not contact or job title is likely the name
    if (!name && line.length > 2 && line.length < 60 && !/[@|•]/.test(line) && !/\d{4}/.test(line)) {
      // Check if this line is a proper name (typically 2-4 words, capitalized)
      const words = line.split(/\s+/);
      const looksLikeName = words.length >= 1 && words.length <= 5 && 
                           words.every(w => /^[A-Z][a-z]*\.?$/.test(w) || /^[A-Z]+$/.test(w));
      
      if (looksLikeName || !isJobTitle(line)) {
        name = line;
        contentStartIdx = i + 1;
      }
    }
  }
  
  // If we still don't have a name but have other data, use the first line as name
  if (!name && lines.length > 0 && !isHeader(lines[0]) && !isContactInfo(lines[0])) {
    name = lines[0];
    contentStartIdx = 1;
  }
  
  // Second pass: Look for title if not found
  if (!title) {
    for (let i = contentStartIdx; i < Math.min(lines.length, 6); i++) {
      const line = lines[i];
      if (isHeader(line)) break;
      if (isContactInfo(line)) continue;
      if (isJobTitle(line)) {
        title = line;
        contentStartIdx = i + 1;
        break;
      }
    }
  }
  
  const sections = [];
  let currentSection = null;
  
  for (let i = contentStartIdx; i < lines.length; i++) {
    const line = lines[i];
    if (isHeader(line)) {
      if (currentSection) sections.push(currentSection);
      let sectionTitle = line;
      for (const [normalized, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) { sectionTitle = normalized; break; }
      }
      currentSection = { title: sectionTitle, content: [] };
    } else if (currentSection) {
      const isBullet = /^[-*•]\s*/.test(line);
      const hasDate = /\d{4}\s*[-–—]\s*(present|\d{4})/i.test(line);
      currentSection.content.push({
        type: isBullet ? 'bullet' : hasDate ? 'job' : 'text',
        text: line.replace(/^[-*•]\s*/, ''),
        raw: line
      });
    }
  }
  if (currentSection) sections.push(currentSection);
  
  return { name, contact, sections, title };
}

// A4 Page wrapper
const A4Page = ({ children, templateId, showPageNumber = false, pageNumber = 1 }) => {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.classic;
  
  return (
    <div 
      className="a4-page bg-white shadow-lg mx-auto relative"
      style={{
        width: `${A4_WIDTH}px`,
        minHeight: `${A4_HEIGHT}px`,
        fontFamily: config.font,
        pageBreakAfter: 'always',
      }}
      data-testid="resume-preview"
    >
      <div 
        style={{
          padding: config.headerBg && !config.hasPhoto ? '0' : `${PAGE_PADDING}px`,
          minHeight: `${A4_HEIGHT - 2}px`,
          borderLeft: config.leftBorder ? `5px solid ${config.accent}` : 'none',
        }}
      >
        {children}
      </div>
      {showPageNumber && (
        <div className="absolute bottom-4 right-6 text-xs text-slate-400">
          Page {pageNumber}
        </div>
      )}
    </div>
  );
};

// Unified Resume Renderer
const UnifiedResumeRenderer = ({ text, templateId, fontSize = 11, photo }) => {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.classic;
  const parsed = parseContent(text);
  const hasPhoto = config.hasPhoto && photo;
  
  // Section heading renderer
  const renderHeading = (title) => {
    const styles = {
      classic: { borderBottom: `2px solid ${config.accent}30`, paddingBottom: '4px' },
      modern: { borderLeft: `3px solid ${config.accent}`, paddingLeft: '10px', borderBottom: 'none' },
      executive: { borderBottom: `2px solid ${config.accent}40` },
      minimal: { letterSpacing: '4px', fontWeight: 400, borderBottom: 'none' },
      bold: { background: config.accent, color: '#ffffff', padding: '6px 12px', borderRadius: '4px', display: 'inline-block' },
      elegant: { borderBottom: `1px solid ${config.accent}40` },
      corporate: { borderBottom: `2px solid ${config.accent}` },
      creative: { borderBottom: `2px solid #e9d5ff` },
      professional: { borderBottom: `1px solid ${config.accent}` },
      "professional-blue": { borderBottom: `1px solid ${config.accent}` },
      "professional-minimal": { borderBottom: `1px solid ${config.accent}` },
    };
    
    const style = styles[templateId] || styles.classic;
    
    return (
      <h2 
        style={{
          fontSize: `${config.sectionSize}px`,
          fontWeight: templateId === 'minimal' ? 400 : 700,
          textTransform: 'uppercase',
          letterSpacing: templateId === 'minimal' ? '4px' : '2px',
          color: templateId === 'bold' ? '#ffffff' : config.accent,
          marginTop: '14px',
          marginBottom: '8px',
          ...style,
        }}
      >
        {title}
      </h2>
    );
  };
  
  // Render content item
  const renderItem = (item, idx) => {
    if (item.type === 'bullet') {
      return (
        <div 
          key={idx}
          style={{ 
            fontSize: `${config.bodySize}px`,
            lineHeight: 1.5,
            paddingLeft: '16px',
            position: 'relative',
            marginBottom: '3px',
            color: '#374151',
          }}
        >
          <span style={{ position: 'absolute', left: 0, color: config.accent }}>•</span>
          {item.text}
        </div>
      );
    }
    
    if (item.type === 'job') {
      const dateMatch = item.text.match(/(\w+\s+\d{4}\s*[-–—]\s*(?:Present|\w+\s+\d{4}))/i);
      let remaining = item.text;
      let dateStr = '';
      if (dateMatch) {
        dateStr = dateMatch[1];
        remaining = item.text.replace(dateMatch[0], '').trim().replace(/\|$/, '').replace(/,$/, '').trim();
      }
      
      return (
        <div 
          key={idx}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            fontSize: `${config.bodySize}px`,
            marginTop: '8px',
            marginBottom: '4px',
            pageBreakInside: 'avoid',
          }}
        >
          <strong style={{ color: '#1f2937' }}>{remaining}</strong>
          {dateStr && (
            <span style={{ 
              fontSize: `${config.bodySize - 1}px`,
              color: '#6b7280',
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}>
              {dateStr}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div 
        key={idx}
        style={{
          fontSize: `${config.bodySize}px`,
          lineHeight: 1.6,
          color: '#374151',
          marginBottom: '3px',
        }}
      >
        {item.text}
      </div>
    );
  };
  
  return (
    <A4Page templateId={templateId}>
      {/* Header with Photo - Side by Side Layout */}
      {hasPhoto ? (
        <div 
          style={{
            background: config.headerBg,
            padding: '20px 24px',
            margin: `-${PAGE_PADDING}px -${PAGE_PADDING}px 16px`,
            borderBottom: `3px solid ${config.accent}`,
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',
          }}
        >
          {/* Left: Profile Photo */}
          <div style={{ flexShrink: 0 }}>
            <img 
              src={photo} 
              alt="Profile"
              style={{
                width: '85px',
                height: '85px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: `3px solid ${config.accent}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            />
          </div>
          
          {/* Right: Name, Title, and Contact Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Name - Always show */}
            <div style={{ 
              fontSize: `${config.nameSize}px`, 
              fontWeight: 700, 
              color: '#1f2937',
              marginBottom: '2px',
              lineHeight: 1.2,
            }}>
              {parsed.name || 'Your Name'}
            </div>
            
            {/* Job Title - Use parsed title or fallback to first job entry */}
            {(parsed.title || parsed.sections?.[0]?.content?.[0]?.type === 'job') && (
              <div style={{ 
                fontSize: `${config.bodySize + 1}px`, 
                fontWeight: 500,
                color: config.accent,
                marginBottom: '8px',
              }}>
                {parsed.title || parsed.sections[0].content[0].text.split(/[-–—]/)[0].trim()}
              </div>
            )}
            
            {/* Contact Information - Horizontal with Icons */}
            {parsed.contact && (
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: `${config.bodySize - 1}px`,
                color: '#4b5563',
              }}>
                {/* Email */}
                {parsed.contact.includes('@') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: config.accent }}>✉</span>
                    <span>{(parsed.contact.match(/[\w.-]+@[\w.-]+\.\w+/) || [''])[0]}</span>
                  </div>
                )}
                {/* Phone */}
                {/\+?\d[\d\s\-()]{6,}/.test(parsed.contact) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: config.accent }}>📞</span>
                    <span>{(parsed.contact.match(/\+?[\d\s\-()]{10,}/) || [''])[0]?.trim()}</span>
                  </div>
                )}
                {/* LinkedIn */}
                {parsed.contact.toLowerCase().includes('linkedin') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: config.accent }}>🔗</span>
                    <span>{(parsed.contact.match(/linkedin\.com\/in\/[\w-]+/i) || ['LinkedIn'])[0]}</span>
                  </div>
                )}
                {/* Location - check for common location patterns */}
                {/[A-Z][a-z]+,?\s+[A-Z]{2}/.test(parsed.contact) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: config.accent }}>📍</span>
                    <span>{(parsed.contact.match(/[A-Z][a-z]+,?\s+[A-Z]{2}/) || [''])[0]}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : config.headerBg && !config.hasPhoto ? (
        /* Executive style header */
        <div 
          style={{
            background: config.headerBg,
            color: config.headerColor,
            padding: '24px 32px 20px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: `${config.nameSize}px`, fontWeight: 700, marginBottom: '4px' }}>
            {parsed.name || 'Your Name'}
          </div>
          {parsed.title && (
            <div style={{ fontSize: `${config.bodySize}px`, color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>
              {parsed.title}
            </div>
          )}
          {parsed.contact && (
            <div style={{ fontSize: `${config.bodySize - 2}px`, color: 'rgba(255,255,255,0.7)' }}>
              {parsed.contact.replace(/\|/g, ' • ')}
            </div>
          )}
        </div>
      ) : (
        /* Standard header */
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            fontSize: `${config.nameSize}px`, 
            fontWeight: 700, 
            textAlign: config.nameAlign,
            color: templateId === 'modern' || templateId === 'creative' ? config.accent : '#1a1a2e',
            marginBottom: '4px',
          }}>
            {parsed.name || 'Your Name'}
          </div>
          {parsed.title && (
            <div style={{ 
              fontSize: `${config.bodySize}px`, 
              textAlign: config.nameAlign,
              color: config.accent,
              marginBottom: '4px',
              fontWeight: 500,
            }}>
              {parsed.title}
            </div>
          )}
          {parsed.contact && (
            <div style={{ 
              fontSize: `${config.bodySize - 2}px`, 
              textAlign: config.nameAlign,
              color: '#6b7280',
              marginBottom: '8px',
            }}>
              {parsed.contact.replace(/\|/g, ' • ')}
            </div>
          )}
          {/* Accent bar */}
          <div style={{
            height: templateId === 'minimal' ? '1px' : templateId === 'bold' ? '4px' : '2px',
            background: templateId === 'creative' 
              ? `linear-gradient(90deg, ${config.accent}, #a78bfa)`
              : templateId === 'elegant'
              ? `linear-gradient(90deg, transparent, ${config.accent}, transparent)`
              : config.accent,
            width: templateId === 'modern' || templateId === 'creative' ? '60px' : '100%',
            margin: config.nameAlign === 'center' ? '12px auto' : '12px 0',
            borderRadius: ['modern', 'creative', 'bold'].includes(templateId) ? '2px' : '0',
          }} />
        </div>
      )}
      
      {/* Sections */}
      <div style={{ padding: hasPhoto || (config.headerBg && !config.hasPhoto) ? `0 ${PAGE_PADDING}px ${PAGE_PADDING}px` : '0' }}>
        {parsed.sections.map((section, sIdx) => (
          <div 
            key={sIdx}
            style={{ 
              marginBottom: '14px',
              pageBreakInside: 'avoid',
            }}
          >
            {renderHeading(section.title)}
            <div>
              {section.content.map((item, iIdx) => renderItem(item, iIdx))}
            </div>
          </div>
        ))}
      </div>
    </A4Page>
  );
};

// Main ResumePreview component
const ResumePreview = ({ 
  text, 
  templateId, 
  editing, 
  onTextChange, 
  fontSize = 11,
  photo,
  // Backward compatibility props
  personalInfo,
  skills,
  education,
  experience,
  certifications,
  languages,
  hobbies,
  summary,
}) => {
  if (!text && !personalInfo?.name) return null;
  const tpl = templateId || "classic";

  // Rich text editing mode
  if (editing) {
    return (
      <div className="w-full flex justify-center" style={{ minHeight: `${A4_HEIGHT + 100}px` }} data-testid="resume-editor">
        <RichEditor value={text} onChange={onTextChange} placeholder="Edit your resume content here..." />
      </div>
    );
  }

  // Preview mode - render with unified A4 renderer
  return (
    <div 
      className="resume-preview-container py-6 flex justify-center"
      style={{ backgroundColor: '#e5e7eb' }}
    >
      <UnifiedResumeRenderer 
        text={text} 
        templateId={tpl} 
        fontSize={fontSize}
        photo={photo}
      />
    </div>
  );
};

export default ResumePreview;
export { A4_WIDTH, A4_HEIGHT, PAGE_PADDING, TEMPLATE_CONFIGS, parseContent };
