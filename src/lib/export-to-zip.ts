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
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets["Hosted Display"];

  data.forEach((entry, i) => {
    const row = 2 + i;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;
    sheet[`A${row}`] = { t: "s", v: creativeName };
    sheet[`C${row}`] = { t: "s", v: entry.file.name };
    sheet[`D${row}`] = { t: "s", v: entry.cturl };
    sheet[`E${row}`] = { t: "s", v: entry.landingPage };
  });

  const workbookBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

  const zip = new JSZip();
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  for (const entry of data) {
    const fileBuffer = await entry.file.arrayBuffer();
    zip.file(entry.file.name, fileBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}
