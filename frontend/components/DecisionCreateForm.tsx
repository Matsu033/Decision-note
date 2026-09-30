"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

export type CreateDecisionStatus = "採用" | "検討中" | "見送り";

export type CreateDecisionOption = {
  title: string;
  description: string;
  proposedBy: string;
  selected: boolean;
};

export type CreateDecisionInput = {
  title: string;
  status: CreateDecisionStatus;
  background: string;
  options: CreateDecisionOption[];
  decision: string;
  reason: string;
  tradeoff: string;
};

type EditableOption = {
  clientId: string;
  title: string;
  description: string;
  proposedBy: string;
};

type DecisionCreateFormProps = {
  initialValue: CreateDecisionInput;
  onChange: (input: CreateDecisionInput) => void;
};

const EMPTY_OPTION_COUNT = 0;
const MINIMUM_OPTION_COUNT = 1;
const DISPLAY_INDEX_OFFSET = 1;
const FIRST_VALID_OPTION_INDEX = 0;

const TEXTAREA_ROWS = {
  BACKGROUND: 5,
  OPTION_DESCRIPTION: 3,
  DECISION: 4,
  REASON: 5,
  TRADEOFF: 5,
} as const;

const ICON_SIZE = {
  OPTION_CHECK: 13,
  DELETE_ACTION: 15,
  ADD_ACTION: 16,
} as const;

const ICON_STROKE_WIDTH = {
  EMPHASIZED: 2.5,
} as const;

function createClientId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `option-${Date.now()}-${Math.random()}`;
}

function createEmptyOption(proposedBy: string): EditableOption {
  return {
    clientId: createClientId(),
    title: "",
    description: "",
    proposedBy,
  };
}

