"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  FilePlus2,
  Files,
  FileText,
  Folder,
  FolderOpen,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  UserCircle,
  X,
} from "lucide-react";
import DecisionSearch from "../components/DecisionSearch";

type DecisionStatus = "採用" | "検討中" | "見送り";
type ActivePanel = "explorer" | "search";

type DecisionOption = {
  title: string;
  description: string;
  proposedBy: string;
  selected: boolean;
};

type DecisionRecord = {
  id: string;
  title: string;
  project: string;
  category: string;
  status: DecisionStatus;
  updatedAt: string;
  background: string;
  options: DecisionOption[];
  decision: string;
  reason: string;
  tradeoff: string;
};

type FolderGroup = {
  id: string;
  name: string;
  records: DecisionRecord[];
};

type ContextMenuState =
  | {
      type: "folder";
      id: string;
      x: number;
      y: number;
    }
  | {
      type: "record";
      id: string;
      x: number;
      y: number;
    };

type EditingState =
  | {
      type: "folder";
      id: string;
      value: string;
    }
  | {
      type: "record";
      id: string;
      value: string;
    };

const DEFAULT_SIDEBAR_WIDTH = 292;
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 480;
const SIDEBAR_STORAGE_KEY = "decision-note-sidebar-width";

const initialFolders: FolderGroup[] = [
  {
    id: "technical-selection",
    name: "技術選定",
    records: [
      {
        id: "firebase-adoption",
        title: "Firebaseを採用する",
        project: "Decision Note",
        category: "技術選定",
        status: "採用",
        updatedAt: "2026/09/10",
        background:
          "知っている人だけが利用できるWebアプリを、できるだけ費用をかけずに公開したい。また、認証機能やデータベースをすべて自分で構築すると、アプリの中心機能以外の実装に時間がかかってしまう。",
        options: [
          {
            title: "Firebase",
            description:
              "認証とデータ保存を一つのサービスで管理し、無料枠から開発を始める。",
            proposedBy: "自分の案",
            selected: true,
          },
          {
            title: "Supabase",
            description:
              "PostgreSQLを利用しながら、認証やデータ保存をまとめて管理する。",
            proposedBy: "比較案",
            selected: false,
          },
          {
            title: "自前のGo APIとPostgreSQL",
            description:
              "認証APIとデータベースを自分で構築し、自由度の高い構成にする。",
            proposedBy: "当初の案",
            selected: false,
          },
        ],
        decision:
          "認証と判断記録の保存に、Firebase AuthenticationとCloud Firestoreを使用する。",
        reason:
          "認証とデータ保存を一つのサービスで扱うことができ、小規模な個人開発であれば無料枠から始められるため。また、ユーザー管理を自前で実装する場合と比べて、開発と運用の負担を抑えられる。",
        tradeoff:
          "Firebaseへの依存度が高くなり、将来ほかのデータベースへ移行する場合には修正が必要になる。今回はサービスの移植性よりも、開発速度と運用負担の小ささを優先する。",
      },
      {
        id: "vercel-deployment",
        title: "Vercelへ公開する",
        project: "Decision Note",
        category: "技術選定",
        status: "採用",
        updatedAt: "2026/09/08",
        background:
          "Next.jsで作成したフロントエンドを、複雑なサーバー設定を行わずに公開したい。GitHubへの更新を、できるだけ簡単に公開環境へ反映できる構成が必要だった。",
        options: [
          {
            title: "Vercel",
            description:
              "GitHubと連携し、pushを起点にNext.jsを自動でデプロイする。",
            proposedBy: "自分の案",
            selected: true,
          },
          {
            title: "Firebase Hosting",
            description:
              "Firebaseのサービス内で、認証やDBと合わせて公開環境も管理する。",
            proposedBy: "比較案",
            selected: false,
          },
          {
            title: "自分でサーバーを構築する",
            description:
              "クラウド上にサーバーを用意し、公開環境を自分で設定する。",
            proposedBy: "比較案",
            selected: false,
          },
        ],
        decision:
          "フロントエンドのデプロイ先としてVercelを使用する。",
        reason:
          "Next.jsとの親和性が高く、GitHubと連携することで更新を自動的に公開環境へ反映できるため。",
        tradeoff:
          "Vercel固有の仕組みに依存する部分が増えるが、デプロイと運用の簡単さを優先する。",
      },
      {
        id: "nextjs-framework",
        title: "Next.jsを採用する",
        project: "Decision Note",
        category: "技術選定",
        status: "採用",
        updatedAt: "2026/09/04",
        background:
          "判断記録を見やすく表示でき、今後の認証機能や編集機能の追加にも対応できるフロントエンドを作りたい。",
        options: [
          {
            title: "Next.js",
            description:
              "Reactをベースに、Webアプリに必要な機能をまとめて利用する。",
            proposedBy: "自分の案",
            selected: true,
          },
          {
            title: "ReactとVite",
            description:
              "シンプルなReact環境を構築し、必要な機能を後から追加する。",
            proposedBy: "比較案",
            selected: false,
          },
          {
            title: "HTML・CSS・JavaScript",
            description:
              "フレームワークを使用せず、基本的なWeb技術だけで実装する。",
            proposedBy: "比較案",
            selected: false,
          },
        ],
        decision:
          "フロントエンドのフレームワークとしてNext.jsを使用する。",
        reason:
          "ルーティングやレイアウトなど、Webアプリに必要な機能をまとめて利用できるため。",
        tradeoff:
          "Reactだけを利用する場合より覚える内容は増えるが、拡張性と開発効率を優先する。",
      },
    ],
  },
  {
    id: "screen-design",
    name: "画面設計",
    records: [
      {
        id: "ide-style-tree",
        title: "左側に判断ツリーを表示する",
        project: "Decision Note",
        category: "画面設計",
        status: "採用",
        updatedAt: "2026/09/11",
        background:
          "判断記録が増えた場合でも、過去の記録を簡単に探せる画面にしたい。",
        options: [
          {
            title: "IDE風の判断ツリー",
            description:
              "カテゴリをフォルダ、判断記録をファイルのように階層表示する。",
            proposedBy: "自分の案",
            selected: true,
          },
          {
            title: "カード形式の一覧",
            description:
              "判断記録をカードとして画面内に並べて表示する。",
            proposedBy: "他の人の案",
            selected: false,
          },
          {
            title: "時系列のタイムライン",
            description:
              "作成した日付順に判断記録を並べて表示する。",
            proposedBy: "比較案",
            selected: false,
          },
        ],
        decision:
          "JetBrains製IDEやVS Codeを参考に、画面左側へカテゴリと判断記録を階層表示する。",
        reason:
          "判断をフォルダのように整理でき、目的の記録へすぐにアクセスできるため。",
        tradeoff:
          "一般的なメモアプリより画面構成が複雑になるが、整理のしやすさを優先する。",
      },
      {
        id: "single-page-editor",
        title: "編集画面を1ページにまとめる",
        project: "Decision Note",
        category: "画面設計",
        status: "検討中",
        updatedAt: "2026/09/11",
        background:
          "複数ページを移動せず、判断した内容を一つの画面で記録できるようにしたい。",
        options: [
          {
            title: "1ページですべて入力する",
            description:
              "課題からデメリットまで、同じ画面をスクロールして入力する。",
            proposedBy: "自分の案",
            selected: true,
          },
          {
            title: "ステップ形式で入力する",
            description:
              "質問を一つずつ表示し、回答後に次の項目へ進む。",
            proposedBy: "他の人の案",
            selected: false,
          },
          {
            title: "項目ごとにページを分ける",
            description:
              "課題や選択肢などを、それぞれ別ページで入力する。",
            proposedBy: "比較案",
            selected: false,
          },
        ],
        decision:
          "課題、選択肢、決定内容、理由、デメリットを一つの画面から入力できるようにする。",
        reason:
          "必要な情報を順番に整理でき、記録する心理的なハードルを下げられるため。",
        tradeoff:
          "入力画面が長くなるため、項目数を必要最低限に絞る必要がある。",
      },
    ],
  },
  {
    id: "rejected",
    name: "見送り",
    records: [
      {
        id: "notion-only-rejected",
        title: "Notionだけで管理する",
        project: "Decision Note",
        category: "見送り",
        status: "見送り",
        updatedAt: "2026/09/06",
        background:
          "新しいアプリを作らず、既存のツールだけで判断記録を管理する方法も検討した。",
        options: [
          {
            title: "独自アプリを開発する",
            description:
              "判断の記録と振り返りに特化した機能を実装する。",
            proposedBy: "最終案",
            selected: true,
          },
          {
            title: "Notionだけで管理する",
            description:
              "既存のテンプレートを利用して判断記録を保存する。",
            proposedBy: "当初の案",
            selected: false,
          },
          {
            title: "MarkdownとGitHubで管理する",
            description:
              "判断記録をMarkdownファイルとして保存する。",
            proposedBy: "比較案",
            selected: false,
          },
        ],
        decision:
          "Notionだけで管理する案は見送り、独自アプリを開発する。",
        reason:
          "選択肢や判断理由を比較し、判断の過程を振り返ることに特化した体験を作るため。",
        tradeoff:
          "開発コストは増えるが、判断の振り返りに特化した画面を設計できる。",
      },
    ],
  },
];

