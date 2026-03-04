import { User, Mail, Phone, MapPin, Linkedin, Globe, Facebook, Instagram, Twitter } from "lucide-react";

// Skill bar component
const SkillBar = ({ skill, level = 80, accentColor }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
      <span className="font-medium text-slate-700">{skill}</span>
    </div>
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-300" 
        style={{ width: `${level}%`, backgroundColor: accentColor }}
      />
    </div>
  </div>
);

// Hobby tag component
const HobbyTag = ({ hobby, accentColor }) => (
  <span 
    className="inline-block px-3 py-1 text-xs rounded-full mr-2 mb-2"
    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
  >
    {hobby}
  </span>
);

// Parse resume data from text/HTML
const parseResumeData = (text, personalInfo, skills, education, experience, certifications, languages, hobbies, photo) => {
  // If we have structured data from Resume Builder, use it directly
  if (personalInfo?.name) {
    return {
      name: personalInfo.name || "Your Name",
      title: experience?.[0]?.title || "Professional Title",
      summary: typeof text === 'string' && !text.includes('<') ? text.split('\n').find(l => l.length > 50) || "" : "",
      contact: {
        email: personalInfo.email || "",
        phone: personalInfo.phone || "",
        location: personalInfo.location || "",
        linkedin: personalInfo.linkedin || "",
        website: personalInfo.website || "",
      },
      photo: photo || null,
      skills: skills?.technical?.map((s, i) => ({ name: s, level: Math.max(60, 95 - i * 8) })) || [],
      softSkills: skills?.soft || [],
      hobbies: hobbies || [],
      education: education || [],
      certifications: certifications || [],
      languages: languages || [],
      experience: experience || [],
    };
  }
  
  // Parse from HTML/text (Resume Optimizer scenario)
  const htmlContent = text || "";
  
  // Check if content is HTML
  const isHtmlContent = htmlContent.includes('<') && (
    htmlContent.includes('<p>') || 
    htmlContent.includes('<div>') || 
    htmlContent.includes('<h') ||
    htmlContent.includes('<strong>') ||
    htmlContent.includes('<br')
  );
  
  // Helper to strip HTML and get text
  const stripHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };
  
  // Convert HTML to normalized plain text with section markers
  const normalizeContent = (html) => {
    if (!html) return '';
    
    // Replace <br> with newlines
    let normalized = html.replace(/<br\s*\/?>/gi, '\n');
    // Replace </p>, </div>, </h1>, </h2>, </h3> with double newlines
    normalized = normalized.replace(/<\/(p|div|h[1-6])>/gi, '\n\n');
    // Replace <li> with bullet marker
    normalized = normalized.replace(/<li[^>]*>/gi, '\n• ');
    // Strip remaining HTML tags
    const div = document.createElement('div');
    div.innerHTML = normalized;
    return (div.textContent || div.innerText || '').trim();
  };
  
  // Get normalized content for parsing
  const normalizedText = isHtmlContent ? normalizeContent(htmlContent) : htmlContent;
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Section detection patterns
  const sectionPatterns = {
    summary: /^(SUMMARY|PROFESSIONAL\s*SUMMARY|PROFILE|ABOUT|OBJECTIVE|CAREER\s*SUMMARY)/i,
    experience: /^(EXPERIENCE|WORK\s*EXPERIENCE|EMPLOYMENT|PROFESSIONAL\s*EXPERIENCE|CAREER\s*HISTORY)/i,
    education: /^(EDUCATION|ACADEMIC|QUALIFICATIONS|EDUCATIONAL\s*BACKGROUND)/i,
    skills: /^(SKILLS|TECHNICAL\s*SKILLS|CORE\s*COMPETENCIES|EXPERTISE|KEY\s*SKILLS)/i,
    certifications: /^(CERTIFICATIONS|CERTIFICATES|LICENSES|CREDENTIALS)/i,
    languages: /^(LANGUAGES|LANGUAGE\s*SKILLS)/i,
  };
  
  // Find sections
  const findSectionContent = (pattern) => {
    let startIdx = -1;
    let endIdx = lines.length;
    
    // Find start of section
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        startIdx = i;
        break;
      }
    }
    
    if (startIdx === -1) return [];
    
    // Find end of section (next section header)
    for (let i = startIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = Object.values(sectionPatterns).some(p => p.test(line)) ||
        (line.length < 50 && line === line.toUpperCase() && /^[A-Z][A-Z\s\/&,]+$/.test(line));
      if (isHeader) {
        endIdx = i;
        break;
      }
    }
    
    return lines.slice(startIdx + 1, endIdx);
  };
  
  // Extract name (first significant line that's not a section header)
  let name = "Your Name";
  for (const line of lines.slice(0, 5)) {
    const isHeader = Object.values(sectionPatterns).some(p => p.test(line));
    if (!isHeader && line.length > 2 && line.length < 60 && !/[@|•]/.test(line)) {
      name = line;
      break;
    }
  }
  
  // Extract contact info from full text
  const fullText = normalizedText;
  const contact = {
    email: (fullText.match(/[\w.-]+@[\w.-]+\.\w+/) || [])[0] || "",
    phone: (fullText.match(/\+?[\d\s\-()]{10,}/) || [])[0]?.trim() || "",
    location: "",
    linkedin: (fullText.match(/linkedin\.com\/in\/[\w-]+/) || [])[0] || "",
    website: "",
  };
  
  // Extract summary
  const summaryLines = findSectionContent(sectionPatterns.summary);
  const summary = summaryLines.filter(l => !l.startsWith('•')).join(' ').slice(0, 500);
  
  // Extract experience
  const expLines = findSectionContent(sectionPatterns.experience);
  const experienceItems = [];
  let currentExp = null;
  
  for (const line of expLines) {
    // Check if this is a job header line (contains date pattern)
    const hasDate = /\d{4}/.test(line) || /present/i.test(line);
    const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
    
    if (hasDate && !isBullet && line.length > 15) {
      // This looks like a job header
      if (currentExp) experienceItems.push(currentExp);
      
      // Parse the job header
      let title = "";
      let company = "";
      let startDate = "";
      let endDate = "";
      
      // Extract dates
      const dateMatch = line.match(/(\w{3,9}\s+\d{4}|\d{4})\s*[-–—]\s*(Present|\w{3,9}\s+\d{4}|\d{4})/i);
      let remaining = line;
      if (dateMatch) {
        startDate = dateMatch[1];
        endDate = dateMatch[2];
        remaining = line.replace(dateMatch[0], '').trim();
      }
      
      // Parse title and company
      // Pattern: "Title, Company" or "Title | Company" or "Title at Company"
      if (remaining.includes('|')) {
        const parts = remaining.split('|').map(p => p.trim());
        title = parts[0];
        company = parts[1];
      } else if (remaining.includes(',')) {
        const commaIdx = remaining.indexOf(',');
        title = remaining.substring(0, commaIdx).trim();
        company = remaining.substring(commaIdx + 1).trim();
      } else if (/\s+at\s+/i.test(remaining)) {
        const parts = remaining.split(/\s+at\s+/i);
        title = parts[0].trim();
        company = parts[1]?.trim() || "";
      } else {
        title = remaining;
      }
      
      currentExp = {
        title: title || "Professional",
        company: company,
        location: "",
        start_date: startDate,
        end_date: endDate,
        bullets: []
      };
    } else if (currentExp && (isBullet || line.length > 20)) {
      // Add as bullet point
      currentExp.bullets.push(line.replace(/^[-•*]\s*/, ''));
    }
  }
  if (currentExp) experienceItems.push(currentExp);
  
  // Extract education
  const eduLines = findSectionContent(sectionPatterns.education);
  const educationItems = [];
  for (let i = 0; i < eduLines.length; i++) {
    const line = eduLines[i];
    if (line.length > 5 && !line.startsWith('•')) {
      const yearMatch = line.match(/\d{4}/);
      educationItems.push({
        degree: line.replace(/\d{4}.*$/, '').trim(),
        school: eduLines[i + 1]?.startsWith('•') ? "" : eduLines[i + 1] || "",
        year: yearMatch ? yearMatch[0] : "",
        gpa: ""
      });
      if (eduLines[i + 1] && !eduLines[i + 1].startsWith('•')) i++;
    }
  }
  
  // Extract skills
  const skillLines = findSectionContent(sectionPatterns.skills);
  const skillsList = [];
  for (const line of skillLines) {
    // Split by common delimiters
    const items = line.split(/[,•|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
    items.forEach((skill, i) => {
      if (skill && !skillsList.find(s => s.name.toLowerCase() === skill.toLowerCase())) {
        skillsList.push({ name: skill, level: Math.max(60, 95 - skillsList.length * 5) });
      }
    });
  }
  
  // Extract certifications
  const certLines = findSectionContent(sectionPatterns.certifications);
  const certList = certLines.filter(l => l.length > 3 && !l.startsWith('•')).slice(0, 5);
  
  // Extract languages
  const langLines = findSectionContent(sectionPatterns.languages);
  const langList = [];
  for (const line of langLines) {
    if (line.length > 2) {
      const parts = line.split(/[-–:]/);
      langList.push({
        name: parts[0]?.trim() || line,
        level: parts[1]?.trim() || "Professional"
      });
    }
  }
  
  return {
    name,
    title: experienceItems[0]?.title || "Professional",
    summary,
    contact,
    photo: photo || null,
    skills: skillsList.slice(0, 8),
    softSkills: [],
    hobbies: hobbies || [],
    education: educationItems.slice(0, 3),
    certifications: certList,
    languages: langList.slice(0, 4),
    experience: experienceItems.slice(0, 5),
  };
};
      }
    });
    if (currentExp) experienceItems.push(currentExp);
    
    // Extract bullets from list items
    const listItems = expDiv.querySelectorAll('li');
    listItems.forEach(li => {
      const bulletText = li.textContent.trim();
      if (bulletText && experienceItems.length > 0) {
        experienceItems[experienceItems.length - 1].bullets.push(bulletText);
      }
    });
    
    // If no structured experience found, try plain text parsing
    if (experienceItems.length === 0) {
      const plainExp = stripHtml(experienceSection);
      const lines = plainExp.split('\n').filter(l => l.trim());
      let currentPlainExp = null;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) continue;
        
        // Check if this line looks like a job header
        // Pattern 1: "Title | Company | Date" format
        // Pattern 2: "Title, Company Date - Present" format
        // Pattern 3: "Senior AEM Developer, Tata Consultancy Services (TCS) Feb 2021 – Present"
        const isJobHeader = (
          // Contains date pattern (month year or just year)
          (/\d{4}/.test(trimmed) || /present/i.test(trimmed)) &&
          // Contains some separator or company indicator
          (trimmed.includes('|') || trimmed.includes(',') || /\(.*\)/.test(trimmed) || /(at|@)\s/i.test(trimmed)) &&
          // Is not too short (job title + company + date)
          trimmed.length > 20 &&
          // Is not a bullet point
          !trimmed.startsWith('•') && !trimmed.startsWith('-') && !trimmed.startsWith('*')
        );
        
        if (isJobHeader) {
          if (currentPlainExp && currentPlainExp.title) {
            experienceItems.push(currentPlainExp);
          }
          
          // Parse different formats
          let title = "";
          let company = "";
          let startDate = "";
          let endDate = "";
          
          // Extract date first (common pattern at the end)
          const dateMatch = trimmed.match(/(\w{3,9}\s+\d{4}|\d{4})\s*[-–—]\s*(Present|\w{3,9}\s+\d{4}|\d{4})/i);
          let withoutDate = trimmed;
          if (dateMatch) {
            startDate = dateMatch[1];
            endDate = dateMatch[2];
            withoutDate = trimmed.replace(dateMatch[0], '').trim();
          }
          
          // Check for pipe separator
          if (withoutDate.includes('|')) {
            const parts = withoutDate.split('|').map(p => p.trim());
            title = parts[0] || "";
            company = parts[1] || "";
          } 
          // Check for parentheses (company abbreviation pattern)
          else if (/\(.*\)/.test(withoutDate)) {
            const parenMatch = withoutDate.match(/^(.+?),\s*(.+?\(.*?\))/);
            if (parenMatch) {
              title = parenMatch[1].trim();
              company = parenMatch[2].trim();
            } else {
              // Try splitting by comma
              const commaIdx = withoutDate.indexOf(',');
              if (commaIdx > 0) {
                title = withoutDate.substring(0, commaIdx).trim();
                company = withoutDate.substring(commaIdx + 1).trim();
              } else {
                title = withoutDate;
              }
            }
          }
          // Check for comma separator
          else if (withoutDate.includes(',')) {
            const commaIdx = withoutDate.indexOf(',');
            title = withoutDate.substring(0, commaIdx).trim();
            company = withoutDate.substring(commaIdx + 1).trim();
          }
          // Check for " at " pattern
          else if (/\s+at\s+/i.test(withoutDate)) {
            const atParts = withoutDate.split(/\s+at\s+/i);
            title = atParts[0].trim();
            company = atParts[1]?.trim() || "";
          }
          else {
            title = withoutDate;
          }
          
          currentPlainExp = {
            title: title || "Professional",
            company: company,
            location: "",
            start_date: startDate,
            end_date: endDate,
            bullets: []
          };
        } else if (currentPlainExp && trimmed.length > 10) {
          // This is a bullet point - only add if we have a current experience
          currentPlainExp.bullets.push(trimmed.replace(/^[-•*]\s*/, ''));
        }
      }
      if (currentPlainExp && currentPlainExp.title) {
        experienceItems.push(currentPlainExp);
      }
      
      // If still no experience found, create a generic one
      if (experienceItems.length === 0 && plainExp.length > 20) {
        experienceItems.push({
          title: "Professional",
          company: "",
          location: "",
          start_date: "",
          end_date: "",
          bullets: plainExp.split('\n').filter(l => l.trim().length > 10).slice(0, 5)
        });
      }
    }
  }
  
  // Extract education
  const educationSection = findSection(htmlContent, ['Education', 'Academic', 'Qualifications']);
  const educationItems = [];
  if (educationSection) {
    const plainEdu = stripHtml(educationSection);
    const lines = plainEdu.split('\n').filter(l => l.trim());
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i]) {
        educationItems.push({
          degree: lines[i].trim(),
          school: lines[i + 1]?.trim() || "",
          year: (lines[i].match(/\d{4}/) || [])[0] || "",
          gpa: ""
        });
      }
    }
  }
  
  // Extract skills
  const skillsSection = findSection(htmlContent, ['Skills', 'Technical Skills', 'Core Competencies', 'Expertise']);
  const skillsList = [];
  if (skillsSection) {
    const plainSkills = stripHtml(skillsSection);
    // Handle format like "Programming Languages: Python (Expert), JavaScript (Advanced)"
    // or simple comma-separated list
    const lines = plainSkills.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      // Check if line has a category prefix like "Programming Languages:"
      const colonIdx = line.indexOf(':');
      const skillPart = colonIdx > 0 ? line.slice(colonIdx + 1) : line;
      
      // Split by common delimiters
      const skillItems = skillPart.split(/[,•|]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 80);
      skillItems.forEach((skill, i) => {
        // Remove parenthetical skill levels like "(Expert)"
        const cleanSkill = skill.replace(/\s*\([^)]+\)\s*/g, '').trim();
        if (cleanSkill.length > 1 && cleanSkill.length < 50) {
          skillsList.push({ name: cleanSkill, level: Math.max(60, 95 - skillsList.length * 5) });
        }
      });
    }
  }
  
  // Extract certifications
  const certSection = findSection(htmlContent, ['Certifications', 'Certificates', 'Licenses']);
  const certList = [];
  if (certSection) {
    const plainCerts = stripHtml(certSection);
    const certItems = plainCerts.split('\n').map(s => s.trim()).filter(s => s.length > 3);
    certList.push(...certItems.slice(0, 5));
  }
  
  // Extract languages
  const langSection = findSection(htmlContent, ['Languages', 'Language Skills']);
  const langList = [];
  if (langSection) {
    const plainLang = stripHtml(langSection);
    const langItems = plainLang.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 1);
    langItems.forEach(lang => {
      const parts = lang.split(/[-–:]/);
      langList.push({
        name: parts[0]?.trim() || lang,
        level: parts[1]?.trim() || "Professional"
      });
    });
  }
  
  return {
    name,
    title: experienceItems[0]?.title || "Professional",
    summary,
    contact,
    photo: photo || null,
    skills: skillsList.slice(0, 8),
    softSkills: [],
    hobbies: hobbies || [],
    education: educationItems.slice(0, 3),
    certifications: certList,
    languages: langList.slice(0, 4),
    experience: experienceItems.slice(0, 4),
  };
};

