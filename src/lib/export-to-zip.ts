import { saveAs } from "file-saver";
import JSZip from "jszip";
import { read, write } from "xlsx";

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

  // ✅ FIX: Use write() to generate array buffer
  const updatedXLSXBuffer = write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const zip = new JSZip();
  zip.file("Hosted_Display_Export.xlsx", updatedXLSXBuffer);

  for (const entry of data) {
    zip.file(entry.file.name, entry.file);
  }

  const finalZip = await zip.generateAsync({ type: "blob" });
  saveAs(finalZip, `CreatomatorExport_${Date.now()}.zip`);
}
