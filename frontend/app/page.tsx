const folders = [
  {
    name: "技術選定",
    records: [
      "Firebaseを採用する",
      "Vercelへ公開する",
      "Next.jsを採用する",
    ],
  },
  {
    name: "画面設計",
    records: [
      "左側にフォルダを表示する",
      "編集画面を1ページにまとめる",
    ],
  },
  {
    name: "見送り",
    records: ["Notionを使用する"],
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      {/* 左側のフォルダ一覧 */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 md:flex md:flex-col">
        <div className="border-b border-slate-200 px-5 py-5">
          <h1 className="text-xl font-bold">判断ノート</h1>
          <p className="mt-1 text-sm text-slate-500">
            Decision Records
          </p>
        </div>

        <div className="p-4">
          <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            ＋ 新しい判断
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-5">
          {folders.map((folder) => (
            <div key={folder.name} className="mb-4">
              <p className="mb-1 flex items-center gap-2 px-2 text-sm font-semibold text-slate-700">
                <span className="text-indigo-500">▼</span>
                <span>📁</span>
                {folder.name}
              </p>

              <div className="ml-4 border-l border-slate-200 pl-2">
                {folder.records.map((record) => (
                  <button
                    key={record}
                    className="mb-1 w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    📄 {record}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 text-sm text-slate-500">
          🔒 知っている人限定
        </div>
      </aside>

      {/* 右側の判断記録 */}
      <main className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm text-slate-500">
            ニュースアプリ / 技術選定
          </p>

          <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
            編集する
          </button>
        </header>

        <article className="mx-auto max-w-4xl px-6 py-10">
          <div className="border-b border-slate-200 pb-8">
            <div className="mb-4 flex gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-600">
                ADR-001
              </span>

              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                採用
              </span>
            </div>

            <h2 className="text-4xl font-bold tracking-tight">
              Firebaseを採用する
            </h2>

            <p className="mt-3 text-slate-500">
              決めたことと、その理由をひとつの記録に。
            </p>
          </div>

          <div className="space-y-10 py-9">
            <section>
              <h3 className="mb-4 text-xl font-bold">
                01 課題・背景
              </h3>
              <p className="leading-8 text-slate-600">
                知っている人だけが利用できるWebアプリを、
                できるだけ費用をかけずに公開したい。
              </p>
            </section>

            <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <h3 className="text-lg font-bold text-indigo-950">
                ✓ 決定内容
              </h3>
              <p className="mt-4 leading-8 text-slate-700">
                Firebase AuthenticationとCloud Firestoreを使用する。
              </p>
            </section>

            <section>
              <h3 className="mb-4 text-xl font-bold">
                02 採用した理由
              </h3>
              <p className="leading-8 text-slate-600">
                認証とデータ保存をまとめて実装でき、小規模なアプリなら
                無料枠で始められるため。
              </p>
            </section>

            <section>
              <h3 className="mb-4 text-xl font-bold">
                03 許容するデメリット
              </h3>
              <p className="leading-8 text-slate-600">
                Firebaseへの依存は増えるが、開発のしやすさと
                運用負担の小ささを優先する。
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}