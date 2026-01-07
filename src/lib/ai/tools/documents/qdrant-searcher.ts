import { tool as createTool } from "ai";
import { JSONSchema7 } from "json-schema";
import { jsonSchemaToZod } from "lib/json-schema-to-zod";
import { safe } from "ts-safe";

// RAG Document Query Types
export interface RAGDocumentQueryRequest {
  query: string;
  limit?: number;
  score_threshold?: number;
}

export interface RAGDocumentResponse {
  result: string;
  path?: string; // Tambahkan field path
}

export interface RAGDocumentResult {
  result: string;
  path?: string;
}

export const ragDocumentQuerySchema: JSONSchema7 = {
  type: "object",
  properties: {
    query: {
      type: "string",
      description:
        "Pertanyaan atau kata kunci untuk mencari dokumen yang relevan dari knowledge base",
    },
  },
  required: ["query"],
};

const RAG_API_BASE_URL = "http://172.16.100.249:7052";

const fetchRAGDocuments = async (
  query: string,
): Promise<RAGDocumentResponse> => {
  const payload: RAGDocumentQueryRequest = {
    query: query,
    limit: 3,
    score_threshold: 0.5,
  };

  const response = await fetch(`${RAG_API_BASE_URL}/document/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`RAG API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

const processRAGResults = (response: RAGDocumentResponse) => {
  // Return content dari result dan path jika ada
  return {
    status: "success",
    message: "Document retrieved successfully",
    content: response.result,
    path: response.path || "Unknown path", // Default value jika path tidak ada
    guide: `Gunakan hasil pencarian dokumen ini untuk menjawab pertanyaan user.`,
  };
};

export const ragDocumentTool = createTool({
  description:
    "Search through document knowledge base using RAG (Retrieval Augmented Generation) - finds relevant documents and content based on semantic search. Useful for answering questions based on internal documents, policies, procedures, and knowledge base content.",
  inputSchema: jsonSchemaToZod(ragDocumentQuerySchema),
  execute: async (params) => {
    return safe(async () => {
      const result = await fetchRAGDocuments(params.query);
      return processRAGResults(result);
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "Terjadi error saat mencari dokumen. Jelaskan error tersebut kepada user dan coba gunakan pengetahuan umum untuk menjawab pertanyaannya.",
        };
      })
      .unwrap();
  },
});

export const ragDocumentToolForWorkflow = createTool({
  description:
    "Search through document knowledge base using RAG (Retrieval Augmented Generation)",
  inputSchema: jsonSchemaToZod(ragDocumentQuerySchema),
  execute: async (params) => {
    const payload: RAGDocumentQueryRequest = {
      query: params.query,
      limit: 3,
      score_threshold: 0.5,
    };

    const response = await fetch(`${RAG_API_BASE_URL}/document/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `RAG API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = await response.json();
    return processRAGResults(result);
  },
});
