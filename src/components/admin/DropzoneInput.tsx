"use client";

import { useRef, useState } from "react";

export default function DropzoneInput({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [highlight, setHighlight] = useState(false);

  function onFiles(files: FileList | null) {
    if (!files || !inputRef.current) return;
    // Assign files to the hidden input so the server action receives them
    const dt = new DataTransfer();
    Array.from(files).forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
  }

  return (
    <div>
      <input ref={inputRef} name={name} type="file" accept="image/*" className="hidden" />
      <div
        className={`flex h-28 w-full cursor-pointer items-center justify-center rounded border text-xs ${highlight ? "bg-muted/50" : "bg-transparent"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setHighlight(true);
        }}
        onDragLeave={() => setHighlight(false)}
        onDrop={(e) => {
          e.preventDefault();
          setHighlight(false);
          onFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        Drop image here or click to select
      </div>
    </div>
  );
}


