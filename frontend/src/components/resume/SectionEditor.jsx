import { useState, useEffect, useCallback, useRef } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ChevronDown, ChevronUp, Trash2, Plus, Edit3, Check, X, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// Common resume section patterns for auto-detection
const SECTION_PATTERNS = [
  { id: "contact", patterns: [/^(contact|personal)\s*(info|information|details)?$/i], label: "Contact Information" },
  { id: "summary", patterns: [/^(professional\s*)?(summary|profile|objective|about(\s*me)?|overview)$/i], label: "Professional Summary" },
  { id: "experience", patterns: [/^(work\s*)?(experience|history|employment)$/i, /^professional\s*experience$/i], label: "Work Experience" },
  { id: "education", patterns: [/^education(al)?(\s*(background|history))?$/i, /^academic/i], label: "Education" },
  { id: "skills", patterns: [/^(core\s*)?(skills|competencies|expertise|technical\s*skills)$/i], label: "Skills" },
  { id: "certifications", patterns: [/^certifications?(\s*&?\s*licenses?)?$/i, /^licenses?\s*&?\s*certifications?$/i], label: "Certifications" },
  { id: "projects", patterns: [/^(key\s*)?(projects|portfolio)$/i], label: "Projects" },
  { id: "awards", patterns: [/^awards?(\s*&?\s*honors?)?$/i, /^honors?\s*&?\s*awards?$/i, /^achievements?$/i], label: "Awards & Honors" },
  { id: "languages", patterns: [/^languages?$/i], label: "Languages" },
  { id: "interests", patterns: [/^(interests?|hobbies)$/i], label: "Interests" },
  { id: "references", patterns: [/^references?$/i], label: "References" },
  { id: "publications", patterns: [/^publications?$/i], label: "Publications" },
  { id: "volunteer", patterns: [/^volunteer(ing)?(\s*(experience|work))?$/i], label: "Volunteer Experience" },
];

// Detect section type from heading text
const detectSectionType = (heading) => {
  const cleanHeading = heading.replace(/<[^>]*>/g, "").trim();
  for (const section of SECTION_PATTERNS) {
    for (const pattern of section.patterns) {
      if (pattern.test(cleanHeading)) {
        return { type: section.id, label: section.label };
      }
    }
  }
  return { type: "custom", label: cleanHeading };
};

// Parse HTML/text content into sections
const parseContentIntoSections = (content) => {
  if (!content) return [];
  
  const sections = [];
  let currentSection = null;
  
  // Check if content is HTML
  const isHtml = content.includes("<h2>") || content.includes("<p>");
  
  if (isHtml) {
    // Parse HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    
    // First, extract header info (name, contact) before first h2
    let headerContent = "";
    const children = Array.from(tempDiv.childNodes);
    let foundFirstH2 = false;
    
    for (const node of children) {
      if (node.nodeName === "H2") {
        foundFirstH2 = true;
        break;
      }
      if (node.outerHTML) headerContent += node.outerHTML;
      else if (node.textContent?.trim()) headerContent += `<p>${node.textContent}</p>`;
    }
    
    if (headerContent.trim()) {
      sections.push({
        id: `section_header_${Date.now()}`,
        type: "header",
        label: "Header / Contact",
        heading: "",
        content: headerContent,
        isHeader: true,
      });
    }
    
    // Now parse sections by h2 tags
    const h2Elements = tempDiv.querySelectorAll("h2");
    h2Elements.forEach((h2, index) => {
      const headingText = h2.textContent || h2.innerText || "";
      const { type, label } = detectSectionType(headingText);
      
      // Get content between this h2 and next h2 (or end)
      let sectionContent = "";
      let sibling = h2.nextSibling;
      while (sibling && sibling.nodeName !== "H2") {
        if (sibling.outerHTML) sectionContent += sibling.outerHTML;
        else if (sibling.textContent?.trim()) sectionContent += sibling.textContent;
        sibling = sibling.nextSibling;
      }
      
      sections.push({
        id: `section_${type}_${Date.now()}_${index}`,
        type,
        label,
        heading: headingText,
        content: sectionContent.trim(),
        isHeader: false,
      });
    });
  } else {
    // Parse plain text content
    const lines = content.split("\n");
    let headerLines = [];
    let currentHeading = "";
    let currentContent = [];
    let foundFirstSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Check if this is a section heading (ALL CAPS, no special chars like @ or |)
      const isHeading = /^[A-Z][A-Z\s\/&,]{3,}$/.test(trimmed) && 
                       !trimmed.includes("@") && 
                       !trimmed.includes("|") && 
                       !trimmed.includes(".com");
      
      if (isHeading) {
        // Save previous section
        if (currentHeading) {
          const { type, label } = detectSectionType(currentHeading);
          sections.push({
            id: `section_${type}_${Date.now()}_${sections.length}`,
            type,
            label,
            heading: currentHeading,
            content: currentContent.join("\n").trim(),
            isHeader: false,
          });
        } else if (headerLines.length > 0 && !foundFirstSection) {
          // This is header content before first section
          sections.push({
            id: `section_header_${Date.now()}`,
            type: "header",
            label: "Header / Contact",
            heading: "",
            content: headerLines.join("\n").trim(),
            isHeader: true,
          });
        }
        
        foundFirstSection = true;
        currentHeading = trimmed;
        currentContent = [];
      } else if (foundFirstSection) {
        currentContent.push(line);
      } else {
        headerLines.push(line);
      }
    }
    
    // Don't forget the last section
    if (currentHeading) {
      const { type, label } = detectSectionType(currentHeading);
      sections.push({
        id: `section_${type}_${Date.now()}_${sections.length}`,
        type,
        label,
        heading: currentHeading,
        content: currentContent.join("\n").trim(),
        isHeader: false,
      });
    }
  }
  
  return sections;
};

