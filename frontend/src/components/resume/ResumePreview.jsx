import RichEditor from "./RichEditor";

function parseSections(text) {
  const lines = (text || "").split("\n");
  const sections = [];
  let currentSection = null;
  let nameLines = [];
  let foundFirstSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isHeader = /^[A-Z][A-Z\s\/&,]{3,}$/.test(trimmed) && !trimmed.includes("@") && !trimmed.includes("|") && !trimmed.includes(".com") && !trimmed.match(/\+?\d[\d\s\-()]{6,}/);
    if (isHeader) {
      foundFirstSection = true;
      if (currentSection) sections.push(currentSection);
      currentSection = { title: trimmed, lines: [] };
    } else if (!foundFirstSection) {
      nameLines.push(trimmed);
    } else if (currentSection) {
      currentSection.lines.push(trimmed);
    }
  }
  if (currentSection) sections.push(currentSection);
  return { nameLines, sections };
}

function isHtml(text) {
  return text && (text.includes("<h2>") || text.includes("<p>") || text.includes("<li>") || text.includes("<strong>") || text.includes("<b>"));
}

  const renderHtmlContent = (html, tplId, fSize) => {
    const fs = `${fSize}px`;
    const fonts = {
      classic: "Georgia, 'Times New Roman', serif",
      modern: "'Segoe UI', Calibri, Arial, sans-serif",
      executive: "'Segoe UI', Calibri, sans-serif",
      minimal: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      bold: "'Inter', 'Segoe UI', sans-serif",
      elegant: "Georgia, 'Palatino Linotype', serif",
      corporate: "'Segoe UI', Calibri, Arial, sans-serif",
      creative: "'Inter', 'Segoe UI', sans-serif",
    };
    const accents = { classic: "#1a1a2e", modern: "#2563eb", executive: "#f59e0b", minimal: "#6b7280", bold: "#dc2626", elegant: "#0d9488", corporate: "#1e3a5f", creative: "#7c3aed" };
    const accent = accents[tplId] || accents.classic;
    const font = fonts[tplId] || fonts.classic;

  // Build styled HTML with template-specific classes
  let styledHtml = html
    // Bold headings with accent color and border
    .replace(/<h2>/g, `<h2 style="font-weight:700;text-transform:uppercase;letter-spacing:2px;font-size:${Math.max(10, fSize - 2)}px;color:${accent};border-bottom:2px solid ${accent}30;padding-bottom:4px;margin:16px 0 8px;">`)
    // Make paragraphs properly sized
    .replace(/<p>/g, `<p style="font-size:${fs};line-height:1.6;color:#374151;margin:2px 0;">`)
    // Style list items
    .replace(/<ul>/g, `<ul style="padding-left:20px;margin:4px 0;list-style-type:disc;">`)
    .replace(/<li>/g, `<li style="font-size:${fs};line-height:1.6;color:#374151;margin-bottom:2px;">`)
    // Horizontal rules
    .replace(/<hr>/g, `<hr style="border:none;border-top:1px solid ${accent}30;margin:12px 0;">`)
    .replace(/<hr\/>/g, `<hr style="border:none;border-top:1px solid ${accent}30;margin:12px 0;">`);

  // Executive template: dark header
  if (tplId === "executive") {
    // Find first elements as name/contact and wrap in dark header
    const parser = new DOMParser();
    const doc = parser.parseFromString(styledHtml, "text/html");
    const firstH2 = doc.querySelector("h2");
    const nameEls = [];
    let el = doc.body.firstChild;
    while (el && el !== firstH2) {
      nameEls.push(el);
      el = el.nextSibling;
    }
    if (nameEls.length > 0) {
      const headerDiv = document.createElement("div");
      headerDiv.style.cssText = `background:#1e293b;color:white;padding:20px 32px;margin:-32px -32px 16px;`;
      nameEls.forEach((n) => {
        const clone = n.cloneNode(true);
        if (clone.style) {
          clone.style.color = clone === nameEls[0] ? "white" : "#94a3b8";
        }
        headerDiv.appendChild(clone);
      });
      nameEls.forEach((n) => n.remove());
      doc.body.insertBefore(headerDiv, doc.body.firstChild);
      styledHtml = doc.body.innerHTML;
    }
  }

  return (
    <div
      className="bg-white p-8 md:p-8 max-w-[780px] mx-auto"
      style={{ fontFamily: font }}
      data-testid="resume-preview"
      dangerouslySetInnerHTML={{ __html: styledHtml }}
    />
  );
}

