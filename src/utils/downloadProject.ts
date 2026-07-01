"use client";

import JSZip from "jszip";
import type { FileItem } from "@/store/useStore";

function addFilesToZip(zip: JSZip, files: FileItem[], basePath = "") {
  files.forEach((file) => {
    const path = basePath ? `${basePath}/${file.name}` : file.name;

    if (file.type === "folder") {
      addFilesToZip(zip, file.children || [], path);
      return;
    }

    zip.file(path, file.content || "");
  });
}

export async function downloadProject(files: FileItem[]) {
  const zip = new JSZip();

  addFilesToZip(zip, files);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "ai-code-editor-project.zip";
  anchor.click();

  URL.revokeObjectURL(url);
}
