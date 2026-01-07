import { tool as createTool } from "ai";
import { z } from "zod";

export const createTableTool = createTool({
  description:
    "Create an interactive table with data. The table will automatically have sorting, filtering, and search functionality.",
  inputSchema: z.object({
    title: z.string().describe("Table title"),
    description: z.string().nullable().describe("Optional table description"),
    columns: z
      .array(
        z.object({
          key: z
            .string()
            .describe("Column key that matches the data object keys"),
          label: z.string().describe("Display label for the column header"),
          type: z
            .enum(["string", "number", "date", "boolean"])
            .nullable()
            .default("string")
            .describe("Data type for proper sorting and formatting"),
        }),
      )
      .describe("Column configuration array"),
    data: z
      .array(
        z
          .object({})
          .catchall(z.any())
          .describe(
            "Array of row objects. Each object should have keys matching the column names.",
          ),
      )
      .describe(
        "Array of row objects. Each object should have keys matching the column names.",
      ),
  }),
  execute: async () => {
    return "Success";
  },
});

// /src/lib/ai/tools/visualization/create-table.ts

// import { tool as createTool } from "ai";
// import { z } from "zod";

// // Helper: parse JSON string dengan aman
// const safeJsonParse = (str: string, fallback: any = str): any => {
//   if (typeof str !== 'string') return str;
//   try {
//     const trimmed = str.trim();
//     if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
//         (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
//       return JSON.parse(trimmed);
//     }
//   } catch (e) {
//     console.warn('⚠️ Failed to parse JSON string:', str.substring(0, 100));
//   }
//   return fallback;
// };

// export const createTableTool = createTool({
//   description:
//     "Create an interactive table with data. The table will automatically have sorting, filtering, and search functionality.",
//   inputSchema: z.object({
//     title: z.string().describe("Table title"),
//     description: z.string().nullable().optional().describe("Optional table description"),
//     columns: z.union([
//       z.array(
//         z.object({
//           key: z.string().describe("Column key that matches the data object keys"),
//           label: z.string().describe("Display label for the column header"),
//           type: z
//             .enum(["string", "number", "date", "boolean"])
//             .nullable()
//             .default("string")
//             .describe("Data type for proper sorting and formatting"),
//         })
//       ).describe("Column configuration as array"),
//       z.string().describe("JSON string of column configuration array")
//     ]).describe("Column configuration (array or JSON string)"),
//     data: z.union([
//       z.array(
//         z.object({}).catchall(z.any())
//       ).describe("Array of row objects"),
//       z.string().describe("JSON string of row data array")
//     ]).describe("Table data (array of objects or JSON string)")
//   }),
//   execute: async (input) => {
//     // Parse columns
//     let columns = input.columns;
//     if (typeof columns === 'string') {
//       columns = safeJsonParse(columns, []);
//     }

//     // Parse data
//     let data = input.data;
//     if (typeof data === 'string') {
//       data = safeJsonParse(data, []);
//     }

//     // Validasi hasil parse
//     if (!Array.isArray(columns) || !Array.isArray(data)) {
//       throw new Error("Failed to parse columns or data into arrays");
//     }

//     console.log('✅ createTableTool.execute() - Parsed input:', {
//       columns: columns.length,
//       data: data.length
//     });

//     // TODO: Implementasi sebenarnya
//     return {
//       type: "table",
//       title: input.title,
//       description: input.description || undefined,
//       columns,
//       data
//     };
//   },
// // });

// import { tool as createTool } from "ai";
// import { z } from "zod";

// // Schema untuk column object
// const columnSchema = z.object({
//   key: z.string().describe("Column key that matches the data object keys"),
//   label: z.string().describe("Display label for the column header"),
//   type: z
//     .enum(["string", "number", "date", "boolean"])
//     .nullable()
//     .default("string")
//     .describe("Data type for proper sorting and formatting"),
// });

// // Schema untuk row object
// const rowSchema = z.object({}).catchall(z.any());

// // Helper: parse JSON string dengan aman
// const safeJsonParse = (str: string, fallback: any = str): any => {
//   if (typeof str !== 'string') return str;
//   try {
//     const trimmed = str.trim();
//     if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
//         (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
//       return JSON.parse(trimmed);
//     }
//   } catch (e) {
//     console.warn('⚠️ Failed to parse JSON string:', str.substring(0, 100));
//   }
//   return fallback;
// };

// export const createTableTool = createTool({
//   description:
//     "Create an interactive table with data. The table will automatically have sorting, filtering, and search functionality.",
//   inputSchema: z.object({
//     title: z.string().describe("Table title"),
//     description: z.string().nullable().optional().describe("Optional table description"),
//     columns: z.union([
//       z.array(columnSchema).describe("Column configuration as array"),
//       z.string().describe("JSON string of column configuration array")
//     ]).describe("Column configuration (array or JSON string)"),
//     data: z.union([
//       z.array(rowSchema).describe("Array of row objects"),
//       z.string().describe("JSON string of row data array")
//     ]).describe("Table data (array of objects or JSON string)")
//   }),
//   execute: async (input) => {
//     // Parse columns
//     let columns = input.columns;
//     if (typeof columns === 'string') {
//       columns = safeJsonParse(columns, []);
//     }

//     // Parse data
//     let data = input.data;
//     if (typeof data === 'string') {
//       data = safeJsonParse(data, []);
//     }

//     // Validasi hasil parse
//     if (!Array.isArray(columns) || !Array.isArray(data)) {
//       throw new Error("Failed to parse columns or data into arrays");
//     }

//     // Validasi ulang dengan schema untuk memastikan struktur benar
//     try {
//       columns = z.array(columnSchema).parse(columns);
//       data = z.array(rowSchema).parse(data);
//     } catch (error) {
//       console.error('❌ Validation error after parsing:', error);
//       const errorMessage = error instanceof Error ? error.message : String(error);
//       throw new Error(`Invalid data structure after parsing: ${errorMessage}`);
//     }

//     console.log('✅ createTableTool.execute() - Parsed & validated:', {
//       columns: columns.length,
//       data: data.length
//     });

//     return {
//       type: "table" as const,
//       title: input.title,
//       description: input.description || undefined,
//       columns,
//       data
//     };
//   },
// });
