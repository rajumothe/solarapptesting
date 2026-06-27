import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { useSelector, useDispatch } from 'react-redux';
import api from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Main Dashboard Component
 */
export const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedRegion]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/dashboard/metrics', {
        params: {
          timeRange,
          region: selectedRegion !== 'all' ? selectedRegion : undefined,
        },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 Executive Dashboard</h1>
        <div className="dashboard-filters">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="filter-select"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>

          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Regions</option>
            <option value="north">North</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards-grid">
        <KPICard
          title="Total Leads"
          value={dashboardData.leads.total}
          change={dashboardData.leads.change}
          icon="📈"
          color="blue"
        />
        <KPICard
          title="Lead Conversion Rate"
          value={`${dashboardData.leads.conversionRate}%`}
          change={dashboardData.leads.conversionChange}
          icon="🎯"
          color="green"
        />
        <KPICard
          title="Total Orders"
          value={dashboardData.orders.total}
          change={dashboardData.orders.change}
          icon="📦"
          color="orange"
        />
        <KPICard
          title="Revenue"
          value={`₹${(dashboardData.orders.revenue / 100000).toFixed(1)}L`}
          change={dashboardData.orders.revenueChange}
          icon="💰"
          color="purple"
        />
        <KPICard
          title="Avg System Size"
          value={`${dashboardData.orders.avgSystemSize}kW`}
          change={0}
          icon="⚡"
          color="yellow"
        />
        <KPICard
          title="Customer Satisfaction"
          value={`${dashboardData.satisfaction}%`}
          change={dashboardData.satisfactionChange}
          icon="⭐"
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Lead Funnel */}
        <div className="chart-card">
          <h3>Lead Funnel</h3>
          <Bar data={generateLeadFunnelData(dashboardData.leadFunnel)} />
        </div>

        {/* Revenue Trend */}
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <Line data={generateRevenueData(dashboardData.revenueTrend)} />
        </div>

        {/* Lead Status Distribution */}
        <div className="chart-card">
          <h3>Lead Status Distribution</h3>
          <Doughnut data={generateLeadStatusData(dashboardData.leadStatus)} />
        </div>

        {/* Orders by Month */}
        <div className="chart-card">
          <h3>Orders by Month</h3>
          <Bar data={generateOrdersTrendData(dashboardData.ordersTrend)} />
        </div>

        {/* Territory Performance */}
        <div className="chart-card wide">
          <h3>Territory Performance</h3>
          <Bar data={generateTerritoryData(dashboardData.territories)} />
        </div>

        {/* System Capacity Distribution */}
        <div className="chart-card">
          <h3>System Capacity Distribution</h3>
          <Pie data={generateCapacityDistribution(dashboardData.capacityDistribution)} />
        </div>

        {/* Top Performing Engineers */}
        <div className="chart-card wide">
          <h3>Top Performing Engineers</h3>
          <TopPerformersTable data={dashboardData.topEngineers} />
        </div>

        {/* Service Tickets Status */}
        <div className="chart-card">
          <h3>Service Tickets</h3>
          <Pie data={generateTicketStatusData(dashboardData.ticketStatus)} />
        </div>
      </div>

      {/* Recent Activities */}
      <div className="recent-activities">
        <h3>🔔 Recent Activities</h3>
        <ul>
          {dashboardData.recentActivities?.slice(0, 5).map((activity, idx) => (
            <li key={idx}>
              <span className="activity-time">{activity.time}</span>
              <span className="activity-message">{activity.message}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

/**
 * KPI Card Component
 */
const KPICard = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;

  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <h4>{title}</h4>
        <div className="kpi-value">{value}</div>
        <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(change)}% from last period
        </div>
      </div>
    </div>
  );
};

/**
 * Top Performers Table
 */
const TopPerformersTable = ({ data }) => {
  return (
    <table className="performers-table">
      <thead>
        <tr>
          <th>Engineer Name</th>
          <th>Leads Converted</th>
          <th>Revenue Generated</th>
          <th>Satisfaction Rate</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((engineer, idx) => (
          <tr key={idx}>
            <td>{engineer.name}</td>
            <td>{engineer.leadsConverted}</td>
            <td>₹{(engineer.revenue / 100000).toFixed(1)}L</td>
            <td>{engineer.satisfaction}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/**
 * Chart Data Generators
 */

const generateLeadFunnelData = (data) => {
  const stages = ['New', 'Contacted', 'Site Survey', 'Quotation', 'Negotiation', 'Converted'];
  const counts = stages.map((stage) => data[stage.toLowerCase().replace(' ', '')] || 0);

  return {
    labels: stages,
    datasets: [
      {
        label: 'Lead Count',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
};

const generateRevenueData = (data) => {
  const days = Object.keys(data);
  const revenues = Object.values(data);

  return {
    labels: days,
    datasets: [
      {
        label: 'Daily Revenue (₹)',
        data: revenues,
        borderColor: 'rgba(75, 192, 75, 1)',
        backgroundColor: 'rgba(75, 192, 75, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

const generateLeadStatusData = (data) => {
  return {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

const generateOrdersTrendData = (data) => {
  return {
    labels: Object.keys(data),
    datasets: [
      {
        label: 'Orders',
        data: Object.values(data),
        backgroundColor: 'rgba(153, 102, 255, 0.8)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };
};

const generateTerritoryData = (data) => {
  return {
    labels: data.map((t) => t.territory),
    datasets: [
      {
        label: 'Leads',
        data: data.map((t) => t.leads),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: 'Revenue (₹100k)',
        data: data.map((t) => t.revenue / 100000),
        backgroundColor: 'rgba(75, 192, 75, 0.8)',
      },
    ],
  };
};

const generateCapacityDistribution = (data) => {
  return {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

const generateTicketStatusData = (data) => {
  return {
    labels: Object.keys(data),
    datasets: [
      {
        data: Object.values(data),
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

export default Dashboard;
