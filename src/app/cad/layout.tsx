import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SpaceVision CAD — Engineering Mode",
  description: "Professional parametric CAD powered by OpenCASCADE",
};

export default function CadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0d0d1a] text-white">
      {children}
    </div>
  );
}
