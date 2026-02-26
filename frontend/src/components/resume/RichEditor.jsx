import { useRef, useCallback, useEffect } from "react";
import { Bold, Italic, List, Heading1, Underline, Minus, Undo, Redo } from "lucide-react";

const ToolbarButton = ({ icon: Icon, label, onClick, active }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={label}
    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${active ? "bg-slate-200 text-primary" : "text-slate-600"}`}
    data-testid={`editor-${label.toLowerCase().replace(/\s/g, "-")}`}
  >
    <Icon size={16} />
  </button>
);

const RichEditor = ({ value, onChange, placeholder = "Edit your resume..." }) => {
  const editorRef = useRef(null);
  const isInternalUpdate = useRef(false);

  // Convert plain text to HTML on first load
  useEffect(() => {
    if (editorRef.current && value && !editorRef.current.innerHTML.trim()) {
      if (value.includes("<") && value.includes(">")) {
        editorRef.current.innerHTML = value;
      } else {
        editorRef.current.innerHTML = plainTextToHtml(value);
      }
    }
  }, []);

  // Sync external value changes (only if not from internal edit)
  useEffect(() => {
    if (!isInternalUpdate.current && editorRef.current && value) {
      const currentHtml = editorRef.current.innerHTML;
      if (value.includes("<") && value.includes(">")) {
        if (currentHtml !== value) {
          editorRef.current.innerHTML = value;
        }
      } else if (!currentHtml.trim()) {
        editorRef.current.innerHTML = plainTextToHtml(value);
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  const plainTextToHtml = (text) => {
    const lines = (text || "").split("\n");
    let html = "";
    let inList = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (inList) { html += "</ul>"; inList = false; }
        html += "<br>";
        continue;
      }

      const isHeading = /^[A-Z][A-Z\s\/&,]{3,}$/.test(trimmed) &&
        !trimmed.includes("@") && !trimmed.includes("|") && !trimmed.includes(".com");
      const isBullet = /^[-*\u2022]\s+/.test(trimmed);

      if (isBullet) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += `<li>${trimmed.replace(/^[-*\u2022]\s+/, "")}</li>`;
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (isHeading) {
          html += `<h2>${trimmed}</h2>`;
        } else {
          html += `<p>${trimmed}</p>`;
        }
      }
    }
    if (inList) html += "</ul>";
    return html;
  };

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const formatHeading = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let node = range.startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeType === 1 && node.tagName === "H2") {
        // Already a heading - convert back to paragraph
        const p = document.createElement("p");
        p.innerHTML = node.innerHTML;
        node.replaceWith(p);
        handleInput();
        return;
      }
      node = node.parentNode;
    }
    exec("formatBlock", "h2");
  };

  const insertHR = () => {
    exec("insertHorizontalRule");
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white" data-testid="rich-editor">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-slate-50 flex-wrap">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={Underline} label="Underline" onClick={() => exec("underline")} />
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <ToolbarButton icon={Heading1} label="Heading" onClick={formatHeading} />
        <ToolbarButton icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={Minus} label="Divider" onClick={insertHR} />
        <div className="w-px h-5 bg-slate-300 mx-1" />
        <ToolbarButton icon={Undo} label="Undo" onClick={() => exec("undo")} />
        <ToolbarButton icon={Redo} label="Redo" onClick={() => exec("redo")} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-testid="resume-edit-area"
        data-placeholder={placeholder}
        className="min-h-[500px] p-6 outline-none prose prose-sm max-w-none
          [&_h2]:text-sm [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-[2px] [&_h2]:text-slate-800 [&_h2]:border-b [&_h2]:border-slate-300 [&_h2]:pb-1 [&_h2]:mb-2 [&_h2]:mt-4
          [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:my-0.5
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
          [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-700
          [&_hr]:my-3 [&_hr]:border-slate-300
          [&_b]:font-bold [&_strong]:font-bold
          empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none
        "
        style={{ fontFamily: "'Segoe UI', Calibri, Arial, sans-serif", fontSize: "13px" }}
      />
    </div>
  );
};

export default RichEditor;
