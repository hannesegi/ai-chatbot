"use client";

import { ToolUIPart } from "ai";
import equal from "lib/equal";
import { toAny } from "lib/utils";
import { FileTextIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { TextShimmer } from "ui/text-shimmer";

interface RagDocumentToolInvocationProps {
  part: ToolUIPart;
}

function PureRagDocumentToolInvocation({
  part,
}: RagDocumentToolInvocationProps) {
  const t = useTranslations();

  if (!part.state.startsWith("output")) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <FileTextIcon className="size-5 wiggle text-muted-foreground" />
        <TextShimmer>{t("Chat.Tool.documentSearching")}</TextShimmer>
      </div>
    );
  }
  return null;
}

function areEqual(
  { part: prevPart }: RagDocumentToolInvocationProps,
  { part: nextPart }: RagDocumentToolInvocationProps,
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

export const RagDocumentToolInvocation = memo(
  PureRagDocumentToolInvocation,
  areEqual,
);
