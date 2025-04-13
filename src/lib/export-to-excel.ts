import { read, writeFile, utils } from "xlsx";
import { saveAs } from "file-saver";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToExcel(data: CreativeData[]) {
  // Load exact TTD template from /public
  const response = await fetch("/bulkcreativeimporttemplate.v34__6__copy.xlsx");
  const arrayBuffer = await response.arrayBuffer();

  // Read the template without altering sheet names or formatting
  const workbook = read(arrayBuffer, { type: "buffer", cellStyles: true });

  const sheetName = "Hosted Display";
  const ws = workbook.Sheets[sheetName];

  const startRow = 2;
  data.forEach((item, i) => {
    const row = startRow + i;
    const baseName = item.file.name.split(".")[0];
    const creativeName = `${baseName}_${item.campaignId}_${item.date}`;

    ws[`A${row}`] = { t: "s", v: creativeName };
    ws[`C${row}`] = { t: "s", v: item.file.name };
    ws[`D${row}`] = { t: "s", v: item.cturl };
    ws[`E${row}`] = { t: "s", v: item.landingPage };
  });

  const wbout = utils.book_new();
  utils.book_append_sheet(wbout, ws, sheetName);

  const blob = new Blob(
    [writeFile(wbout, { bookType: "xlsx", type: "binary", bookSST: false })],
    { type: "application/octet-stream" }
  );

  saveAs(blob, `Hosted_Display_Export_${Date.now()}.xlsx`);
}
