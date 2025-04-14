// src/lib/export-to-zip.ts
import JSZip from "jszip";
import { read, utils, write } from "xlsx";
import { saveAs } from "file-saver";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  const zip = new JSZip();

  // Read and clone the uploaded template
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "buffer" });

  const ws = workbook.Sheets["Hosted Display"];
  const startRow = 2;

  data.forEach((entry, i) => {
    const row = startRow + i;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;

    ws[`A${row}`] = { t: "s", v: creativeName };
    ws[`C${row}`] = { t: "s", v: entry.file.name };
    ws[`D${row}`] = { t: "s", v: entry.cturl };
    ws[`E${row}`] = { t: "s", v: entry.landingPage };
  });

  // Write updated workbook
  const buffer = write(workbook, { bookType: "xlsx", type: "array" });
  zip.file(templateFile.name, buffer);

  // Add creatives
  data.forEach(({ file }) => {
    zip.file(file.name, file);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `CreatomatorExport_${Date.now()}.zip`);
}
