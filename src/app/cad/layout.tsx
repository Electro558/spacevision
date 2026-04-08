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
    <div className="h-[calc(100vh-57px)] mt-[57px] overflow-hidden bg-[#0d0d1a] text-white">
      {children}
    </div>
  );
}
