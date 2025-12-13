import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">
          🧬 LabFlow
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          AI for Science Starter Kit - 初心者研究者のためのAI科学プラットフォーム
        </p>

        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {domains.map((domain) => (
            <DomainCard key={domain.id} {...domain} />
          ))}
        </div>

        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition hover:bg-primary-700"
          >
            ダッシュボードへ
          </Link>
          <Link
            href="/tutorials"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            チュートリアル
          </Link>
        </div>
      </div>
    </main>
  );
}

interface DomainCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

function DomainCard({ name, description, icon, color }: DomainCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md`}
    >
      <div className={`mb-3 text-3xl`}>{icon}</div>
      <h3 className="mb-2 font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

const domains: DomainCardProps[] = [
  {
    id: 'drug_discovery',
    name: '創薬',
    description: '分子設計、ADMET予測、バーチャルスクリーニング',
    icon: '💊',
    color: 'drug-discovery',
  },
  {
    id: 'materials_science',
    name: '材料科学',
    description: '結晶構造予測、物性シミュレーション',
    icon: '🔬',
    color: 'materials-science',
  },
  {
    id: 'climate',
    name: '気候科学',
    description: '気候モデリング、衛星データ解析',
    icon: '🌍',
    color: 'climate',
  },
  {
    id: 'genomics',
    name: 'ゲノミクス',
    description: 'バリアント解析、タンパク質構造予測',
    icon: '🧬',
    color: 'genomics',
  },
];