const ResumePreview = ({ text, templateId, editing, onTextChange, fontSize = 13 }) => {
  if (!text) return null;
  const tpl = templateId || "classic";

  // Rich text editing mode
  if (editing) {
    return (
      <div className="w-full" data-testid="resume-editor">
        <RichEditor value={text} onChange={onTextChange} placeholder="Edit your resume..." />
      </div>
    );
  }

  // If content is HTML (from rich editor), render with styling
  if (isHtml(text)) {
    return renderHtmlContent(text, tpl, fontSize);
  }

  // Plain text fallback rendering
  const { nameLines, sections } = parseSections(text);
  const fs = `${fontSize}px`;
  const nameFs = `${fontSize + 11}px`;
  const headerFs = `${Math.max(9, fontSize - 2)}px`;

  const renderBullet = (line, key, bulletClass, textClass) => {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("\u2022 ")) {
      const content = line.replace(/^[-*\u2022]\s+/, "");
      return <li key={key} className={`${textClass} list-disc ml-5`} style={{ fontSize: fs }}>{content}</li>;
    }
    // Check for date patterns in lines (job titles)
    const hasDate = /\d{4}\s*[-\u2013]\s*(present|\d{4})/i.test(line);
    if (hasDate) {
      return <div key={key} className={`${textClass} font-semibold`} style={{ fontSize: fs }}>{line}</div>;
    }
    return <div key={key} className={textClass} style={{ fontSize: fs }}>{line}</div>;
  };

  if (tpl === "classic") {
    return (
      <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto font-serif" data-testid="resume-preview" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {nameLines[0] && <div className="text-center font-bold tracking-wide text-slate-900 mb-1" style={{ fontSize: nameFs }}>{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-center text-slate-500 tracking-wide" style={{ fontSize: `${fontSize - 2}px` }}>{l}</div>)}
        {nameLines.length > 0 && <div className="border-b-2 border-slate-800 mt-4 mb-2" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-4">
            <div className="font-bold tracking-[3px] uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2" style={{ fontSize: headerFs }}>{s.title}</div>
            <ul className="list-none">{s.lines.map((l, li) => renderBullet(l, li, "bg-slate-600", "leading-relaxed text-slate-700"))}</ul>
          </div>
        ))}
      </div>
    );
  }

  if (tpl === "modern") {
    return (
      <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif" }}>
        {nameLines[0] && <div className="font-extrabold text-blue-600 mb-0.5" style={{ fontSize: `${fontSize + 14}px` }}>{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-slate-500" style={{ fontSize: `${fontSize - 1}px` }}>{l}</div>)}
        {nameLines.length > 0 && <div className="h-1 bg-blue-600 mt-3 mb-4 w-20 rounded-full" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-3 bg-blue-600 rounded-full" />
              <div className="font-bold tracking-[2px] uppercase text-blue-600" style={{ fontSize: headerFs }}>{s.title}</div>
            </div>
            <ul className="list-none">{s.lines.map((l, li) => renderBullet(l, li, "bg-blue-500", "leading-relaxed text-slate-700"))}</ul>
          </div>
        ))}
      </div>
    );
  }

  if (tpl === "executive") {
    return (
      <div className="max-w-[780px] mx-auto overflow-hidden" data-testid="resume-preview" style={{ fontFamily: "'Segoe UI', Calibri, sans-serif" }}>
        <div className="bg-slate-800 text-white px-8 md:px-12 py-8">
          {nameLines[0] && <div className="font-bold tracking-wide" style={{ fontSize: `${fontSize + 14}px` }}>{nameLines[0]}</div>}
          {nameLines.slice(1).map((l, i) => <div key={i} className="text-slate-300 mt-1" style={{ fontSize: `${fontSize - 1}px` }}>{l}</div>)}
        </div>
        <div className="bg-white px-8 md:px-12 py-6">
          {sections.map((s, si) => (
            <div key={si} className="mb-5">
              <div className="font-bold tracking-[3px] uppercase text-amber-600 border-b-2 border-amber-500/30 pb-1 mb-2" style={{ fontSize: headerFs }}>{s.title}</div>
              <ul className="list-none">{s.lines.map((l, li) => renderBullet(l, li, "bg-amber-500", "leading-relaxed text-slate-700"))}</ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tpl === "minimal") {
    return (
      <div className="bg-white p-8 md:p-14 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {nameLines[0] && <div className="font-light tracking-[4px] uppercase text-slate-900 mb-1" style={{ fontSize: `${fontSize + 5}px` }}>{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-slate-400 tracking-wide" style={{ fontSize: `${fontSize - 2}px` }}>{l}</div>)}
        {nameLines.length > 0 && <div className="border-b border-slate-200 mt-6 mb-6" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-6">
            <div className="font-medium tracking-[4px] uppercase text-slate-400 mb-3" style={{ fontSize: `${fontSize - 3}px` }}>{s.title}</div>
            <ul className="list-none">{s.lines.map((l, li) => renderBullet(l, li, "bg-slate-300", "leading-[1.8] text-slate-600 font-light"))}</ul>
          </div>
        ))}
      </div>
    );
  }

  // BOLD template
  return (
    <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {nameLines[0] && <div className="font-black text-slate-900 mb-1" style={{ fontSize: `${fontSize + 18}px` }}>{nameLines[0]}</div>}
      {nameLines.slice(1).map((l, i) => <div key={i} className="text-slate-500 font-medium" style={{ fontSize: `${fontSize - 1}px` }}>{l}</div>)}
      {nameLines.length > 0 && <div className="h-1.5 bg-red-600 mt-3 mb-5 w-full rounded-full" />}
      {sections.map((s, si) => (
        <div key={si} className="mb-5">
          <div className="bg-red-600 text-white font-bold tracking-[2px] uppercase px-3 py-1.5 rounded mb-2 inline-block" style={{ fontSize: headerFs }}>{s.title}</div>
          <div className="mt-1">
            <ul className="list-none">{s.lines.map((l, li) => renderBullet(l, li, "bg-red-500", "leading-relaxed text-slate-700"))}</ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResumePreview;
