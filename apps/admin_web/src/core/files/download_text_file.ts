export type TextFileDownload = {
  content: string;
  filename: string;
  contentType?: string;
};

export function downloadTextFile(input: TextFileDownload) {
  const blob = new Blob([input.content], {
    type: input.contentType || "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = input.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
