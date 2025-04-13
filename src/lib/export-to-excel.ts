import { read, writeFileXLSX } from "xlsx";
import { saveAs } from "file-saver";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToExcel(data: CreativeData[]) {
  // Fetch the exact unmodified TTD template
  const response = await fetch("/bulkcreativeimporttemplate.v34__6__copy.xlsx");
  const arrayBuffer = await response.arrayBuffer();

  const workbook = read(arrayBuffer, { type: "buffer", cellStyles: true });
  const sheet = workbook.Sheets["Hosted Display"];

  const startRow = 2;
  data.forEach((item, i) => {
    const row = startRow + i;
    const base = item.file.name.split(".")[0];
    const creativeName = `${base}_${item.campaignId}_${item.date}`;

    sheet[`A${row}`] = { t: "s", v: creativeName };
    sheet[`C${row}`] = { t: "s", v: item.file.name };
    sheet[`D${row}`] = { t: "s", v: item.cturl };
    sheet[`E${row}`] = { t: "s", v: item.landingPage };
  });

  // Create a binary array of the updated workbook
  const updated = writeFileXLSX(workbook, null, { bookType: "xlsx", type: "array" });

  // Create and download the final Blob
  const blob = new Blob([updated], { type: "application/octet-stream" });
  saveAs(blob, `Hosted_Display_Export_${Date.now()}.xlsx`);
}
