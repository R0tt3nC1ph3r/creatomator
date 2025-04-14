import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, writeFileXLSX } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  const templateBuffer = await templateFile.arrayBuffer();
  const workbook = read(templateBuffer, { type: "buffer" });
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

  const updatedXLSXBlob = new Blob([
    writeFileXLSX(workbook, { bookType: "xlsx", type: "array" })
  ], { type: "application/octet-stream" });

  const zip = new JSZip();
  const folderName = `Creatives_${data[0].campaignId}_${data[0].date}`;
  const folder = zip.folder(folderName);

  data.forEach((entry) => {
    folder?.file(entry.file.name, entry.file);
  });

  folder?.file("Hosted_Display_Template.xlsx", updatedXLSXBlob);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${folderName}.zip`);
}