// Convert sections back to HTML
const sectionsToHtml = (sections) => {
  let html = "";
  for (const section of sections) {
    if (section.isHeader) {
      html += section.content;
    } else {
      html += `<h2>${section.heading}</h2>`;
      html += section.content;
    }
  }
  return html;
};

// Sortable Section Item Component
const SortableSection = ({ section, onEdit, onDelete, onContentChange, isEditing, setEditingId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const [localContent, setLocalContent] = useState(section.content);
  const [localHeading, setLocalHeading] = useState(section.heading);
  const contentRef = useRef(null);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    setLocalContent(section.content);
    setLocalHeading(section.heading);
  }, [section.content, section.heading]);

  const handleSave = () => {
    onContentChange(section.id, localHeading, localContent);
    setEditingId(null);
  };

  const handleCancel = () => {
    setLocalContent(section.content);
    setLocalHeading(section.heading);
    setEditingId(null);
  };

  const handleContentInput = () => {
    if (contentRef.current) {
      setLocalContent(contentRef.current.innerHTML);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg mb-3 overflow-hidden ${isDragging ? "shadow-lg ring-2 ring-primary" : "shadow-sm"}`}
      data-testid={`section-${section.type}`}
    >
      {/* Section Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b">
        <button
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-slate-200 rounded cursor-grab active:cursor-grabbing"
          data-testid={`drag-handle-${section.id}`}
        >
          <GripVertical size={16} className="text-slate-400" />
        </button>
        
        <div className="flex-1">
          {isEditing && !section.isHeader ? (
            <input
              type="text"
              value={localHeading}
              onChange={(e) => setLocalHeading(e.target.value)}
              className="w-full px-2 py-1 text-sm font-semibold border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Section heading..."
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {section.label}
              </span>
              {section.heading && !section.isHeader && (
                <span className="text-sm text-slate-600 font-medium">{section.heading}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 hover:bg-green-100 rounded text-green-600"
                title="Save changes"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 hover:bg-red-100 rounded text-red-500"
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditingId(section.id)}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-500"
                title="Edit section"
              >
                <Edit3 size={14} />
              </button>
              {!section.isHeader && (
                <button
                  onClick={() => onDelete(section.id)}
                  className="p-1.5 hover:bg-red-100 rounded text-red-500"
                  title="Delete section"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="p-4">
        {isEditing ? (
          <div
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleContentInput}
            dangerouslySetInnerHTML={{ __html: localContent }}
            className="min-h-[80px] p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary prose prose-sm max-w-none
              [&_p]:my-1 [&_li]:my-0.5 [&_ul]:pl-5 [&_ol]:pl-5"
            style={{ fontSize: "13px" }}
          />
        ) : (
          <div
            className="prose prose-sm max-w-none text-slate-700
              [&_p]:my-1 [&_li]:my-0.5 [&_ul]:pl-5 [&_ul]:list-disc [&_ol]:pl-5 [&_ol]:list-decimal
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1"
            style={{ fontSize: "13px" }}
            dangerouslySetInnerHTML={{ __html: section.content || "<p class='text-slate-400 italic'>Empty section - click edit to add content</p>" }}
          />
        )}
      </div>
    </div>
  );
};

// Main Section Editor Component
const SectionEditor = ({ value, onChange }) => {
  const [sections, setSections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedo = useRef(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Parse content into sections on mount or value change
  useEffect(() => {
    if (value && sections.length === 0) {
      const parsed = parseContentIntoSections(value);
      if (parsed.length > 0) {
        setSections(parsed);
        // Initialize history with first state
        setHistory([JSON.stringify(parsed)]);
        setHistoryIndex(0);
      }
    }
  }, [value]);

  // Add to history when sections change (except during undo/redo)
  const addToHistory = useCallback((newSections) => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }
    const serialized = JSON.stringify(newSections);
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Don't add duplicate states
      if (newHistory[newHistory.length - 1] === serialized) return newHistory;
      // Limit history to 50 states
      const limited = newHistory.length >= 50 ? newHistory.slice(1) : newHistory;
      return [...limited, serialized];
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const newIndex = historyIndex - 1;
      const prevState = JSON.parse(history[newIndex]);
      setSections(prevState);
      setHistoryIndex(newIndex);
      const html = sectionsToHtml(prevState);
      onChange(html);
    }
  }, [historyIndex, history, onChange]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const newIndex = historyIndex + 1;
      const nextState = JSON.parse(history[newIndex]);
      setSections(nextState);
      setHistoryIndex(newIndex);
      const html = sectionsToHtml(nextState);
      onChange(html);
    }
  }, [historyIndex, history, onChange]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Update parent when sections change
  const updateParent = useCallback((newSections) => {
    const html = sectionsToHtml(newSections);
    onChange(html);
    addToHistory(newSections);
  }, [onChange, addToHistory]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        updateParent(newItems);
        return newItems;
      });
    }
  };

  const handleDelete = (id) => {
    setSections((items) => {
      const newItems = items.filter((i) => i.id !== id);
      updateParent(newItems);
      return newItems;
    });
  };

  const handleContentChange = (id, newHeading, newContent) => {
    setSections((items) => {
      const newItems = items.map((item) =>
        item.id === id ? { ...item, heading: newHeading, content: newContent } : item
      );
      updateParent(newItems);
      return newItems;
    });
  };

  const handleAddSection = (type) => {
    const sectionDef = SECTION_PATTERNS.find((s) => s.id === type);
    const newSection = {
      id: `section_${type}_${Date.now()}`,
      type,
      label: sectionDef?.label || "Custom Section",
      heading: sectionDef?.label?.toUpperCase() || "NEW SECTION",
      content: "",
      isHeader: false,
    };
    setSections((items) => {
      const newItems = [...items, newSection];
      updateParent(newItems);
      return newItems;
    });
    setShowAddSection(false);
    setEditingId(newSection.id);
  };

  if (sections.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>No sections detected. The editor will auto-parse your resume content.</p>
        <p className="text-sm mt-2">Upload a resume or paste content to get started.</p>
      </div>
    );
  }

  return (
    <div className="section-editor" data-testid="section-editor">
      {/* Toolbar with Undo/Redo */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex-1">
          <p className="text-sm text-blue-800">
            <strong>Drag & Drop:</strong> Grab the handle (⋮⋮) to reorder sections. 
            <strong className="ml-2">Edit:</strong> Click the pencil icon to edit content.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="h-8 px-2 rounded"
            title="Undo (Ctrl+Z)"
            data-testid="undo-btn"
          >
            <Undo2 size={16} className={historyIndex <= 0 ? "text-slate-300" : "text-slate-600"} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="h-8 px-2 rounded"
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
            data-testid="redo-btn"
          >
            <Redo2 size={16} className={historyIndex >= history.length - 1 ? "text-slate-300" : "text-slate-600"} />
          </Button>
        </div>
      </div>

      {/* Sortable Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              onDelete={handleDelete}
              onContentChange={handleContentChange}
              isEditing={editingId === section.id}
              setEditingId={setEditingId}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Add Section Button */}
      <div className="mt-4">
        {showAddSection ? (
          <div className="p-4 bg-slate-50 border rounded-lg">
            <p className="text-sm font-medium mb-3">Add a new section:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SECTION_PATTERNS.filter((s) => s.id !== "contact").map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleAddSection(section.id)}
                  className="px-3 py-2 text-sm text-left rounded-lg border hover:bg-white hover:border-primary transition-colors"
                >
                  {section.label}
                </button>
              ))}
              <button
                onClick={() => handleAddSection("custom")}
                className="px-3 py-2 text-sm text-left rounded-lg border hover:bg-white hover:border-primary transition-colors"
              >
                Custom Section
              </button>
            </div>
            <button
              onClick={() => setShowAddSection(false)}
              className="mt-3 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={() => setShowAddSection(true)}
            className="w-full border-dashed"
            data-testid="add-section-btn"
          >
            <Plus size={16} className="mr-2" />
            Add Section
          </Button>
        )}
      </div>
    </div>
  );
};

export default SectionEditor;
