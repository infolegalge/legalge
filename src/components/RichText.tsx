import sanitizeHtml from "sanitize-html";

const allowed = {
  allowedTags: [
    "a",
    "p",
    "br",
    "strong",
    "em",
    "u",
    "span",
    "div",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "blockquote",
    "img",
    "audio",
    "source",
    "video",
    "iframe",
    "figure",
    "figcaption",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "class"],
    img: ["src", "alt", "width", "height", "srcset", "sizes", "class", "loading", "decoding"],
    audio: ["src", "controls", "class", "style", "preload"],
    source: ["src", "type"],
    video: ["src", "controls", "width", "height", "style", "poster"],
    iframe: [
      "src",
      "width",
      "height",
      "class",
      "style",
      "frameborder",
      "allow",
      "allowfullscreen",
      "loading",
    ],
    p: ["class", "style", "data-line-start", "data-line-end"],
    span: ["class", "style"],
    div: ["class", "style"],
    h2: ["class"],
    h3: ["class"],
    blockquote: ["class", "style"],
    ul: ["class", "style"],
    ol: ["class", "style"],
    li: ["class", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: true,
};

export default function RichText({ html, className }: { html: string; className?: string }) {
  let rendered = html;
  
  
  // First, decode HTML entities that might be encoding video tags
  rendered = rendered.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  
  // Replace YouTube links in <video> tags with iframe embeds FIRST
  // Handle standard YouTube watch URLs
  rendered = rendered.replace(/<video[^>]*src=["'](https?:\/\/www\.youtube\.com\/watch\?v=([\w-]+))["'][^>]*>(.*?)<\/video>/gim, (match, fullUrl, id) => {
    const src = `https://www.youtube.com/embed/${id}`;
    return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
  });
  
  // Handle youtu.be short URLs
  rendered = rendered.replace(/<video[^>]*src=["'](https?:\/\/youtu\.be\/([\w-]+))["'][^>]*>(.*?)<\/video>/gim, (match, fullUrl, id) => {
    const src = `https://www.youtube.com/embed/${id}`;
    return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
  });
  
  // Handle Vimeo links in <video> tags
  rendered = rendered.replace(/<video[^>]*src=["']https?:\/\/(?:www\.)?vimeo\.com\/(\d+)["'][^>]*>(.*?)<\/video>/gim, (match, id) => {
    const src = `https://player.vimeo.com/video/${id}`;
    return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
  });
  
  // Also handle plain YouTube URLs in text (not in video tags)
  rendered = rendered.replace(/(https?:\/\/www\.youtube\.com\/watch\?v=([\w-]+))/gim, (match, fullUrl, id) => {
    const src = `https://www.youtube.com/embed/${id}`;
    return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
  });

  // Handle youtu.be short URLs in text
  rendered = rendered.replace(/(https?:\/\/youtu\.be\/([\w-]+))/gim, (match, fullUrl, id) => {
    const src = `https://www.youtube.com/embed/${id}`;
    return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
  });
  
  // Handle incomplete or broken video tags more aggressively
  rendered = rendered.replace(/<video[^>]*src=["'][^"']*youtube[^"']*["'][^>]*>/gi, (match) => {
    // Extract YouTube URL from the incomplete tag
    const urlMatch = match.match(/src=["']([^"']*youtube[^"']*)["']/i);
    if (urlMatch) {
      const url = urlMatch[1];
      const idMatch = url.match(/[?&]v=([^&]+)/);
        if (idMatch) {
          const id = idMatch[1];
          const src = `https://www.youtube.com/embed/${id}`;
          return `<div class="w-full my-6 relative" style="aspect-ratio: 16/9;"><iframe src="${src}" width="100%" height="100%" frameborder="0" allowfullscreen loading="lazy" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe></div>`;
        }
    }
    return '';
  });
  
  // NOW clean up any remaining broken video tags or fragments
  rendered = rendered.replace(/<video[^>]*>/gi, '');
  rendered = rendered.replace(/<\/video>/gi, '');
  // Don't remove src attributes as they might be from valid iframes
  
  const clean = sanitizeHtml(rendered, allowed);
  
  return (
    <div 
      className={
        className ||
        "prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-p:leading-relaxed prose-p:text-base prose-p:text-justify prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3 prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-ul:my-4 prose-ol:my-4 prose-li:text-foreground prose-li:leading-relaxed"
      } 
      dangerouslySetInnerHTML={{ __html: clean }} 
    />
  );
}


