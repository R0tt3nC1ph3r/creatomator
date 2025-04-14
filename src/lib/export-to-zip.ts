import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, writeFile, WorkBook } from "xlsx";

interface CreativeData {
  file: File;
  campaignId: string;
  cturl: string;
  landingPage: string;
  date: string;
}

export async function exportToZip(data: CreativeData[], templateFile: File) {
  try {
    // Step 1: Read uploaded template workbook as binary
    const arrayBuffer = await templateFile.arrayBuffer();
    const workbook: WorkBook = read(arrayBuffer, { type: "array" });

    const sheetName = "Hosted Display";
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new Error("Hosted Display sheet not found");

    // Convert sheet to JSON to determine headers
    const json = utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    const headers = json[0];

    // Step 2: Inject new creative data starting on row 2
    const newRows = data.map((item) => {
      const baseName = item.file.name.split(".")[0];
      const fullName = `${baseName}_${item.campaignId}_${item.date}`;

      return headers.map((header) => {
        switch (header) {
          case "Name (required)":
            return fullName;
          case "Asset File Name (required)":
            return item.file.name;
          case "Clickthrough URL (required)":
            return item.cturl;
          case "Landing Page URL (required)":
            return item.landingPage;
          default:
            return "";
        }
      });
    });

    // Merge with original rows
    const updatedSheetData = [headers, ...newRows];
    const updatedSheet = utils.aoa_to_sheet(updatedSheetData);
    workbook.Sheets[sheetName] = updatedSheet;

    // Step 3: Write the updated workbook to buffer
    const workbookBuffer = writeFile(workbook, templateFile.name, {
      bookType: "xlsx",
      type: "buffer",
    });

    // Step 4: Create ZIP
    const zip = new JSZip();
    zip.file(templateFile.name, workbookBuffer);

    for (const item of data) {
      const arrayBuffer = await item.file.arrayBuffer();
      zip.file(item.file.name, arrayBuffer);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export. Please check your input and try again.");
  }
}