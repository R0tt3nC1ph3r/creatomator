import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, writeFile, WorkBook } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  const templateArrayBuffer = await templateFile.arrayBuffer();
  const workbook: WorkBook = read(templateArrayBuffer, { type: "array" });
  const sheet = workbook.Sheets["Hosted Display"];

  const startRow = 2;
  data.forEach((entry, i) => {
    const row = startRow + i;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;

    sheet[`A${row}`] = { t: "s", v: creativeName }; // Creative Name
    sheet[`C${row}`] = { t: "s", v: entry.file.name }; // File Name
    sheet[`D${row}`] = { t: "s", v: entry.cturl }; // CTURL
    sheet[`E${row}`] = { t: "s", v: entry.landingPage }; // Landing Page
  });

  // Write the updated workbook to binary
  const workbookBuffer = writeFile(workbook, {
    bookType: "xlsx",
    type: "buffer",
  } as any);

  const zip = new JSZip();
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  // Add each creative file to the root of the zip
  for (const creative of data) {
    zip.file(creative.file.name, creative.file);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}
