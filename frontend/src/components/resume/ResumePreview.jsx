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

const ResumePreview = ({ text, templateId, editing, onTextChange, fontSize = 13 }) => {
  if (!text) return null;
  const tpl = templateId || "classic";
  const { nameLines, sections } = parseSections(text);
  const fs = `${fontSize}px`;
  const nameFs = `${fontSize + 11}px`;
  const headerFs = `${Math.max(9, fontSize - 2)}px`;

  const renderBullet = (line, key, bulletClass, textClass) => {
    if (line.startsWith("- ") || line.startsWith("* ") || line.startsWith("\u2022 ")) {
      const content = line.replace(/^[-*\u2022]\s+/, "");
      return <div key={key} className={`flex gap-2 ${textClass} pl-1 py-[2px]`} style={{ fontSize: fs }}><span className={`${bulletClass} mt-[5px] flex-shrink-0 w-1.5 h-1.5 rounded-full`} /><span>{content}</span></div>;
    }
    return <div key={key} className={textClass} style={{ fontSize: fs }}>{line}</div>;
  };

  if (editing) {
    return (
      <div className="w-full" data-testid="resume-editor">
        <textarea
          className="w-full min-h-[500px] p-6 font-mono text-sm leading-relaxed border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-y"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          data-testid="resume-edit-textarea"
        />
      </div>
    );
  }

  if (tpl === "classic") {
    return (
      <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto font-serif" data-testid="resume-preview" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {nameLines[0] && <div className="text-center font-bold tracking-wide text-slate-900 mb-1" style={{ fontSize: nameFs }}>{nameLines[0]}</div>}
        {nameLines.slice(1).map((l, i) => <div key={i} className="text-center text-slate-500 tracking-wide" style={{ fontSize: `${fontSize - 2}px` }}>{l}</div>)}
        {nameLines.length > 0 && <div className="border-b-2 border-slate-800 mt-4 mb-2" />}
        {sections.map((s, si) => (
          <div key={si} className="mb-4">
            <div className="font-bold tracking-[3px] uppercase text-slate-800 border-b border-slate-300 pb-1 mb-2" style={{ fontSize: headerFs }}>{s.title}</div>
            {s.lines.map((l, li) => renderBullet(l, li, "bg-slate-600", "leading-relaxed text-slate-700"))}
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
            {s.lines.map((l, li) => renderBullet(l, li, "bg-blue-500", "leading-relaxed text-slate-700"))}
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
              {s.lines.map((l, li) => renderBullet(l, li, "bg-amber-500", "leading-relaxed text-slate-700"))}
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
            {s.lines.map((l, li) => renderBullet(l, li, "bg-slate-300", "leading-[1.8] text-slate-600 font-light"))}
          </div>
        ))}
      </div>
    );
  }

  // BOLD
  return (
    <div className="bg-white p-8 md:p-12 max-w-[780px] mx-auto" data-testid="resume-preview" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {nameLines[0] && <div className="font-black text-slate-900 mb-1" style={{ fontSize: `${fontSize + 18}px` }}>{nameLines[0]}</div>}
      {nameLines.slice(1).map((l, i) => <div key={i} className="text-slate-500 font-medium" style={{ fontSize: `${fontSize - 1}px` }}>{l}</div>)}
      {nameLines.length > 0 && <div className="h-1.5 bg-red-600 mt-3 mb-5 w-full rounded-full" />}
      {sections.map((s, si) => (
        <div key={si} className="mb-5">
          <div className="bg-red-600 text-white font-bold tracking-[2px] uppercase px-3 py-1.5 rounded mb-2 inline-block" style={{ fontSize: headerFs }}>{s.title}</div>
          <div className="mt-1">
            {s.lines.map((l, li) => renderBullet(l, li, "bg-red-500", "leading-relaxed text-slate-700"))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResumePreview;
