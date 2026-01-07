import { useState, useEffect, useCallback } from "react";

export type DocumentStatus = "pending" | "processing" | "completed" | "failed";

export interface Document {
  id: string;
  name: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  extractedPages?: number;
  uploadedAt: string;
  userId: string;
  fileType?: string;
  extractedText?: string;
}

interface UseDocumentsOptions {
  limit?: number;
  status?: DocumentStatus;
}

// Mock API functions - ganti dengan API call yang sebenarnya
const fetchDocuments = async (
  _options: UseDocumentsOptions,
): Promise<Document[]> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/documents?limit=${options.limit}&status=${options.status}`);
  // if (!response.ok) throw new Error('Failed to fetch documents');
  // return response.json();

  // Mock data untuk development
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "1",
          name: "Invoice Q1 2024",
          fileName: "invoice-q1-2024.pdf",
          fileSize: 1024000,
          status: "completed",
          extractedPages: 5,
          uploadedAt: new Date().toISOString(),
          userId: "user-1",
          fileType: "pdf",
        },
        {
          id: "2",
          name: "Contract Agreement",
          fileName: "contract.docx",
          fileSize: 512000,
          status: "processing",
          uploadedAt: new Date().toISOString(),
          userId: "user-1",
          fileType: "docx",
        },
        {
          id: "3",
          name: "Report 2024",
          fileName: "report.pdf",
          fileSize: 2048000,
          status: "completed",
          extractedPages: 12,
          uploadedAt: new Date().toISOString(),
          userId: "user-1",
          fileType: "pdf",
        },
      ]);
    }, 500);
  });
};

const deleteDocumentApi = async (id: string): Promise<void> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  // if (!response.ok) throw new Error('Failed to delete document');
  console.log("Deleting document:", id);
  await new Promise((resolve) => setTimeout(resolve, 500));
};

const reprocessDocumentApi = async (id: string): Promise<void> => {
  // TODO: Replace with actual API call
  // const response = await fetch(`/api/documents/${id}/reprocess`, { method: 'POST' });
  // if (!response.ok) throw new Error('Failed to reprocess document');
  console.log("Reprocessing document:", id);
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { limit = 50, status } = options;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDocuments({ limit, status });
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [limit, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    documents,
    isLoading,
    error,
    refetch,
  };
}

export function useDeleteDocument() {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (
    id: string,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    try {
      setIsPending(true);
      await deleteDocumentApi(id);
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}

export function useReprocessDocument() {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (
    id: string,
    options?: {
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    },
  ) => {
    try {
      setIsPending(true);
      await reprocessDocumentApi(id);
      options?.onSuccess?.();
    } catch (error) {
      options?.onError?.(
        error instanceof Error ? error : new Error("Unknown error"),
      );
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending };
}