function clampSidebarWidth(width: number) {
  return Math.min(
    MAX_SIDEBAR_WIDTH,
    Math.max(MIN_SIDEBAR_WIDTH, width),
  );
}

function StatusBadge({ status }: { status: DecisionStatus }) {
  const styles: Record<DecisionStatus, string> = {
    採用: "border-emerald-200 bg-emerald-50 text-emerald-700",
    検討中: "border-amber-200 bg-amber-50 text-amber-700",
    見送り: "border-slate-300 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className="mr-1.5 text-[9px]">●</span>
      {status}
    </span>
  );
}

function OptionCard({
  option,
  number,
}: {
  option: DecisionOption;
  number: number;
}) {
  return (
    <div
      className={`relative rounded-xl border p-5 ${
        option.selected
          ? "border-indigo-300 bg-indigo-50/70 shadow-sm"
          : "border-slate-200 bg-white"
      }`}
    >
      {option.selected && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-semibold text-white">
          <Check size={11} strokeWidth={2.5} />
          採用
        </span>
      )}

      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            option.selected
              ? "bg-indigo-600 text-white"
              : "border border-slate-300 bg-white text-slate-400"
          }`}
        >
          {option.selected ? (
            <Check size={13} strokeWidth={2.5} />
          ) : (
            <Circle
              size={9}
              fill="currentColor"
              strokeWidth={0}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 pr-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-slate-400">
              OPTION {String(number).padStart(2, "0")}
            </span>

            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              {option.proposedBy}
            </span>
          </div>

          <h3
            className={`mt-2 text-[15px] font-semibold ${
              option.selected
                ? "text-indigo-950"
                : "text-slate-800"
            }`}
          >
            {option.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {option.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepNumber({
  number,
  active = false,
}: {
  number: string;
  active?: boolean;
}) {
  return (
    <div
      className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
        active
          ? "bg-indigo-600 text-white"
          : "border border-slate-200 bg-white text-slate-400"
      }`}
    >
      {number}
    </div>
  );
}

