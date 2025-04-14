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
  const workbook: WorkBook = read(arrayBuffer, { type: "array" });

  const sheetName = "Hosted Display";
  const ws = workbook.Sheets[sheetName];

  if (!ws) {
    alert(`Sheet '${sheetName}' not found in the template.`);
    return;
  }

  // Inject creative data starting from row 2
  data.forEach((item, index) => {
    const row = index + 2;
    const baseName = item.file.name.split(".")[0];
    const finalName = `${baseName}_${item.campaignId}_${item.date}`;

    ws[`A${row}`] = { t: "s", v: finalName }; // Creative Name
    ws[`D${row}`] = { t: "s", v: item.cturl }; // CTURL
    ws[`I${row}`] = { t: "s", v: item.landingPage }; // Landing Page
    ws[`L${row}`] = { t: "s", v: item.file.name }; // Filename
  });

  const zip = new JSZip();
  const workbookBuffer = writeFile(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  // Add filled out workbook
  zip.file(templateFile.name, workbookBuffer);

  // Add each creative
  data.forEach((item) => {
    zip.file(item.file.name, item.file);
  });

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const filename = `CreatomatorExport_${Date.now()}.zip`;
  saveAs(zipBlob, filename);
}
