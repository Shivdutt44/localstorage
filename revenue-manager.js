class RevenueManager {
    constructor() {
        this.invoices = [];
        this.charts = {};
    }

    async init() {
        await this.loadUI();
        this.loadData();
        this.updateMetrics();
        this.renderCharts();
    }

    async loadUI() {
        const revenuePage = document.getElementById('page-revenue');
        if (!revenuePage) return;

        try {
            const response = await fetch('revenue.html');
            if (!response.ok) throw new Error('Failed to load revenue UI');
            const html = await response.text();
            revenuePage.innerHTML = html;
        } catch (error) {
            console.error('Error loading revenue page:', error);
            revenuePage.innerHTML = `<div style="padding:20px; color:red;">Error: ${error.message}</div>`;
        }
    }

    loadData() {
        try {
            const stored = localStorage.getItem('ayush_invoices');
            if (stored) {
                this.invoices = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.invoices = [];
        }
    }

    updateMetrics() {
        const totalRevenue = this.invoices.reduce((sum, inv) => sum + (inv.totals?.total || 0), 0);
        const totalGst = this.invoices.reduce((sum, inv) => sum + (inv.totals?.tax || 0), 0);
        const netSales = totalRevenue - totalGst;
        const totalOrders = this.invoices.length;

        // Calculate Growth (dummy for now relative to 100 orders target)
        const growth = totalOrders > 0 ? Math.min(100, (totalOrders / 100) * 100).toFixed(1) : 0;

        document.getElementById('revenue-total-sales').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
        document.getElementById('revenue-net-sales').textContent = `₹${Math.round(netSales).toLocaleString('en-IN')}`;
        document.getElementById('revenue-gst-total').textContent = `₹${Math.round(totalGst).toLocaleString('en-IN')}`;

        const growthEl = document.getElementById('revenue-growth');
        if (growthEl) {
            growthEl.innerHTML = `<i class="fas fa-chart-line"></i> ${growth}% Target Reached`;
        }

        this.renderRecentSales();
        this.renderTopProducts();
    }

    renderRecentSales() {
        const listContainer = document.getElementById('revenue-recent-list');
        if (!listContainer) return;

        const recent = [...this.invoices]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recent.length === 0) {
            listContainer.innerHTML = '<div class="no-data">No sales records yet.</div>';
            return;
        }

        listContainer.innerHTML = recent.map(inv => `
            <div class="recent-sale-item">
                <div class="sale-info">
                    <span class="sale-customer">${inv.customerName}</span>
                    <span class="sale-date">${inv.date}</span>
                </div>
                <div class="sale-amount">₹${(inv.totals?.total || 0).toLocaleString('en-IN')}</div>
            </div>
        `).join('');
    }

    renderTopProducts() {
        const listContainer = document.getElementById('top-products-list');
        if (!listContainer) return;

        const productStats = {};
        this.invoices.forEach(inv => {
            (inv.products || []).forEach(p => {
                const key = p.name || 'Unnamed Product';
                if (!productStats[key]) {
                    productStats[key] = { qty: 0, revenue: 0 };
                }
                productStats[key].qty += (p.quantity || 1);
                productStats[key].revenue += (p.price * p.quantity || 0);
            });
        });

        const top5 = Object.entries(productStats)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5);

        if (top5.length === 0) {
            listContainer.innerHTML = '<div class="no-data">No product statistical data available.</div>';
            return;
        }

        const maxRevenue = top5[0][1].revenue;

        listContainer.innerHTML = top5.map(([name, stats], i) => {
            const percentage = (stats.revenue / maxRevenue) * 100;
            return `
                <div class="top-product-item" style="margin-bottom: 12px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:13px; font-weight:600;">
                        <span>${i + 1}. ${name}</span>
                        <span>₹${Math.round(stats.revenue).toLocaleString('en-IN')}</span>
                    </div>
                    <div class="progress-bar-wrap" style="height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
                        <div class="progress-fill" style="width: ${percentage}%; height:100%; background:linear-gradient(90deg, #6366f1, #a855f7); border-radius:10px;"></div>
                    </div>
                    <div style="font-size:11px; color:#64748b; margin-top:2px;">Sold: ${stats.qty} unit(s)</div>
                </div>
            `;
        }).join('');
    }

    renderCharts() {
        this.renderSalesBreakdown();
        this.renderRevenueTrend();
        this.renderPaymentStatus();
    }

    renderPaymentStatus() {
        const ctx = document.getElementById('paymentStatusChart');
        if (!ctx) return;

        const statusCounts = { 'completed': 0, 'paid': 0, 'generated': 0, 'pending': 0 };
        this.invoices.forEach(inv => {
            const s = (inv.status || 'generated').toLowerCase();
            if (statusCounts.hasOwnProperty(s)) {
                statusCounts[s]++;
            } else {
                statusCounts['pending']++;
            }
        });

        const labels = Object.keys(statusCounts).map(l => l.charAt(0).toUpperCase() + l.slice(1));
        const data = Object.values(statusCounts);

        if (this.charts.payment) this.charts.payment.destroy();

        this.charts.payment = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15,
                            font: { size: 11 }
                        }
                    }
                }
            }
        });

        this.renderAdvancedStatusLegend(statusCounts);
    }

    renderAdvancedStatusLegend(counts) {
        const el = document.getElementById('status-legend-advanced');
        if (!el) return;

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        const colors = { 'completed': '#10b981', 'paid': '#3b82f6', 'generated': '#f59e0b', 'pending': '#ef4444' };

        el.innerHTML = Object.entries(counts).map(([status, count]) => {
            const perc = total > 0 ? Math.round((count / total) * 100) : 0;
            return `
                <div class="status-summary-item" style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #f8fafc; font-size:12px;">
                    <span style="display:flex; align-items:center; gap:8px;">
                        <span style="width:8px; height:8px; border-radius:50%; background:${colors[status]}"></span>
                        ${status.toUpperCase()}
                    </span>
                    <span style="font-weight:700;">${perc}%</span>
                </div>
            `;
        }).join('');
    }

    renderSalesBreakdown() {
        const ctx = document.getElementById('salesBreakdownChart');
        if (!ctx) return;

        const categoryData = {};
        this.invoices.forEach(inv => {
            (inv.products || []).forEach(p => {
                const cat = this.getCategory(p.name);
                categoryData[cat] = (categoryData[cat] || 0) + (p.price * p.quantity || 0);
            });
        });

        const labels = Object.keys(categoryData);
        const data = Object.values(categoryData);

        if (this.charts.breakdown) this.charts.breakdown.destroy();

        this.charts.breakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                cutout: '70%'
            }
        });

        this.renderCustomLegend(labels, data);
    }

    renderCustomLegend(labels, data) {
        const legendEl = document.getElementById('sales-legend');
        if (!legendEl) return;

        const total = data.reduce((a, b) => a + b, 0);
        const colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

        legendEl.innerHTML = labels.map((label, i) => {
            const percentage = total > 0 ? Math.round((data[i] / total) * 100) : 0;
            return `
                <div class="legend-item-v2" style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
                    <div style="display:flex; align-items:center;">
                        <span class="dot" style="width:8px; height:8px; border-radius:50%; margin-right:8px; background:${colors[i % colors.length]}"></span>
                        <span class="label">${label}</span>
                    </div>
                    <span class="value" style="font-weight:700;">${percentage}%</span>
                </div>
            `;
        }).join('');
    }

    renderRevenueTrend() {
        const ctx = document.getElementById('revenueTrendChart');
        if (!ctx) return;

        const months = [];
        const revenueByMonth = {};

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const mLabel = d.toLocaleString('default', { month: 'short' });
            months.push(mLabel);
            revenueByMonth[mLabel] = 0;
        }

        this.invoices.forEach(inv => {
            const d = new Date(inv.date);
            const mLabel = d.toLocaleString('default', { month: 'short' });
            if (revenueByMonth.hasOwnProperty(mLabel)) {
                revenueByMonth[mLabel] += (inv.totals?.total || 0);
            }
        });

        if (this.charts.trend) this.charts.trend.destroy();

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue',
                    data: Object.values(revenueByMonth),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' }
                    },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    getCategory(name) {
        const n = (name || '').toUpperCase();
        if (n.includes('TV')) return 'Electronics (TV)';
        if (n.includes('FRIDGE') || n.includes('REFRIGERATOR')) return 'Appliances';
        if (n.includes('MOBILE') || n.includes('PHONE')) return 'Mobile';
        if (n.includes('AC') || n.includes('AIR')) return 'AC/Cooling';
        return 'General';
    }

    refreshDashboard() {
        this.init();
    }
}

const revenueManager = new RevenueManager();
window.revenueManager = revenueManager;
