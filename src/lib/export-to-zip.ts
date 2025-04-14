// src/lib/export-to-zip.ts

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, write } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  try {
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = read(arrayBuffer, { type: "buffer" });
    const sheetName = "Hosted Display";
    const ws = workbook.Sheets[sheetName];

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

    // Generate the updated workbook buffer
    const workbookBuffer = write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    const zip = new JSZip();

    // Add workbook to zip with original template name
    zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

    // Add creative files to root of ZIP
    data.forEach(({ file }) => {
      zip.file(file.name, file);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `CreatomatorExport_${Date.now()}.zip`);
  } catch (err) {
    console.error("Failed to export ZIP:", err);
    alert("There was an error exporting your ZIP. Check the console for details.");
  }
}
