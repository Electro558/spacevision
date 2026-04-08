"use client";

import { CadProvider } from "@/cad/context/CadContext";
import { CadWorkspace } from "@/cad/components/CadWorkspace";

export default function CadPage() {
  return (
    <CadProvider>
      <CadWorkspace />
    </CadProvider>
  );
}
