// import { tool as createTool } from "ai";
// import { z } from "zod";

// export interface GeneralSearchResult {
//   id: string;
//   url: string;
//   title: string;
//   content: string;
//   score_relevance_browser: number;
//   extract_article_data: {
//     title: string;
//     author: string | null;
//     publish_date: string;
//     content: string;
//     success: boolean;
//     error: string | null;
//     elapsed_time: number;
//   };
// }

// export interface GeneralSearchResponse {
//   query: string;
//   metadata: GeneralSearchResult[];
// }

// export const generalSearchSchema = z.object({
//   query: z.string().describe("Search query untuk pencarian berita dan artikel"),
//   crawling: z
//     .boolean()
//     .default(true)
//     .describe("Apakah melakukan crawling konten lengkap"),
//   use_llm: z
//     .boolean()
//     .default(true)
//     .describe("Apakah menggunakan LLM untuk processing"),
//   maxResults: z
//     .number()
//     .min(1)
//     .max(10)
//     .default(5)
//     .describe("Jumlah maksimal hasil yang diambil"),
// });

// const API_BASE_URL = "http://172.16.100.249:7076";

// const fetchGeneralSearch = async (
//   payload: any,
// ): Promise<GeneralSearchResponse> => {
//   const response = await fetch(`${API_BASE_URL}/search`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!response.ok) {
//     throw new Error(
//       `General Search API error: ${response.status} ${response.statusText}`,
//     );
//   }

//   return await response.json();
// };

// const safe = <T>(fn: () => Promise<T>) => {
//   return {
//     ifFail: (errorHandler: (error: Error) => any) => ({
//       unwrap: async (): Promise<T> => {
//         try {
//           return await fn();
//         } catch (error) {
//           return errorHandler(
//             error instanceof Error ? error : new Error(String(error)),
//           );
//         }
//       },
//     }),
//   };
// };

// export const generalSearchTool = createTool({
//   description:
//     "Search the web using general-search AI - performs real-time web searches with semantic and neural search capabilities. Returns high-quality, relevant results with full content extraction.",
//   inputSchema: generalSearchSchema,
//   execute: async (params: {
//     query: string;
//     crawling?: boolean;
//     use_llm?: boolean;
//     maxResults?: number;
//   }) => {
//     try {
//       const payload = {
//         query: params.query,
//         crawling: params.crawling !== undefined ? params.crawling : true,
//         use_llm: params.use_llm !== undefined ? params.use_llm : true,
//       };

//       const result = await fetchGeneralSearch(payload);

//       const maxResults = params.maxResults || 5;
//       const limitedResults = result.metadata.slice(0, maxResults);

//       const formattedResults = limitedResults.map((item) => ({
//         id: item.id,
//         title: item.extract_article_data?.title || item.title,
//         url: item.url,
//         author: item.extract_article_data?.author || "Unknown",
//         publish_date: item.extract_article_data?.publish_date || "Unknown",
//         content: item.extract_article_data?.content || item.content,
//         relevance_score: item.score_relevance_browser,
//         extraction_success: item.extract_article_data?.success || false,
//         extraction_time: item.extract_article_data?.elapsed_time || 0,
//       }));

//       return {
//         original_query: result.query,
//         results: formattedResults,
//         total_results: formattedResults.length,
//         guide: `Gunakan hasil pencarian untuk menjawab pertanyaan user. Ringkas informasi dari konten yang tersedia dan tawarkan informasi tambahan jika diperlukan.`,
//       };
//     } catch (error) {
//       return {
//         isError: true,
//         error:
//           error instanceof Error ? error.message : "Unknown error occurred",
//         solution:
//           "Terjadi error saat melakukan pencarian. Coba lagi dengan query yang lebih spesifik atau periksa koneksi jaringan.",
//         results: [],
//       };
//     }
//   },
// });

// export const generalSearchToolWithSafe = createTool({
//   description: "Pencarian web umum dengan error handling ",
//   inputSchema: generalSearchSchema,
//   execute: async (params: {
//     query: string;
//     crawling?: boolean;
//     use_llm?: boolean;
//     maxResults?: number;
//   }) => {
//     return safe(async () => {
//       const payload = {
//         query: params.query,
//         crawling: params.crawling !== undefined ? params.crawling : true,
//         use_llm: params.use_llm !== undefined ? params.use_llm : true,
//       };

//       const result = await fetchGeneralSearch(payload);

//       const maxResults = params.maxResults || 5;
//       const limitedResults = result.metadata.slice(0, maxResults);

//       const formattedResults = limitedResults.map((item) => ({
//         id: item.id,
//         title: item.extract_article_data?.title || item.title,
//         url: item.url,
//         author: item.extract_article_data?.author || "Unknown",
//         publish_date: item.extract_article_data?.publish_date || "Unknown",
//         content: item.extract_article_data?.content || item.content,
//         relevance_score: item.score_relevance_browser,
//         extraction_success: item.extract_article_data?.success || false,
//       }));

//       return {
//         original_query: result.query,
//         results: formattedResults,
//         total_results: formattedResults.length,
//         guide: `Gunakan hasil pencarian untuk menjawab pertanyaan user. Fokus pada informasi yang paling relevan dari sumber yang terpercaya.`,
//       };
//     })
//       .ifFail((e) => {
//         return {
//           isError: true,
//           error: e.message,
//           solution:
//             "Error pencarian terjadi. Jelaskan kemungkinan penyebabnya dan berikan informasi berdasarkan pengetahuan yang ada.",
//           results: [],
//         };
//       })
//       .unwrap();
//   },
// });

