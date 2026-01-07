// "use client";

// import { ToolUIPart } from "ai";
// import { GeneralSearchResponse } from "lib/ai/tools/web/general-search";
// import equal from "lib/equal";
// import { cn, toAny } from "lib/utils";
// import {
//   AlertTriangleIcon,
//   CalendarIcon,
//   UserIcon,
//   GlobeIcon,
// } from "lucide-react";
// import { useTranslations } from "next-intl";
// import { memo, useMemo } from "react";
// import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
// import { GlobalIcon } from "ui/global-icon";
// import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
// import JsonView from "ui/json-view";
// import { Separator } from "ui/separator";
// import { TextShimmer } from "ui/text-shimmer";
// import { Badge } from "ui/badge";

// interface GeneralSearchToolInvocationProps {
//   part: ToolUIPart;
// }

// // Extended interface untuk handle output dari tool
// interface GeneralSearchToolOutput extends GeneralSearchResponse {
//   isError?: boolean;
//   error?: string;
//   solution?: string;
//   guide?: string;
//   original_query?: string;
//   results?: Array<{
//     id: string;
//     title: string;
//     url: string;
//     author: string;
//     publish_date: string;
//     content: string;
//     relevance_score: number;
//     extraction_success: boolean;
//     extraction_time?: number;
//   }>;
//   total_results?: number;
// }

// function PureGeneralSearchToolInvocation({
//   part,
// }: GeneralSearchToolInvocationProps) {
//   const t = useTranslations();

//   const result = useMemo(() => {
//     if (!part.state.startsWith("output")) return null;
//     return part.output as GeneralSearchToolOutput;
//   }, [part.state]);

//   const options = useMemo(() => {
//     return (
//       <HoverCard openDelay={200} closeDelay={0}>
//         <HoverCardTrigger asChild>
//           <span className="hover:text-primary transition-colors text-xs text-muted-foreground">
//             {t("Chat.Tool.searchOptions")}
//           </span>
//         </HoverCardTrigger>
//         <HoverCardContent className="max-w-xs md:max-w-md! w-full! overflow-auto flex flex-col">
//           <p className="text-xs text-muted-foreground px-2 mb-2">
//             {t("Chat.Tool.searchOptionsDescription")}
//           </p>
//           <div className="p-2">
//             <JsonView data={part.input} />
//           </div>
//         </HoverCardContent>
//       </HoverCard>
//     );
//   }, [part.input, t]);

//   const getDomainFromUrl = (url: string) => {
//     try {
//       const domain = new URL(url).hostname;
//       return domain.replace("www.", "");
//     } catch {
//       return url;
//     }
//   };

//   const formatDate = (dateString: string) => {
//     try {
//       return new Date(dateString).toLocaleDateString("id-ID", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   // Truncate text untuk preview
//   const truncateText = (text: string, maxLength: number = 300) => {
//     if (!text) return "";
//     return text.length > maxLength
//       ? text.substring(0, maxLength) + "..."
//       : text;
//   };

//   if (!part.state.startsWith("output"))
//     return (
//       <div className="flex items-center gap-2 text-sm">
//         <GlobalIcon className="size-5 wiggle text-muted-foreground" />
//         <TextShimmer>{t("Chat.Tool.webSearching")}</TextShimmer>
//       </div>
//     );

//   return (
//     <div className="flex flex-col gap-2">
//       <div className="flex items-center gap-2">
//         <GlobalIcon className="size-5 text-muted-foreground" />
//         <span className="text-sm font-semibold">
//           {t("Chat.Tool.searchedTheWeb")}
//         </span>
//         {options}
//       </div>
//       <div className="flex gap-2">
//         <div className="px-2.5">
//           <Separator
//             orientation="vertical"
//             className="bg-gradient-to-b from-border to-transparent from-80%"
//           />
//         </div>
//         <div className="flex flex-col gap-3 pb-2 w-full">
//           {result?.isError ? (
//             <div className="flex items-center gap-2 p-3 border border-destructive/20 bg-destructive/10 rounded-lg">
//               <AlertTriangleIcon className="size-4 text-destructive" />
//               <div className="flex flex-col">
//                 <p className="text-sm font-medium text-destructive">
//                   {result.error || "Terjadi error saat pencarian"}
//                 </p>
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {result.solution || "Coba lagi dengan query yang berbeda."}
//                 </p>
//               </div>
//             </div>
//           ) : (
//             <>
//               {/* LIST VIEW - Default tampilan */}
//               <div className="flex flex-col gap-3">
//                 {result?.results?.map((item, index) => (
//                   <div
//                     key={item.id || index}
//                     className="group border border-border rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-card"
//                   >
//                     {/* Header dengan URL dan metadata */}
//                     <div className="flex items-start justify-between mb-3">
//                       <div className="flex items-center gap-2 flex-1 min-w-0">
//                         <Avatar className="size-5 rounded-md">
//                           <AvatarImage
//                             src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
//                           />
//                           <AvatarFallback className="text-xs bg-muted rounded-md">
//                             {getDomainFromUrl(item.url)
//                               .slice(0, 1)
//                               .toUpperCase()}
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1 min-w-0">
//                           <a
//                             href={item.url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-xs text-muted-foreground hover:text-blue-600 transition-colors truncate block"
//                             title={item.url}
//                           >
//                             {getDomainFromUrl(item.url)}
//                           </a>
//                         </div>
//                       </div>
//                       <Badge
//                         variant="outline"
//                         className="text-xs bg-blue-50 text-blue-700 border-blue-200"
//                       >
//                         Score: {(item.relevance_score * 100).toFixed(0)}%
//                       </Badge>
//                     </div>

