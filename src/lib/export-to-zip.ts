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
  try {
    // Step 1: Load the uploaded Excel template
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = read(arrayBuffer);
    const sheetName = "Hosted Display";
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) throw new Error(`Sheet "${sheetName}" not found in template.`);

    // Step 2: Convert sheet to JSON and inject new rows
    const json = utils.sheet_to_json(sheet, { header: 1 });
    const newRows = data.map((item) => [
      `${item.file.name.split(".")[0]}_${item.campaignId}_${item.date}`,
      item.file.name,
      item.cturl,
      item.landingPage,
    ]);
    const updatedSheet = utils.aoa_to_sheet([
      ...(json as any[]).slice(0, 1),
      ...newRows,
      ...(json as any[]).slice(1),
    ]);
    workbook.Sheets[sheetName] = updatedSheet;

    // Step 3: Write updated workbook to binary string
    const updatedWorkbookBinary = write(workbook, {
      bookType: "xlsx",
      type: "binary",
    });

    const stringToArrayBuffer = (s: string) => {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    };

    // Step 4: Create a ZIP with updated workbook and creatives
    const zip = new JSZip();
    zip.file(templateFile.name, stringToArrayBuffer(updatedWorkbookBinary));
    for (const item of data) {
      zip.file(item.file.name, item.file);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `CreatomatorExport_${Date.now()}.zip`);
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed. Check console for details.");
  }
}