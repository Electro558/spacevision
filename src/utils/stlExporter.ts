import * as THREE from "three";
import { STLExporter } from "three-stdlib";

export function exportToSTL(scene: THREE.Scene, filename = "model.stl") {
  const exporter = new STLExporter();
  const result = exporter.parse(scene, { binary: true }) as DataView;
  const buffer = new ArrayBuffer(result.byteLength);
  new Uint8Array(buffer).set(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
