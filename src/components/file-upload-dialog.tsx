"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Download, Trash2 } from "lucide-react";

// Pilih salah satu opsi toast berikut:

// Opsi 1: Jika menggunakan shadcn/ui toast
// import { useToast } from "@/components/ui/use-toast";

// Opsi 2: Jika menggunakan custom toast
// import { toast } from "sonner"; // atau library toast lainnya

// Opsi 3: Simple alert sebagai fallback
const toast = {
  success: (title: string, description?: string) => {
    alert(`${title}: ${description || ""}`);
  },
  error: (title: string, description?: string) => {
    alert(`Error: ${title} - ${description || ""}`);
  },
};

interface RecentFile {
  id: string;
  name: string;
  size: number;
  url?: string;
}

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileUploadDialog({
  open,
  onOpenChange,
}: FileUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Jika menggunakan shadcn/ui toast, uncomment berikut:
  // const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("folder_name", "development");
    formData.append("extract_images", "yes");
    formData.append("force_reinsert", "false");

    try {
      const response = await axios.post(
        "http://172.16.100.249:7052/document/insert/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgress(percent);
            }
          },
        },
      );

      const newFile: RecentFile = {
        id: response.data.id || Date.now().toString(),
        name: selectedFile.name,
        size: selectedFile.size,
        url: response.data.url,
      };

      setRecentFiles((prev) => [newFile, ...prev.slice(0, 4)]);

      // Pilih salah satu berdasarkan toast yang digunakan:
      toast.success("Upload Berhasil!", `${selectedFile.name} telah diupload.`);
      // atau jika menggunakan shadcn/ui toast:
      // toast({ title: "Upload Berhasil!", description: `${selectedFile.name} telah diupload.` });

      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);

      // Pilih salah satu berdasarkan toast yang digunakan:
      toast.error("Upload Gagal", "Coba lagi atau periksa file.");
      // atau jika menggunakan shadcn/ui toast:
      // toast({ variant: "destructive", title: "Upload Gagal", description: "Coba lagi atau periksa file." });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteRecentFile = (id: string) => {
    setRecentFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const downloadRecentFile = (file: RecentFile) => {
    if (file.url) {
      window.open(file.url, "_blank");
    } else {
      toast.error("Download Tidak Tersedia");
      // atau: toast({ variant: "destructive", title: "Download Tidak Tersedia" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Attach File</DialogTitle>
        </DialogHeader>

        {/* Upload Section */}
        <div className="space-y-4">
          <div>
            <Label>Upload File</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                {isDragActive
                  ? "Drop file di sini..."
                  : "Drag & drop PDF atau klik untuk pilih"}
              </p>
              {selectedFile && (
                <p className="text-sm font-medium mt-2">{selectedFile.name}</p>
              )}
            </div>
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <Button
            onClick={uploadFile}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? "Mengupload..." : "Upload"}
          </Button>
        </div>

        {/* Recent Files Section */}
        {recentFiles.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Files
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadRecentFile(file)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecentFile(file.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
