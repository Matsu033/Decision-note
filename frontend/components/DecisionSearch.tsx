"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileText,
  PanelLeftClose,
  Search,
  X,
} from "lucide-react";

type SearchOption = {
  title: string;
  description: string;
  proposedBy: string;
};

export type SearchableDecision = {
  id: string;
  title: string;
  project: string;
  category: string;
  background: string;
  options: SearchOption[];
  decision: string;
  reason: string;
  tradeoff: string;
};

type DecisionSearchProps = {
  records: SearchableDecision[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowExplorer: () => void;
  onClose: () => void;
};

export default function DecisionSearch({
  records,
  selectedId,
  onSelect,
  onShowExplorer,
  onClose,
}: DecisionSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) => {
      const optionText = record.options
        .map((option) =>
          [
            option.title,
            option.description,
            option.proposedBy,
          ].join(" "),
        )
        .join(" ");

      const searchableText = [
        record.title,
        record.project,
        record.category,
        record.background,
        optionText,
        record.decision,
        record.reason,
        record.tradeoff,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [normalizedQuery, records]);

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onShowExplorer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onShowExplorer]);

  return (
    <aside className="flex h-full w-full flex-col bg-[#f7f8fa]">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#dfe1e5] px-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
          Search
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onShowExplorer}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            title="Explorerへ戻る"
          >
            <FileText size={16} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            title="検索パネルを閉じる"
          >
            <PanelLeftClose size={16} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      <div className="shrink-0 border-b border-[#e5e7eb] p-3">
        <div className="relative">
          <Search
            size={15}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="タイトルや判断内容を検索"
            className="h-9 w-full rounded border border-slate-300 bg-white pl-8 pr-8 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              title="検索文字を消す"
            >
              <X size={13} strokeWidth={2} />
            </button>
          )}
        </div>

        <div className="mt-2 text-[10px] text-slate-400">
          {normalizedQuery
            ? `${results.length}件見つかりました`
            : `${records.length}件の判断`}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {results.length > 0 ? (
          results.map((record) => {
            const isSelected = record.id === selectedId;

            return (
              <button
                type="button"
                key={record.id}
                onClick={() => onSelect(record.id)}
                className={`relative w-full border-b border-slate-200/70 px-3 py-3 text-left transition ${
                  isSelected
                    ? "bg-[#dfe7ff]"
                    : "hover:bg-[#e8eaed]"
                }`}
              >
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                )}

                <div className="flex items-start gap-2">
                  <FileText
                    size={15}
                    strokeWidth={1.7}
                    className={`mt-0.5 shrink-0 ${
                      isSelected
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={`line-clamp-2 text-xs font-medium leading-5 ${
                        isSelected
                          ? "text-indigo-950"
                          : "text-slate-700"
                      }`}
                    >
                      {record.title}
                    </p>

                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {record.project} / {record.category}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="px-6 py-12 text-center">
            <Search
              size={24}
              strokeWidth={1.5}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-xs font-medium text-slate-500">
              判断が見つかりません
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              別の言葉で検索してください
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}