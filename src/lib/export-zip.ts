import JSZip from "jszip";

export async function createExportZip(
  reportBlob: Blob,
  reportFilename: string,
  attachments: { url: string; filename: string; fallbackUrl?: string | null }[]
): Promise<Blob> {
  const zip = new JSZip();

  zip.file(reportFilename, await reportBlob.arrayBuffer());

  if (attachments.length > 0) {
    const attachFolder = zip.folder("attachments");
    if (attachFolder) {
      for (const att of attachments) {
        let added = false;
        for (const url of [att.url, att.fallbackUrl].filter(Boolean) as string[]) {
          try {
            const res = await fetch(url, { credentials: "same-origin" });
            if (!res.ok) continue;
            const data = await res.arrayBuffer();
            attachFolder.file(att.filename.replace(/[\\/]/g, "_"), data);
            added = true;
            break;
          } catch { /* try next source */ }
        }
        if (!added) {
          throw new Error(`Could not include attachment "${att.filename}". Please try again or remove and re-upload the attachment.`);
        }
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
