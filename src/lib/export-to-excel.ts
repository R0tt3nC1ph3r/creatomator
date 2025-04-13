import { read, utils, write, WorkBook } from "xlsx";
import { saveAs } from "file-saver";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToExcel(data: CreativeData[]) {
  const res = await fetch("/template.xlsx");
  const buffer = await res.arrayBuffer();

  const workbook: WorkBook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets["Hosted Display"];

  // Convert incoming data to a 2D array format for easy AOA injection
  const rows = data.map((entry) => {
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;
    return [creativeName, "", entry.file.name, entry.cturl, entry.landingPage];
  });

  // Inject into sheet starting at A2
  utils.sheet_add_aoa(sheet, rows, { origin: "A2" });

  const blob = new Blob(
    [write(workbook, { type: "array", bookType: "xlsx" })],
    { type: "application/octet-stream" }
  );

  saveAs(blob, `Hosted_Display_Export_${Date.now()}.xlsx`);
}
