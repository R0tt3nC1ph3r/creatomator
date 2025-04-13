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

export async function exportToZip(data: CreativeData[]) {
  const zip = new JSZip();

  const campaignId = data[0]?.campaignId || "Export";
  const folder = zip.folder(`Creatomator_${campaignId}`);
  const assets = folder?.folder("assets");

  // Load template
  const template = await fetch("/template.xlsx").then((res) => res.arrayBuffer());
  const workbook = read(template, { type: "buffer" });
  const sheet = workbook.Sheets["Hosted Display"];

  // Fill in data rows
  const rows = data.map((entry) => {
    const baseName = entry.file.name.split(".")[0];
    const creativeName = `${baseName}_${entry.campaignId}_${entry.date}`;
    return [creativeName, "", entry.file.name, entry.cturl, entry.landingPage];
  });

  utils.sheet_add_aoa(sheet, rows, { origin: "A2" });

  const excelBlob = new Blob(
    [write(workbook, { type: "array", bookType: "xlsx" })],
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }
  );

  folder?.file("Hosted_Display_Export.xlsx", excelBlob);

  for (const entry of data) {
    const arrayBuffer = await entry.file.arrayBuffer();
    assets?.file(entry.file.name, arrayBuffer);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `Creatomator_${campaignId}_${Date.now()}.zip`);
}
