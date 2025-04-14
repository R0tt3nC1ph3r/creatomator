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

  const zip = new JSZip();
  const updatedXLSXBlob = writeFileXLSX(workbook, {
    bookType: "xlsx",
    type: "blob",
  });

  zip.file("Hosted_Display_Export.xlsx", updatedXLSXBlob);

  for (const entry of data) {
    zip.file(entry.file.name, entry.file);
  }

  const finalZip = await zip.generateAsync({ type: "blob" });
  saveAs(finalZip, `CreatomatorExport_${Date.now()}.zip`);
}
