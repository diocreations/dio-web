import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Briefcase, GraduationCap, Award, Code, Languages, FolderOpen,
  Sparkles, Download, FileText, Plus, Trash2, ChevronRight, ChevronLeft,
  Save, Loader2, Eye, Wand2, Camera, Heart, Layout as LayoutIcon,
} from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import ResumePreview from "@/components/resume/ResumePreview";
import { VISUAL_TEMPLATES } from "@/components/resume/constants";

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Builder steps
const STEPS = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Summary", icon: FileText },
  { id: 3, title: "Experience", icon: Briefcase },
  { id: 4, title: "Education", icon: GraduationCap },
  { id: 5, title: "Skills", icon: Code },
  { id: 6, title: "More", icon: Award },
  { id: 7, title: "Preview", icon: Eye },
];

const ResumeBuilderPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [pubUser, setPubUser] = useState(null);
  
  // Form state
  const [personalInfo, setPersonalInfo] = useState({
    name: "", email: "", phone: "", location: "", linkedin: "", website: ""
  });
  
  const [summary, setSummary] = useState("");
  
  const [experience, setExperience] = useState([
    { id: 1, title: "", company: "", location: "", start_date: "", end_date: "", bullets: [""] }
  ]);
  
  const [education, setEducation] = useState([
    { id: 1, degree: "", school: "", location: "", year: "", gpa: "" }
  ]);
  
  const [skills, setSkills] = useState({ technical: [], soft: [] });
  const [skillInput, setSkillInput] = useState({ technical: "", soft: "" });
  
  const [certifications, setCertifications] = useState([]);
  const [certInput, setCertInput] = useState("");
  
  const [languages, setLanguages] = useState([]);
  const [langInput, setLangInput] = useState({ name: "", level: "Professional" });
  
  const [projects, setProjects] = useState([]);
  
  // NEW: Photo and Hobbies for Professional templates
  const [photo, setPhoto] = useState(null);
  const [hobbies, setHobbies] = useState([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Check for logged in user
  useEffect(() => {
    const stored = localStorage.getItem("pub_user");
    if (stored) setPubUser(JSON.parse(stored));
  }, []);

  // Auto-save draft
  const saveDraft = async () => {
    if (!pubUser) {
      toast.info("Sign in to save your progress");
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/builder/draft`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("pub_token")}`
        },
        body: JSON.stringify({
          draft_id: draftId,
          title: personalInfo.name ? `${personalInfo.name}'s Resume` : "Untitled Resume",
          personal_info: personalInfo,
          sections: { summary, experience, education, skills, certifications, languages, projects }
        })
      });
      const data = await res.json();
      if (res.ok) {
        setDraftId(data.draft_id);
        toast.success("Draft saved!");
      }
    } catch (e) {
      toast.error("Failed to save draft");
    }
  };

  // AI Generate Summary
  const generateSummary = async () => {
    if (!personalInfo.name) {
      toast.error("Please enter your name first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/generate/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: experience[0]?.title || "Professional",
          years_experience: "",
          skills: skills.technical,
          achievements: ""
        })
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        toast.success("Summary generated!");
      }
    } catch (e) {
      toast.error("Failed to generate summary");
    }
    setGenerating(false);
  };

  // AI Generate Experience Bullets
  const generateBullets = async (expIndex) => {
    const exp = experience[expIndex];
    if (!exp.title) {
      toast.error("Please enter job title first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/generate/experience`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: exp.title,
          company: exp.company,
          responsibilities: exp.bullets.filter(b => b).join(", "),
          achievements: ""
        })
      });
      const data = await res.json();
      if (data.bullets) {
        const newExp = [...experience];
        newExp[expIndex].bullets = data.bullets;
        setExperience(newExp);
        toast.success("Bullet points generated!");
      }
    } catch (e) {
      toast.error("Failed to generate bullets");
    }
    setGenerating(false);
  };

  // AI Generate Skills
  const generateSkills = async () => {
    const jobTitle = experience[0]?.title;
    if (!jobTitle) {
      toast.error("Please add work experience first");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/generate/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          industry: "",
          current_skills: [...skills.technical, ...skills.soft]
        })
      });
      const data = await res.json();
      if (data.technical || data.soft) {
        setSkills({
          technical: [...new Set([...skills.technical, ...(data.technical || [])])],
          soft: [...new Set([...skills.soft, ...(data.soft || [])])]
        });
        toast.success("Skills suggested!");
      }
    } catch (e) {
      toast.error("Failed to generate skills");
    }
    setGenerating(false);
  };

  // AI Generate Full Resume
  const generateFullResume = async () => {
    if (!experience[0]?.title) {
      toast.error("Please enter at least your job title");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/generate/full`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: experience[0].title,
          years_experience: "",
          industry: "",
          skills: skills.technical,
          education: education[0]?.degree
        })
      });
      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        if (data.experience) setExperience(data.experience.map((e, i) => ({ ...e, id: i + 1 })));
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education.map((e, i) => ({ ...e, id: i + 1 })));
        toast.success("Resume content generated!");
        setStep(7); // Go to preview
      }
    } catch (e) {
      toast.error("Failed to generate resume");
    }
    setGenerating(false);
  };

  // Export as DOCX
  const exportDocx = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/builder/export/docx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personal_info: personalInfo,
          sections: { summary, experience, education, skills, certifications, languages, projects }
        })
      });
      const data = await res.json();
      if (data.docx_base64) {
        // Download file
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${data.docx_base64}`;
        link.download = data.filename || "resume.docx";
        link.click();
        toast.success("DOCX downloaded!");
      }
    } catch (e) {
      toast.error("Failed to export DOCX");
    }
    setLoading(false);
  };

  // Export as PDF
  const exportPdf = async () => {
    setLoading(true);
    toast.info("Generating PDF...", { duration: 2000 });
    
    const filename = personalInfo.name ? `${personalInfo.name.replace(/\s+/g, "_").toLowerCase()}_resume` : "resume";
    
    // Build HTML content for PDF
    let html = `
      <div style="font-family: Georgia, serif; padding: 40px; max-width: 700px; margin: 0 auto; color: #333; line-height: 1.5;">
        <div style="text-align: center; border-bottom: 2px solid #1a1a2e; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="font-size: 24pt; font-weight: bold; color: #1a1a2e; margin: 0;">${personalInfo.name || "Your Name"}</h1>
          <p style="font-size: 10pt; color: #666; margin: 8px 0 0;">
            ${[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}
          </p>
          ${personalInfo.linkedin ? `<p style="font-size: 9pt; color: #2563eb; margin: 4px 0 0;">${personalInfo.linkedin}</p>` : ""}
        </div>
    `;
    
    // Summary
    if (summary) {
      html += `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Professional Summary</h2>
          <p style="font-size: 10pt; margin: 0;">${summary}</p>
        </div>
      `;
    }
    
    // Experience
    if (experience.some(e => e.title)) {
      html += `<div style="margin-bottom: 16px;"><h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Work Experience</h2>`;
      for (const exp of experience.filter(e => e.title)) {
        html += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: bold; font-size: 10pt;">${exp.title}</span>
              <span style="font-size: 9pt; color: #666; font-style: italic;">${exp.start_date} - ${exp.end_date}</span>
            </div>
            <p style="font-size: 9pt; color: #666; margin: 2px 0 4px;">${exp.company}${exp.location ? ` | ${exp.location}` : ""}</p>
            <ul style="margin: 0; padding-left: 18px; font-size: 10pt;">
              ${exp.bullets.filter(b => b).map(b => `<li style="margin-bottom: 2px;">${b}</li>`).join("")}
            </ul>
          </div>
        `;
      }
      html += `</div>`;
    }
    
    // Education
    if (education.some(e => e.degree)) {
      html += `<div style="margin-bottom: 16px;"><h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Education</h2>`;
      for (const edu of education.filter(e => e.degree)) {
        html += `
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <span style="font-weight: bold; font-size: 10pt;">${edu.degree}</span>
              <span style="font-size: 9pt; color: #666;">${edu.year}</span>
            </div>
            <p style="font-size: 9pt; color: #666; margin: 2px 0 0;">${edu.school}${edu.location ? ` | ${edu.location}` : ""}</p>
          </div>
        `;
      }
      html += `</div>`;
    }
    
    // Skills
    if (skills.technical.length > 0 || skills.soft.length > 0) {
      html += `<div style="margin-bottom: 16px;"><h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Skills</h2>`;
      if (skills.technical.length > 0) {
        html += `<p style="font-size: 10pt; margin: 0 0 4px;"><strong>Technical:</strong> ${skills.technical.join(", ")}</p>`;
      }
      if (skills.soft.length > 0) {
        html += `<p style="font-size: 10pt; margin: 0;"><strong>Soft Skills:</strong> ${skills.soft.join(", ")}</p>`;
      }
      html += `</div>`;
    }
    
    // Certifications
    if (certifications.length > 0) {
      html += `<div style="margin-bottom: 16px;"><h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Certifications</h2>`;
      html += `<ul style="margin: 0; padding-left: 18px; font-size: 10pt;">${certifications.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    }
    
    // Languages
    if (languages.length > 0) {
      html += `<div style="margin-bottom: 16px;"><h2 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #1a1a2e; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px;">Languages</h2>`;
      html += `<p style="font-size: 10pt; margin: 0;">${languages.map(l => `${l.name} (${l.level})`).join(", ")}</p></div>`;
    }
    
    html += `</div>`;
    
    // Create container and generate PDF
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    
    try {
      const opt = {
        margin: [0.5, 0.6, 0.5, 0.6],
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };
      await html2pdf().set(opt).from(container.querySelector("div")).save();
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed");
    } finally {
      document.body.removeChild(container);
      setLoading(false);
    }
  };

  // Add/Remove helpers
  const addExperience = () => setExperience([...experience, { id: Date.now(), title: "", company: "", location: "", start_date: "", end_date: "", bullets: [""] }]);
  const removeExperience = (id) => setExperience(experience.filter(e => e.id !== id));
  
  const addEducation = () => setEducation([...education, { id: Date.now(), degree: "", school: "", location: "", year: "" }]);
  const removeEducation = (id) => setEducation(education.filter(e => e.id !== id));
  
  const addBullet = (expIndex) => {
    const newExp = [...experience];
    newExp[expIndex].bullets.push("");
    setExperience(newExp);
  };
  const removeBullet = (expIndex, bulletIndex) => {
    const newExp = [...experience];
    newExp[expIndex].bullets.splice(bulletIndex, 1);
    setExperience(newExp);
  };
  const updateBullet = (expIndex, bulletIndex, value) => {
    const newExp = [...experience];
    newExp[expIndex].bullets[bulletIndex] = value;
    setExperience(newExp);
  };

  const addSkill = (type) => {
    const value = skillInput[type].trim();
    if (value && !skills[type].includes(value)) {
      setSkills({ ...skills, [type]: [...skills[type], value] });
      setSkillInput({ ...skillInput, [type]: "" });
    }
  };
  const removeSkill = (type, skill) => setSkills({ ...skills, [type]: skills[type].filter(s => s !== skill) });

  const addCertification = () => {
    if (certInput.trim()) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput("");
    }
  };

  const addLanguage = () => {
    if (langInput.name.trim()) {
      setLanguages([...languages, { ...langInput }]);
      setLangInput({ name: "", level: "Professional" });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Personal Information</h2>
            <p className="text-muted-foreground text-sm">Start with your basic contact details</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={personalInfo.name} onChange={e => setPersonalInfo({...personalInfo, name: e.target.value})} placeholder="John Doe" data-testid="input-name" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={personalInfo.email} onChange={e => setPersonalInfo({...personalInfo, email: e.target.value})} placeholder="john@email.com" data-testid="input-email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={personalInfo.phone} onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})} placeholder="+1 234 567 8900" data-testid="input-phone" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={personalInfo.location} onChange={e => setPersonalInfo({...personalInfo, location: e.target.value})} placeholder="New York, NY" data-testid="input-location" />
              </div>
              <div>
                <Label>LinkedIn URL</Label>
                <Input value={personalInfo.linkedin} onChange={e => setPersonalInfo({...personalInfo, linkedin: e.target.value})} placeholder="linkedin.com/in/johndoe" data-testid="input-linkedin" />
              </div>
              <div>
                <Label>Website/Portfolio</Label>
                <Input value={personalInfo.website} onChange={e => setPersonalInfo({...personalInfo, website: e.target.value})} placeholder="johndoe.com" data-testid="input-website" />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Professional Summary</h2>
                <p className="text-muted-foreground text-sm">A brief overview of your career highlights</p>
              </div>
              <Button variant="outline" size="sm" onClick={generateSummary} disabled={generating} className="gap-2" data-testid="generate-summary-btn">
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                AI Generate
              </Button>
            </div>
            <Textarea 
              value={summary} 
              onChange={e => setSummary(e.target.value)} 
              placeholder="Results-driven professional with X years of experience in..." 
              rows={5}
              data-testid="textarea-summary"
            />
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Work Experience</h2>
                <p className="text-muted-foreground text-sm">Add your work history, starting with the most recent</p>
              </div>
              <Button variant="outline" size="sm" onClick={addExperience} className="gap-2" data-testid="add-experience-btn">
                <Plus size={16} /> Add Position
              </Button>
            </div>
            
            {experience.map((exp, expIndex) => (
              <Card key={exp.id} className="relative">
                {experience.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 hover:text-red-600" onClick={() => removeExperience(exp.id)}>
                    <Trash2 size={16} />
                  </Button>
                )}
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title *</Label>
                      <Input value={exp.title} onChange={e => { const n = [...experience]; n[expIndex].title = e.target.value; setExperience(n); }} placeholder="Software Engineer" />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input value={exp.company} onChange={e => { const n = [...experience]; n[expIndex].company = e.target.value; setExperience(n); }} placeholder="Tech Corp" />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input value={exp.location} onChange={e => { const n = [...experience]; n[expIndex].location = e.target.value; setExperience(n); }} placeholder="San Francisco, CA" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Start Date</Label>
                        <Input value={exp.start_date} onChange={e => { const n = [...experience]; n[expIndex].start_date = e.target.value; setExperience(n); }} placeholder="Jan 2020" />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input value={exp.end_date} onChange={e => { const n = [...experience]; n[expIndex].end_date = e.target.value; setExperience(n); }} placeholder="Present" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Key Achievements / Responsibilities</Label>
                      <Button variant="ghost" size="sm" onClick={() => generateBullets(expIndex)} disabled={generating} className="gap-1 text-xs">
                        <Wand2 size={14} /> AI Generate
                      </Button>
                    </div>
                    {exp.bullets.map((bullet, bIndex) => (
                      <div key={bIndex} className="flex gap-2 mb-2">
                        <Input value={bullet} onChange={e => updateBullet(expIndex, bIndex, e.target.value)} placeholder="Led a team of 5 engineers to deliver..." />
                        {exp.bullets.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeBullet(expIndex, bIndex)} className="text-red-500"><Trash2 size={14} /></Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => addBullet(expIndex)} className="text-xs"><Plus size={14} /> Add Bullet</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Education</h2>
                <p className="text-muted-foreground text-sm">Add your educational background</p>
              </div>
              <Button variant="outline" size="sm" onClick={addEducation} className="gap-2" data-testid="add-education-btn">
                <Plus size={16} /> Add Education
              </Button>
            </div>
            
            {education.map((edu, eduIndex) => (
              <Card key={edu.id} className="relative">
                {education.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500" onClick={() => removeEducation(edu.id)}>
                    <Trash2 size={16} />
                  </Button>
                )}
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Degree / Certificate</Label>
                      <Input value={edu.degree} onChange={e => { const n = [...education]; n[eduIndex].degree = e.target.value; setEducation(n); }} placeholder="Bachelor of Science in Computer Science" />
                    </div>
                    <div>
                      <Label>School / University</Label>
                      <Input value={edu.school} onChange={e => { const n = [...education]; n[eduIndex].school = e.target.value; setEducation(n); }} placeholder="Stanford University" />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input value={edu.location} onChange={e => { const n = [...education]; n[eduIndex].location = e.target.value; setEducation(n); }} placeholder="Stanford, CA" />
                    </div>
                    <div>
                      <Label>Year</Label>
                      <Input value={edu.year} onChange={e => { const n = [...education]; n[eduIndex].year = e.target.value; setEducation(n); }} placeholder="2020" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Skills</h2>
                <p className="text-muted-foreground text-sm">Add your technical and soft skills</p>
              </div>
              <Button variant="outline" size="sm" onClick={generateSkills} disabled={generating} className="gap-2" data-testid="generate-skills-btn">
                {generating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                AI Suggest
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Technical Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={skillInput.technical} onChange={e => setSkillInput({...skillInput, technical: e.target.value})} placeholder="e.g., Python, React, AWS" onKeyPress={e => e.key === 'Enter' && addSkill('technical')} />
                    <Button onClick={() => addSkill('technical')} size="icon"><Plus size={16} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.technical.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill('technical', skill)} className="hover:text-red-500"><Trash2 size={12} /></button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Soft Skills</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input value={skillInput.soft} onChange={e => setSkillInput({...skillInput, soft: e.target.value})} placeholder="e.g., Leadership, Communication" onKeyPress={e => e.key === 'Enter' && addSkill('soft')} />
                    <Button onClick={() => addSkill('soft')} size="icon"><Plus size={16} /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.soft.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1">
                        {skill}
                        <button onClick={() => removeSkill('soft', skill)} className="hover:text-red-500"><Trash2 size={12} /></button>
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Additional Information</h2>
            <p className="text-muted-foreground text-sm">Add certifications, languages, and other details</p>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Award size={18} /> Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={certInput} onChange={e => setCertInput(e.target.value)} placeholder="e.g., AWS Solutions Architect" onKeyPress={e => e.key === 'Enter' && addCertification()} />
                  <Button onClick={addCertification} size="icon"><Plus size={16} /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-1">
                      {cert}
                      <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="hover:text-red-500"><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Languages size={18} /> Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input value={langInput.name} onChange={e => setLangInput({...langInput, name: e.target.value})} placeholder="Language" className="flex-1" />
                  <select value={langInput.level} onChange={e => setLangInput({...langInput, level: e.target.value})} className="px-3 py-2 border rounded-md text-sm">
                    <option>Native</option>
                    <option>Fluent</option>
                    <option>Professional</option>
                    <option>Intermediate</option>
                    <option>Basic</option>
                  </select>
                  <Button onClick={addLanguage} size="icon"><Plus size={16} /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                      {lang.name} ({lang.level})
                      <button onClick={() => setLanguages(languages.filter((_, j) => j !== i))} className="hover:text-red-500"><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold">Preview & Export</h2>
                <p className="text-muted-foreground text-sm">Review your resume and download</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={exportDocx} disabled={loading} className="gap-2 w-full sm:w-auto" data-testid="export-docx-btn">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
                  Export DOCX
                </Button>
                <Button onClick={exportPdf} disabled={loading} className="gap-2 w-full sm:w-auto" data-testid="export-pdf-btn">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                  Export PDF
                </Button>
              </div>
            </div>
            
            {/* Preview */}
            <Card className="shadow-lg">
              <CardContent className="p-8 bg-white">
                <div className="max-w-2xl mx-auto space-y-6 text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  {/* Header */}
                  <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold text-slate-800">{personalInfo.name || "Your Name"}</h1>
                    <p className="text-slate-600 text-xs mt-1">
                      {[personalInfo.email, personalInfo.phone, personalInfo.location].filter(Boolean).join(" | ")}
                    </p>
                    {personalInfo.linkedin && <p className="text-xs text-blue-600">{personalInfo.linkedin}</p>}
                  </div>
                  
                  {/* Summary */}
                  {summary && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Professional Summary</h2>
                      <p className="text-slate-700 leading-relaxed">{summary}</p>
                    </div>
                  )}
                  
                  {/* Experience */}
                  {experience.some(e => e.title) && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Work Experience</h2>
                      {experience.filter(e => e.title).map((exp, i) => (
                        <div key={i} className="mb-4">
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold">{exp.title}</span>
                            <span className="text-xs text-slate-500">{exp.start_date} - {exp.end_date}</span>
                          </div>
                          <p className="text-slate-600 text-xs">{exp.company} {exp.location && `| ${exp.location}`}</p>
                          <ul className="list-disc list-inside mt-1 text-slate-700">
                            {exp.bullets.filter(b => b).map((b, j) => <li key={j}>{b}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Education */}
                  {education.some(e => e.degree) && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Education</h2>
                      {education.filter(e => e.degree).map((edu, i) => (
                        <div key={i} className="mb-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-semibold">{edu.degree}</span>
                            <span className="text-xs text-slate-500">{edu.year}</span>
                          </div>
                          <p className="text-slate-600 text-xs">{edu.school} {edu.location && `| ${edu.location}`}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Skills */}
                  {(skills.technical.length > 0 || skills.soft.length > 0) && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Skills</h2>
                      {skills.technical.length > 0 && <p><strong>Technical:</strong> {skills.technical.join(", ")}</p>}
                      {skills.soft.length > 0 && <p><strong>Soft Skills:</strong> {skills.soft.join(", ")}</p>}
                    </div>
                  )}
                  
                  {/* Certifications */}
                  {certifications.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Certifications</h2>
                      <ul className="list-disc list-inside">
                        {certifications.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  {/* Languages */}
                  {languages.length > 0 && (
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b mb-2">Languages</h2>
                      <p>{languages.map(l => `${l.name} (${l.level})`).join(", ")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Resume Builder - Create Professional Resume | Diocreations</title>
        <meta name="description" content="Build your professional resume with AI assistance. Create, edit, and export in PDF or DOCX format." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-white">
        {/* Hero */}
        <section className="py-12 lg:py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">AI-Powered</span>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-4">
              Resume Builder
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Create a professional resume in minutes. Fill in your details, let AI enhance your content, and export in PDF or DOCX.
            </p>
            
            {/* Quick Generate Button */}
            {step === 1 && experience[0]?.title && (
              <Button onClick={generateFullResume} disabled={generating} className="gap-2 mb-8" size="lg" data-testid="generate-full-btn">
                {generating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                AI Generate Full Resume
              </Button>
            )}
          </div>
        </section>
        
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[80px] ${isActive ? "bg-primary text-white" : isCompleted ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  data-testid={`step-${s.id}`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium whitespace-nowrap">{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <Card className="shadow-lg">
            <CardContent className="p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
              
              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="gap-2"
                  data-testid="prev-step-btn"
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                
                <div className="flex gap-2">
                  {pubUser && (
                    <Button variant="ghost" onClick={saveDraft} className="gap-2" data-testid="save-draft-btn">
                      <Save size={16} /> Save Draft
                    </Button>
                  )}
                  
                  {step < 7 ? (
                    <Button onClick={() => setStep(Math.min(7, step + 1))} className="gap-2" data-testid="next-step-btn">
                      Next <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={exportDocx} disabled={loading} className="gap-2" data-testid="final-export-btn">
                      {loading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                      Download Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Login prompt for guests */}
          {!pubUser && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              <a href="/login" className="text-primary hover:underline">Sign in</a> to save your progress and access your drafts anytime.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ResumeBuilderPage;
