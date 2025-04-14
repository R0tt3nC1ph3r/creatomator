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
  // Load the uploaded template
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "buffer" });

  // Set workbook title to match expected name
  workbook.Props = workbook.Props || {};
  workbook.Props.Title = "bulkcreativeimporttemplate.v34__6__copy";

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

  // Convert workbook to binary
  const updatedWorkbook = writeFile(workbook, "bulkcreativeimporttemplate.v34__6__copy.xlsx", { bookType: "xlsx" });

  // Create ZIP file
  const zip = new JSZip();

  // Add filled workbook to zip
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", arrayBuffer);

  // Add creatives to a folder inside zip
  const creativesFolder = zip.folder("creatives");
  for (const entry of data) {
    const arrayBuffer = await entry.file.arrayBuffer();
    creativesFolder?.file(entry.file.name, arrayBuffer);
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipFilename = `Creatives_Export_${Date.now()}.zip`;
  saveAs(zipBlob, zipFilename);
}
