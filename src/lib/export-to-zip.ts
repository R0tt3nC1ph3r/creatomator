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
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook: WorkBook = read(arrayBuffer, { type: "buffer" });
  const sheet = workbook.Sheets["Hosted Display"];

  if (!sheet) {
    throw new Error("'Hosted Display' sheet not found in uploaded template");
  }

  const startRow = 2;
  data.forEach((entry, i) => {
    const row = startRow + i;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;

    sheet[`A${row}`] = { t: "s", v: creativeName };
    sheet[`C${row}`] = { t: "s", v: entry.file.name };
    sheet[`D${row}`] = { t: "s", v: entry.cturl };
    sheet[`E${row}`] = { t: "s", v: entry.landingPage };
  });

  // Write modified workbook to binary format
  const wbout = writeFile(workbook, "Hosted_Display_Export.xlsx", {
    bookType: "xlsx",
    type: "binary",
  });

  // Create a new zip file
  const zip = new JSZip();

  // Add the workbook to the zip
  const updatedArrayBuffer = await templateFile.arrayBuffer();
  zip.file("Hosted_Display_Export.xlsx", updatedArrayBuffer);

  // Add each creative asset to the zip
  data.forEach((entry) => {
    zip.file(entry.file.name, entry.file);
  });

  // Generate the zip file
  const content = await zip.generateAsync({ type: "blob" });

  // Trigger download
  saveAs(content, `CreatomatorExport_${Date.now()}.zip`);
}
