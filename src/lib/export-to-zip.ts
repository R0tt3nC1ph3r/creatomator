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
  if (!templateFile) {
    console.error("No template file provided.");
    return;
  }

  // Step 1: Read the uploaded template
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer);
  const ws = workbook.Sheets["Hosted Display"];

  // Step 2: Inject creative data into the worksheet
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
  const workbookBuffer = write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  // Step 4: Add creatives to the ZIP
  const assets = zip.folder("creatives");
  await Promise.all(
    data.map(async ({ file }) => {
      const buffer = await file.arrayBuffer();
      assets?.file(file.name, buffer);
    })
  );

  // Step 5: Generate the ZIP and trigger download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}