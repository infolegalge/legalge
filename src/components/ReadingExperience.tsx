"use client";

import { useState, useEffect } from "react";

interface ReadingExperienceProps {
  content: string;
  locale: string;
}

export default function ReadingExperience({ content, locale }: ReadingExperienceProps) {
  const [readingTime, setReadingTime] = useState(0);
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [showToc, setShowToc] = useState(false);

  // Calculate reading time based on content
  useEffect(() => {
    // Remove HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').filter(word => word.length > 0).length;
    
    // Average reading speed: 200-250 words per minute
    const wordsPerMinute = 225;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    setReadingTime(minutes);
  }, [content]);

  // Generate table of contents from headings
  useEffect(() => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const tocItems = Array.from(headings).map((heading, index) => {
      const id = `heading-${index}`;
      const text = heading.textContent || '';
      const level = parseInt(heading.tagName.charAt(1));
      
      // Add ID to heading for anchor links
      heading.id = id;
      
      return { id, text, level };
    });
    
    setToc(tocItems);
  }, [content]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getReadingTimeText = () => {
    switch (locale) {
      case 'ka':
        return `${readingTime} წუთი`;
      case 'ru':
        return `${readingTime} мин`;
      default:
        return `${readingTime} min read`;
    }
  };

  const getTocText = () => {
    switch (locale) {
      case 'ka':
        return 'შინაარსი';
      case 'ru':
        return 'Содержание';
      default:
        return 'Table of Contents';
    }
  };

  if (!content) return null;

  return (
    <div className="reading-experience">
      {/* Reading Time */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{getReadingTimeText()}</span>
        </div>
        
        {/* Table of Contents Toggle */}
        {toc.length > 2 && (
          <button
            onClick={() => setShowToc(!showToc)}
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors"
            aria-label={getTocText()}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>{getTocText()}</span>
            <svg 
              className={`h-4 w-4 transition-transform ${showToc ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Table of Contents */}
      {showToc && toc.length > 2 && (
        <nav className="mb-8 rounded-lg border border-border bg-card p-4" aria-label={getTocText()}>
          <h3 className="mb-3 font-medium text-foreground">{getTocText()}</h3>
          <ul className="space-y-2">
            {toc.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`text-left text-sm transition-colors hover:text-primary ${
                    item.level === 1 ? 'font-medium' : 
                    item.level === 2 ? 'ml-2' : 'ml-4 text-muted-foreground'
                  }`}
                >
                  {item.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
