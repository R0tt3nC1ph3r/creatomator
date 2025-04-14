import { saveAs } from "file-saver";
import JSZip from "jszip";
import { read, utils, writeFileXLSX } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  // Read the uploaded Excel template
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "buffer" });

  // Use the "Hosted Display" tab only
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

  // Export updated Excel file as Blob
  const updatedXLSXBlob = writeFileXLSX(workbook, {
    bookType: "xlsx",
    type: "blob",
  });

  // Create ZIP file
  const zip = new JSZip();
  zip.file("Hosted_Display_Export.xlsx", updatedXLSXBlob);

  // Add each creative to the ZIP
  for (const entry of data) {
    zip.file(entry.file.name, entry.file);
  }

  // Finalize ZIP and download
  const finalZip = await zip.generateAsync({ type: "blob" });
  saveAs(finalZip, `CreatomatorExport_${Date.now()}.zip`);
}
