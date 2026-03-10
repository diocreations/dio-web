import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Trash2, Copy, ArrowRight, Sparkles, FileText, User, Mail, Phone, MapPin,
  Linkedin, Briefcase, GraduationCap, Award, Languages, Target, ChevronDown, ChevronUp,
  Download, Eye, Wand2, CheckCircle, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// A4 dimensions
const A4_WIDTH = 794;

// ATS-safe section names (standardized)
const ATS_SECTIONS = {
  summary: "PROFESSIONAL SUMMARY",
  experience: "WORK EXPERIENCE", 
  education: "EDUCATION",
  skills: "SKILLS",
  certifications: "CERTIFICATIONS",
  languages: "LANGUAGES",
};

// Empty experience entry template
const emptyExperience = {
  title: "",
  company: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
};

// Empty education entry template
const emptyEducation = {
  degree: "",
  school: "",
  location: "",
  year: "",
  gpa: "",
};

const ATSResumeBuilder = ({
  originalResume,
  analysis,
  onClose,
  onSave,
  onDownload,
}) => {
  // Structured form data
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: "",
    skills: [],
    experience: [{ ...emptyExperience }],
    education: [{ ...emptyEducation }],
    certifications: [],
    languages: [],
  });
  
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");
  const [newLang, setNewLang] = useState("");
  const [activeSection, setActiveSection] = useState("header");
  const [previewMode, setPreviewMode] = useState(false);
  const [expandedExp, setExpandedExp] = useState([0]);
  const [expandedEdu, setExpandedEdu] = useState([0]);

  // Parse original resume to pre-fill form
  useEffect(() => {
    if (originalResume) {
      parseOriginalResume(originalResume);
    }
  }, [originalResume]);

  // Parse original resume text to extract structured data
  const parseOriginalResume = (text) => {
    if (!text) return;
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    
    // Try to extract header info
    let name = "", email = "", phone = "", linkedin = "", location = "";
    
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      
      // Email
      const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailMatch) email = emailMatch[0];
      
      // Phone
      const phoneMatch = line.match(/\+?[\d\s\-()]{10,}/);
      if (phoneMatch) phone = phoneMatch[0].trim();
      
      // LinkedIn
      if (line.toLowerCase().includes('linkedin')) {
        const linkedinMatch = line.match(/linkedin\.com\/in\/[\w-]+/i);
        if (linkedinMatch) linkedin = linkedinMatch[0];
      }
      
      // Name (first non-contact, non-header line)
      if (!name && line.length > 2 && line.length < 60 && 
          !line.includes('@') && !/\d{4}/.test(line) &&
          !/^(SUMMARY|EXPERIENCE|EDUCATION|SKILLS)/i.test(line)) {
        const words = line.split(/\s+/);
        if (words.length >= 1 && words.length <= 5) {
          name = line;
        }
      }
    }
    
    setFormData(prev => ({
      ...prev,
      name: name || prev.name,
      email: email || prev.email,
      phone: phone || prev.phone,
      linkedin: linkedin || prev.linkedin,
    }));
  };

  // Add recommended keyword to skills
  const addKeyword = (keyword) => {
    if (!formData.skills.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, keyword],
      }));
      toast.success(`Added "${keyword}" to skills`);
    }
  };

  // Copy text from original resume
  const copyFromOriginal = (section) => {
    navigator.clipboard.writeText(originalResume || "");
    toast.success("Original resume copied to clipboard");
  };

  // Update header field
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add skill
  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  // Remove skill
  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  // Experience management
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { ...emptyExperience }],
    }));
    setExpandedExp(prev => [...prev, formData.experience.length]);
  };

  const updateExperience = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      ),
    }));
  };

  const removeExperience = (index) => {
    if (formData.experience.length > 1) {
      setFormData(prev => ({
        ...prev,
        experience: prev.experience.filter((_, i) => i !== index),
      }));
    }
  };

  const addExpBullet = (expIndex) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? { ...exp, bullets: [...exp.bullets, ""] } : exp
      ),
    }));
  };

  const updateExpBullet = (expIndex, bulletIndex, value) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex ? {
          ...exp,
          bullets: exp.bullets.map((b, j) => j === bulletIndex ? value : b)
        } : exp
      ),
    }));
  };

  const removeExpBullet = (expIndex, bulletIndex) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.map((exp, i) => 
        i === expIndex && exp.bullets.length > 1 ? {
          ...exp,
          bullets: exp.bullets.filter((_, j) => j !== bulletIndex)
        } : exp
      ),
    }));
  };

  // Education management
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { ...emptyEducation }],
    }));
    setExpandedEdu(prev => [...prev, formData.education.length]);
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      ),
    }));
  };

  const removeEducation = (index) => {
    if (formData.education.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: prev.education.filter((_, i) => i !== index),
      }));
    }
  };

  // Certifications
  const addCertification = () => {
    if (newCert.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCert.trim()],
      }));
      setNewCert("");
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  // Languages
  const addLanguage = () => {
    if (newLang.trim()) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLang.trim()],
      }));
      setNewLang("");
    }
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  // Generate ATS-optimized text from form data
  const generateATSText = () => {
    const lines = [];
    
    // Header
    if (formData.name) lines.push(formData.name);
    if (formData.title) lines.push(formData.title);
    
    const contactParts = [];
    if (formData.email) contactParts.push(formData.email);
    if (formData.phone) contactParts.push(formData.phone);
    if (formData.location) contactParts.push(formData.location);
    if (formData.linkedin) contactParts.push(formData.linkedin);
    if (contactParts.length) lines.push(contactParts.join(" | "));
    
    lines.push("");
    
    // Summary
    if (formData.summary) {
      lines.push(ATS_SECTIONS.summary);
      lines.push(formData.summary);
      lines.push("");
    }
    
    // Skills
    if (formData.skills.length) {
      lines.push(ATS_SECTIONS.skills);
      lines.push(formData.skills.join(", "));
      lines.push("");
    }
    
    // Experience
    const validExp = formData.experience.filter(e => e.title || e.company);
    if (validExp.length) {
      lines.push(ATS_SECTIONS.experience);
      validExp.forEach(exp => {
        const dateStr = exp.startDate ? `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}` : "";
        lines.push(`${exp.title}${exp.company ? ` | ${exp.company}` : ""}${dateStr ? ` | ${dateStr}` : ""}`);
        if (exp.location) lines.push(exp.location);
        exp.bullets.filter(b => b.trim()).forEach(b => {
          lines.push(`• ${b}`);
        });
        lines.push("");
      });
    }
    
    // Education
    const validEdu = formData.education.filter(e => e.degree || e.school);
    if (validEdu.length) {
      lines.push(ATS_SECTIONS.education);
      validEdu.forEach(edu => {
        lines.push(`${edu.degree}${edu.school ? ` | ${edu.school}` : ""}${edu.year ? ` | ${edu.year}` : ""}`);
        if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
      });
      lines.push("");
    }
    
    // Certifications
    if (formData.certifications.length) {
      lines.push(ATS_SECTIONS.certifications);
      formData.certifications.forEach(cert => lines.push(`• ${cert}`));
      lines.push("");
    }
    
    // Languages
    if (formData.languages.length) {
      lines.push(ATS_SECTIONS.languages);
      lines.push(formData.languages.join(", "));
    }
    
    return lines.join("\n");
  };

  // Handle save
  const handleSave = () => {
    const atsText = generateATSText();
    if (onSave) onSave(atsText, formData);
    toast.success("ATS Resume saved!");
  };

  // Toggle section expansion
  const toggleExpanded = (type, index) => {
    if (type === "exp") {
      setExpandedExp(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setExpandedEdu(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    }
  };

  // Extract missing keywords from analysis
  const missingKeywords = analysis?.missing_keywords || [];

  return (
    <div className="flex h-full gap-4" data-testid="ats-resume-builder">
      {/* Left Panel - Original Resume */}
      <div className="w-1/2 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText size={20} className="text-slate-500" />
                Original Resume
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyFromOriginal}>
                <Copy size={14} className="mr-1" /> Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-3">
            <ScrollArea className="h-full">
              <div className="bg-slate-50 p-4 rounded-lg text-sm font-mono whitespace-pre-wrap text-slate-700">
                {originalResume || "No original resume content available"}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Keyword Suggestions */}
        {missingKeywords.length > 0 && (
          <Card className="mt-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target size={16} className="text-amber-500" />
                Recommended Keywords
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {missingKeywords.slice(0, 15).map((kw, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors text-xs"
                    onClick={() => addKeyword(kw)}
                  >
                    <Plus size={10} className="mr-1" /> {kw}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">Click to add keyword to skills</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel - ATS Resume Builder */}
      <div className="w-1/2 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2 flex-shrink-0 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 size={20} className="text-primary" />
                ATS Resume Builder
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye size={14} className="mr-1" /> {previewMode ? "Edit" : "Preview"}
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <CheckCircle size={14} className="mr-1" /> Save Resume
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            {previewMode ? (
              /* Preview Mode */
              <ScrollArea className="h-full p-4">
                <div 
                  className="bg-white shadow-lg mx-auto p-8 text-sm"
                  style={{ width: `${A4_WIDTH}px`, maxWidth: '100%', fontFamily: "'Segoe UI', Calibri, sans-serif" }}
                >
                  {/* Header */}
                  <div className="text-center mb-4 pb-3 border-b-2 border-slate-800">
                    <div className="text-2xl font-bold text-slate-800">{formData.name || "Your Name"}</div>
                    {formData.title && <div className="text-base text-slate-600 mt-1">{formData.title}</div>}
                    <div className="text-xs text-slate-500 mt-2">
                      {[formData.email, formData.phone, formData.location, formData.linkedin]
                        .filter(Boolean).join(" • ")}
                    </div>
                  </div>
                  
                  {/* Summary */}
                  {formData.summary && (
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.summary}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{formData.summary}</p>
                    </div>
                  )}
                  
                  {/* Skills */}
                  {formData.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.skills}
                      </div>
                      <p className="text-xs text-slate-700">{formData.skills.join(", ")}</p>
                    </div>
                  )}
                  
                  {/* Experience */}
                  {formData.experience.some(e => e.title || e.company) && (
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.experience}
                      </div>
                      {formData.experience.filter(e => e.title || e.company).map((exp, i) => (
                        <div key={i} className="mb-3">
                          <div className="flex justify-between items-baseline">
                            <div className="font-semibold text-xs text-slate-800">{exp.title}</div>
                            <div className="text-xs text-slate-500">
                              {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                            </div>
                          </div>
                          <div className="text-xs text-slate-600">{exp.company}{exp.location && ` | ${exp.location}`}</div>
                          {exp.bullets.filter(b => b.trim()).length > 0 && (
                            <ul className="list-disc list-outside ml-4 mt-1">
                              {exp.bullets.filter(b => b.trim()).map((b, j) => (
                                <li key={j} className="text-xs text-slate-700">{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Education */}
                  {formData.education.some(e => e.degree || e.school) && (
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.education}
                      </div>
                      {formData.education.filter(e => e.degree || e.school).map((edu, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <div className="font-semibold text-xs text-slate-800">{edu.degree}</div>
                            <div className="text-xs text-slate-500">{edu.year}</div>
                          </div>
                          <div className="text-xs text-slate-600">{edu.school}</div>
                          {edu.gpa && <div className="text-xs text-slate-500">GPA: {edu.gpa}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Certifications */}
                  {formData.certifications.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.certifications}
                      </div>
                      <ul className="list-disc list-outside ml-4">
                        {formData.certifications.map((cert, i) => (
                          <li key={i} className="text-xs text-slate-700">{cert}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Languages */}
                  {formData.languages.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1 mb-2">
                        {ATS_SECTIONS.languages}
                      </div>
                      <p className="text-xs text-slate-700">{formData.languages.join(", ")}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              /* Edit Mode */
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Header Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={16} className="text-primary" />
                      <span className="font-medium text-sm">Contact Information</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Full Name *</Label>
                        <Input 
                          value={formData.name}
                          onChange={(e) => updateField("name", e.target.value)}
                          placeholder="John Doe"
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Job Title</Label>
                        <Input 
                          value={formData.title}
                          onChange={(e) => updateField("title", e.target.value)}
                          placeholder="Software Engineer"
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Email *</Label>
                        <Input 
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="john@example.com"
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone</Label>
                        <Input 
                          value={formData.phone}
                          onChange={(e) => updateField("phone", e.target.value)}
                          placeholder="+1 234 567 8900"
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Location</Label>
                        <Input 
                          value={formData.location}
                          onChange={(e) => updateField("location", e.target.value)}
                          placeholder="New York, NY"
                          className="text-sm h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">LinkedIn</Label>
                        <Input 
                          value={formData.linkedin}
                          onChange={(e) => updateField("linkedin", e.target.value)}
                          placeholder="linkedin.com/in/johndoe"
                          className="text-sm h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={16} className="text-primary" />
                      <span className="font-medium text-sm">Professional Summary</span>
                    </div>
                    <Textarea 
                      value={formData.summary}
                      onChange={(e) => updateField("summary", e.target.value)}
                      placeholder="Write 2-3 sentences highlighting your experience, key skills, and career objectives..."
                      className="text-sm min-h-[100px]"
                    />
                  </div>

                  {/* Skills Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-primary" />
                      <span className="font-medium text-sm">Skills</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a skill..."
                        className="text-sm h-9"
                        onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      />
                      <Button size="sm" onClick={addSkill}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                          <button onClick={() => removeSkill(i)} className="ml-1 hover:text-red-500">
                            <Trash2 size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-primary" />
                        <span className="font-medium text-sm">Work Experience</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={addExperience}>
                        <Plus size={14} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.experience.map((exp, i) => (
                        <div key={i} className="bg-white rounded-lg border p-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleExpanded("exp", i)}
                          >
                            <span className="text-sm font-medium">
                              {exp.title || exp.company || `Experience ${i + 1}`}
                            </span>
                            <div className="flex items-center gap-2">
                              {formData.experience.length > 1 && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeExperience(i); }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {expandedExp.includes(i) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          {expandedExp.includes(i) && (
                            <div className="mt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Job Title</Label>
                                  <Input 
                                    value={exp.title}
                                    onChange={(e) => updateExperience(i, "title", e.target.value)}
                                    placeholder="Software Engineer"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Company</Label>
                                  <Input 
                                    value={exp.company}
                                    onChange={(e) => updateExperience(i, "company", e.target.value)}
                                    placeholder="Tech Corp"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Start Date</Label>
                                  <Input 
                                    value={exp.startDate}
                                    onChange={(e) => updateExperience(i, "startDate", e.target.value)}
                                    placeholder="Jan 2020"
                                    className="text-sm h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">End Date</Label>
                                  <Input 
                                    value={exp.endDate}
                                    onChange={(e) => updateExperience(i, "endDate", e.target.value)}
                                    placeholder="Present"
                                    disabled={exp.current}
                                    className="text-sm h-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label className="text-xs">Location</Label>
                                <Input 
                                  value={exp.location}
                                  onChange={(e) => updateExperience(i, "location", e.target.value)}
                                  placeholder="New York, NY"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Key Achievements (Bullet Points)</Label>
                                {exp.bullets.map((bullet, j) => (
                                  <div key={j} className="flex gap-1 mt-1">
                                    <span className="text-slate-400 mt-2">•</span>
                                    <Input 
                                      value={bullet}
                                      onChange={(e) => updateExpBullet(i, j, e.target.value)}
                                      placeholder="Describe an achievement..."
                                      className="text-sm h-8 flex-1"
                                    />
                                    {exp.bullets.length > 1 && (
                                      <button 
                                        onClick={() => removeExpBullet(i, j)}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="mt-1 text-xs"
                                  onClick={() => addExpBullet(i)}
                                >
                                  <Plus size={12} className="mr-1" /> Add Bullet
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GraduationCap size={16} className="text-primary" />
                        <span className="font-medium text-sm">Education</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={addEducation}>
                        <Plus size={14} className="mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {formData.education.map((edu, i) => (
                        <div key={i} className="bg-white rounded-lg border p-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => toggleExpanded("edu", i)}
                          >
                            <span className="text-sm font-medium">
                              {edu.degree || edu.school || `Education ${i + 1}`}
                            </span>
                            <div className="flex items-center gap-2">
                              {formData.education.length > 1 && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); removeEducation(i); }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {expandedEdu.includes(i) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          {expandedEdu.includes(i) && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Degree</Label>
                                <Input 
                                  value={edu.degree}
                                  onChange={(e) => updateEducation(i, "degree", e.target.value)}
                                  placeholder="Bachelor of Science"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">School</Label>
                                <Input 
                                  value={edu.school}
                                  onChange={(e) => updateEducation(i, "school", e.target.value)}
                                  placeholder="University of..."
                                  className="text-sm h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Year</Label>
                                <Input 
                                  value={edu.year}
                                  onChange={(e) => updateEducation(i, "year", e.target.value)}
                                  placeholder="2020"
                                  className="text-sm h-8"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">GPA (Optional)</Label>
                                <Input 
                                  value={edu.gpa}
                                  onChange={(e) => updateEducation(i, "gpa", e.target.value)}
                                  placeholder="3.8"
                                  className="text-sm h-8"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={16} className="text-primary" />
                      <span className="font-medium text-sm">Certifications</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        value={newCert}
                        onChange={(e) => setNewCert(e.target.value)}
                        placeholder="AWS Certified Solutions Architect"
                        className="text-sm h-9"
                        onKeyPress={(e) => e.key === "Enter" && addCertification()}
                      />
                      <Button size="sm" onClick={addCertification}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {formData.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center justify-between bg-white rounded px-2 py-1">
                          <span className="text-sm">{cert}</span>
                          <button onClick={() => removeCertification(i)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Languages size={16} className="text-primary" />
                      <span className="font-medium text-sm">Languages</span>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <Input 
                        value={newLang}
                        onChange={(e) => setNewLang(e.target.value)}
                        placeholder="English (Native)"
                        className="text-sm h-9"
                        onKeyPress={(e) => e.key === "Enter" && addLanguage()}
                      />
                      <Button size="sm" onClick={addLanguage}>
                        <Plus size={14} />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.languages.map((lang, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {lang}
                          <button onClick={() => removeLanguage(i)} className="ml-1 hover:text-red-500">
                            <Trash2 size={10} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ATSResumeBuilder;
