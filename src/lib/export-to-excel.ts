import { read, utils, write } from "xlsx";
import { saveAs } from "file-saver";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToExcel(data: CreativeData[], templateFile: File) {
  // Read the uploaded template file into an ArrayBuffer
  const arrayBuffer = await templateFile.arrayBuffer();

  // Load the workbook from buffer
  const workbook = read(arrayBuffer, { type: "buffer" });

  // Get the 'Hosted Display' worksheet
  const sheet = workbook.Sheets["Hosted Display"];

  // Inject data starting at row 2
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

  // Generate a new binary workbook
  const xlsxBlob = new Blob([write(workbook, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  // Save file with the same name TTD expects
  saveAs(xlsxBlob, "bulkcreativeimporttemplate.v34__6__copy.xlsx");
}
