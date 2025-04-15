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
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px", background: "#f6f6f6" }}>
      <div style={{ background: "#fff", padding: "24px", borderRadius: "12px", boxShadow: "0 0 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          <div>
            <Label style={{ color: "#444", fontWeight: 600 }}>Campaign ID</Label>
            <Input
              style={{ marginTop: "8px" }}
              value={campaignId}
              onChange={(e) => setCampaignId(e.target.value)}
              placeholder="Enter Campaign ID"
            />
          </div>
          <div>
            <Label style={{ color: "#444", fontWeight: 600 }}>Landing Page</Label>
            <Input
              style={{ marginTop: "8px" }}
              value={landingPage}
              onChange={(e) => setLandingPage(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Label style={{ color: "#444", fontWeight: 600 }}>Client CTURL (optional)</Label>
          <Input
            style={{ marginTop: "8px" }}
            value={clientCTURL}
            onChange={(e) => setClientCTURL(e.target.value)}
            placeholder="https://example.com/?utm_source=..."
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", gap: "10px" }}>
          <Checkbox checked={useClientCTURL} onCheckedChange={toggleUseClientCTURL} />
          <span style={{ fontSize: "14px", color: "#333" }}>Use client-provided CTURL</span>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Label style={{ color: "#444", fontWeight: 600 }}>Upload Creatives</Label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: "12px",
              border: "2px dashed #bbb",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
              cursor: "pointer",
              background: "#fafafa",
            }}
          >
            <p style={{ color: "#555" }}>Drag & drop files here or click to select</p>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <Label style={{ color: "#444", fontWeight: 600 }}>Upload TTD Template</Label>
          <Input ref={templateInputRef} type="file" accept=".xlsx" onChange={handleTemplateUpload} style={{ marginTop: "8px" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "24px", gap: "10px" }}>
          <Checkbox checked={removeTermGlobal} onCheckedChange={toggleRemoveTermGlobal} />
          <span style={{ fontSize: "14px", color: "#333" }}>
            Remove <code style={{ background: "#fffae5", padding: "0 4px", borderRadius: "4px" }}>utm_term=%%TTD_CAMPAIGNID%%</code>
          </span>
        </div>

        <Button
          onClick={handleExport}
          style={{
            backgroundColor: "#222",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "8px",
            fontWeight: 600,
            marginBottom: "32px",
          }}
        >
          Export as ZIP
        </Button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {files.map((file, index) => {
            const baseName = file.name.split(".")[0];
            const fileName = `${baseName}_${campaignId}_${today}`;
            const cturl = cturls[index]?.url ?? "";
            const borderColor = cturls[index]?.valid ? "#4CAF50" : "#f44336";

            return (
              <div
                key={fileName}
                style={{
                  border: `1px solid ${borderColor}`,
                  borderRadius: "10px",
                  padding: "12px",
                  background: "#fff",
                  boxShadow: "0 0 6px rgba(0,0,0,0.03)",
                }}
              >
                <p style={{ fontWeight: 600, fontSize: "14px", color: "#222" }}>{fileName}</p>
                <p style={{ fontSize: "12px", color: "#666", wordBreak: "break-all" }}>{cturl}</p>
                <div style={{ marginTop: "4px" }}>
                  {cturls[index]?.valid ? (
                    <CheckCircle color="green" size={16} />
                  ) : (
                    <XCircle color="red" size={16} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Export</DialogTitle>
          </DialogHeader>
          <div style={{ fontSize: "14px", color: "#333" }}>
            <p><strong>Campaign ID:</strong> {campaignId}</p>
            <p><strong>Creatives:</strong> {files.length}</p>
            <p><strong>Valid CTURLs:</strong> {validCount}</p>
            {invalidCount > 0 && <p style={{ color: "#e53935" }}>⚠️ {invalidCount} CTURL(s) not valid</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowSummary(false)}>Cancel</Button>
            <Button onClick={confirmExport}>Export Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
