"use client";

import { SidebarMenuAction } from "ui/sidebar";
import Link from "next/link";
import { SidebarMenuButton, SidebarMenuSkeleton } from "ui/sidebar";
import { SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "ui/sidebar";
import { SidebarGroup } from "ui/sidebar";
import {
  ArrowUpRightIcon,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  UploadIcon,
  FileText,
  FileCheck,
  AlertCircle,
} from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { useCallback, useState, useRef } from "react";
import { cn } from "lib/utils";
import { UploadModal } from "@/components/documents/upload-modal";

const DISPLAY_LIMIT = 5;

type DocumentStatus = "pending" | "processing" | "completed" | "failed";

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  extractedPages?: number;
  uploadedAt: string;
}

export function AppSidebarDocuments() {
  const mounted = useMounted();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const documents: Document[] = [];
  const isLoading = false;

  const handleUploadClick = useCallback(() => {
    setUploadModalOpen(true);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    console.log("Upload successful, refreshing documents...");
  }, []);

  const handleDocumentClick = useCallback((id: string) => {
    console.log("Document clicked:", id);
  }, []);

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "completed":
        return <FileCheck className="size-3.5 text-green-500" />;
      case "processing":
        return <FileText className="size-3.5 text-blue-500 animate-pulse" />;
      case "failed":
        return <AlertCircle className="size-3.5 text-red-500" />;
      default:
        return <FileText className="size-3.5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 ring-green-500/20";
      case "processing":
        return "bg-blue-500/10 ring-blue-500/20";
      case "failed":
        return "bg-red-500/10 ring-red-500/20";
      default:
        return "bg-muted ring-border";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <>
      <SidebarGroup>
        {/* Hidden file input (fallback) */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={() => {}}
          className="hidden"
        />

        <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/documents">
          <SidebarMenu
            className="group/documents"
            data-testid="documents-sidebar-menu"
          >
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="font-semibold">
                <Link href="/documents" data-testid="documents-link">
                  Documents
                </Link>
              </SidebarMenuButton>
              <SidebarMenuAction
                className="group-hover/documents:opacity-100 opacity-0 transition-opacity"
                onClick={handleUploadClick}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <UploadIcon className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent side="right" align="center">
                    Upload Document
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuAction>
            </SidebarMenuItem>

            {isLoading ? (
              <SidebarMenuItem>
                {Array.from({ length: 2 }).map(
                  (_, index) => mounted && <SidebarMenuSkeleton key={index} />,
                )}
              </SidebarMenuItem>
            ) : documents.length === 0 ? (
              <div className="px-2 mt-1">
                <div
                  onClick={handleUploadClick}
                  className="bg-input/40 py-8 px-4 hover:bg-input/100 rounded-lg cursor-pointer flex justify-between items-center text-xs overflow-hidden"
                >
                  <div className="gap-1 z-10">
                    <div className="flex items-center mb-4 gap-1">
                      <p className="font-semibold">Upload Document</p>
                      <ArrowUpRightIcon className="size-3" />
                    </div>
                    <p className="text-muted-foreground">
                      Upload documents to extract text and data
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="relative">
                  {expanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-4 z-10 pointer-events-none bg-gradient-to-t from-background to-transparent" />
                  )}
                  <div
                    className={cn(
                      "w-full",
                      expanded && "max-h-[400px] overflow-y-auto",
                    )}
                  >
                    {(expanded
                      ? documents
                      : documents.slice(0, DISPLAY_LIMIT)
                    )?.map((doc) => {
                      return (
                        <SidebarMenu
                          key={doc.id}
                          className="group/document mr-0 w-full"
                        >
                          <SidebarMenuItem
                            className="px-2 cursor-pointer w-full"
                            onClick={() => handleDocumentClick(doc.id)}
                          >
                            <SidebarMenuButton
                              asChild
                              className="data-[state=open]:bg-input! w-full"
                            >
                              <div className="flex gap-2 w-full min-w-0 items-center">
                                <div
                                  className={cn(
                                    "p-1.5 rounded-lg ring-2 flex items-center justify-center",
                                    getStatusColor(doc.status),
                                  )}
                                >
                                  {getStatusIcon(doc.status)}
                                </div>

                                <div className="flex flex-col min-w-0 w-full">
                                  <p
                                    className="truncate text-sm font-medium"
                                    data-testid="sidebar-document-name"
                                  >
                                    {doc.name}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatFileSize(doc.fileSize)}</span>
                                    {doc.extractedPages && (
                                      <>
                                        <span>•</span>
                                        <span>{doc.extractedPages} pages</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <SidebarMenuAction className="data-[state=open]:bg-input! data-[state=open]:opacity-100 opacity-0 group-hover/document:opacity-100 mr-2">
                                    <MoreHorizontal className="size-4" />
                                  </SidebarMenuAction>
                                </div>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      );
                    })}
                  </div>
                </div>

                {/* Show More/Less Button */}
                {documents.length > DISPLAY_LIMIT && (
                  <SidebarMenu className="group/showmore">
                    <SidebarMenuItem className="px-2 cursor-pointer">
                      <SidebarMenuButton
                        onClick={() => setExpanded(!expanded)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <div className="flex items-center gap-1">
                          <p className="text-xs">
                            {expanded ? "Show Less" : "Show More"}
                          </p>
                          {expanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                )}
              </div>
            )}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Upload Modal */}
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </>
  );
}
