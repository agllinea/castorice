import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import "./markdown.css";

export function scriptHeadingId(title: string) {
  return `script-section-${title.trim().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "")}`;
}

export function getScriptHeadings(markdown: string) {
  return Array.from(markdown.matchAll(/^##\s+(.+)$/gm), (match) => match[1].trim());
}

export function MarkdownContent({ markdown, withHeadingIds = false }: { markdown: string; withHeadingIds?: boolean }) {
  return <div className="markdown-body">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={withHeadingIds ? { h2: ({ children }) => <h2 id={scriptHeadingId(String(children))}>{children}</h2> } : undefined}
    >
      {markdown}
    </ReactMarkdown>
  </div>;
}
