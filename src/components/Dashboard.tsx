import React, { useMemo, useState } from 'react';
import { MerchantWithStatus } from '../types/merchant';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
	LineElement,
	PointElement
} from 'chart.js';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

interface DashboardProps {
	merchants: MerchantWithStatus[];
}

const COLORS = [
	'#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
	'#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E',
	'#316395', '#994499', '#22AA99', '#AAAA11', '#6633CC',
	'#E67300', '#8B0707', '#651067', '#329262', '#5574A6'
];

	const Dashboard: React.FC<DashboardProps> = ({ merchants }) => {
	const [range, setRange] = useState<'day' | 'week' | 'month' | 'year'>('day');
	const [terminalRange, setTerminalRange] = useState<'day' | 'week' | 'month' | 'year'>('day');

	const { labels, counts, categoryMap } = useMemo(() => {
		const categoryCountMap = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
				const raw = (log.category || '').trim();
				const key = raw !== '' ? raw : 'Uncategorized';
				categoryCountMap.set(key, (categoryCountMap.get(key) || 0) + 1);
			});
		});
		const labelsArr = Array.from(categoryCountMap.keys());
		const countsArr = labelsArr.map(l => categoryCountMap.get(l) || 0);
		return { labels: labelsArr, counts: countsArr, categoryMap: categoryCountMap };
	}, [merchants]);

	const total = counts.reduce((a, b) => a + b, 0);

	const data = {
		labels,
		datasets: [
			{
				label: 'Số lượng theo Category',
				data: counts,
				backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
				borderColor: '#ffffff',
				borderWidth: 1,
			},
		],
	};

	const options = {
		plugins: {
			legend: { position: 'right' as const },
			tooltip: {
				callbacks: {
					label: (ctx: any) => {
						const value = ctx.parsed || 0;
						const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
						return `${ctx.label}: ${value} (${percent}%)`;
					},
				},
			},
		},
		maintainAspectRatio: false,
	} as const;

	// ---------- Bar chart for interactions over time ----------
	const parseDate = (dateString: string): Date | null => {
		if (!dateString) return null;
		try {
			if (dateString.includes('/')) {
				const parts = dateString.split('/');
				if (parts.length === 3) {
					const [month, day, year] = parts;
					return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
				}
			}
			const d = new Date(dateString);
			return isNaN(d.getTime()) ? null : d;
		} catch {
			return null;
		}
	};

	const getDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
	const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
	const getYearKey = (d: Date) => `${d.getFullYear()}`;
	const getWeekKey = (d: Date) => {
		const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
		const dayNum = date.getUTCDay() || 7; // 1..7, Mon..Sun
		if (dayNum !== 1) {
			date.setUTCDate(date.getUTCDate() + (1 - dayNum));
		}
		const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
		const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
		return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
	};

	const timeAgg = useMemo(() => {
		const map = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
				const d = parseDate(log.date);
				if (!d) return;
				let key = '';
				switch (range) {
					case 'day': key = getDayKey(d); break;
					case 'week': key = getWeekKey(d); break;
					case 'month': key = getMonthKey(d); break;
					case 'year': key = getYearKey(d); break;
				}
				map.set(key, (map.get(key) || 0) + 1);
			});
		});
		const keys = Array.from(map.keys()).sort();
		return { labels: keys, counts: keys.map(k => map.get(k) || 0) };
	}, [merchants, range]);

	const barData = {
		labels: timeAgg.labels,
		datasets: [
			{
				label: 'Interactions',
				data: timeAgg.counts,
				backgroundColor: '#4F46E5',
				borderColor: '#4338CA',
				borderWidth: 1,
			},
		],
	};

	const barOptions = {
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx: any) => `Interactions: ${ctx.parsed.y}`,
				},
			},
		},
		maintainAspectRatio: false,
		scales: {
			y: { beginAtZero: true }
		}
	} as const;

	// ---------- Terminal Issues Over Time ----------
	const terminalKeywords = ['terminal', 'disconnected', 'processing', 'connection', 'connectivity', 'network', 'offline', 'online'];
	const isTerminalRelated = (category: string | undefined): boolean => {
		if (!category) return false;
		const lowerCategory = category.toLowerCase();
		return terminalKeywords.some(keyword => lowerCategory.includes(keyword));
	};

	const terminalTimeAgg = useMemo(() => {
		const map = new Map<string, number>();
		merchants.forEach(m => {
			(m.supportLogs || []).forEach(log => {
				if (!isTerminalRelated(log.category)) return;
				const d = parseDate(log.date);
				if (!d) return;
				let key = '';
				switch (terminalRange) {
					case 'day': key = getDayKey(d); break;
					case 'week': key = getWeekKey(d); break;
					case 'month': key = getMonthKey(d); break;
					case 'year': key = getYearKey(d); break;
				}
				map.set(key, (map.get(key) || 0) + 1);
			});
		});
		const keys = Array.from(map.keys()).sort();
		return { labels: keys, counts: keys.map(k => map.get(k) || 0) };
	}, [merchants, terminalRange]);

	const terminalLineData = {
		labels: terminalTimeAgg.labels,
		datasets: [
			{
				label: 'Terminal Issues',
				data: terminalTimeAgg.counts,
				borderColor: '#EF4444',
				backgroundColor: 'rgba(239, 68, 68, 0.1)',
				borderWidth: 2,
				fill: true,
				tension: 0.4,
			},
		],
	};

	const terminalLineOptions = {
		plugins: {
			legend: { display: true },
			tooltip: {
				callbacks: {
					label: (ctx: any) => `Terminal Issues: ${ctx.parsed.y}`,
				},
			},
		},
		maintainAspectRatio: false,
		scales: {
			y: { beginAtZero: true }
		}
	} as const;

	// ---------- Leaderboards: top merchants by interactions/issues ----------
	const leaderboards = useMemo(() => {
		const byMerchant = merchants.map(m => {
			const logs = m.supportLogs || [];
			const interactions = logs.length;
			const distinctCategorySet = new Set<string>();
			logs.forEach(l => {
				const raw = (l.category || '').trim();
				const key = raw !== '' ? raw : 'Uncategorized';
				distinctCategorySet.add(key);
			});
			const distinctCategories = distinctCategorySet.size;
			return {
				name: m.name,
				storeId: m.storeId || '',
				interactions,
				distinctCategories,
			};
		});
		const topInteractions = byMerchant.slice().sort((a, b) => b.interactions - a.interactions).slice(0, 10);
		const topIssues = byMerchant.slice().sort((a, b) => b.distinctCategories - a.distinctCategories).slice(0, 10);
		const grandTotalInteractions = byMerchant.reduce((s, m) => s + m.interactions, 0);
		const grandTotalDistinctCategories = byMerchant.reduce((s, m) => s + m.distinctCategories, 0);
		return { topInteractions, topIssues, grandTotalInteractions, grandTotalDistinctCategories };
	}, [merchants]);

	return (
		<div className="dashboard-container">
			<h2>Dashboard - Category Distribution</h2>
			<div className="chart-wrapper">
				{labels.length === 0 ? (
					<div className="empty-state">Không có dữ liệu category.</div>
				) : (
					<Pie data={data} options={options} />
				)}
			</div>


			<h2 style={{ marginTop: 24 }}>Interactions Over Time</h2>
			<div style={{ marginBottom: 8 }}>
				<select value={range} onChange={e => setRange(e.target.value as any)}>
					<option value="day">Day</option>
					<option value="week">Week</option>
					<option value="month">Month</option>
					<option value="year">Year</option>
				</select>
			</div>
			<div className="chart-wrapper" style={{ height: 380 }}>
				{timeAgg.labels.length === 0 ? (
					<div className="empty-state">Không có dữ liệu interactions.</div>
				) : (
					<Bar data={barData} options={barOptions} />
				)}
			</div>

			{/* Terminal Issues Over Time */}
			<h2 style={{ marginTop: 24 }}>Terminal issues (disconnected, processing, ...) over time</h2>
			<div style={{ marginBottom: 8 }}>
				<select value={terminalRange} onChange={e => setTerminalRange(e.target.value as any)}>
					<option value="day">Day</option>
					<option value="week">Week</option>
					<option value="month">Month</option>
					<option value="year">Year</option>
				</select>
			</div>
			<div className="chart-wrapper" style={{ height: 380 }}>
				{terminalTimeAgg.labels.length === 0 ? (
					<div className="empty-state">No terminal-related interactions found.</div>
				) : (
					<Line data={terminalLineData} options={terminalLineOptions} />
				)}
			</div>

			<div className="leaderboards">
				<div className="board">
					<h3>Top Merchants by Interactions</h3>
					<div style={{ height: 360 }}>
						{leaderboards.topInteractions.length === 0 ? (
							<div className="empty-state">Không có dữ liệu.</div>
						) : (
							<Pie 
								data={{
									labels: leaderboards.topInteractions.map((m) => `${m.name}${m.storeId ? ` (${m.storeId})` : ''}`),
									datasets: [{
										label: 'Interactions',
										data: leaderboards.topInteractions.map(m => m.interactions),
										backgroundColor: leaderboards.topInteractions.map((_, i) => COLORS[i % COLORS.length]),
										borderColor: '#fff',
										borderWidth: 1,
									}],
								}}
								options={{
									plugins: {
										legend: { position: 'right' },
										tooltip: {
											callbacks: {
												label: (ctx: any) => {
													const value = ctx.parsed || 0;
													const totalVal = leaderboards.grandTotalInteractions || 0;
													const pct = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0.0';
													return `${ctx.label}: ${value} (${pct}%)`;
												}
											}
										}
									}
								}}
							/>
						)}
					</div>
				</div>
				<div className="board">
					<h3>Top Merchants by Issues</h3>
					<div style={{ height: 360 }}>
						{leaderboards.topIssues.length === 0 ? (
							<div className="empty-state">Không có dữ liệu.</div>
						) : (
							<Pie 
								data={{
									labels: leaderboards.topIssues.map((m) => `${m.name}${m.storeId ? ` (${m.storeId})` : ''}`),
									datasets: [{
										label: 'Distinct Categories',
										data: leaderboards.topIssues.map(m => m.distinctCategories),
										backgroundColor: leaderboards.topIssues.map((_, i) => COLORS[i % COLORS.length]),
										borderColor: '#fff',
										borderWidth: 1,
									}],
								}}
								options={{
								plugins: {
									legend: { position: 'right' },
									tooltip: {
											callbacks: {
												label: (ctx: any) => {
													const value = ctx.parsed || 0;
													const totalVal = leaderboards.grandTotalDistinctCategories || 0;
													const pct = totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : '0.0';
													return `${ctx.label}: ${value} (${pct}%)`;
												}
											}
										}
									}
								}}
							/>
						)}
					</div>
				</div>
			</div>

		</div>
	);
};

export default Dashboard;
