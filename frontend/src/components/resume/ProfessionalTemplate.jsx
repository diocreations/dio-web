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
  // If we have structured data, use it directly
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
  
  // Fallback: parse from text
  const lines = (text || "").replace(/<[^>]*>/g, '').split('\n').filter(l => l.trim());
  let name = lines[0] || "Your Name";
  let contact = {};
  
  // Try to extract contact info
  for (const line of lines.slice(0, 5)) {
    if (line.includes('@')) contact.email = line.match(/[\w.-]+@[\w.-]+/)?.[0] || "";
    if (line.match(/\+?\d[\d\s\-()]{8,}/)) contact.phone = line.match(/\+?\d[\d\s\-()]{8,}/)?.[0] || "";
    if (line.toLowerCase().includes('linkedin')) contact.linkedin = line;
  }
  
  return {
    name,
    title: "Professional",
    summary: "",
    contact,
    photo: photo || null,
    skills: [],
    softSkills: [],
    hobbies: [],
    education: [],
    certifications: [],
    languages: [],
    experience: [],
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
