import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getPortfolioSummary, getEvmMetrics } from '@/api/pmo';
import { listProjects } from '@/api/projects';
import { formatCurrency, stageBadge, stageLabel, riskColor, riskLabel } from '@/utils/format';
import { aggregateRaidItems } from './dashboardUtils';
import type { PortfolioSummary, EvmMetrics, RaidItemDto, ProjectDto } from '@/types';
import BarChart from '@/pages/reports/BarChart';
import Spinner from '@/components/common/Spinner';

export default function ExecutiveDashboard() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [evmMap, setEvmMap] = useState<Record<number, EvmMetrics>>({});
  const [allRisks, setAllRisks] = useState<RaidItemDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPortfolioSummary().catch(() => null),
      listProjects(),
    ]).then(async ([portfolioData, projectList]) => {
      setPortfolio(portfolioData);
      setProjects(projectList);

      const ids = projectList.map((p) => p.id);
      const [evmResults, risks] = await Promise.all([
        Promise.all(ids.map((id) => getEvmMetrics(id).catch(() => null))).then((results) => {
          const map: Record<number, EvmMetrics> = {};
          results.forEach((e, i) => { if (e) map[ids[i]] = e; });
          return map;
        }),
        aggregateRaidItems(ids, 'RISK').then((items) =>
          items.filter((r) => r.status === 'OPEN' || r.status === 'MITIGATING'),
        ),
      ]);

      setEvmMap(evmResults);
      setAllRisks(risks);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    );
  }

  const kpiCards = portfolio ? [
    { label: 'Total Projects', value: portfolio.totalProjects, color: 'bg-primary-50 text-primary-700' },
    { label: 'Total Budget', value: formatCurrency(portfolio.totalBudget), color: 'bg-blue-50 text-blue-700' },
    { label: 'Portfolio CPI', value: portfolio.portfolioCv !== 0 ? (portfolio.totalActualCost > 0 ? (portfolio.totalEarnedValue / portfolio.totalActualCost).toFixed(2) : '—') : '—', color: portfolio.portfolioCv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Portfolio SPI', value: portfolio.totalPlannedValue > 0 ? (portfolio.totalEarnedValue / portfolio.totalPlannedValue).toFixed(2) : '—', color: portfolio.portfolioSv >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700' },
    { label: 'Open Risks', value: portfolio.totalOpenRisks + portfolio.totalMitigatingRisks, color: 'bg-amber-50 text-amber-700' },
    { label: 'Completion', value: portfolio.totalIssues > 0 ? ((portfolio.totalCompleted / portfolio.totalIssues) * 100).toFixed(0) + '%' : '—', color: 'bg-emerald-50 text-emerald-700' },
  ] : [
    { label: 'Total Projects', value: projects.length, color: 'bg-primary-50 text-primary-700' },
  ];

  const stageLabels: Record<string, string> = {
    INITIATION: 'Initiation',
    PLANNING: 'Planning',
    EXECUTION: 'Execution',
    CLOSING: 'Closing',
  };

  const stageColors: Record<string, string> = {
    INITIATION: 'bg-blue-500',
    PLANNING: 'bg-purple-500',
    EXECUTION: 'bg-amber-500',
    CLOSING: 'bg-green-500',
  };

  const budgetItems = projects
    .filter((p) => p.budget)
    .map((p) => ({
      label: p.key,
      title: p.name,
      value: Number(p.budget),
      color: 'bg-blue-500',
    }));

  const spentItems = projects
    .filter((p) => p.budget)
    .map((p) => {
      const evm = evmMap[p.id];
      const spent = Number(p.budgetSpent || 0) + (evm?.actualCost || 0);
      const over = spent > Number(p.budget);
      return {
        label: p.key,
        title: p.name,
        value: spent,
        color: over ? 'bg-red-500' : 'bg-green-500',
      };
    });

  const maxBudget = Math.max(...budgetItems.map((i) => i.value), 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {user ? `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${user.firstName}` : 'Welcome'}
        </h2>
        <p className="text-gray-500 mt-1">Portfolio overview and strategic insights.</p>
      </div>

      {/* Portfolio KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Stage Distribution */}
      {portfolio?.stageDistribution && Object.keys(portfolio.stageDistribution).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(portfolio.stageDistribution).map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stageColors[stage] || 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">{stageLabels[stage] || stage}: <strong>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget Overview */}
      {budgetItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Spent</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Budget</h4>
              <BarChart items={budgetItems} maxValue={maxBudget} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-3">Spent</h4>
              <BarChart items={spentItems} maxValue={maxBudget} />
            </div>
          </div>
        </div>
      )}

      {/* Project Health Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Health</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const evm = evmMap[project.id];
            const projectRisks = allRisks.filter((r) => r.projectId === project.id);
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {project.key}
                    </span>
                    <h4 className="font-semibold text-gray-900 truncate">{project.name}</h4>
                  </div>
                  {project.stage && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadge(project.stage)}`}>
                      {stageLabel(project.stage)}
                    </span>
                  )}
                </div>
                {evm && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20">Completion</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 rounded-full h-2"
                          style={{ width: `${Math.round(evm.completionPct * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{(evm.completionPct * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>CPI: <span className={evm.cpi >= 1 ? 'text-green-600' : evm.cpi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.cpi.toFixed(2)}</span></span>
                      <span>SPI: <span className={evm.spi >= 1 ? 'text-green-600' : evm.spi >= 0.9 ? 'text-yellow-600' : 'text-red-600'}>{evm.spi.toFixed(2)}</span></span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>Budget: {formatCurrency(Number(project.budget || 0))}</span>
                  <span>Risks: {projectRisks.length > 0 ? (
                    <span className={riskColor(Math.max(...projectRisks.map((r) => r.riskScore)))}>
                      {projectRisks.length} (max: {Math.max(...projectRisks.map((r) => r.riskScore))})
                    </span>
                  ) : '0'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Top Risks */}
      {allRisks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Risks</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">P × I</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allRisks.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{r.projectName}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${riskColor(r.riskScore)}`}>
                        {r.riskScore} — {riskLabel(r.riskScore)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.probability} × {r.impact}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'MITIGATING' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}