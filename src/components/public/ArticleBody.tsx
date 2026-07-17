import sanitizeHtml from "sanitize-html";

const ALLOWED: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "strong", "em", "u", "s",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "a", "blockquote", "hr", "br",
    "img", "figure", "figcaption",
    "code", "pre",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height", "class", "style"],
    figure: ["class"],
    figcaption: ["class"],
  },
  // Allow width/height inline styles on images so editor-resized images
  // render at the correct size. Only these two properties are permitted.
  allowedStyles: {
    img: {
      width: [/^\d+px$/],
      height: [/^\d+px$/],
    },
  },
  transformTags: {
    // merge=true (default) keeps href/target and only sets/overwrites rel
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
  allowedSchemes: ["https"],
};

export default function ArticleBody({ html }: { html: string }) {
  const clean = sanitizeHtml(html, ALLOWED);
  return (
    <div
      className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-a:text-brand-red"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