//                     {/* Title */}
//                     <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
//                       <a
//                         href={item.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="hover:underline"
//                       >
//                         {item.title}
//                       </a>
//                     </h3>

//                     {/* Content Preview */}
//                     <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
//                       {truncateText(item.content, 200)}
//                     </p>

//                     {/* Metadata Footer */}
//                     <div className="flex items-center justify-between text-xs text-muted-foreground">
//                       <div className="flex items-center gap-4">
//                         {item.author && item.author !== "Unknown" && (
//                           <div className="flex items-center gap-1">
//                             <UserIcon className="size-3" />
//                             <span>{item.author}</span>
//                           </div>
//                         )}
//                         {item.publish_date &&
//                           item.publish_date !== "Unknown" && (
//                             <div className="flex items-center gap-1">
//                               <CalendarIcon className="size-3" />
//                               <span>{formatDate(item.publish_date)}</span>
//                             </div>
//                           )}
//                       </div>
//                       <div className="flex items-center gap-2">
//                         {item.extraction_success && (
//                           <Badge variant="secondary" className="text-xs">
//                             Full Content
//                           </Badge>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* CARD VIEW - Hover Card untuk detail lengkap */}
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {result?.results?.map((item, index) => (
//                   <HoverCard
//                     key={item.id || index}
//                     openDelay={300}
//                     closeDelay={100}
//                   >
//                     <HoverCardTrigger asChild>
//                       <a
//                         href={item.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="group rounded-full bg-secondary pl-2 pr-3 py-1.5 text-xs flex items-center gap-2 hover:bg-input hover:ring hover:ring-blue-500 transition-all cursor-pointer border"
//                       >
//                         <div className="rounded-full bg-input ring-1 ring-border">
//                           <Avatar className="size-4 rounded-full">
//                             <AvatarImage
//                               src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
//                             />
//                             <AvatarFallback className="text-xs">
//                               {getDomainFromUrl(item.url)
//                                 .slice(0, 1)
//                                 .toUpperCase()}
//                             </AvatarFallback>
//                           </Avatar>
//                         </div>
//                         <span className="truncate max-w-32 font-medium">
//                           {getDomainFromUrl(item.url)}
//                         </span>
//                         <Badge
//                           variant="outline"
//                           className="text-xs h-4 px-1 bg-blue-50"
//                         >
//                           {(item.relevance_score * 100).toFixed(0)}%
//                         </Badge>
//                       </a>
//                     </HoverCardTrigger>

//                     <HoverCardContent className="flex flex-col gap-3 p-4 max-w-md">
//                       {/* Header */}
//                       <div className="flex items-center gap-2">
//                         <Avatar className="size-6 rounded-md">
//                           <AvatarImage
//                             src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
//                           />
//                           <AvatarFallback className="text-sm bg-muted rounded-md">
//                             {getDomainFromUrl(item.url)
//                               .slice(0, 1)
//                               .toUpperCase()}
//                           </AvatarFallback>
//                         </Avatar>
//                         <div className="flex-1 min-w-0">
//                           <h4
//                             className={cn(
//                               "font-semibold text-sm",
//                               !item.title && "truncate",
//                             )}
//                           >
//                             {item.title || getDomainFromUrl(item.url)}
//                           </h4>
//                           <p className="text-xs text-muted-foreground truncate">
//                             {item.url}
//                           </p>
//                         </div>
//                       </div>

//                       {/* Metadata */}
//                       <div className="flex items-center gap-4 text-xs text-muted-foreground">
//                         {item.author && item.author !== "Unknown" && (
//                           <div className="flex items-center gap-1">
//                             <UserIcon className="size-3" />
//                             <span>{item.author}</span>
//                           </div>
//                         )}
//                         {item.publish_date &&
//                           item.publish_date !== "Unknown" && (
//                             <div className="flex items-center gap-1">
//                               <CalendarIcon className="size-3" />
//                               <span>{formatDate(item.publish_date)}</span>
//                             </div>
//                           )}
//                       </div>

//                       {/* Content */}
//                       <div className="mt-2">
//                         <div className="relative">
//                           <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-card from-80%" />
//                           <p className="text-xs text-muted-foreground max-h-40 overflow-y-auto leading-relaxed">
//                             {item.content}
//                           </p>
//                         </div>
//                       </div>

//                       {/* Extraction Status */}
//                       {item.extraction_success && (
//                         <div className="flex items-center justify-between text-xs">
//                           <Badge
//                             variant="outline"
//                             className="bg-green-50 text-green-700 border-green-200"
//                           >
//                             ✓ Content Extracted
//                           </Badge>
//                           {item.extraction_time && (
//                             <span className="text-muted-foreground">
//                               {item.extraction_time}s
//                             </span>
//                           )}
//                         </div>
//                       )}
//                     </HoverCardContent>
//                   </HoverCard>
//                 ))}
//               </div>

//               {/* Summary */}
//               {result?.results?.length && (
//                 <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
//                   <GlobeIcon className="size-3" />
//                   {t("Common.resultsFound", {
//                     count: result?.results?.length,
//                   })}
//                   {result.original_query && (
//                     <span className="ml-1">
//                       untuk &ldquo;{result.original_query}&rdquo;
//                     </span>
//                   )}
//                 </p>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function areEqual(
//   { part: prevPart }: GeneralSearchToolInvocationProps,
//   { part: nextPart }: GeneralSearchToolInvocationProps,
// ) {
//   if (prevPart.state != nextPart.state) return false;
//   if (!equal(prevPart.input, nextPart.input)) return false;
//   if (
//     prevPart.state.startsWith("output") &&
//     !equal(prevPart.output, toAny(nextPart).output)
//   )
//     return false;
//   return true;
// }

// export const GeneralSearchToolInvocation = memo(
//   PureGeneralSearchToolInvocation,
//   areEqual,
// );

"use client";

import { ToolUIPart } from "ai";
import { GeneralSearchResponse } from "lib/ai/tools/web/general-search";
import equal from "lib/equal";
import { cn, toAny } from "lib/utils";
import {
  AlertTriangleIcon,
  CalendarIcon,
  UserIcon,
  GlobeIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { GlobalIcon } from "ui/global-icon";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "ui/hover-card";
import JsonView from "ui/json-view";
import { Separator } from "ui/separator";
import { TextShimmer } from "ui/text-shimmer";
// import { Badge } from "ui/badge";

interface GeneralSearchToolInvocationProps {
  part: ToolUIPart;
}

// Extended interface sesuai struktur API baru
interface GeneralSearchToolOutput extends GeneralSearchResponse {
  isError?: boolean;
  error?: string;
  solution?: string;
  guide?: string;
  original_query?: string;
  results?: Array<{
    title: string;
    url: string;
    author: string | null;
    publish_date: string | null;
    content: string;
  }>;
  total_results?: number;
}

function PureGeneralSearchToolInvocation({
  part,
}: GeneralSearchToolInvocationProps) {
  const t = useTranslations();

  const result = useMemo(() => {
    if (!part.state.startsWith("output")) return null;
    return part.output as GeneralSearchToolOutput;
  }, [part.state]);

  const options = useMemo(() => {
    return (
      <HoverCard openDelay={200} closeDelay={0}>
        <HoverCardTrigger asChild>
          <span className="hover:text-primary transition-colors text-xs text-muted-foreground">
            {t("Chat.Tool.searchOptions")}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="max-w-xs md:max-w-md! w-full! overflow-auto flex flex-col">
          <p className="text-xs text-muted-foreground px-2 mb-2">
            {t("Chat.Tool.searchOptionsDescription")}
          </p>
          <div className="p-2">
            <JsonView data={part.input} />
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  }, [part.input, t]);

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace("www.", "");
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Tidak diketahui";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Truncate text untuk preview
  const truncateText = (text: string, maxLength: number = 300) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  if (!part.state.startsWith("output"))
    return (
      <div className="flex items-center gap-2 text-sm">
        <GlobalIcon className="size-5 wiggle text-muted-foreground" />
        <TextShimmer>{t("Chat.Tool.webSearching")}</TextShimmer>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <GlobalIcon className="size-5 text-muted-foreground" />
        <span className="text-sm font-semibold">
          {t("Chat.Tool.searchedTheWeb")}
        </span>
        {options}
      </div>
      <div className="flex gap-2">
        <div className="px-2.5">
          <Separator
            orientation="vertical"
            className="bg-gradient-to-b from-border to-transparent from-80%"
          />
        </div>
        <div className="flex flex-col gap-3 pb-2 w-full">
          {result?.isError ? (
            <div className="flex items-center gap-2 p-3 border border-destructive/20 bg-destructive/10 rounded-lg">
              <AlertTriangleIcon className="size-4 text-destructive" />
              <div className="flex flex-col">
                <p className="text-sm font-medium text-destructive">
                  {result.error || "Terjadi error saat pencarian"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.solution || "Coba lagi dengan query yang berbeda."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* LIST VIEW - Default tampilan */}
              <div className="flex flex-col gap-3">
                {result?.results?.map((item, index) => (
                  <div
                    key={index} // Tidak ada id, gunakan index sebagai key
                    className="group border border-border rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-card"
                  >
                    {/* Header dengan URL dan metadata */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Avatar className="size-5 rounded-md">
                          <AvatarImage
                            src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
                          />
                          <AvatarFallback className="text-xs bg-muted rounded-md">
                            {getDomainFromUrl(item.url)
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-blue-600 transition-colors truncate block"
                            title={item.url}
                          >
                            {getDomainFromUrl(item.url)}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {item.title}
                      </a>
                    </h3>

                    {/* Content Preview */}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                      {truncateText(item.content, 200)}
                    </p>

                    {/* Metadata Footer */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {item.author && item.author !== "Unknown" && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="size-3" />
                            <span>{item.author}</span>
                          </div>
                        )}
                        {item.publish_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            <span>{formatDate(item.publish_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CARD VIEW - Hover Card untuk detail lengkap */}
              <div className="flex flex-wrap gap-2 mt-2">
                {result?.results?.map((item, index) => (
                  <HoverCard
                    key={index} // Tidak ada id, gunakan index sebagai key
                    openDelay={300}
                    closeDelay={100}
                  >
                    <HoverCardTrigger asChild>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-full bg-secondary pl-2 pr-3 py-1.5 text-xs flex items-center gap-2 hover:bg-input hover:ring hover:ring-blue-500 transition-all cursor-pointer border"
                      >
                        <div className="rounded-full bg-input ring-1 ring-border">
                          <Avatar className="size-4 rounded-full">
                            <AvatarImage
                              src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
                            />
                            <AvatarFallback className="text-xs">
                              {getDomainFromUrl(item.url)
                                .slice(0, 1)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="truncate max-w-32 font-medium">
                          {getDomainFromUrl(item.url)}
                        </span>
                      </a>
                    </HoverCardTrigger>

                    <HoverCardContent className="flex flex-col gap-3 p-4 max-w-md">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6 rounded-md">
                          <AvatarImage
                            src={`https://www.google.com/s2/favicons?domain=${getDomainFromUrl(item.url)}&sz=32`}
                          />
                          <AvatarFallback className="text-sm bg-muted rounded-md">
                            {getDomainFromUrl(item.url)
                              .slice(0, 1)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "font-semibold text-sm",
                              !item.title && "truncate",
                            )}
                          >
                            {item.title || getDomainFromUrl(item.url)}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.url}
                          </p>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {item.author && item.author !== "Unknown" && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="size-3" />
                            <span>{item.author}</span>
                          </div>
                        )}
                        {item.publish_date && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            <span>{formatDate(item.publish_date)}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="mt-2">
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-card from-80%" />
                          <p className="text-xs text-muted-foreground max-h-40 overflow-y-auto leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>

              {/* Summary */}
              {result?.results?.length && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <GlobeIcon className="size-3" />
                  {t("Common.resultsFound", {
                    count: result?.results?.length,
                  })}
                  {result.original_query && (
                    <span className="ml-1">
                      untuk &ldquo;{result.original_query}&rdquo;
                    </span>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function areEqual(
  { part: prevPart }: GeneralSearchToolInvocationProps,
  { part: nextPart }: GeneralSearchToolInvocationProps,
) {
  if (prevPart.state != nextPart.state) return false;
  if (!equal(prevPart.input, nextPart.input)) return false;
  if (
    prevPart.state.startsWith("output") &&
    !equal(prevPart.output, toAny(nextPart).output)
  )
    return false;
  return true;
}

export const GeneralSearchToolInvocation = memo(
  PureGeneralSearchToolInvocation,
  areEqual,
);