function StepLine() {
  return (
    <div className="absolute bottom-[-48px] left-[13px] top-8 w-px bg-slate-200" />
  );
}

function SectionLabel({
  children,
  active = false,
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <p
      className={`text-xs font-bold uppercase tracking-[0.16em] ${
        active ? "text-indigo-500" : "text-slate-400"
      }`}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-2 text-xl font-bold text-slate-900">
      {children}
    </h2>
  );
}

export default function Home() {
  const [folders, setFolders] =
    useState<FolderGroup[]>(initialFolders);

  const allRecords = useMemo(
    () => folders.flatMap((folder) => folder.records),
    [folders],
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    "firebase-adoption",
  );

  const [openTabIds, setOpenTabIds] = useState<string[]>([
    "firebase-adoption",
  ]);

  const [dirtyIds, setDirtyIds] = useState<Set<string>>(
    () => new Set(),
  );

  const [draggedTabId, setDraggedTabId] =
    useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [activePanel, setActivePanel] =
    useState<ActivePanel>("explorer");

  const [openFolders, setOpenFolders] = useState<
    Record<string, boolean>
  >({
    "technical-selection": true,
    "screen-design": true,
    rejected: true,
  });

  const [contextMenu, setContextMenu] =
    useState<ContextMenuState | null>(null);

  const [editing, setEditing] =
    useState<EditingState | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(
    DEFAULT_SIDEBAR_WIDTH,
  );

  const [isResizing, setIsResizing] = useState(false);

  const resizeStartRef = useRef({
    x: 0,
    width: DEFAULT_SIDEBAR_WIDTH,
  });

  const sidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);

  const selectedRecord =
    allRecords.find((record) => record.id === selectedId) ??
    null;

  const openTabs = openTabIds
    .map((id) =>
      allRecords.find((record) => record.id === id),
    )
    .filter(
      (record): record is DecisionRecord =>
        record !== undefined,
    );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedWidth = window.localStorage.getItem(
        SIDEBAR_STORAGE_KEY,
      );

      if (!storedWidth) {
        return;
      }

      const parsedWidth = Number(storedWidth);

      if (Number.isNaN(parsedWidth)) {
        return;
      }

      const nextWidth = clampSidebarWidth(parsedWidth);

      sidebarWidthRef.current = nextWidth;

      setSidebarWidth((currentWidth) => {
        if (currentWidth === nextWidth) {
          return currentWidth;
        }

        return nextWidth;
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const difference =
        event.clientX - resizeStartRef.current.x;

      const nextWidth = clampSidebarWidth(
        resizeStartRef.current.width + difference,
      );

      sidebarWidthRef.current = nextWidth;
      setSidebarWidth(nextWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);

      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(sidebarWidthRef.current),
      );
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener(
      "pointermove",
      handlePointerMove,
    );
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );
      window.removeEventListener(
        "pointerup",
        handlePointerUp,
      );
    };
  }, [isResizing]);

  useEffect(() => {
    const closeContextMenu = () => {
      setContextMenu(null);
    };

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("resize", closeContextMenu);

    return () => {
      window.removeEventListener(
        "click",
        closeContextMenu,
      );
      window.removeEventListener(
        "resize",
        closeContextMenu,
      );
    };
  }, []);

  const showExplorer = useCallback(() => {
    setIsSidebarOpen(true);
    setActivePanel("explorer");
  }, []);

  const toggleExplorer = useCallback(() => {
    if (isSidebarOpen && activePanel === "explorer") {
      setIsSidebarOpen(false);
      return;
    }

    setActivePanel("explorer");
    setIsSidebarOpen(true);
  }, [activePanel, isSidebarOpen]);

  const toggleSearch = useCallback(() => {
    if (isSidebarOpen && activePanel === "search") {
      setIsSidebarOpen(false);
      return;
    }

    setActivePanel("search");
    setIsSidebarOpen(true);
  }, [activePanel, isSidebarOpen]);

  const openRecord = useCallback((id: string) => {
    setOpenTabIds((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id],
    );

    setSelectedId(id);
  }, []);

  const closeTab = (id: string) => {
    setOpenTabIds((previous) => {
      const closingIndex = previous.indexOf(id);

      const nextTabs = previous.filter(
        (tabId) => tabId !== id,
      );

      if (selectedId === id) {
        const nextSelectedId =
          nextTabs[
            Math.min(closingIndex, nextTabs.length - 1)
          ] ?? null;

        setSelectedId(nextSelectedId);
      }

      return nextTabs;
    });
  };

  const reorderTabs = (
    draggedId: string,
    targetId: string,
  ) => {
    if (draggedId === targetId) {
      return;
    }

    setOpenTabIds((previous) => {
      const nextTabs = [...previous];
      const draggedIndex = nextTabs.indexOf(draggedId);
      const targetIndex = nextTabs.indexOf(targetId);

      if (draggedIndex === -1 || targetIndex === -1) {
        return previous;
      }

      nextTabs.splice(draggedIndex, 1);
      nextTabs.splice(targetIndex, 0, draggedId);

      return nextTabs;
    });
  };

  const toggleFolder = (folderId: string) => {
    setOpenFolders((previous) => ({
      ...previous,
      [folderId]: !previous[folderId],
    }));
  };

  const markDirty = (recordIds: string[]) => {
    setDirtyIds((previous) => {
      const next = new Set(previous);

      recordIds.forEach((id) => {
        next.add(id);
      });

      return next;
    });
  };

  const saveRecord = (recordId: string) => {
    setDirtyIds((previous) => {
      const next = new Set(previous);
      next.delete(recordId);
      return next;
    });
  };

  const beginFolderRename = (folderId: string) => {
    const folder = folders.find(
      (item) => item.id === folderId,
    );

    if (!folder) {
      return;
    }

    setEditing({
      type: "folder",
      id: folder.id,
      value: folder.name,
    });

    setContextMenu(null);
  };

  const beginRecordRename = (recordId: string) => {
    const record = allRecords.find(
      (item) => item.id === recordId,
    );

    if (!record) {
      return;
    }

    setEditing({
      type: "record",
      id: record.id,
      value: record.title,
    });

    openRecord(record.id);
    setContextMenu(null);
  };

  const commitRename = () => {
    if (!editing) {
      return;
    }

    const nextValue = editing.value.trim();

    if (!nextValue) {
      setEditing(null);
      return;
    }

    if (editing.type === "folder") {
      const targetFolder = folders.find(
        (folder) => folder.id === editing.id,
      );

      if (!targetFolder) {
        setEditing(null);
        return;
      }

      setFolders((previous) =>
        previous.map((folder) => {
          if (folder.id !== editing.id) {
            return folder;
          }

          return {
            ...folder,
            name: nextValue,
            records: folder.records.map((record) => ({
              ...record,
              category: nextValue,
            })),
          };
        }),
      );

      markDirty(
        targetFolder.records.map((record) => record.id),
      );
    }

    if (editing.type === "record") {
      setFolders((previous) =>
        previous.map((folder) => ({
          ...folder,
          records: folder.records.map((record) =>
            record.id === editing.id
              ? {
                  ...record,
                  title: nextValue,
                }
              : record,
          ),
        })),
      );

      markDirty([editing.id]);
    }

    setEditing(null);
  };

  const openFolderContextMenu = (
    event: ReactMouseEvent,
    folderId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      type: "folder",
      id: folderId,
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 100),
    });
  };

  const openRecordContextMenu = (
    event: ReactMouseEvent,
    recordId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      type: "record",
      id: recordId,
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 140),
    });
  };

  const beginSidebarResize = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    resizeStartRef.current = {
      x: event.clientX,
      width: sidebarWidth,
    };

    setIsResizing(true);
  };

  const resetSidebarWidth = () => {
    sidebarWidthRef.current = DEFAULT_SIDEBAR_WIDTH;
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);

    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      String(DEFAULT_SIDEBAR_WIDTH),
    );
  };

  const changeSidebarWidthByKeyboard = (
    difference: number,
  ) => {
    const nextWidth = clampSidebarWidth(
      sidebarWidthRef.current + difference,
    );

    sidebarWidthRef.current = nextWidth;
    setSidebarWidth(nextWidth);

    window.localStorage.setItem(
      SIDEBAR_STORAGE_KEY,
      String(nextWidth),
    );
  };

  const handleRenameKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitRename();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setEditing(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-900">
      {/* Activity Bar */}
      <aside className="flex w-12 shrink-0 flex-col border-r border-[#2b2d30] bg-[#1e1f22] text-[#9da0a8]">
        <div className="flex h-12 items-center justify-center border-b border-[#2b2d30]">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-sm font-bold text-white">
            D
          </div>
        </div>

        <nav className="flex flex-1 flex-col items-center py-1">
          <button
            type="button"
            onClick={toggleExplorer}
            className={`relative flex h-12 w-full items-center justify-center transition ${
              activePanel === "explorer" && isSidebarOpen
                ? "text-white"
                : "hover:bg-white/5 hover:text-white"
            }`}
            title={
              activePanel === "explorer" && isSidebarOpen
                ? "Explorerを閉じる"
                : "Explorerを開く"
            }
          >
            {activePanel === "explorer" &&
              isSidebarOpen && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-indigo-400" />
              )}

            <Files size={22} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            onClick={toggleSearch}
            className={`relative flex h-12 w-full items-center justify-center transition ${
              activePanel === "search" && isSidebarOpen
                ? "text-white"
                : "hover:bg-white/5 hover:text-white"
            }`}
            title={
              activePanel === "search" && isSidebarOpen
                ? "検索を閉じる"
                : "検索を開く"
            }
          >
            {activePanel === "search" &&
              isSidebarOpen && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-r bg-indigo-400" />
              )}

            <Search size={22} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center transition hover:bg-white/5 hover:text-white"
            title="判断履歴"
          >
            <Clock3 size={21} strokeWidth={1.7} />
          </button>
        </nav>

        <div className="flex flex-col border-t border-[#2b2d30] py-1">
          <button
            type="button"
            className="flex h-11 items-center justify-center transition hover:bg-white/5 hover:text-white"
            title="アカウント"
          >
            <UserCircle size={21} strokeWidth={1.7} />
          </button>

          <button
            type="button"
            className="flex h-11 items-center justify-center transition hover:bg-white/5 hover:text-white"
            title="設定"
          >
            <Settings size={21} strokeWidth={1.7} />
          </button>
        </div>
      </aside>

      {/* Resizable Sidebar */}
      {isSidebarOpen && (
        <div
          className="relative block h-full shrink-0 border-r border-[#dfe1e5]"
          style={{ width: sidebarWidth }}
        >
          {activePanel === "explorer" ? (
            <aside className="flex h-full w-full flex-col bg-[#f7f8fa]">
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#dfe1e5] px-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                  Explorer
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                    title="新しい判断"
                  >
                    <FilePlus2 size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                    title="新しいフォルダ"
                  >
                    <Folder size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                    title="その他"
                  >
                    <MoreHorizontal size={17} />
                  </button>
                </div>
              </div>

              <div className="flex h-9 shrink-0 items-center border-b border-[#e5e7eb] px-2">
                <ChevronDown
                  size={14}
                  className="mr-1 text-slate-500"
                />

                <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Decision Note
                </span>
              </div>

              <div className="px-3 pb-2 pt-3">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
                >
                  <Plus size={16} />
                  新しい判断
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto pb-3 pt-1">
                {folders.map((folder) => {
                  const isFolderOpen =
                    openFolders[folder.id];

                  const isEditingFolder =
                    editing?.type === "folder" &&
                    editing.id === folder.id;

                  return (
                    <div key={folder.id}>
                      <div
                        onContextMenu={(event) =>
                          openFolderContextMenu(
                            event,
                            folder.id,
                          )
                        }
                        className="flex min-h-7 items-center hover:bg-[#e8eaed]"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleFolder(folder.id)
                          }
                          className="flex h-7 shrink-0 items-center pl-2"
                        >
                          {isFolderOpen ? (
                            <ChevronDown
                              size={14}
                              className="text-slate-500"
                            />
                          ) : (
                            <ChevronRight
                              size={14}
                              className="text-slate-500"
                            />
                          )}
                        </button>

                        {isFolderOpen ? (
                          <FolderOpen
                            size={15}
                            className="mr-1.5 shrink-0 text-amber-500"
                          />
                        ) : (
                          <Folder
                            size={15}
                            className="mr-1.5 shrink-0 text-amber-500"
                          />
                        )}

                        {isEditingFolder ? (
                          <input
                            autoFocus
                            value={editing.value}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                value: event.target.value,
                              })
                            }
                            onKeyDown={handleRenameKeyDown}
                            onBlur={commitRename}
                            className="mr-2 h-6 min-w-0 flex-1 rounded border border-indigo-500 bg-white px-1.5 text-xs outline-none"
                          />
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                toggleFolder(folder.id)
                              }
                              className="min-w-0 flex-1 truncate text-left text-xs font-medium text-slate-700"
                            >
                              {folder.name}
                            </button>

                            <span className="ml-2 mr-2 text-[10px] text-slate-400">
                              {folder.records.length}
                            </span>
                          </>
                        )}
                      </div>

                      {isFolderOpen &&
                        folder.records.map((record) => {
                          const isSelected =
                            record.id === selectedId;

                          const isEditingRecord =
                            editing?.type === "record" &&
                            editing.id === record.id;

                          return (
                            <div
                              key={record.id}
                              onContextMenu={(event) =>
                                openRecordContextMenu(
                                  event,
                                  record.id,
                                )
                              }
                              className={`relative flex min-h-8 items-center pl-8 pr-2 text-xs ${
                                isSelected
                                  ? "bg-[#dfe7ff] text-indigo-950"
                                  : "text-slate-600 hover:bg-[#e8eaed]"
                              }`}
                            >
                              {isSelected && (
                                <span className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                              )}

                              <FileText
                                size={14}
                                className={`mr-2 shrink-0 ${
                                  isSelected
                                    ? "text-indigo-600"
                                    : "text-slate-400"
                                }`}
                              />

                              {isEditingRecord ? (
                                <input
                                  autoFocus
                                  value={editing.value}
                                  onChange={(event) =>
                                    setEditing({
                                      ...editing,
                                      value:
                                        event.target.value,
                                    })
                                  }
                                  onKeyDown={
                                    handleRenameKeyDown
                                  }
                                  onBlur={commitRename}
                                  className="h-6 min-w-0 flex-1 rounded border border-indigo-500 bg-white px-1.5 text-xs outline-none"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openRecord(record.id)
                                  }
                                  className="min-w-0 flex-1 truncate py-2 text-left"
                                >
                                  {record.title}
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </nav>

              <div className="flex h-8 shrink-0 items-center justify-between border-t border-[#dfe1e5] px-3 text-[10px] text-slate-500">
                <span>{allRecords.length} decisions</span>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded p-1 hover:bg-slate-200"
                  title="サイドバーを閉じる"
                >
                  <PanelLeftClose size={14} />
                </button>
              </div>
            </aside>
          ) : (
            <DecisionSearch
              records={allRecords}
              selectedId={selectedId}
              onSelect={openRecord}
              onShowExplorer={showExplorer}
              onClose={() => setIsSidebarOpen(false)}
            />
          )}

          <div
            role="separator"
            aria-label="サイドバーの幅を変更"
            aria-orientation="vertical"
            tabIndex={0}
            onPointerDown={beginSidebarResize}
            onDoubleClick={resetSidebarWidth}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                changeSidebarWidthByKeyboard(-16);
              }

              if (event.key === "ArrowRight") {
                changeSidebarWidthByKeyboard(16);
              }
            }}
            className={`absolute inset-y-0 right-[-3px] z-30 w-[6px] cursor-col-resize outline-none transition ${
              isResizing
                ? "bg-indigo-500"
                : "bg-transparent hover:bg-indigo-400 focus:bg-indigo-400"
            }`}
            title="ドラッグで幅を変更・ダブルクリックで元に戻す"
          />
        </div>
      )}

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col bg-white">
        {/* Tabs */}
        <div className="flex h-[42px] shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50">
          {openTabs.map((record) => {
            const isActive = record.id === selectedId;
            const isDirty = dirtyIds.has(record.id);

            return (
              <div
                key={record.id}
                draggable
                onDragStart={() =>
                  setDraggedTabId(record.id)
                }
                onDragEnd={() => setDraggedTabId(null)}
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onDrop={() => {
                  if (draggedTabId) {
                    reorderTabs(
                      draggedTabId,
                      record.id,
                    );
                  }

                  setDraggedTabId(null);
                }}
                onClick={() => setSelectedId(record.id)}
                className={`group flex h-full min-w-[180px] max-w-[300px] cursor-pointer items-center border-r border-slate-200 px-3 ${
                  isActive
                    ? "border-t-2 border-t-indigo-500 bg-white"
                    : "border-t-2 border-t-transparent bg-slate-50 hover:bg-slate-100"
                } ${
                  draggedTabId === record.id
                    ? "opacity-50"
                    : ""
                }`}
              >
                <FileText
                  size={14}
                  className="mr-2 shrink-0 text-indigo-500"
                />

                <span className="min-w-0 flex-1 truncate text-xs text-slate-700">
                  {record.title}
                </span>

                {isDirty && (
                  <span
                    className="ml-2 h-2 w-2 shrink-0 rounded-full bg-slate-600"
                    title="未保存"
                  />
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    closeTab(record.id);
                  }}
                  className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 opacity-0 hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
                  title="タブを閉じる"
                >
                  <X size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {selectedRecord ? (
          <>
            <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 px-5">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-slate-500">
                <span className="shrink-0">
                  {selectedRecord.project}
                </span>

                <span className="shrink-0 text-slate-300">
                  /
                </span>

                <span className="shrink-0">
                  {selectedRecord.category}
                </span>

                <span className="shrink-0 text-slate-300">
                  /
                </span>

                <span className="truncate font-medium text-slate-700">
                  {selectedRecord.title}
                </span>
              </div>

              <div className="ml-3 flex shrink-0 items-center gap-2">
                {dirtyIds.has(selectedRecord.id) ? (
                  <span className="hidden text-xs text-amber-600 lg:block">
                    ● 未保存
                  </span>
                ) : (
                  <span className="hidden text-xs text-slate-400 lg:block">
                    ✓ 保存済み
                  </span>
                )}

                <button
                  type="button"
                  disabled={
                    !dirtyIds.has(selectedRecord.id)
                  }
                  onClick={() =>
                    saveRecord(selectedRecord.id)
                  }
                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={15} />

                  <span className="hidden sm:inline">
                    保存
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(event) =>
                    openRecordContextMenu(
                      event,
                      selectedRecord.id,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  title="その他"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <article className="mx-auto w-full max-w-[920px] px-5 pb-24 pt-10 sm:px-10">
                <div className="border-b border-slate-200 pb-9">
                  <div className="mb-5">
                    <StatusBadge
                      status={selectedRecord.status}
                    />
                  </div>

                  <h1 className="max-w-3xl text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-[38px]">
                    {selectedRecord.title}
                  </h1>

                  <p className="mt-4 max-w-2xl leading-7 text-slate-500">
                    選択肢を比較し、なぜその方法を選んだのか。
                    判断の過程まで残して、未来の自分が振り返れるようにする。
                  </p>

                  <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
                    <span>
                      Project
                      <strong className="ml-2 font-medium text-slate-600">
                        {selectedRecord.project}
                      </strong>
                    </span>

                    <span>
                      Category
                      <strong className="ml-2 font-medium text-slate-600">
                        {selectedRecord.category}
                      </strong>
                    </span>

                    <span>
                      Updated
                      <strong className="ml-2 font-medium text-slate-600">
                        {selectedRecord.updatedAt}
                      </strong>
                    </span>
                  </div>
                </div>

                <section className="relative mt-12 pl-10">
                  <StepNumber number="01" />
                  <StepLine />
                  <SectionLabel>Context</SectionLabel>
                  <SectionTitle>課題・背景</SectionTitle>

                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    {selectedRecord.background}
                  </p>
                </section>

                <section className="relative mt-12 pl-10">
                  <StepNumber number="02" />
                  <StepLine />
                  <SectionLabel>Options</SectionLabel>
                  <SectionTitle>
                    検討した選択肢
                  </SectionTitle>

                  <div className="mt-5 space-y-3">
                    {selectedRecord.options.map(
                      (option, index) => (
                        <OptionCard
                          key={`${selectedRecord.id}-${option.title}`}
                          option={option}
                          number={index + 1}
                        />
                      ),
                    )}
                  </div>
                </section>

                <section className="relative mt-12 pl-10">
                  <StepNumber number="03" active />
                  <StepLine />

                  <SectionLabel active>
                    Decision
                  </SectionLabel>

                  <SectionTitle>
                    最終的な決定
                  </SectionTitle>

                  <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-6">
                    <p className="text-[15px] font-medium leading-8 text-slate-800">
                      {selectedRecord.decision}
                    </p>
                  </div>
                </section>

                <section className="relative mt-12 pl-10">
                  <StepNumber number="04" />
                  <StepLine />
                  <SectionLabel>Reason</SectionLabel>

                  <SectionTitle>
                    この方法を選んだ理由
                  </SectionTitle>

                  <p className="mt-4 text-[15px] leading-8 text-slate-600">
                    {selectedRecord.reason}
                  </p>
                </section>

                <section className="relative mt-12 pl-10">
                  <StepNumber number="05" />
                  <SectionLabel>
                    Trade-off
                  </SectionLabel>

                  <SectionTitle>
                    許容したデメリット
                  </SectionTitle>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <p className="text-[15px] leading-8 text-slate-600">
                      {selectedRecord.tradeoff}
                    </p>
                  </div>
                </section>
              </article>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white">
            <div className="px-4 text-center">
              <Files
                size={42}
                strokeWidth={1.2}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 text-sm font-medium text-slate-600">
                開いている判断はありません
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Explorerから判断記録を選択してください
              </p>
            </div>
          </div>
        )}

        <footer className="flex h-7 shrink-0 items-center justify-between bg-indigo-600 px-4 text-[11px] text-indigo-50">
          <span>Decision Note</span>

          <div className="flex items-center gap-4">
            <span>{openTabIds.length} open tabs</span>
            <span>{allRecords.length} records</span>
          </div>
        </footer>
      </main>

      {/* Context Menu */}
      {contextMenu && (
        <div
          onClick={(event) => event.stopPropagation()}
          className="fixed z-50 w-44 rounded-md border border-slate-200 bg-white py-1 text-xs shadow-xl"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          {contextMenu.type === "record" && (
            <button
              type="button"
              onClick={() => {
                openRecord(contextMenu.id);
                setContextMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
            >
              <FileText size={14} />
              タブで開く
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (contextMenu.type === "folder") {
                beginFolderRename(contextMenu.id);
              } else {
                beginRecordRename(contextMenu.id);
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
          >
            <Pencil size={14} />
            名前を変更
          </button>
        </div>
      )}
    </div>
  );
}