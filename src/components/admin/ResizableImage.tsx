"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, type NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";

const MIN_WIDTH = 60;

// ── NodeView component ─────────────────────────────────────────────────────

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const storedWidth = node.attrs.width as number | null;
  const displayWidth = liveWidth ?? storedWidth;

  const startResize = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, side: "left" | "right") => {
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startW = containerRef.current?.offsetWidth ?? storedWidth ?? 300;
      let currentW = startW;

      const onMove = (ev: MouseEvent) => {
        const dx = side === "right" ? ev.clientX - startX : startX - ev.clientX;
        currentW = Math.max(MIN_WIDTH, Math.round(startW + dx));
        setLiveWidth(currentW);
      };

      const onUp = () => {
        updateAttributes({ width: currentW });
        setLiveWidth(null);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [storedWidth, updateAttributes],
  );

  const shownWidth = liveWidth ?? storedWidth ?? containerRef.current?.offsetWidth ?? null;

  return (
    <NodeViewWrapper
      as="div"
      style={{ display: "block", textAlign: "center", lineHeight: 0, margin: "0.75em 0" }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          display: "inline-block",
          width: displayWidth ? `${displayWidth}px` : "50%",
          maxWidth: "100%",
        }}
      >
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src as string}
          alt={(node.attrs.alt as string) ?? ""}
          draggable={false}
          style={{ display: "block", width: "100%", height: "auto", margin: 0 }}
        />

        {/* Selection ring */}
        {selected && (
          <div
            style={{
              position: "absolute",
              inset: -2,
              outline: "2px solid #3b82f6",
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Resize handles */}
        {selected && (
          <>
            <Handle
              style={{ left: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" }}
              onMouseDown={(e) => startResize(e, "left")}
            />
            <Handle
              style={{ right: -5, top: "50%", transform: "translateY(-50%)", cursor: "ew-resize" }}
              onMouseDown={(e) => startResize(e, "right")}
            />
            <Handle
              style={{ left: -5, bottom: -5, cursor: "sw-resize" }}
              onMouseDown={(e) => startResize(e, "left")}
            />
            <Handle
              style={{ right: -5, bottom: -5, cursor: "se-resize" }}
              onMouseDown={(e) => startResize(e, "right")}
            />
          </>
        )}

        {/* Dimension badge — visible while selected */}
        {selected && shownWidth && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: 11,
              lineHeight: 1,
              padding: "3px 7px",
              borderRadius: 4,
              pointerEvents: "none",
              fontFamily: "monospace",
              userSelect: "none",
            }}
          >
            {shownWidth} px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

function Handle({
  style,
  onMouseDown,
}: {
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        width: 10,
        height: 10,
        background: "#fff",
        border: "2px solid #3b82f6",
        borderRadius: 2,
        zIndex: 20,
        ...style,
      }}
    />
  );
}

// ── Tiptap extension ───────────────────────────────────────────────────────

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML(el) {
          const m = (el.getAttribute("style") ?? "").match(/width:\s*(\d+)px/);
          if (m) return parseInt(m[1]);
          const w = el.getAttribute("width");
          return w ? parseInt(w) : null;
        },
        renderHTML(attrs) {
          if (!attrs.width) return {};
          return { style: `width: ${attrs.width}px` };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
