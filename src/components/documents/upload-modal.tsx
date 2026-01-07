"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import { Button } from "ui/button";
import { Progress } from "ui/progress";
import { Alert, AlertDescription } from "ui/alert";
import {
  UploadIcon,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "lib/utils";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  error?: string;
  result?: any;
}

export function UploadModal({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [folderName, setFolderName] = useState("documents");
  const [extractImages, setExtractImages] = useState(true);
  const [forceReinsert, setForceReinsert] = useState(true); // Diubah dari false ke true

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    console.log(
      "📁 Files dropped:",
      files.map((f) => f.name),
    );
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      console.log(
        "📁 Files selected:",
        files.map((f) => f.name),
      );
      handleFiles(files);
    },
    [],
  );

  const handleFiles = useCallback((files: File[]) => {
    // Filter untuk file PDF saja
    const pdfFiles = files.filter((file) => {
      const isPDF = /\.(pdf)$/i.test(file.name);
      return isPDF;
    });

    const nonPDFFiles = files.filter((file) => {
      const isPDF = /\.(pdf)$/i.test(file.name);
      return !isPDF;
    });

    if (nonPDFFiles.length > 0) {
      console.warn(
        "⚠️ Non-PDF files skipped:",
        nonPDFFiles.map((f) => f.name),
      );
      alert(
        `⚠️ ${nonPDFFiles.length} file non-PDF dilewati. Hanya file PDF yang didukung.`,
      );
    }

    console.log(
      "✅ PDF files added:",
      pdfFiles.map((f) => f.name),
    );
    setSelectedFiles((prev) => [...prev, ...pdfFiles]);
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      const fileToRemove = selectedFiles[index];
      console.log("🗑️ File removed:", fileToRemove.name);
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    },
    [selectedFiles],
  );

  const uploadToAPI = async (file: File): Promise<any> => {
    console.log(`🚀 Starting upload for: ${file.name} (${file.size} bytes)`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder_name", folderName);
    formData.append("extract_images", extractImages.toString());
    formData.append("force_reinsert", forceReinsert.toString()); // Sekarang default true

    try {
      const response = await fetch(
        "http://172.16.100.249:7052/document/insert/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        console.error(
          `❌ Upload failed for ${file.name}:`,
          response.status,
          response.statusText,
        );

        // Handle specific error cases
        if (response.status === 409) {
          throw new Error(
            "File sudah ada di database. Gunakan force reinsert untuk menggantinya.",
          );
        }

        const errorText = await response.text();
        console.error(`❌ Error response:`, errorText);
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log(`✅ Upload successful for: ${file.name}`, result);
      return result;
    } catch (error) {
      console.error(`❌ Upload error for ${file.name}:`, error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    console.log(
      `📤 Starting upload process for ${selectedFiles.length} files:`,
      selectedFiles.map((f) => f.name),
    );
    console.log(
      `⚙️ Settings - Folder: ${folderName}, Extract Images: ${extractImages}, Force Reinsert: ${forceReinsert}`,
    );

    setIsUploading(true);
    const progressMap: UploadProgress[] = selectedFiles.map((file) => ({
      fileName: file.name,
      progress: 0,
      status: "uploading",
    }));

    setUploadProgress(progressMap);

    let successfulUploads = 0;
    let failedUploads = 0;

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      try {
        console.log(
          `⏳ Uploading file ${i + 1}/${selectedFiles.length}: ${file.name}`,
        );

        // Update progress to 50% (uploading phase)
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, progress: 50 } : item,
          ),
        );

        // Actual API call
        const result = await uploadToAPI(file);

        // Update progress to 100% and status to processing
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? { ...item, status: "processing", progress: 100 }
              : item,
          ),
        );

        // Wait a bit to show processing state
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update to completed
        console.log(`🎉 Upload completed for: ${file.name}`);
        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i ? { ...item, status: "completed", result } : item,
          ),
        );
        successfulUploads++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        console.error(`💥 Upload failed for ${file.name}:`, errorMessage);

        setUploadProgress((prev) =>
          prev.map((item, index) =>
            index === i
              ? {
                  ...item,
                  status: "error",
                  error: errorMessage,
                  progress: 100,
                }
              : item,
          ),
        );
        failedUploads++;
      }
    }

    console.log(
      `📊 Upload summary: ${successfulUploads} successful, ${failedUploads} failed`,
    );

    if (failedUploads === 0) {
      console.log("🎯 All files uploaded successfully!");
      // Auto-close modal after 2 seconds if all successful
      setTimeout(() => {
        handleOpenChange(false);
      }, 2000);
    } else {
      console.warn(`⚠️ ${failedUploads} file(s) failed to upload`);
    }

    setIsUploading(false);

    if (successfulUploads > 0) {
      console.log("✅ Upload success callback triggered");
      onUploadSuccess?.();
    }
  };

  const resetModal = () => {
    console.log("🔄 Resetting modal state");
    setSelectedFiles([]);
    setUploadProgress([]);
    setIsUploading(false);
    setFolderName("documents");
    setExtractImages(true);
    setForceReinsert(true); // Diubah dari false ke true
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />;
      case "error":
        return <AlertCircle className="size-4 text-red-500" />;
      case "processing":
        return <FileText className="size-4 text-blue-500 animate-pulse" />;
      default:
        return <FileText className="size-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: UploadProgress["status"]) => {
    switch (status) {
      case "uploading":
        return "Uploading...";
      case "processing":
        return "Processing...";
      case "completed":
        return "Completed";
      case "error":
        return "Error";
      default:
        return "Pending";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const allUploadsCompleted =
    uploadProgress.length > 0 &&
    uploadProgress.every(
      (progress) =>
        progress.status === "completed" || progress.status === "error",
    );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload PDF Documents</DialogTitle>
        </DialogHeader>

        {/* Settings Section */}
        {selectedFiles.length > 0 && !isUploading && (
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Enter folder name"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="extract-images"
                  checked={extractImages}
                  onChange={(e) => setExtractImages(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="extract-images" className="text-sm font-medium">
                  Extract Images
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="force-reinsert"
                  checked={forceReinsert}
                  onChange={(e) => setForceReinsert(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="force-reinsert" className="text-sm font-medium">
                  Force Reinsert
                </label>
              </div>
            </div>

            {!forceReinsert && ( // Sekarang pesan ini hanya muncul jika forceReinsert = false
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="size-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Jika file sudah ada di database, upload
                  akan gagal. Centang &quot;Force Reinsert&quot; untuk mengganti
                  file yang sudah ada.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Drag & Drop Area */}
        {selectedFiles.length === 0 && (
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadIcon className="size-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              Drop PDF files here or click to browse
            </p>
            <p className="text-sm text-gray-500">Supports PDF documents only</p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <FileText className="size-5 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>

                  {!isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="space-y-3">
                {uploadProgress.map((progress, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getStatusIcon(progress.status)}
                        <span className="text-sm font-medium truncate">
                          {progress.fileName}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs capitalize whitespace-nowrap",
                          progress.status === "completed" && "text-green-600",
                          progress.status === "error" && "text-red-600",
                          progress.status === "processing" && "text-blue-600",
                          progress.status === "uploading" && "text-gray-600",
                        )}
                      >
                        {getStatusText(progress.status)}
                      </span>
                    </div>
                    <Progress value={progress.progress} className="h-2" />
                    {progress.error && (
                      <Alert variant="destructive" className="py-2">
                        <AlertDescription className="text-xs">
                          {progress.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Success Message */}
            {allUploadsCompleted &&
              uploadProgress.every((p) => p.status === "completed") && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    All files uploaded successfully! Closing...
                  </AlertDescription>
                </Alert>
              )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => document.getElementById("file-input")?.click()}
                disabled={isUploading}
              >
                Add More PDF Files
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </Button>

              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                >
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${selectedFiles.length} PDF${selectedFiles.length > 1 ? "s" : ""}`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
