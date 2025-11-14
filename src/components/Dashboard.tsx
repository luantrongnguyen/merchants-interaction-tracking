import React, { useMemo, useState } from 'react';
import { MerchantWithStatus, SupportLog } from '../types/merchant';
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
import Modal from './Modal';

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
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [categoryLogs, setCategoryLogs] = useState<Array<{
		merchant: string;
		storeId?: string;
		log: SupportLog;
	}>>([]);

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

	const handleCategoryClick = (category: string) => {
		const logs: Array<{
			merchant: string;
			storeId?: string;
			log: SupportLog;
		}> = [];
		
		merchants.forEach(merchant => {
			(merchant.supportLogs || []).forEach(log => {
				const logCategory = (log.category || '').trim();
				const categoryKey = logCategory !== '' ? logCategory : 'Uncategorized';
				if (categoryKey === category) {
					logs.push({
						merchant: merchant.name,
						storeId: merchant.storeId,
						log: log,
					});
				}
			});
		});
		
		// Sort by date (newest first)
		logs.sort((a, b) => {
			const dateA = a.log.date ? new Date(a.log.date).getTime() : 0;
			const dateB = b.log.date ? new Date(b.log.date).getTime() : 0;
			return dateB - dateA;
		});
		
		setCategoryLogs(logs);
		setSelectedCategory(category);
	};

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
			legend: { 
				position: 'bottom' as const,
				align: 'start' as const,
				fullSize: false,
				labels: {
					padding: 6,
					font: {
						size: 12,
						weight: 500,
					},
					color: '#475569',
					boxWidth: 10,
					boxHeight: 10,
					usePointStyle: false,
					maxWidth: 150,
					textAlign: 'left' as const,
				},
				onClick: (e: any, legendItem: any, legend: any) => {
					// Extract category name from legend item text (remove percentage)
					const labelText = legendItem.text || '';
					const categoryName = labelText.split(' (')[0];
					if (categoryName) {
						handleCategoryClick(categoryName);
					}
					// Return false to prevent default toggle behavior
					return false;
				},
			},
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(255, 179, 0, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => {
						const value = ctx.parsed || 0;
						const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
						return `${ctx.label}: ${value} (${percent}%)`;
					},
				},
			},
		},
		onClick: (event: any, elements: any[]) => {
			if (elements && elements.length > 0) {
				const element = elements[0];
				const index = element.index;
				if (index !== undefined && labels[index]) {
					handleCategoryClick(labels[index]);
				}
			}
		},
		layout: {
			padding: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 10,
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
				backgroundColor: 'rgba(255, 179, 0, 0.8)',
				borderColor: '#FFB300',
				borderWidth: 2,
				borderRadius: 6,
				borderSkipped: false,
			},
		],
	};

	const barOptions = {
		plugins: {
			legend: { display: false },
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(255, 179, 0, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => `Interactions: ${ctx.parsed.y}`,
				},
			},
		},
		maintainAspectRatio: false,
		scales: {
			y: { 
				beginAtZero: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
			x: {
				grid: {
					display: false,
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
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
			legend: { 
				display: true,
				labels: {
					padding: 15,
					font: {
						size: 12,
						weight: 500,
					},
					color: '#475569',
				},
			},
			tooltip: {
				backgroundColor: 'rgba(30, 41, 59, 0.95)',
				padding: 12,
				titleFont: {
					size: 14,
					weight: 600,
				},
				bodyFont: {
					size: 13,
				},
				cornerRadius: 8,
				borderColor: 'rgba(239, 68, 68, 0.3)',
				borderWidth: 1,
				callbacks: {
					label: (ctx: any) => `Terminal Issues: ${ctx.parsed.y}`,
				},
			},
		},
		maintainAspectRatio: false,
		scales: {
			y: { 
				beginAtZero: true,
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
			x: {
				grid: {
					color: 'rgba(0, 0, 0, 0.05)',
				},
				ticks: {
					color: '#64748b',
					font: {
						size: 12,
					},
				},
			},
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
			<h2>Category Distribution</h2>
			<div className="chart-wrapper chart-wrapper-pie-category">
				{labels.length === 0 ? (
					<div className="empty-state">Không có dữ liệu category.</div>
				) : (
					<Pie data={data} options={options} />
				)}
			</div>

			<h2>Interactions Over Time</h2>
			<div style={{ marginBottom: '1rem' }}>
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
			<h2>Terminal Issues Over Time</h2>
			<div style={{ marginBottom: '1rem' }}>
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
					<div style={{ height: 360, width: '100%', position: 'relative' }}>
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
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: { 
											position: 'right',
											labels: {
												padding: 12,
												font: {
													size: 11,
													weight: 500,
												},
												color: '#475569',
											},
										},
										tooltip: {
											backgroundColor: 'rgba(30, 41, 59, 0.95)',
											padding: 10,
											titleFont: {
												size: 13,
												weight: 600,
											},
											bodyFont: {
												size: 12,
											},
											cornerRadius: 8,
											borderColor: 'rgba(255, 179, 0, 0.3)',
											borderWidth: 1,
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
					<div style={{ height: 360, width: '100%', position: 'relative' }}>
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
									responsive: true,
									maintainAspectRatio: false,
									plugins: {
										legend: { 
											position: 'right',
											labels: {
												padding: 12,
												font: {
													size: 11,
													weight: 500,
												},
												color: '#475569',
											},
										},
										tooltip: {
											backgroundColor: 'rgba(30, 41, 59, 0.95)',
											padding: 10,
											titleFont: {
												size: 13,
												weight: 600,
											},
											bodyFont: {
												size: 12,
											},
											cornerRadius: 8,
											borderColor: 'rgba(255, 179, 0, 0.3)',
											borderWidth: 1,
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

			{/* Category Logs Modal */}
			<Modal
				isOpen={!!selectedCategory}
				onClose={() => setSelectedCategory(null)}
				title={`Support Logs - Category: ${selectedCategory || ''}`}
				width="90%"
				maxWidth="800px"
				maxHeight="80vh"
			>
				{categoryLogs.length === 0 ? (
					<div className="category-logs-empty" style={{ textAlign: 'center', color: '#64748b', padding: '2rem', fontSize: '0.9375rem' }}>Không có support logs cho category này.</div>
				) : (
					<div className="category-logs-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
						{categoryLogs.map((item, index) => (
							<div key={index} className="category-log-item" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', transition: 'all 0.2s' }}>
								<div className="category-log-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>
									<div className="category-log-merchant" style={{ flex: 1, fontSize: '1rem', color: '#1e293b' }}>
										<strong style={{ fontWeight: 600 }}>{item.merchant}</strong>
										{item.storeId && <span className="category-log-storeid" style={{ color: '#64748b', fontSize: '0.875rem', marginLeft: '0.5rem' }}>({item.storeId})</span>}
									</div>
									<div className="category-log-date-time" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>
										<span className="category-log-date" style={{ fontWeight: 500 }}>{item.log.date}</span>
										{item.log.time && <span className="category-log-time" style={{ fontSize: '0.8125rem' }}>{item.log.time}</span>}
									</div>
								</div>
								<div className="category-log-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9375rem', color: '#475569' }}>
									{item.log.supporter && (
										<div className="category-log-supporter" style={{ display: 'flex', gap: '0.5rem' }}>
											<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Supporter:</strong> {item.log.supporter}
										</div>
									)}
									{item.log.issue && (
										<div className="category-log-issue" style={{ display: 'flex', gap: '0.5rem' }}>
											<strong style={{ color: '#1e293b', fontWeight: 600, minWidth: '80px' }}>Issue:</strong> {item.log.issue}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</Modal>
		</div>
	);
};

export default Dashboard;