// Main Professional Template Component
const ProfessionalTemplate = ({ 
  text, 
  templateId = "professional",
  personalInfo,
  skills,
  education,
  experience,
  certifications,
  languages,
  hobbies = [],
  photo,
  summary,
  fontSize = 12 
}) => {
  // Template color schemes
  const colorSchemes = {
    professional: { accent: "#a78bfa", sidebar: "#f8f7ff", text: "#374151" },        // Lavender
    "professional-blue": { accent: "#3b82f6", sidebar: "#f0f7ff", text: "#374151" }, // Blue
    "professional-minimal": { accent: "#64748b", sidebar: "#f8fafc", text: "#374151" }, // Slate gray
  };
  
  const colors = colorSchemes[templateId] || colorSchemes.professional;
  const isMinimal = templateId === "professional-minimal";
  
  // Parse data
  const data = parseResumeData(text, personalInfo, skills, education, experience, certifications, languages, hobbies, photo);
  
  // Use summary from props if available
  const displaySummary = summary || data.summary;

  return (
    <div 
      className="bg-white max-w-[780px] mx-auto shadow-lg"
      style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif", fontSize: `${fontSize}px` }}
      data-testid="resume-preview"
    >
      <div className="flex min-h-[1000px]">
        {/* Left Sidebar */}
        <div 
          className="w-[35%] p-6"
          style={{ backgroundColor: colors.sidebar }}
        >
          {/* Photo */}
          <div className="flex justify-center mb-6">
            {data.photo ? (
              <img 
                src={data.photo} 
                alt={data.name}
                className="w-28 h-28 rounded-full object-cover border-4"
                style={{ borderColor: colors.accent }}
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-full flex items-center justify-center border-4"
                style={{ borderColor: colors.accent, backgroundColor: `${colors.accent}20` }}
              >
                <User size={40} style={{ color: colors.accent }} />
              </div>
            )}
          </div>
          
          {/* Contact */}
          <div className="mb-6">
            <h3 
              className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
              style={{ color: colors.accent, borderColor: colors.accent }}
            >
              Contact
            </h3>
            <div className="space-y-2 text-xs">
              {data.contact.email && (
                <div className="flex items-center gap-2">
                  <Mail size={14} style={{ color: colors.accent }} />
                  <span className="text-slate-600 break-all">{data.contact.email}</span>
                </div>
              )}
              {data.contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} style={{ color: colors.accent }} />
                  <span className="text-slate-600">{data.contact.phone}</span>
                </div>
              )}
              {data.contact.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color: colors.accent }} />
                  <span className="text-slate-600">{data.contact.location}</span>
                </div>
              )}
              {data.contact.linkedin && (
                <div className="flex items-center gap-2">
                  <Linkedin size={14} style={{ color: colors.accent }} />
                  <span className="text-slate-600 break-all text-[10px]">{data.contact.linkedin}</span>
                </div>
              )}
              {data.contact.website && (
                <div className="flex items-center gap-2">
                  <Globe size={14} style={{ color: colors.accent }} />
                  <span className="text-slate-600 break-all text-[10px]">{data.contact.website}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Skills with bars (not for minimal) */}
          {data.skills.length > 0 && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Skills
              </h3>
              {isMinimal ? (
                <div className="flex flex-wrap gap-1">
                  {data.skills.map((skill, i) => (
                    <span key={i} className="text-xs text-slate-600 bg-white px-2 py-1 rounded">
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                data.skills.slice(0, 6).map((skill, i) => (
                  <SkillBar 
                    key={i} 
                    skill={typeof skill === 'string' ? skill : skill.name} 
                    level={typeof skill === 'string' ? 80 - i * 5 : skill.level}
                    accentColor={colors.accent}
                  />
                ))
              )}
            </div>
          )}
          
          {/* Hobbies */}
          {data.hobbies.length > 0 && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Hobbies
              </h3>
              <div className="flex flex-wrap">
                {data.hobbies.map((hobby, i) => (
                  <HobbyTag key={i} hobby={hobby} accentColor={colors.accent} />
                ))}
              </div>
            </div>
          )}
          
          {/* Education */}
          {data.education.length > 0 && data.education.some(e => e.degree) && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Education
              </h3>
              {data.education.filter(e => e.degree).map((edu, i) => (
                <div key={i} className="mb-3">
                  <div className="font-semibold text-xs text-slate-800">{edu.degree}</div>
                  <div className="text-xs text-slate-600">{edu.school}</div>
                  <div className="text-xs text-slate-500">{edu.year}</div>
                  {edu.gpa && <div className="text-xs text-slate-500">GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          )}
          
          {/* Certifications */}
          {data.certifications.length > 0 && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Certifications
              </h3>
              {data.certifications.map((cert, i) => (
                <div key={i} className="text-xs text-slate-600 mb-1">• {cert}</div>
              ))}
            </div>
          )}
          
          {/* Languages */}
          {data.languages.length > 0 && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Languages
              </h3>
              {data.languages.map((lang, i) => (
                <div key={i} className="text-xs text-slate-600 mb-1">
                  {typeof lang === 'string' ? lang : `${lang.name} - ${lang.level}`}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right Main Content */}
        <div className="w-[65%] p-6 bg-white">
          {/* Header */}
          <div className="mb-6 pb-4 border-b border-slate-200">
            <h1 
              className="text-2xl font-bold mb-1"
              style={{ color: colors.text }}
            >
              {data.name}
            </h1>
            {data.title && (
              <p className="text-sm" style={{ color: colors.accent }}>
                {data.title}
              </p>
            )}
          </div>
          
          {/* Professional Summary */}
          {displaySummary && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Professional Summary
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {displaySummary}
              </p>
            </div>
          )}
          
          {/* Work Experience */}
          {data.experience.length > 0 && data.experience.some(e => e.title) && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-3 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Work Experience
              </h3>
              {data.experience.filter(e => e.title).map((exp, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{exp.title}</div>
                      <div className="text-xs text-slate-600">{exp.company}{exp.location && ` | ${exp.location}`}</div>
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {exp.start_date} - {exp.end_date || "Present"}
                    </div>
                  </div>
                  {exp.bullets && exp.bullets.filter(b => b).length > 0 && (
                    <ul className="list-disc list-outside ml-4 mt-2 space-y-1">
                      {exp.bullets.filter(b => b).map((bullet, j) => (
                        <li key={j} className="text-xs text-slate-600 leading-relaxed">
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Soft Skills (only if we have them and not too many technical skills shown) */}
          {data.softSkills.length > 0 && (
            <div className="mb-6">
              <h3 
                className="text-xs font-bold uppercase tracking-wider mb-2 pb-1 border-b"
                style={{ color: colors.accent, borderColor: colors.accent }}
              >
                Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.softSkills.map((skill, i) => (
                  <span 
                    key={i}
                    className="text-xs px-2 py-1 rounded"
                    style={{ backgroundColor: `${colors.accent}15`, color: colors.text }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTemplate;