export default function DecisionCreateForm({
  initialValue,
  onChange,
}: DecisionCreateFormProps) {
  const [title, setTitle] = useState(initialValue.title);

  const [status, setStatus] = useState<CreateDecisionStatus>(
    initialValue.status,
  );

  const [background, setBackground] = useState(initialValue.background);
  const [decision, setDecision] = useState(initialValue.decision);
  const [reason, setReason] = useState(initialValue.reason);
  const [tradeoff, setTradeoff] = useState(initialValue.tradeoff);

  const [options, setOptions] = useState<EditableOption[]>(() =>
    initialValue.options.length > EMPTY_OPTION_COUNT
      ? initialValue.options.map((option, index) => ({
          clientId: `initial-option-${index}`,
          title: option.title,
          description: option.description,
          proposedBy: option.proposedBy,
        }))
      : [createEmptyOption("自分の案"), createEmptyOption("比較案")],
  );

  const [selectedOptionId, setSelectedOptionId] = useState<string>(() => {
    const selectedIndex = initialValue.options.findIndex(
      (option) => option.selected,
    );

    return selectedIndex >= FIRST_VALID_OPTION_INDEX
      ? `initial-option-${selectedIndex}`
      : "";
  });

  useEffect(() => {
    onChange({
      title,
      status,
      background,
      options: options.map((option) => ({
        title: option.title,
        description: option.description,
        proposedBy: option.proposedBy,
        selected: option.clientId === selectedOptionId,
      })),
      decision,
      reason,
      tradeoff,
    });
  }, [
    background,
    decision,
    onChange,
    options,
    reason,
    selectedOptionId,
    status,
    title,
    tradeoff,
  ]);

  const updateOption = (
    clientId: string,
    field: keyof Omit<EditableOption, "clientId">,
    value: string,
  ) => {
    setOptions((previous) =>
      previous.map((option) =>
        option.clientId === clientId
          ? {
              ...option,
              [field]: value,
            }
          : option,
      ),
    );
  };

  const addOption = () => {
    setOptions((previous) => [
      ...previous,
      createEmptyOption("比較案"),
    ]);
  };

  const removeOption = (clientId: string) => {
    setOptions((previous) =>
      previous.filter((option) => option.clientId !== clientId),
    );

    if (selectedOptionId === clientId) {
      setSelectedOptionId("");
    }
  };

  const selectOption = (clientId: string) => {
    setSelectedOptionId(clientId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-10 sm:px-10">
          <div className="border-b border-slate-200 pb-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">
              Decision Editor
            </p>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="判断タイトルを入力"
              aria-label="判断タイトル"
              className="mt-2 w-full border-b border-transparent bg-transparent px-0 pb-2 text-3xl font-bold tracking-[-0.03em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-indigo-400"
            />

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              何に困り、どのような案を比較し、なぜその結論を選んだのかを順番に整理します。
            </p>
          </div>

          <div className="mt-10 max-w-xs">
            <FormField label="ステータス" required>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as CreateDecisionStatus,
                  )
                }
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="検討中">検討中</option>
                <option value="採用">採用</option>
                <option value="見送り">見送り</option>
              </select>
            </FormField>
          </div>

          <FormSection
            number="01"
            englishTitle="Context"
            title="課題・背景"
            description="何に困っていて、なぜ判断する必要があったのかを書きます。"
          >
            <FormField label="課題・背景" required>
              <textarea
                value={background}
                onChange={(event) =>
                  setBackground(event.target.value)
                }
                rows={TEXTAREA_ROWS.BACKGROUND}
                placeholder="現在の状況、困っていること、判断が必要になった理由を入力してください。"
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
          </FormSection>

          <FormSection
            number="02"
            englishTitle="Options"
            title="検討した選択肢"
            description="比較した案を追加し、誰が出した案なのかも記録します。"
          >
            <div className="space-y-4">
              {options.map((option, index) => {
                const isSelected =
                  selectedOptionId === option.clientId;

                return (
                  <div
                    key={option.clientId}
                    className={`rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50/60"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          selectOption(option.clientId)
                        }
                        className="flex min-w-0 items-center gap-3 text-left"
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          <Check
                            size={ICON_SIZE.OPTION_CHECK}
                            strokeWidth={
                              ICON_STROKE_WIDTH.EMPHASIZED
                            }
                          />
                        </span>

                        <span>
                          <span className="block text-xs font-semibold text-slate-700">
                            選択肢{" "}
                            {index + DISPLAY_INDEX_OFFSET}
                          </span>

                          <span className="block text-[10px] text-slate-400">
                            {isSelected
                              ? "最終的に採用する案"
                              : "クリックして採用案に設定"}
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          removeOption(option.clientId)
                        }
                        disabled={
                          options.length <= MINIMUM_OPTION_COUNT
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                        title="選択肢を削除"
                      >
                        <Trash2
                          size={ICON_SIZE.DELETE_ACTION}
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
                      <input
                        value={option.title}
                        onChange={(event) =>
                          updateOption(
                            option.clientId,
                            "title",
                            event.target.value,
                          )
                        }
                        placeholder="選択肢の名前"
                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <select
                        value={option.proposedBy}
                        onChange={(event) =>
                          updateOption(
                            option.clientId,
                            "proposedBy",
                            event.target.value,
                          )
                        }
                        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      >
                        <option value="自分の案">
                          自分の案
                        </option>
                        <option value="他の人の案">
                          他の人の案
                        </option>
                        <option value="比較案">比較案</option>
                        <option value="当初の案">
                          当初の案
                        </option>
                        <option value="最終案">最終案</option>
                      </select>
                    </div>

                    <textarea
                      value={option.description}
                      onChange={(event) =>
                        updateOption(
                          option.clientId,
                          "description",
                          event.target.value,
                        )
                      }
                      rows={
                        TEXTAREA_ROWS.OPTION_DESCRIPTION
                      }
                      placeholder="この案では何をするのか、簡潔に入力してください。"
                      className="mt-4 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addOption}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50/40 hover:text-indigo-700"
              >
                <Plus size={ICON_SIZE.ADD_ACTION} />
                選択肢を追加
              </button>
            </div>
          </FormSection>

          <FormSection
            number="03"
            englishTitle="Decision"
            title="最終的な決定"
            description="比較した結果、最終的に何をすることにしたのかを書きます。"
            active
          >
            <FormField label="決定内容" required>
              <textarea
                value={decision}
                onChange={(event) =>
                  setDecision(event.target.value)
                }
                rows={TEXTAREA_ROWS.DECISION}
                placeholder="最終的に決めた内容を入力してください。"
                className="w-full resize-y rounded-lg border border-indigo-200 bg-indigo-50/40 px-3 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
          </FormSection>

          <FormSection
            number="04"
            englishTitle="Reason"
            title="この方法を選んだ理由"
            description="ほかの案ではなく、この案を選んだ理由を書きます。"
          >
            <FormField label="選んだ理由" required>
              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                rows={TEXTAREA_ROWS.REASON}
                placeholder="比較した観点や、この案を優先した理由を入力してください。"
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
          </FormSection>

          <FormSection
            number="05"
            englishTitle="Trade-off"
            title="許容するデメリット"
            description="この判断によって諦めることや、将来発生する可能性がある問題を書きます。"
          >
            <FormField label="許容するデメリット">
              <textarea
                value={tradeoff}
                onChange={(event) =>
                  setTradeoff(event.target.value)
                }
                rows={TEXTAREA_ROWS.TRADEOFF}
                placeholder="採用によって発生する制約やデメリットを入力してください。"
                className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </FormField>
          </FormSection>
        </div>
      </div>
    </div>
  );
}

function FormSection({
  number,
  englishTitle,
  title,
  description,
  active = false,
  children,
}: {
  number: string;
  englishTitle: string;
  title: string;
  description: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="relative mt-12 pl-10">
      <div
        className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
          active
            ? "bg-indigo-600 text-white"
            : "border border-slate-200 bg-white text-slate-400"
        }`}
      >
        {number}
      </div>

      <p
        className={`text-xs font-bold uppercase tracking-[0.16em] ${
          active ? "text-indigo-500" : "text-slate-400"
        }`}
      >
        {englishTitle}
      </p>

      <h2 className="mt-2 text-xl font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
        {label}

        {required && (
          <span className="text-red-500">*</span>
        )}
      </span>

      {children}
    </label>
  );
}