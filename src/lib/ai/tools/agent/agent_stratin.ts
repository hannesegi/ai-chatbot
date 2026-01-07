import { tool as createTool } from "ai";
import { z } from "zod";

export interface StrategicIntelligenceResult {
  result: string;
  url: string[];
}

export interface StrategicIntelligenceResponse {
  success: boolean;
  data: {
    result: string;
    url: string[];
  };
  error: string | null;
  timestamp: string;
  request_id: string;
}

export const strategicIntelligenceSchema = z.object({
  input_data: z
    .string()
    .describe("Query atau topik untuk analisis strategic intelligence"),
});

const API_BASE_URL = "http://172.16.100.249:7060";

const fetchStrategicIntelligence = async (
  payload: any,
): Promise<StrategicIntelligenceResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/strategic-intelligence`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Strategic Intelligence API error: ${response.status} ${response.statusText}`,
    );
  }

  return await response.json();
};

const safe = <T>(fn: () => Promise<T>) => {
  return {
    ifFail: (errorHandler: (error: Error) => any) => ({
      unwrap: async (): Promise<T> => {
        try {
          return await fn();
        } catch (error) {
          return errorHandler(
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      },
    }),
  };
};

export const strategicIntelligenceTool = createTool({
  description:
    "Agent Analisis strategic intelligence untuk menghasilkan laporan keamanan, threat analysis, dan rekomendasi kebijakan strategis berdasarkan topik atau isu tertentu.",
  inputSchema: strategicIntelligenceSchema,
  execute: async (params: {
    input_data: string;
  }) => {
    try {
      const payload = {
        input_data: params.input_data,
      };

      const response = await fetchStrategicIntelligence(payload);

      if (!response.success) {
        return {
          isError: true,
          error: response.error || "Analysis failed",
          solution:
            "Terjadi error saat melakukan analisis. Coba lagi dengan query yang lebih spesifik.",
          result: null,
          sources: [],
        };
      }

      return {
        result: response.data.result,
        sources: response.data.url,
        total_sources: response.data.url.length,
        request_id: response.request_id,
        timestamp: response.timestamp,
        guide: `Gunakan hasil analisis strategic intelligence untuk memberikan insight mendalam. Sertakan sumber-sumber yang digunakan dalam analisis.`,
      };
    } catch (error) {
      return {
        isError: true,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        solution:
          "Terjadi error saat melakukan analisis strategic intelligence. Periksa koneksi jaringan atau coba lagi nanti.",
        result: null,
        sources: [],
      };
    }
  },
});

export const strategicIntelligenceToolWithSafe = createTool({
  description:
    "Analisis strategic intelligence dengan error handling yang lebih baik",
  inputSchema: strategicIntelligenceSchema,
  execute: async (params: {
    input_data: string;
  }) => {
    return safe(async () => {
      const payload = {
        input_data: params.input_data,
      };

      const response = await fetchStrategicIntelligence(payload);

      if (!response.success) {
        throw new Error(response.error || "Analysis failed");
      }

      return {
        result: response.data.result,
        sources: response.data.url,
        total_sources: response.data.url.length,
        request_id: response.request_id,
        timestamp: response.timestamp,
        guide: `Gunakan hasil analisis untuk memberikan insight strategis. Fokus pada rekomendasi kebijakan dan threat assessment yang disediakan.`,
      };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "Error analisis strategic intelligence terjadi. Jelaskan kemungkinan penyebabnya dan berikan analisis berdasarkan pengetahuan yang ada.",
          result: null,
          sources: [],
        };
      })
      .unwrap();
  },
});

export const strategicIntelligenceToolSimple = createTool({
  description: "Analisis strategic intelligence versi sederhana",
  inputSchema: strategicIntelligenceSchema,
  execute: async (params: {
    input_data: string;
  }) => {
    const payload = {
      input_data: params.input_data,
    };

    const response = await fetchStrategicIntelligence(payload);

    return {
      result: response.data.result,
      sources: response.data.url,
      total_sources: response.data.url.length,
    };
  },
});
