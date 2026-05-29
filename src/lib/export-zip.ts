import JSZip from "jszip";

export async function createExportZip(
  reportBlob: Blob,
  reportFilename: string,
  attachments: { url: string; filename: string }[]
): Promise<Blob> {
  const zip = new JSZip();

  zip.file(reportFilename, reportBlob);

  if (attachments.length > 0) {
    const attachFolder = zip.folder("attachments");
    if (attachFolder) {
      for (const att of attachments) {
        try {
          const res = await fetch(att.url, { credentials: "same-origin" });
          if (res.ok) {
            const data = await res.arrayBuffer();
            attachFolder.file(att.filename.replace(/[\\/]/g, "_"), data);
          }
        } catch { /* skip failed attachment */ }
      }
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
