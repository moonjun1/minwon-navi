"use client";

import { Button } from "@/components/ui/button";

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const SUGGESTIONS = [
  "전입신고 하려면?",
  "여권 발급 방법",
  "주민등록등본 발급",
  "인감증명서 발급",
  "운전면허 갱신",
];

export default function SuggestedQuestions({
  onSelect,
}: SuggestedQuestionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
      {SUGGESTIONS.map((q) => (
        <Button
          key={q}
          variant="outline"
          size="sm"
          className="rounded-full text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
          onClick={() => onSelect(q)}
        >
          {q}
        </Button>
      ))}
    </div>
  );
}
