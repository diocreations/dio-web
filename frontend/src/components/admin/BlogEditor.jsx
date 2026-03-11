import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3,
  Link, Image, Code, Quote, Minus, Undo, Redo, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";

const IMAGE_SIZES = [
  { label: "Thumbnail (150x150)", value: "150", width: 150, height: 150 },
  { label: "Small (300x200)", value: "300", width: 300, height: 200 },
  { label: "Medium (600x400)", value: "600", width: 600, height: 400 },
  { label: "Large (900x600)", value: "900", width: 900, height: 600 },
  { label: "Full Width (100%)", value: "full", width: "100%", height: "auto" },
  { label: "Banner (1200x400)", value: "banner", width: 1200, height: 400 },
  { label: "Square (400x400)", value: "square", width: 400, height: 400 },
];

const ToolBtn = ({ icon: Icon, label, onClick, active }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={label}
    className={`p-1.5 rounded hover:bg-slate-200 transition-colors ${active ? "bg-slate-200 text-primary" : "text-slate-600"}`}
  >
    <Icon size={16} />
  </button>
);

const Sep = () => <div className="w-px h-5 bg-slate-300 mx-1" />;

const BlogEditor = ({ value, onChange, placeholder = "Write your blog post content..." }) => {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageData, setImageData] = useState({
    url: "", alt: "", size: "600", link: "", openInNewTab: true,
  });
  const [linkData, setLinkData] = useState({ url: "", text: "", openInNewTab: true });

  // Initialize editor content only once or when value changes externally (e.g., loading a post)
  useEffect(() => {
    if (editorRef.current) {
      // Only set content if editor is empty or this is initial load
      if (!isInitialized.current || editorRef.current.innerHTML === "") {
        editorRef.current.innerHTML = value || "";
        isInitialized.current = true;
      }
    }
  }, [value]);

  // Reset initialization flag when value is cleared (new post)
  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      isInitialized.current = false;
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  }, [value]);

  const exec = useCallback((cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const insertImage = () => {
    if (!imageData.url) return;
    const size = IMAGE_SIZES.find(s => s.value === imageData.size) || IMAGE_SIZES[2];
    const width = size.width === "100%" ? "100%" : `${size.width}px`;
    const height = size.height === "auto" ? "auto" : `${size.height}px`;
    
    let imgHtml = `<img src="${imageData.url}" alt="${imageData.alt || ''}" style="width:${width};height:${height};object-fit:cover;border-radius:8px;margin:16px 0;display:block;" />`;
    
    if (imageData.link) {
      const target = imageData.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      imgHtml = `<a href="${imageData.link}"${target}>${imgHtml}</a>`;
    }
    
    exec("insertHTML", imgHtml);
    setShowImageDialog(false);
    setImageData({ url: "", alt: "", size: "600", link: "", openInNewTab: true });
  };

  const insertLink = () => {
    if (!linkData.url) return;
    const target = linkData.openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const text = linkData.text || linkData.url;
    const linkHtml = `<a href="${linkData.url}"${target} style="color:#7c3aed;text-decoration:underline;">${text}</a>`;
    exec("insertHTML", linkHtml);
    setShowLinkDialog(false);
    setLinkData({ url: "", text: "", openInNewTab: true });
  };

  const formatBlock = (tag) => exec("formatBlock", tag);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-slate-50 flex-wrap">
        <ToolBtn icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolBtn icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <ToolBtn icon={Underline} label="Underline" onClick={() => exec("underline")} />
        <Sep />
        <ToolBtn icon={Heading1} label="Heading 1" onClick={() => formatBlock("h1")} />
        <ToolBtn icon={Heading2} label="Heading 2" onClick={() => formatBlock("h2")} />
        <ToolBtn icon={Heading3} label="Heading 3" onClick={() => formatBlock("h3")} />
        <Sep />
        <ToolBtn icon={List} label="Bullet List" onClick={() => exec("insertUnorderedList")} />
        <ToolBtn icon={ListOrdered} label="Numbered List" onClick={() => exec("insertOrderedList")} />
        <Sep />
        <ToolBtn icon={AlignLeft} label="Align Left" onClick={() => exec("justifyLeft")} />
        <ToolBtn icon={AlignCenter} label="Align Center" onClick={() => exec("justifyCenter")} />
        <ToolBtn icon={AlignRight} label="Align Right" onClick={() => exec("justifyRight")} />
        <Sep />
        <ToolBtn icon={Quote} label="Quote" onClick={() => formatBlock("blockquote")} />
        <ToolBtn icon={Code} label="Code" onClick={() => exec("formatBlock", "pre")} />
        <ToolBtn icon={Minus} label="Horizontal Line" onClick={() => exec("insertHorizontalRule")} />
        <Sep />
        <ToolBtn icon={Link} label="Insert Link" onClick={() => setShowLinkDialog(true)} />
        <ToolBtn icon={Image} label="Insert Image" onClick={() => setShowImageDialog(true)} />
        <Sep />
        <ToolBtn icon={Undo} label="Undo" onClick={() => exec("undo")} />
        <ToolBtn icon={Redo} label="Redo" onClick={() => exec("redo")} />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[400px] p-4 outline-none prose prose-sm max-w-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
          [&_p]:mb-3 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
          [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4
          [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
          [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded [&_code]:text-sm
          [&_a]:text-primary [&_a]:underline
          [&_img]:rounded-lg [&_img]:my-4
          [&_hr]:my-6 [&_hr]:border-slate-300
          empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400
        "
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      />

      {/* Image Insert Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                value={imageData.url}
                onChange={(e) => setImageData({ ...imageData, url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input
                value={imageData.alt}
                onChange={(e) => setImageData({ ...imageData, alt: e.target.value })}
                placeholder="Image description for accessibility"
              />
            </div>
            <div className="space-y-2">
              <Label>Image Size</Label>
              <Select value={imageData.size} onValueChange={(v) => setImageData({ ...imageData, size: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {IMAGE_SIZES.map((size) => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link URL (optional)</Label>
              <Input
                value={imageData.link}
                onChange={(e) => setImageData({ ...imageData, link: e.target.value })}
                placeholder="https://example.com (click image to open)"
              />
            </div>
            {imageData.link && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={imageData.openInNewTab}
                  onCheckedChange={(c) => setImageData({ ...imageData, openInNewTab: c })}
                />
                <Label>Open link in new tab</Label>
              </div>
            )}
            {imageData.url && (
              <div className="border rounded-lg p-2 bg-slate-50">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <img
                  src={imageData.url}
                  alt="Preview"
                  className="max-h-32 rounded object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowImageDialog(false)}>Cancel</Button>
              <Button onClick={insertImage} disabled={!imageData.url}>Insert Image</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Insert Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL *</Label>
              <Input
                value={linkData.url}
                onChange={(e) => setLinkData({ ...linkData, url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Link Text</Label>
              <Input
                value={linkData.text}
                onChange={(e) => setLinkData({ ...linkData, text: e.target.value })}
                placeholder="Click here (leave empty to show URL)"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={linkData.openInNewTab}
                onCheckedChange={(c) => setLinkData({ ...linkData, openInNewTab: c })}
              />
              <Label>Open in new tab</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>Cancel</Button>
              <Button onClick={insertLink} disabled={!linkData.url}>Insert Link</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogEditor;
