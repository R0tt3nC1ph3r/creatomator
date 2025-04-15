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
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook = read(arrayBuffer);
    const sheetName = "Hosted Display";
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) throw new Error(`Sheet "${sheetName}" not found in template.`);

    const originalRows = utils.sheet_to_json(sheet, { header: 1 }) as any[]; // full AOA
    const headers = originalRows[0];
    const body = originalRows.slice(1);

    const injectedRows = data.map((item) => {
      const row: any[] = Array(headers.length).fill(""); // preserve original column count
      row[0] = `${item.file.name.split(".")[0]}_${item.campaignId}_${item.date}`; // Column A
      row[2] = item.file.name; // Column C
      row[3] = item.cturl;     // Column D
      row[4] = item.landingPage; // Column E
      return row;
    });

    const combined = [headers, ...injectedRows, ...body];
    const updatedSheet = utils.aoa_to_sheet(combined);
    workbook.Sheets[sheetName] = updatedSheet;

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
