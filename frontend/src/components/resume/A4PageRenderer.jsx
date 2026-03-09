import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

// A4 dimensions in pixels at 96 DPI
const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_PADDING = 48; // 0.5 inch padding
const CONTENT_WIDTH = A4_WIDTH - (PAGE_PADDING * 2);
const CONTENT_HEIGHT = A4_HEIGHT - (PAGE_PADDING * 2);

// Template configurations
export const TEMPLATE_CONFIGS = {
  classic: { 
    font: "Georgia, 'Times New Roman', serif", 
    accent: "#1a1a2e", 
    nameSize: 24, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "center" 
  },
  modern: { 
    font: "'Segoe UI', Calibri, Arial, sans-serif", 
    accent: "#2563eb", 
    nameSize: 26, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "left" 
  },
  executive: { 
    font: "'Segoe UI', Calibri, sans-serif", 
    accent: "#d97706", 
    nameSize: 26, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "left",
    headerBg: "#1e293b",
    headerColor: "#ffffff"
  },
  minimal: { 
    font: "'Helvetica Neue', Helvetica, Arial, sans-serif", 
    accent: "#6b7280", 
    nameSize: 22, 
    sectionSize: 10,
    bodySize: 11,
    nameAlign: "left" 
  },
  bold: { 
    font: "'Inter', 'Segoe UI', sans-serif", 
    accent: "#dc2626", 
    nameSize: 28, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "left" 
  },
  elegant: { 
    font: "Georgia, 'Palatino Linotype', serif", 
    accent: "#0d9488", 
    nameSize: 24, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "center" 
  },
  corporate: { 
    font: "'Segoe UI', Calibri, Arial, sans-serif", 
    accent: "#1e3a5f", 
    nameSize: 24, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "left",
    leftBorder: true
  },
  creative: { 
    font: "'Inter', 'Segoe UI', sans-serif", 
    accent: "#7c3aed", 
    nameSize: 28, 
    sectionSize: 11,
    bodySize: 11,
    nameAlign: "left" 
  },
  professional: { 
    font: "'Segoe UI', Calibri, Arial, sans-serif", 
    accent: "#a78bfa", 
    nameSize: 24, 
    sectionSize: 10,
    bodySize: 10,
    nameAlign: "left",
    headerBg: "#f8f7ff",
    hasPhoto: true
  },
  "professional-blue": { 
    font: "'Segoe UI', Calibri, Arial, sans-serif", 
    accent: "#3b82f6", 
    nameSize: 24, 
    sectionSize: 10,
    bodySize: 10,
    nameAlign: "left",
    headerBg: "#f0f7ff",
    hasPhoto: true
  },
  "professional-minimal": { 
    font: "'Segoe UI', Calibri, Arial, sans-serif", 
    accent: "#64748b", 
    nameSize: 24, 
    sectionSize: 10,
    bodySize: 10,
    nameAlign: "left",
    headerBg: "#f8fafc",
    hasPhoto: true
  },
};

