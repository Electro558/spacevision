"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TutorialStep {
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for spotlight
  position: "center" | "right" | "left" | "bottom";
}

const STEPS: TutorialStep[] = [
  {
    title: "Welcome to SpaceVision!",
    description:
      "Let's learn the basics of the 3D editor. This will only take a minute.",
    position: "center",
  },
  {
    title: "Adding Shapes",
    description:
      'Click the + button or the Shapes panel to add 3D primitives like cubes, spheres, and cylinders to your workspace.',
    targetSelector: '[data-tutorial="shapes"], [title*="Add"]',
    position: "right",
  },
  {
    title: "Selecting Objects",
    description:
      "Click any object in the viewport to select it. A blue outline shows what's selected. Click the background to deselect.",
    targetSelector: ".canvas-container",
    position: "right",
  },
  {
    title: "Moving Objects (Simple Mode)",
    description:
      "In Simple mode (the default), just click and drag any selected object to slide it around the workspace. It moves along the ground plane.",
    targetSelector: ".canvas-container",
    position: "right",
  },
  {
    title: "Lifting Objects",
    description:
      "See the green arrow above your selected object? Drag it up or down to lift the object off the ground.",
    targetSelector: ".canvas-container",
    position: "right",
  },
  {
    title: "Advanced Mode",
    description:
      'Switch to Advanced mode for precise control with colored axis handles. Press Q to toggle between Simple and Advanced modes.',
    targetSelector: '[data-tutorial="mode-toggle"]',
    position: "right",
  },
  {
    title: "Transform Tools",
    description:
      "In Advanced mode, use Move (G), Rotate (R), and Scale (S) to switch between transform types. Drag the colored handles to transform along specific axes.",
    targetSelector: '[data-tutorial="transform-tools"]',
    position: "right",
  },
  {
    title: "Properties Panel",
    description:
      "Select an object and use the Properties panel on the right to edit exact position values, colors, materials, and more.",
    targetSelector: '[data-tutorial="properties"]',
    position: "left",
  },
  {
    title: "Exporting Your Work",
    description:
      'Click Export to download your creation as STL, OBJ, or GLTF for 3D printing or other software.',
    targetSelector: '[data-tutorial="export"]',
    position: "bottom",
  },
  {
    title: "You're Ready!",
    description:
      "Start creating! Here are some handy shortcuts:\n\n" +
      "Q \u2014 Toggle Simple/Advanced mode\n" +
      "G/R/S \u2014 Move/Rotate/Scale (Advanced)\n" +
      "D \u2014 Duplicate  |  Del \u2014 Delete\n" +
      "X \u2014 Toggle snap  |  W \u2014 Wireframe\n" +
      "Ctrl+Z \u2014 Undo  |  ? \u2014 Replay tutorial",
    position: "center",
  },
];

interface TutorialOverlayProps {
  isActive: boolean;
  onClose: () => void;
  onAddDemoCube?: () => void;
}

export default function TutorialOverlay({
  isActive,
  onClose,
  onAddDemoCube,
}: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  // Find and track the target element
  useEffect(() => {
    if (!isActive || !step?.targetSelector) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector!);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    const interval = setInterval(updateRect, 500);
    window.addEventListener("resize", updateRect);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateRect);
    };
  }, [isActive, step?.targetSelector, currentStep]);

  // Auto-add demo cube for steps that need an object (steps 2-4)
  useEffect(() => {
    if (isActive && currentStep >= 2 && currentStep <= 4 && onAddDemoCube) {
      // Give a small delay so the user sees the step first
      const timer = setTimeout(() => onAddDemoCube(), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive, currentStep, onAddDemoCube]);

  const handleNext = useCallback(() => {
    if (isLast) {
      localStorage.setItem("spacevision-tutorial-completed", "true");
      setCurrentStep(0);
      onClose();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast, onClose]);

  const handleSkip = useCallback(() => {
    localStorage.setItem("spacevision-tutorial-completed", "true");
    setCurrentStep(0);
    onClose();
  }, [onClose]);

  // Escape to close
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleSkip();
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isActive, handleSkip, handleNext]);

  if (!isActive) return null;

  // Compute tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (step.position === "center" || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;

    if (step.position === "right") {
      return {
        top: Math.max(padding, targetRect.top),
        left: Math.min(targetRect.right + padding, window.innerWidth - 380),
      };
    }
    if (step.position === "left") {
      return {
        top: Math.max(padding, targetRect.top),
        right: window.innerWidth - targetRect.left + padding,
      };
    }
    if (step.position === "bottom") {
      return {
        top: targetRect.bottom + padding,
        left: Math.max(padding, targetRect.left),
      };
    }

    return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  };

  // Spotlight cutout via box-shadow
  const getBackdropStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { background: "rgba(0, 0, 0, 0.6)" };
    }

    const pad = 6;
    const x = targetRect.left - pad;
    const y = targetRect.top - pad;
    const w = targetRect.width + pad * 2;
    const h = targetRect.height + pad * 2;

    return {
      background: "none",
      boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(59, 130, 246, 0.5) inset`,
      position: "fixed",
      top: y,
      left: x,
      width: w,
      height: h,
      borderRadius: 8,
      pointerEvents: "none",
    };
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      style={{ pointerEvents: "auto" }}
    >
      {/* Backdrop */}
      {!targetRect ? (
        <div className="absolute inset-0 bg-black/60" />
      ) : (
        <>
          {/* Full-screen click catcher */}
          <div className="absolute inset-0" />
          {/* Spotlight cutout */}
          <div style={getBackdropStyle()} />
        </>
      )}

      {/* Tooltip */}
      <div
        className="absolute z-10 max-w-sm"
        style={getTooltipStyle()}
      >
        <div className="bg-surface border border-surface-border rounded-xl shadow-2xl p-5">
          {/* Step counter */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-semibold text-brand uppercase tracking-wider">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === currentStep
                      ? "bg-brand"
                      : i < currentStep
                      ? "bg-brand/40"
                      : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>

          <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
          <p className="text-gray-400 text-xs leading-relaxed whitespace-pre-line">
            {step.description}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              {isLast ? "" : "Skip tutorial"}
            </button>
            <div className="flex gap-2">
              {currentStep > 0 && !isFirst && (
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-surface-border text-gray-400 hover:text-white hover:border-gray-500 transition-all"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-4 py-1.5 text-xs rounded-lg bg-brand hover:bg-brand-hover text-white font-medium transition-all"
              >
                {isLast ? "Get Started!" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
