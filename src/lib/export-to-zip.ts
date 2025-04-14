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
  // Step 1: Load the uploaded template workbook
  const templateArrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(templateArrayBuffer);
  const ws = workbook.Sheets["Hosted Display"];

  // Step 2: Inject new rows (starting at row 2)
  const startRow = 2;
  data.forEach((entry, i) => {
    const row = startRow + i;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;

    ws[`A${row}`] = { t: "s", v: creativeName }; // Name
    ws[`C${row}`] = { t: "s", v: entry.file.name }; // Asset File Name
    ws[`D${row}`] = { t: "s", v: entry.cturl }; // CTURL
    ws[`E${row}`] = { t: "s", v: entry.landingPage }; // Landing Page
  });

  // Step 3: Write the updated workbook to binary and add to ZIP
  const zip = new JSZip();
  const workbookBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  // Step 4: Add creatives to the root of the ZIP
  data.forEach((entry) => {
    zip.file(entry.file.name, entry.file);
  });

  // Step 5: Generate ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}