// Parse resume content from HTML/text
export const parseResumeContent = (text) => {
  if (!text) return { name: "", contact: "", sections: [] };
  
  const isHtml = text.includes("<") && (text.includes("<p>") || text.includes("<h2>") || text.includes("<li>"));
  
  // Normalize content
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
  
  // Section detection patterns
  const sectionPatterns = {
    'PROFESSIONAL SUMMARY': /^(SUMMARY|PROFESSIONAL\s*SUMMARY|PROFILE|ABOUT|OBJECTIVE|CAREER\s*SUMMARY)/i,
    'WORK EXPERIENCE': /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE|CAREER\s*HISTORY)/i,
    'EDUCATION': /^(EDUCATION|ACADEMIC|QUALIFICATIONS|EDUCATIONAL\s*BACKGROUND)/i,
    'SKILLS': /^(SKILLS|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|EXPERTISE|KEY\s*SKILLS)/i,
    'CERTIFICATIONS': /^(CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS)/i,
    'LANGUAGES': /^(LANGUAGES|LANGUAGE\s*SKILLS)/i,
  };
  
  const isHeader = (line) => {
    return Object.values(sectionPatterns).some(p => p.test(line)) ||
      (line.length < 50 && line === line.toUpperCase() && /^[A-Z][A-Z\s\/&,]+$/.test(line) && !line.includes("@"));
  };
  
  // Extract name and contact
  let name = "";
  let contact = "";
  let contentStartIdx = 0;
  
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (!isHeader(line)) {
      if (!name && line.length > 2 && line.length < 60 && !/[@|•]/.test(line) && !/\d{4}/.test(line)) {
        name = line;
        contentStartIdx = i + 1;
      } else if (name && !contact && (line.includes("@") || line.includes("|") || /\+?\d[\d\s\-()]{6,}/.test(line))) {
        contact = line;
        contentStartIdx = i + 1;
      }
    } else {
      contentStartIdx = i;
      break;
    }
  }
  
  // Parse sections
  const sections = [];
  let currentSection = null;
  
  for (let i = contentStartIdx; i < lines.length; i++) {
    const line = lines[i];
    
    if (isHeader(line)) {
      if (currentSection) sections.push(currentSection);
      // Normalize section title
      let sectionTitle = line;
      for (const [normalized, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          sectionTitle = normalized;
          break;
        }
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
  
  return { name, contact, sections };
};

// Single A4 Page Component
const A4Page = ({ children, pageNumber, totalPages, templateId }) => {
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.classic;
  
  return (
    <div 
      className="a4-page bg-white shadow-lg mx-auto mb-4 relative"
      style={{
        width: `${A4_WIDTH}px`,
        minHeight: `${A4_HEIGHT}px`,
        fontFamily: config.font,
        boxSizing: 'border-box',
        pageBreakAfter: 'always',
        pageBreakInside: 'avoid',
      }}
      data-page={pageNumber}
    >
      <div 
        className="a4-content"
        style={{
          padding: `${PAGE_PADDING}px`,
          minHeight: `${A4_HEIGHT - 2}px`,
          boxSizing: 'border-box',
          borderLeft: config.leftBorder ? `5px solid ${config.accent}` : 'none',
        }}
      >
        {children}
      </div>
      {/* Page number */}
      {totalPages > 1 && (
        <div 
          className="absolute bottom-4 right-6 text-xs text-slate-400"
          style={{ fontFamily: config.font }}
        >
          Page {pageNumber} of {totalPages}
        </div>
      )}
    </div>
  );
};

// Unified A4 Page Renderer Component
const A4PageRenderer = forwardRef(({ 
  content, 
  templateId = "classic", 
  fontSize = 11,
  photo = null,
  isEditing = false,
  onContentChange,
}, ref) => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [pages, setPages] = useState([]);
  const config = TEMPLATE_CONFIGS[templateId] || TEMPLATE_CONFIGS.classic;
  
  // Expose methods for PDF generation
  useImperativeHandle(ref, () => ({
    getContainer: () => containerRef.current,
    getPages: () => pages,
    getConfig: () => config,
  }));
  
  // Parse content and calculate pages
  useEffect(() => {
    if (!content) {
      setPages([{ content: '', startIdx: 0 }]);
      return;
    }
    
    const parsed = parseResumeContent(content);
    
    // For now, render as single flowing content - pagination will be handled by CSS
    setPages([{ 
      parsed,
      content,
    }]);
  }, [content, templateId, fontSize]);
  
  // Render section heading based on template
  const renderSectionHeading = (title) => {
    const headingStyles = {
      classic: { borderBottom: `2px solid ${config.accent}30`, color: config.accent, paddingBottom: '4px' },
      modern: { borderLeft: `3px solid ${config.accent}`, paddingLeft: '10px', color: config.accent },
      executive: { borderBottom: `2px solid ${config.accent}40`, color: config.accent },
      minimal: { color: '#9ca3af', letterSpacing: '4px', fontWeight: 400 },
      bold: { background: config.accent, color: '#ffffff', padding: '6px 12px', borderRadius: '4px', display: 'inline-block' },
      elegant: { borderBottom: `1px solid ${config.accent}40`, color: config.accent },
      corporate: { color: config.accent, borderBottom: `2px solid ${config.accent}` },
      creative: { borderBottom: `2px solid #e9d5ff`, color: config.accent },
      professional: { borderBottom: `1px solid ${config.accent}`, color: config.accent },
      "professional-blue": { borderBottom: `1px solid ${config.accent}`, color: config.accent },
      "professional-minimal": { borderBottom: `1px solid ${config.accent}`, color: config.accent },
    };
    
    const style = headingStyles[templateId] || headingStyles.classic;
    
    return (
      <h2 
        style={{
          fontSize: `${config.sectionSize}px`,
          fontWeight: templateId === 'minimal' ? 400 : 700,
          textTransform: 'uppercase',
          letterSpacing: templateId === 'minimal' ? '4px' : '2px',
          marginTop: '16px',
          marginBottom: '8px',
          ...style,
        }}
      >
        {title}
      </h2>
    );
  };
  
  // Render content based on template
  const renderContent = (parsed) => {
    if (!parsed) return null;
    
    const hasPhoto = config.hasPhoto && photo;
    const hasHeaderBg = config.headerBg;
    
    return (
      <div className="resume-content">
        {/* Header Section */}
        <div 
          style={{
            background: hasHeaderBg && !hasPhoto ? config.headerBg : 'transparent',
            color: hasHeaderBg && !hasPhoto && config.headerColor ? config.headerColor : 'inherit',
            padding: hasHeaderBg && !hasPhoto ? '20px 24px' : '0',
            margin: hasHeaderBg && !hasPhoto ? `-${PAGE_PADDING}px -${PAGE_PADDING}px 16px` : '0 0 16px',
          }}
        >
          {/* Photo header layout */}
          {hasPhoto ? (
            <div 
              style={{
                background: config.headerBg,
                padding: '16px 20px',
                margin: `-${PAGE_PADDING}px -${PAGE_PADDING}px 16px`,
                borderBottom: `3px solid ${config.accent}`,
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
              }}
            >
              <img 
                src={photo} 
                alt="Profile"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `3px solid ${config.accent}`,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: `${config.nameSize}px`, 
                  fontWeight: 700, 
                  color: '#374151',
                  marginBottom: '4px',
                }}>
                  {parsed.name}
                </div>
                {parsed.contact && (
                  <div style={{ 
                    fontSize: `${config.bodySize - 2}px`, 
                    color: '#6b7280',
                  }}>
                    {parsed.contact.replace(/\|/g, ' • ')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Standard header */}
              <div style={{ 
                fontSize: `${config.nameSize}px`, 
                fontWeight: 700, 
                textAlign: config.nameAlign,
                color: hasHeaderBg && config.headerColor ? config.headerColor : 
                       templateId === 'modern' || templateId === 'creative' ? config.accent : '#1a1a2e',
                marginBottom: '4px',
              }}>
                {parsed.name}
              </div>
              {parsed.contact && (
                <div style={{ 
                  fontSize: `${config.bodySize - 2}px`, 
                  textAlign: config.nameAlign,
                  color: hasHeaderBg && config.headerColor ? 'rgba(255,255,255,0.7)' : '#6b7280',
                  marginBottom: '8px',
                }}>
                  {parsed.contact.replace(/\|/g, ' • ')}
                </div>
              )}
              {/* Accent bar */}
              {!hasHeaderBg && (
                <div style={{
                  height: templateId === 'minimal' ? '1px' : templateId === 'bold' ? '4px' : '2px',
                  background: templateId === 'creative' 
                    ? `linear-gradient(90deg, ${config.accent}, #a78bfa)`
                    : config.accent,
                  width: templateId === 'modern' || templateId === 'creative' ? '60px' : '100%',
                  margin: config.nameAlign === 'center' ? '12px auto' : '12px 0',
                  borderRadius: templateId === 'modern' || templateId === 'creative' || templateId === 'bold' ? '2px' : '0',
                }} />
              )}
            </>
          )}
        </div>
        
        {/* Sections */}
        {parsed.sections.map((section, sIdx) => (
          <div 
            key={sIdx} 
            className="resume-section"
            style={{ 
              marginBottom: '14px',
              pageBreakInside: 'avoid',
            }}
          >
            {renderSectionHeading(section.title)}
            <div className="section-content">
              {section.content.map((item, iIdx) => {
                if (item.type === 'bullet') {
                  return (
                    <div 
                      key={iIdx} 
                      style={{ 
                        fontSize: `${config.bodySize}px`,
                        lineHeight: 1.5,
                        paddingLeft: '16px',
                        position: 'relative',
                        marginBottom: '3px',
                        color: '#374151',
                      }}
                    >
                      <span style={{ 
                        position: 'absolute', 
                        left: 0, 
                        color: config.accent 
                      }}>•</span>
                      {item.text}
                    </div>
                  );
                }
                if (item.type === 'job') {
                  // Parse job line: Title | Company, Date Range
                  const dateMatch = item.text.match(/(\w+\s+\d{4}\s*[-–—]\s*(?:Present|\w+\s+\d{4}))/i);
                  let remaining = item.text;
                  let dateStr = '';
                  if (dateMatch) {
                    dateStr = dateMatch[1];
                    remaining = item.text.replace(dateMatch[0], '').trim().replace(/\|$/, '').replace(/,$/, '').trim();
                  }
                  
                  return (
                    <div 
                      key={iIdx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        fontSize: `${config.bodySize}px`,
                        marginTop: '8px',
                        marginBottom: '4px',
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
                    key={iIdx}
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
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const parsed = pages[0]?.parsed || parseResumeContent(content);
  
  return (
    <div 
      ref={containerRef}
      className="a4-renderer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#e5e7eb',
        padding: '20px',
        minHeight: '100%',
      }}
      data-testid="a4-renderer"
    >
      <A4Page pageNumber={1} totalPages={1} templateId={templateId}>
        {renderContent(parsed)}
      </A4Page>
    </div>
  );
});

A4PageRenderer.displayName = 'A4PageRenderer';

export { A4_WIDTH, A4_HEIGHT, PAGE_PADDING, CONTENT_WIDTH, CONTENT_HEIGHT };
export default A4PageRenderer;
