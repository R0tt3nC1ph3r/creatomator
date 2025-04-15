"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle } from "lucide-react";
import { exportToZip } from "@/lib/export-to-zip";

interface CTURLData {
  url: string;
  valid: boolean;
  removeTerm: boolean;
}

export default function CampaignForm() {
  const [campaignId, setCampaignId] = useState("");
  const [landingPage, setLandingPage] = useState("");
  const [clientCTURL, setClientCTURL] = useState("");
  const [useClientCTURL, setUseClientCTURL] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [cturls, setCturls] = useState<CTURLData[]>([]);
  const [removeTermGlobal, setRemoveTermGlobal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const templateInputRef = useRef<HTMLInputElement | null>(null);

  const today = (() => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(2);
    return `${mm}${dd}${yy}`;
  })();

  const buildCTURL = (base: string, campaignId: string, removeTerm = false): string => {
    try {
      const url = new URL(base);
      url.searchParams.set("utm_source", "3461");
      url.searchParams.set("utm_medium", "Display");
      url.searchParams.set("utm_campaign", campaignId);
      if (!removeTerm) {
        url.search += (url.search ? "&" : "?") + "utm_term=%%TTD_CAMPAIGNID%%";
      }
      return url.toString();
    } catch {
      return "";
    }
  };

  const validateUrls = async (filesList: File[], useRemoveTerm: boolean) => {
    const updated = await Promise.all(
      filesList.map(async () => {
        const url = useClientCTURL ? clientCTURL : buildCTURL(landingPage, campaignId, useRemoveTerm);
        try {
          await fetch(url, { method: "HEAD", mode: "no-cors" });
          return { url, valid: true, removeTerm: useRemoveTerm };
        } catch {
          return { url, valid: false, removeTerm: useRemoveTerm };
        }
      })
    );
    setCturls(updated);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const fileList = Array.from(e.dataTransfer.files);
    await processFiles(fileList);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files ? Array.from(e.target.files) : [];
    await processFiles(fileList);
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setTemplateFile(file);
  };

  const processFiles = async (fileList: File[]) => {
    setFiles(fileList);
    await validateUrls(fileList, removeTermGlobal);
  };

  const toggleRemoveTermGlobal = async () => {
    const newRemove = !removeTermGlobal;
    setRemoveTermGlobal(newRemove);
    await validateUrls(files, newRemove);
  };

  const toggleUseClientCTURL = async () => {
    const newValue = !useClientCTURL;
    setUseClientCTURL(newValue);
    await validateUrls(files, removeTermGlobal);
  };

  const handleExport = () => {
    if (!files.length || !campaignId || !landingPage || !templateFile) {
      alert("Please complete all fields and upload files/template.");
      return;
    }
    setShowSummary(true);
  };

  const confirmExport = async () => {
    if (!templateFile) return;
    const data = files.map((file, index) => ({
      file,
      campaignId,
      cturl: cturls[index]?.url ?? "",
      landingPage,
      date: today,
    }));
    await exportToZip(data, templateFile);
    setShowSummary(false);
  };

  const validCount = cturls.filter((c) => c.valid).length;
  const invalidCount = cturls.length - validCount;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-neutral-950 text-white min-h-screen">
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Label className="text-neutral-300">Campaign ID</Label>
            <Input
              className="mt-2 bg-neutral-900 border border-neutral-700 text-white"
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter Campaign ID"
            />
          </div>
          <div>
            <Label className="text-neutral-300">Landing Page</Label>
            <Input
              className="mt-2 bg-neutral-900 border border-neutral-700 text-white"
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Client-Provided CTURL (Optional)</Label>
          <Input
            className="mt-2 bg-neutral-900 border border-neutral-700 text-white"
            value={clientCTURL}
            onChange={(e) => setClientCTURL(e.target.value)}
            placeholder="https://example.com/?utm_source=..."
          />
        </div>

        <div className="flex items-center gap-4">
          <Checkbox checked={useClientCTURL} onCheckedChange={toggleUseClientCTURL} />
          <span className="text-sm text-neutral-300">
            Use client-provided CTURL instead of auto-generated one
          </span>
        </div>

        <div>
          <Label className="text-neutral-300">Upload Creatives</Label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 border-2 border-dashed border-neutral-700 bg-neutral-900 p-6 rounded-md text-center cursor-pointer hover:border-orange-500"
          >
            <p className="text-neutral-500">Drag & drop files here or click to select</p>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
          </div>
        </div>

        <div>
          <Label className="text-neutral-300">Upload TTD Template</Label>
          <Input
            ref={templateInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleTemplateUpload}
            className="mt-2 bg-neutral-900 border border-neutral-700 text-white"
          />
        </div>

        <div className="flex items-center gap-4">
          <Checkbox checked={removeTermGlobal} onCheckedChange={toggleRemoveTermGlobal} />
          <span className="text-sm text-orange-400">
            Remove <code className="bg-neutral-800 px-1 rounded">utm_term=%%TTD_CAMPAIGNID%%</code> from all CTURLs
          </span>
        </div>

        <div>
          <Button onClick={handleExport} variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
            Export as ZIP
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {files.map((file, index) => {
            const baseName = file.name.split(".")[0];
            const fileName = `${baseName}_${campaignId}_${today}`;
            const cturl = cturls[index]?.url ?? "";

            return (
              <div key={fileName} className="rounded-xl bg-neutral-900 border border-neutral-700 p-4 space-y-3">
                <p className="font-semibold text-white text-sm">{fileName}</p>
                <p className="text-xs text-neutral-400 break-words">{cturl}</p>
                <div className="flex items-center gap-2">
                  {cturls[index]?.valid ? (
                    <CheckCircle className="text-green-400 h-4 w-4" />
                  ) : (
                    <XCircle className="text-red-400 h-4 w-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Dialog open={showSummary} onOpenChange={setShowSummary}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Export</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm text-neutral-300">
              <p><strong>Campaign ID:</strong> {campaignId}</p>
              <p><strong>Creatives:</strong> {files.length}</p>
              <p><strong>Valid CTURLs:</strong> {validCount}</p>
              {invalidCount > 0 && <p className="text-red-500">⚠️ {invalidCount} CTURL(s) not valid</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowSummary(false)}>Cancel</Button>
              <Button onClick={confirmExport} className="bg-orange-500 text-white hover:bg-orange-600">Export Now</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
