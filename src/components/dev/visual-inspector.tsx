import React, { useState, useEffect, useRef, useCallback } from "react";
import { MousePointer2, X, Edit, Info, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * VisualInspector Component
 * A developer tool to select and identify elements in the preview.
 * Only active in development mode.
 */
export const VisualInspector: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const getElementInfo = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : "";
    const classes = Array.from(el.classList).map(c => `.${c}`).join("");
    const text = el.innerText?.slice(0, 50).trim() || el.getAttribute("placeholder") || "";
    
    // Try to find the closest component or useful parent context
    let context = "";
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      if (parent.tagName.toLowerCase().includes("-") || parent.getAttribute("data-component")) {
        context = parent.tagName.toLowerCase();
        break;
      }
      parent = parent.parentElement;
    }

    return { tag, id, classes, text, context, rect };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive || selectedElement) return;
    
    // We want to find the element under the mouse, but ignore our own overlay
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const target = elements.find(el => 
      el instanceof HTMLElement && 
      !el.closest("#visual-inspector-ui")
    ) as HTMLElement | null;

    if (target && target !== document.body && target !== document.documentElement) {
      setHoveredElement(target);
    } else {
      setHoveredElement(null);
    }
  }, [isActive, selectedElement]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    
    // Check if we clicked on our own UI
    if ((e.target as HTMLElement).closest("#visual-inspector-ui")) return;

    e.preventDefault();
    e.stopPropagation();

    if (hoveredElement) {
      setSelectedElement(hoveredElement);
    } else {
      setSelectedElement(null);
    }
  }, [isActive, hoveredElement]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener("mousemove", handleMouseMove, true);
      window.addEventListener("click", handleClick, true);
      document.body.style.cursor = "crosshair";
    } else {
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("click", handleClick, true);
      document.body.style.cursor = "";
      setHoveredElement(null);
      setSelectedElement(null);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove, true);
      window.removeEventListener("click", handleClick, true);
      document.body.style.cursor = "";
    };
  }, [isActive, handleMouseMove, handleClick]);

  const copyToClipboard = () => {
    if (!selectedElement) return;
    const info = getElementInfo(selectedElement);
    const prompt = `Please edit this element:
Tag: ${info.tag}
ID: ${info.id}
Classes: ${info.classes}
Text content: "${info.text}"
Context: ${info.context}

Desired changes: [Describe your changes here]`;

    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeElement = selectedElement || hoveredElement;
  const rect = activeElement?.getBoundingClientRect();

  return (
    <div id="visual-inspector-ui" className="fixed inset-0 pointer-events-none z-[9999]">
      {/* Floating Toggle Button */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-colors border ${
            isActive 
              ? "bg-primary text-primary-foreground border-primary" 
              : "bg-background text-foreground border-border hover:bg-muted"
          }`}
        >
          <MousePointer2 size={18} className={isActive ? "animate-pulse" : ""} />
          <span className="font-medium text-sm">
            {isActive ? "Inspector Active" : "Inspect Element"}
          </span>
        </motion.button>
      </div>

      {/* Highlight Overlay */}
      <AnimatePresence>
        {rect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute border-2 pointer-events-none transition-all duration-150 ${
              selectedElement ? "border-primary bg-primary/10" : "border-primary/40 bg-primary/5"
            }`}
            style={{
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX,
              width: rect.width,
              height: rect.height,
            }}
          >
            {/* Tag Label */}
            <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-t-md whitespace-nowrap font-mono flex items-center gap-1">
              {activeElement?.tagName.toLowerCase()}
              {activeElement?.id && <span className="opacity-70">#{activeElement.id}</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Menu (for selected element) */}
      <AnimatePresence>
        {selectedElement && rect && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute pointer-events-auto bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-2 min-w-[200px]"
            style={{
              top: Math.min(window.innerHeight - 150, rect.bottom + window.scrollY + 8),
              left: Math.max(10, Math.min(window.innerWidth - 220, rect.left + window.scrollX)),
            }}
          >
            <div className="flex items-center justify-between px-2 py-1 mb-2 border-bottom border-border">
              <span className="text-xs font-semibold opacity-70 flex items-center gap-1">
                <Info size={12} />
                Element Actions
              </span>
              <button 
                onClick={() => setSelectedElement(null)}
                className="hover:bg-muted p-1 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm hover:bg-primary/10 hover:text-primary rounded-lg transition-all active:scale-95 group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {copied ? <Check size={16} /> : <Edit size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{copied ? "Prompt Copied!" : "Request Edit"}</span>
                  <span className="text-[10px] opacity-50">Ask Antigravity to modify</span>
                </div>
              </button>

              <button
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 text-sm hover:bg-muted rounded-lg transition-all active:scale-95 group opacity-50 cursor-not-allowed"
                title="Coming soon: Live text editing"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Copy size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">Direct Edit</span>
                  <span className="text-[10px] opacity-50">Modify directly in browser</span>
                </div>
              </button>
              
              <div className="mt-2 pt-2 border-t border-border">
                <div className="px-3 py-1.5 text-[9px] font-mono bg-muted/30 rounded-md overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Tag:</span>
                    <span className="text-foreground">{selectedElement.tagName.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Classes:</span>
                    <span className="text-foreground text-right max-w-[100px] truncate">
                      {Array.from(selectedElement.classList).join(" ") || "none"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
