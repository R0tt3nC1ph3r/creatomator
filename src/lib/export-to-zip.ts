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
  const buffer = await templateFile.arrayBuffer();
  const workbook = read(buffer);
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

  const updatedXLSXBuffer = write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const updatedXLSXBlob = new Blob([updatedXLSXBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const zip = new JSZip();
  const campaignFolder = zip.folder(`${data[0].campaignId}_${data[0].date}`);

  campaignFolder?.file("Hosted_Display_Export.xlsx", updatedXLSXBlob);
  const creativesFolder = campaignFolder?.folder("creatives");

  await Promise.all(
    data.map(async ({ file }) => {
      const arrayBuffer = await file.arrayBuffer();
      creativesFolder?.file(file.name, arrayBuffer);
    })
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `${data[0].campaignId}_${data[0].date}_Export.zip`);
}
