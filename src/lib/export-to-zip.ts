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
  // Step 1: Load and parse the uploaded template file
  const arrayBuffer = await templateFile.arrayBuffer();
  const workbook = read(arrayBuffer, { type: "array" });
  const sheetName = "Hosted Display";
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    alert("The uploaded template is missing the 'Hosted Display' tab.");
    return;
  }

  // Step 2: Inject creative data starting from row 2
  data.forEach((item, index) => {
    const rowIndex = index + 2;
    const baseName = item.file.name.split(".")[0];
    const finalName = `${baseName}_${item.campaignId}_${item.date}`;

    sheet[`A${rowIndex}`] = { v: "Creative" };
    sheet[`B${rowIndex}`] = { v: finalName };
    sheet[`C${rowIndex}`] = { v: item.cturl };
    sheet[`D${rowIndex}`] = { v: item.file.name };
    sheet[`E${rowIndex}`] = { v: item.file.type.includes("video") ? "Hosted Video" : "Hosted Display" };
  });

  // Step 3: Write the updated workbook to buffer and prepare ZIP
  const workbookBuffer = write(workbook, {
    bookType: "xlsx",
    type: "buffer",
  });

  const zip = new JSZip();
  zip.file(templateFile.name, workbookBuffer);

  for (const item of data) {
    const fileBuffer = await item.file.arrayBuffer();
    zip.file(item.file.name, fileBuffer);
  }

  // Step 4: Generate and download the ZIP file
  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, `CreatomatorExport_${Date.now()}.zip`);
}