import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, writeFile } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  // Step 1: Read the uploaded template file
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "buffer" });
  const sheetName = "Hosted Display";
  const ws = workbook.Sheets[sheetName];

  // Step 2: Fill out data starting at row 2
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

  // Step 3: Write the updated workbook to binary and add to ZIP
  const zip = new JSZip();
  const workbookBuffer = writeFile(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  // Step 4: Add creative files to the ZIP
  const creativeFolder = zip.folder("creatives");
  for (const entry of data) {
    const buffer = await entry.file.arrayBuffer();
    creativeFolder?.file(entry.file.name, buffer);
  }

  // Step 5: Generate the final ZIP file
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `Creatomator_Export_${Date.now()}.zip`);
}
