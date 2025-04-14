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

  const sheetName = "Hosted Display";
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    alert(`Sheet "${sheetName}" not found in uploaded workbook.`);
    return;
  }

  // Inject data into rows starting at row 2
  const startRow = 2;
  data.forEach((entry, index) => {
    const row = startRow + index;
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;

    sheet[`A${row}`] = { t: "s", v: creativeName };
    sheet[`C${row}`] = { t: "s", v: entry.file.name };
    sheet[`D${row}`] = { t: "s", v: entry.cturl };
    sheet[`E${row}`] = { t: "s", v: entry.landingPage };
  });

  // Manually update sheet range so Excel recognizes new rows
  const endRow = startRow + data.length - 1;
  sheet["!ref"] = `A1:E${endRow}`;

  // Generate buffer from updated workbook
  const workbookBuffer = write(workbook, { bookType: "xlsx", type: "buffer" });

  // Build ZIP with creatives + workbook in same root
  const zip = new JSZip();
  zip.file("bulkcreativeimporttemplate.v34__6__copy.xlsx", workbookBuffer);

  for (const entry of data) {
    const fileBuffer = await entry.file.arrayBuffer();
    zip.file(entry.file.name, fileBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}
