import JSZip from "jszip";
import { saveAs } from "file-saver";
import { read, utils, writeFile } from "xlsx";

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

    // Step 2: Insert new rows into the existing sheet starting from row 2
    const rows = data.map((item) => [
      `${item.file.name.split(".")[0]}_${item.campaignId}_${item.date}`, // Name
      item.file.name, // Asset File Name
      item.cturl, // Clickthrough URL
      item.landingPage, // Landing Page URL
    ]);

    // Convert existing sheet to JSON to get headers
    const json = utils.sheet_to_json(sheet, { header: 1 });

    // Inject our new rows starting at index 1 (below the headers)
    const updatedSheet = utils.aoa_to_sheet([
      ...(json as any[]).slice(0, 1),
      ...rows,
      ...(json as any[]).slice(1),
    ]);

    workbook.Sheets[sheetName] = updatedSheet;

    // Step 3: Generate updated workbook buffer
    const workbookBuffer = writeFile(workbook, templateFile.name, {
      bookType: "xlsx",
      type: "buffer",
    } as any);

    // Step 4: Create a new ZIP and add files
    const zip = new JSZip();
    zip.file(templateFile.name, workbookBuffer);

    for (const item of data) {
      zip.file(item.file.name, item.file);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
  } catch (error) {
    console.error("Export to ZIP failed:", error);
    alert("Export failed. Please check console for details.");
  }
}