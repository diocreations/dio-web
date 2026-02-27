import { useRef, useCallback, useEffect, useState } from "react";
import {
  Bold, Italic, List, ListOrdered, Heading1, Heading2, Underline, Strikethrough,
  Minus, Undo, Redo, Palette, AlignLeft, AlignCenter, AlignRight,
  Link, Unlink, Indent, Outdent, RemoveFormatting, Type, Highlighter,
} from "lucide-react";

const FONT_COLORS = [
  { label: "Black", value: "#1a1a2e" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Blue", value: "#2563eb" },
  { label: "Navy", value: "#1e3a5f" },
  { label: "Teal", value: "#0d9488" },
  { label: "Red", value: "#dc2626" },
  { label: "Amber", value: "#d97706" },
  { label: "Green", value: "#16a34a" },
  { label: "Purple", value: "#7c3aed" },
];

const FONT_SIZES = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Medium", value: "4" },
  { label: "Large", value: "5" },
  { label: "X-Large", value: "6" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Pink", value: "#fbcfe8" },
  { label: "None", value: "transparent" },
];

const Btn = ({ icon: Icon, label, onClick, active }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={label}
    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${active ? "bg-slate-200 text-primary" : "text-slate-600"}`}
    data-testid={`editor-${label.toLowerCase().replace(/\s/g, "-")}`}
  >
    <Icon size={15} />
  </button>
);

const Sep = () => <div className="w-px h-5 bg-slate-300 mx-0.5" />;

const RichEditor = ({ value, onChange, placeholder = "Edit your resume..." }) => {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const colorRef = useRef(null);
  const fontSizeRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML.trim()) {
      editorRef.current.innerHTML = (value.includes("<") && value.includes(">")) ? value : plainTextToHtml(value);
    }
  }, []);

  useEffect(() => {
    if (!isInternalUpdate.current && editorRef.current && value) {
      const currentHtml = editorRef.current.innerHTML;
      if (value.includes("<") && value.includes(">")) {
        if (currentHtml !== value) editorRef.current.innerHTML = value;
      } else if (!currentHtml.trim()) {
        editorRef.current.innerHTML = plainTextToHtml(value);
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  useEffect(() => {
    const closeAll = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) setShowColorPicker(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(e.target)) setShowFontSize(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target)) setShowHighlight(false);
    };
    document.addEventListener("mousedown", closeAll);
    return () => document.removeEventListener("mousedown", closeAll);
  }, []);

  const plainTextToHtml = (text) => {
    const lines = (text || "").split("\n");
    let html = "";
    let inList = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { if (inList) { html += "</ul>"; inList = false; } html += "<br>"; continue; }
      const isHeading = /^[A-Z][A-Z\s\/&,]{3,}$/.test(trimmed) && !trimmed.includes("@") && !trimmed.includes("|") && !trimmed.includes(".com");
      const isBullet = /^[-*\u2022]\s+/.test(trimmed);
      if (isBullet) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${trimmed.replace(/^[-*\u2022]\s+/, "")}</li>`;
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        html += isHeading ? `<h2>${trimmed}</h2>` : `<p>${trimmed}</p>`;
      }
    }
    if (inList) html += "</ul>";
    return html;
  };

  const handleInput = useCallback(() => {
    if (editorRef.current) { isInternalUpdate.current = true; onChange(editorRef.current.innerHTML); }
  }, [onChange]);

  const exec = (cmd, val = null) => { document.execCommand(cmd, false, val); editorRef.current?.focus(); handleInput(); };

  const formatHeading = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1 && node.tagName === "H2") {
        const p = document.createElement("p"); p.innerHTML = node.innerHTML; node.replaceWith(p); handleInput(); return;
      }
      node = node.parentNode;
    }
    exec("formatBlock", "h2");
  };

  const formatSubheading = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1 && node.tagName === "H3") {
        const p = document.createElement("p"); p.innerHTML = node.innerHTML; node.replaceWith(p); handleInput(); return;
      }
      node = node.parentNode;
    }
    exec("formatBlock", "h3");
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) exec("createLink", url);
  };

  const removeLink = () => exec("unlink");

  const clearFormatting = () => {
    exec("removeFormat");
    exec("formatBlock", "p");
  };

  const Dropdown = ({ refProp, show, children }) => (
    show ? <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-1.5 z-50" ref={refProp}>{children}</div> : null
  );

  return (
    <div className="border rounded-lg overflow-hidden bg-white" data-testid="rich-editor">
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-slate-50 flex-wrap">
        {/* Text Style */}
        <Btn icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <Btn icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <Btn icon={Underline} label="Underline" onClick={() => exec("underline")} />
        <Btn icon={Strikethrough} label="Strikethrough" onClick={() => exec("strikethrough")} />
        <Sep />

        {/* Headings */}
        <Btn icon={Heading1} label="Heading" onClick={formatHeading} />
        <Btn icon={Heading2} label="Subheading" onClick={formatSubheading} />
        <Sep />

        {/* Lists */}
        <Btn icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
        <Btn icon={ListOrdered} label="Numbered list" onClick={() => exec("insertOrderedList")} />
        <Btn icon={Indent} label="Indent" onClick={() => exec("indent")} />
        <Btn icon={Outdent} label="Outdent" onClick={() => exec("outdent")} />
        <Sep />

        {/* Alignment */}
        <Btn icon={AlignLeft} label="Align left" onClick={() => exec("justifyLeft")} />
        <Btn icon={AlignCenter} label="Align center" onClick={() => exec("justifyCenter")} />
        <Btn icon={AlignRight} label="Align right" onClick={() => exec("justifyRight")} />
        <Sep />

        {/* Divider */}
        <Btn icon={Minus} label="Divider" onClick={() => exec("insertHorizontalRule")} />
        <Sep />

        {/* Font Size */}
        <div className="relative" ref={fontSizeRef}>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowFontSize(!showFontSize); }}
            title="Font Size" className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${showFontSize ? "bg-slate-200" : "text-slate-600"}`} data-testid="editor-font-size">
            <Type size={15} />
          </button>
          <Dropdown refProp={fontSizeRef} show={showFontSize}>
            <div className="flex flex-col gap-0.5 min-w-[100px]">
              {FONT_SIZES.map((s) => (
                <button key={s.value} type="button" onMouseDown={(e) => { e.preventDefault(); exec("fontSize", s.value); setShowFontSize(false); }}
                  className="text-left px-2 py-1 text-sm rounded hover:bg-slate-100" data-testid={`font-size-${s.label.toLowerCase()}`}>{s.label}</button>
              ))}
            </div>
          </Dropdown>
        </div>

        {/* Font Color */}
        <div className="relative" ref={colorRef}>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(!showColorPicker); }}
            title="Font Color" className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${showColorPicker ? "bg-slate-200" : "text-slate-600"}`} data-testid="editor-font-color">
            <Palette size={15} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-50 grid grid-cols-3 gap-1 w-[120px]" data-testid="color-picker-dropdown">
              {FONT_COLORS.map((c) => (
                <button key={c.value} type="button" onMouseDown={(e) => { e.preventDefault(); exec("foreColor", c.value); setShowColorPicker(false); }}
                  title={c.label} className="w-8 h-8 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: c.value }}
                  data-testid={`color-${c.label.toLowerCase().replace(/\s/g, "-")}`} />
              ))}
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative" ref={highlightRef}>
          <button type="button" onMouseDown={(e) => { e.preventDefault(); setShowHighlight(!showHighlight); }}
            title="Highlight" className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${showHighlight ? "bg-slate-200" : "text-slate-600"}`} data-testid="editor-highlight">
            <Highlighter size={15} />
          </button>
          {showHighlight && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-2 z-50 flex gap-1" data-testid="highlight-dropdown">
              {HIGHLIGHT_COLORS.map((c) => (
                <button key={c.value} type="button" onMouseDown={(e) => { e.preventDefault(); exec("hiliteColor", c.value); setShowHighlight(false); }}
                  title={c.label} className="w-7 h-7 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.value === "transparent" ? "#f1f5f9" : c.value }} />
              ))}
            </div>
          )}
        </div>
        <Sep />

        {/* Links */}
        <Btn icon={Link} label="Insert link" onClick={insertLink} />
        <Btn icon={Unlink} label="Remove link" onClick={removeLink} />
        <Sep />

        {/* Clear & History */}
        <Btn icon={RemoveFormatting} label="Clear formatting" onClick={clearFormatting} />
        <Sep />
        <Btn icon={Undo} label="Undo" onClick={() => exec("undo")} />
        <Btn icon={Redo} label="Redo" onClick={() => exec("redo")} />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-testid="resume-edit-area"
        data-placeholder={placeholder}
        className="min-h-[500px] p-6 outline-none prose prose-sm max-w-none
          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[2px] [&_h2]:text-slate-800 [&_h2]:border-b [&_h2]:border-slate-300 [&_h2]:pb-1 [&_h2]:mb-2 [&_h2]:mt-4
          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3]:mb-1 [&_h3]:mt-3
          [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:my-0.5
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
          [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-700
          [&_hr]:my-3 [&_hr]:border-slate-300
          [&_b]:font-bold [&_strong]:font-bold
          [&_a]:text-blue-600 [&_a]:underline
          [&_s]:line-through [&_strike]:line-through
          [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600
          empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none
        "
        style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif", fontSize: "13px" }}
      />
    </div>
  );
};

export default RichEditor;