// export const generalSearchToolSimple = createTool({
//   description: "Pencarian web umum versi sederhana",
//   inputSchema: generalSearchSchema,
//   execute: async (params: {
//     query: string;
//     crawling?: boolean;
//     use_llm?: boolean;
//     maxResults?: number;
//   }) => {
//     const payload = {
//       query: params.query,
//       crawling: params.crawling ?? true,
//       use_llm: params.use_llm ?? true,
//     };

//     const result = await fetchGeneralSearch(payload);

//     const maxResults = params.maxResults || 5;
//     const limitedResults = result.metadata.slice(0, maxResults);

//     const formattedResults = limitedResults.map((item) => ({
//       id: item.id,
//       title: item.extract_article_data?.title || item.title,
//       url: item.url,
//       author: item.extract_article_data?.author || "Unknown",
//       publish_date: item.extract_article_data?.publish_date || "Unknown",
//       content: item.extract_article_data?.content || item.content,
//       relevance_score: item.score_relevance_browser,
//       extraction_success: item.extract_article_data?.success || false,
//     }));

//     return {
//       original_query: result.query,
//       results: formattedResults,
//       total_results: formattedResults.length,
//     };
//   },
// });

import { tool as createTool } from "ai";
import { z } from "zod";

export interface GeneralSearchResult {
  title: string;
  author: string | null;
  publish_date: string | null;
  content: string;
  url: string;
}

export interface GeneralSearchResponse {
  status: string;
  query: string;
  total_queries: number;
  total_metadata_extracted: number;
  top_n_used: number;
  metadata_append: GeneralSearchResult[];
}

export const generalSearchSchema = z.object({
  query: z.string().describe("Search query untuk pencarian berita dan artikel"),
  top_n: z
    .number()
    .min(1)
    .max(10)
    .default(2)
    .describe("Jumlah maksimal hasil yang diambil"),
});

const API_BASE_URL = "http://172.16.100.249:7049";

const fetchGeneralSearch = async (
  payload: any,
): Promise<GeneralSearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(
      `General Search API error: ${response.status} ${response.statusText}`,
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

export const generalSearchTool = createTool({
  description:
    "Search the web using general-search AI - performs real-time web searches with semantic and neural search capabilities. Returns high-quality, relevant results with full content extraction.",
  inputSchema: generalSearchSchema,
  execute: async (params: {
    query: string;
    top_n?: number;
  }) => {
    try {
      const payload = {
        query_str: params.query,
        top_n: params.top_n !== undefined ? params.top_n : 2,
      };

      const result = await fetchGeneralSearch(payload);

      const formattedResults = result.metadata_append.map((item) => ({
        title: item.title,
        url: item.url,
        author: item.author || "Unknown",
        publish_date: item.publish_date || "Unknown",
        content: item.content,
      }));

      return {
        original_query: result.query,
        results: formattedResults,
        total_results: formattedResults.length,
        status: result.status,
        top_n_used: result.top_n_used,
        guide: `Gunakan hasil pencarian untuk menjawab pertanyaan user. Ringkas informasi dari konten yang tersedia dan tawarkan informasi tambahan jika diperlukan.`,
      };
    } catch (error) {
      return {
        isError: true,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        solution:
          "Terjadi error saat melakukan pencarian. Coba lagi dengan query yang lebih spesifik atau periksa koneksi jaringan.",
        results: [],
      };
    }
  },
});

export const generalSearchToolWithSafe = createTool({
  description: "Pencarian web umum dengan error handling ",
  inputSchema: generalSearchSchema,
  execute: async (params: {
    query: string;
    top_n?: number;
  }) => {
    return safe(async () => {
      const payload = {
        query_str: params.query,
        top_n: params.top_n !== undefined ? params.top_n : 2,
      };

      const result = await fetchGeneralSearch(payload);

      const formattedResults = result.metadata_append.map((item) => ({
        title: item.title,
        url: item.url,
        author: item.author || "Unknown",
        publish_date: item.publish_date || "Unknown",
        content: item.content,
      }));

      return {
        original_query: result.query,
        results: formattedResults,
        total_results: formattedResults.length,
        status: result.status,
        top_n_used: result.top_n_used,
        guide: `Gunakan hasil pencarian untuk menjawab pertanyaan user. Fokus pada informasi yang paling relevan dari sumber yang terpercaya.`,
      };
    })
      .ifFail((e) => {
        return {
          isError: true,
          error: e.message,
          solution:
            "Error pencarian terjadi. Jelaskan kemungkinan penyebabnya dan berikan informasi berdasarkan pengetahuan yang ada.",
          results: [],
        };
      })
      .unwrap();
  },
});

export const generalSearchToolSimple = createTool({
  description: "Pencarian web umum versi sederhana",
  inputSchema: generalSearchSchema,
  execute: async (params: {
    query: string;
    top_n?: number;
  }) => {
    const payload = {
      query_str: params.query,
      top_n: params.top_n ?? 2,
    };

    const result = await fetchGeneralSearch(payload);

    const formattedResults = result.metadata_append.map((item) => ({
      title: item.title,
      url: item.url,
      author: item.author || "Unknown",
      publish_date: item.publish_date || "Unknown",
      content: item.content,
    }));

    return {
      original_query: result.query,
      results: formattedResults,
      total_results: formattedResults.length,
      status: result.status,
      top_n_used: result.top_n_used,
    };
  },
});
