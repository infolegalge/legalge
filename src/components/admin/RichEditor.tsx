"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import DOMPurify from "dompurify";
import { Switch } from "@/components/ui/switch";
import Blockquote from "@tiptap/extension-blockquote";
import AudioUpload from "./AudioUpload";
import { Audio } from "./AudioExtension";

type Props = {
  name: string;
  initialHTML?: string;
  label?: string;
  onChange?: (html: string) => void;
};

export default function RichEditor({ name, initialHTML = "", label, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [htmlMode, setHtmlMode] = useState(false);
  const [raw, setRaw] = useState<string>(initialHTML);
  const [mounted, setMounted] = useState(false);
  const [, setFormEl] = useState<HTMLFormElement | null>(null);
  const [showAudioUpload, setShowAudioUpload] = useState(false);

  useEffect(() => {
    setMounted(true);
}, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions that we're configuring separately to avoid duplicates
        link: false,
        blockquote: false,
        underline: false,
      }),
      Underline,
      Link.configure({ linkOnPaste: true, openOnClick: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Blockquote,
      Audio,
    ],
    content: initialHTML,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = DOMPurify.sanitize(editor.getHTML(), {
        USE_PROFILES: { html: true },
        ADD_TAGS: ["video", "audio", "iframe"],
        ADD_ATTR: [
          "href",
          "target",
          "rel",
          "class",
          "style",
          "src",
          "alt",
          "width",
          "height",
          "frameborder",
          "allow",
          "allowfullscreen",
          "controls",
          "poster",
          "data-line-start",
          "data-line-end",
        ],
      });
      setRaw(html);
      if (inputRef.current) inputRef.current.value = html;
      if (onChange) onChange(html);
    },
  });

  // Add keyboard shortcuts for paste as plain text and clear formatting
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+V for paste as plain text
      if (event.ctrlKey && event.shiftKey && event.key === 'v') {
        event.preventDefault();
        navigator.clipboard.readText().then((clipboardText) => {
          if (clipboardText && editor) {
            editor.commands.insertContent(clipboardText);
          }
        }).catch(() => {
          // Fallback handled by button click
        });
      }
      
      // Ctrl+\ for clear formatting
      if (event.ctrlKey && event.key === '\\') {
        event.preventDefault();
        if (editor) {
          editor.commands.unsetMark('bold');
          editor.commands.unsetMark('italic');
          editor.commands.unsetMark('underline');
          editor.commands.unsetMark('textStyle');
          editor.commands.unsetMark('color');
          editor.commands.setParagraph();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = initialHTML;
  }, [initialHTML]);

  // Keep hidden input in sync when editing in HTML mode
  useEffect(() => {
    if (htmlMode && inputRef.current) {
      inputRef.current.value = raw;
      if (onChange) onChange(raw);
    }
  }, [htmlMode, raw]);

  // Sync when toggling HTML mode
  useEffect(() => {
    if (!editor) return;
    if (htmlMode) {
      setRaw(editor.getHTML());
      if (inputRef.current) inputRef.current.value = editor.getHTML();
    } else {
      const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
      editor.commands.setContent(clean);
      if (inputRef.current) inputRef.current.value = clean;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlMode]);

  // Ensure the latest editor content is written to the hidden input right before submit
  useEffect(() => {
    const currentForm = inputRef.current?.form || null;
    setFormEl(currentForm);
    if (!currentForm) return;
    const handler = () => {
      const editorHtml = editor?.getHTML() || "";
      
      const html = htmlMode ? raw : DOMPurify.sanitize(editorHtml, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ["video", "audio", "iframe"],
        ADD_ATTR: [
          "href",
          "target",
          "rel",
          "class",
          "style",
          "src",
          "alt",
          "width",
          "height",
          "frameborder",
          "allow",
          "allowfullscreen",
          "controls",
          "poster",
          "data-line-start",
          "data-line-end",
        ],
      });
      if (inputRef.current) inputRef.current.value = html;
    };
    currentForm.addEventListener("submit", handler);
    return () => currentForm.removeEventListener("submit", handler);
  }, [editor, htmlMode, raw]);

  // Allow rich HTML paste and rely on DOMPurify sanitization in onUpdate

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm">{label}</label> : null}
      <div className="flex flex-wrap items-center gap-1">
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted font-bold ${editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleBold()}
        >
          B
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted italic ${editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleItalic()}
        >
          I
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted underline ${editor?.isActive('underline') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleUnderline()}
        >
          U
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleHeading({ level: 2 })}
        >
          H2
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleHeading({ level: 3 })}
        >
          H3
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleBulletList()}
        >
          • List
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive('orderedList') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleOrderedList()}
        >
          1. List
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive('blockquote') ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.toggleBlockquote()}
        >
          ❝ Quote
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => setShowAudioUpload(true)}
        >
          🎵 Audio
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => {
            const url = prompt("Embed video URL (.mp4)")?.trim();
            if (!url) return;
            editor?.commands.insertContent(`<video controls style="max-width:100%" src="${url}"></video>`);
          }}
        >
          Video
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.setTextAlign("left")}
        >
          ⬅
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.setTextAlign("center")}
        >
          ⬌
        </button>
        <button 
          type="button" 
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.setTextAlign("right")}
        >
          ➡
        </button>
        <button
          type="button"
          className={`rounded border px-2 py-1 text-xs hover:bg-muted ${editor?.isActive({ textAlign: 'justify' }) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={() => editor?.commands.setTextAlign("justify")}
        >
          ⫷⫸
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={async () => {
            try {
              const clipboardText = await navigator.clipboard.readText();
              if (clipboardText) {
                // Insert plain text without formatting
                editor?.commands.insertContent(clipboardText);
              }
            } catch {
              // Fallback: prompt user to paste manually
              const text = prompt("Paste your text here (formatting will be removed):");
              if (text) {
                editor?.commands.insertContent(text);
              }
            }
          }}
          title="Paste as Plain Text (Ctrl+Shift+V)"
        >
          📋 Plain
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted"
          onClick={() => {
            // Clear formatting from selected text - only use supported mark types
            editor?.commands.unsetMark('bold');
            editor?.commands.unsetMark('italic');
            editor?.commands.unsetMark('underline');
            editor?.commands.unsetMark('textStyle');
            editor?.commands.setParagraph();
          }}
          title="Clear Formatting (Ctrl+\\)"
        >
          ✨ Clear
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-muted bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
          onClick={() => {
            // Reset to original style - clear all formatting and return to paragraph
            editor?.commands.clearNodes();
            editor?.commands.unsetAllMarks();
            editor?.commands.setParagraph();
            editor?.commands.setTextAlign('left');
          }}
          title="Reset to Original Style"
        >
          🔄 Reset
        </button>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-foreground/70">HTML</span>
        <Switch checked={htmlMode} onCheckedChange={(v) => setHtmlMode(Boolean(v))} />
      </div>
    </div>
    
    {/* Visual Style Status Bar */}
    {editor && (
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground bg-muted/50 p-2 rounded border">
        <span className="font-medium">Active:</span>
        {editor.isActive('bold') && <span className="bg-primary/20 text-primary px-1 rounded">Bold</span>}
        {editor.isActive('italic') && <span className="bg-primary/20 text-primary px-1 rounded">Italic</span>}
        {editor.isActive('underline') && <span className="bg-primary/20 text-primary px-1 rounded">Underline</span>}
        {editor.isActive('heading', { level: 2 }) && <span className="bg-primary/20 text-primary px-1 rounded">H2</span>}
        {editor.isActive('heading', { level: 3 }) && <span className="bg-primary/20 text-primary px-1 rounded">H3</span>}
        {editor.isActive('bulletList') && <span className="bg-primary/20 text-primary px-1 rounded">• List</span>}
        {editor.isActive('orderedList') && <span className="bg-primary/20 text-primary px-1 rounded">1. List</span>}
        {editor.isActive('blockquote') && <span className="bg-primary/20 text-primary px-1 rounded">Quote</span>}
        {editor.isActive({ textAlign: 'left' }) && <span className="bg-primary/20 text-primary px-1 rounded">Left</span>}
        {editor.isActive({ textAlign: 'center' }) && <span className="bg-primary/20 text-primary px-1 rounded">Center</span>}
        {editor.isActive({ textAlign: 'right' }) && <span className="bg-primary/20 text-primary px-1 rounded">Right</span>}
        {editor.isActive({ textAlign: 'justify' }) && <span className="bg-primary/20 text-primary px-1 rounded">Justify</span>}
        {!editor.isActive('bold') && !editor.isActive('italic') && !editor.isActive('underline') && 
         !editor.isActive('heading') && !editor.isActive('bulletList') && !editor.isActive('orderedList') && 
         !editor.isActive('blockquote') && !editor.isActive({ textAlign: 'left' }) && 
         !editor.isActive({ textAlign: 'center' }) && !editor.isActive({ textAlign: 'right' }) && 
         !editor.isActive({ textAlign: 'justify' }) && (
          <span className="text-muted-foreground">Normal text</span>
        )}
      </div>
    )}
      {htmlMode ? (
        <textarea className="min-h-40 w-full rounded border p-2 font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
      ) : mounted ? (
        <div className="rounded border p-2">
          {editor ? <EditorContent editor={editor} /> : <div className="min-h-40" />}
        </div>
      ) : (
        <div className="min-h-40 w-full rounded border p-2 text-sm text-foreground/60">Loading editor…</div>
      )}
      <input ref={inputRef} type="hidden" name={name} defaultValue={initialHTML} />
      
      {/* Audio Upload Modal */}
    {showAudioUpload && (
      <AudioUpload
        onAudioInsert={(audioUrl, title) => {
          // Use the new Audio extension to insert a proper audio node
          if (editor) {
            editor.commands.setAudio({
              src: audioUrl,
              title: title && title.trim() ? title : undefined
            });
          }
          setShowAudioUpload(false);
        }}
        onClose={() => setShowAudioUpload(false)}
      />
    )}
    </div>
  );
}


