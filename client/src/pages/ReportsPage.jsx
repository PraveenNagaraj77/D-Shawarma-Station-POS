
import { useCallback, useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  IndianRupee,
  ReceiptText,
  Calculator,
  Ban,
  RefreshCw,
  ChartColumn,
  CreditCard,
  CalendarDays,
  AlertCircle,
} from 'lucide-react'

import { getSalesReport } from '../api/reports.api.js'

const ORANGE = '#f97316'
const CHART_COLORS = ['#f97316', '#292524', '#a8a29e']

const ORDER_TYPES = [
  { key: 'DINE_IN', label: 'Dine-in' },
  { key: 'TAKEAWAY', label: 'Takeaway' },
  { key: 'SWIGGY', label: 'Swiggy' },
  { key: 'ZOMATO', label: 'Zomato' },
]

const PAYMENT_TYPES = [
  { key: 'CASH', label: 'Cash' },
  { key: 'UPI', label: 'UPI' },
  { key: 'PLATFORM', label: 'Platform' },
]

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom range' },
]

const getToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0)

const formatNumber = (value = 0) =>
  new Intl.NumberFormat('en-IN').format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) return '—'

  const [year, month, day] = value.split('-').map(Number)

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function SummaryCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 break-words text-2xl font-bold text-gray-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function EmptyChart({ message }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg bg-gray-50 px-4 text-center text-sm text-gray-500">
      {message}
    </div>
  )
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily')
  const [date, setDate] = useState(getToday)
  const [startDate, setStartDate] = useState(getToday)
  const [endDate, setEndDate] = useState(getToday)

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadReport = useCallback(async (params) => {
    setError('')
    setRefreshing(true)

    try {
      const result = await getSalesReport(params)
      setReport(result)
    } catch (err) {
      setError(err.message || 'Unable to load the sales report.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadReport({ period: 'daily', date: getToday() })
  }, [loadReport])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (period === 'custom') {
      if (!startDate || !endDate) {
        setError('Please select both dates.')
        return
      }

      if (startDate > endDate) {
        setError('Start date must be on or before end date.')
        return
      }

      loadReport({ period, startDate, endDate })
      return
    }

    if (!date) {
      setError('Please select a date.')
      return
    }

    loadReport({ period, date })
  }

  const summary = report?.summary

  const orderChartData = ORDER_TYPES.map(({ key, label }) => ({
    name: label,
    revenue: Number(report?.orderTypeBreakdown?.[key]?.amount) || 0,
    bills: Number(report?.orderTypeBreakdown?.[key]?.count) || 0,
  }))

  const paymentChartData = PAYMENT_TYPES.map(({ key, label }) => ({
    name: label,
    amount: Number(report?.paymentBreakdown?.[key]?.amount) || 0,
    bills: Number(report?.paymentBreakdown?.[key]?.count) || 0,
  }))

  const hasOrderRevenue = orderChartData.some((item) => item.revenue > 0)
  const hasPaymentRevenue = paymentChartData.some((item) => item.amount > 0)

  const tooltipCurrency = (value) => formatCurrency(value)

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Sales Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track revenue, orders, and payment performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSubmit({
            preventDefault: () => {},
          })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh report
        </button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={19} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900">Report filters</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="report-period"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Period
            </label>
            <select
              id="report-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {PERIODS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {period !== 'custom' ? (
            <div>
              <label
                htmlFor="report-date"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Reference date
              </label>
              <input
                id="report-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="report-start"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Start date
                </label>
                <input
                  id="report-start"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label
                  htmlFor="report-end"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  End date
                </label>
                <input
                  id="report-end"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={refreshing}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {refreshing ? 'Loading...' : 'Apply filters'}
            </button>
          </div>
        </div>

        {report && (
          <p className="mt-3 text-xs text-gray-500">
            Showing {formatDate(report.startDate)} – {formatDate(report.endDate)}
            {' · '}Timezone: {report.timezone || 'Asia/Kolkata'}
          </p>
        )}
      </form>

      {/* Errors */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => handleSubmit({
                preventDefault: () => {},
              })}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total revenue"
          value={loading && !report ? '—' : formatCurrency(summary?.totalRevenue)}
          description="From non-cancelled bills"
          icon={IndianRupee}
        />
        <SummaryCard
          title="Completed bills"
          value={loading && !report ? '—' : formatNumber(summary?.completedBillCount)}
          description="Included in revenue"
          icon={ReceiptText}
        />
        <SummaryCard
          title="Average bill value"
          value={loading && !report ? '—' : formatCurrency(summary?.averageBillValue)}
          description="Revenue per completed bill"
          icon={Calculator}
        />
        <SummaryCard
          title="Cancelled bills"
          value={loading && !report ? '—' : formatNumber(summary?.cancelledBillCount)}
          description={`${formatNumber(summary?.totalBillCount)} total bills in period`}
          icon={Ban}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Order type bar chart */}
        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
              <ChartColumn size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Revenue by order type
              </h2>
              <p className="text-sm text-gray-500">
                Compare sales across all channels
              </p>
            </div>
          </div>

          {loading && !report ? (
            <EmptyChart message="Loading order-type report..." />
          ) : !hasOrderRevenue ? (
            <EmptyChart message="No completed sales for this period." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderChartData}
                  margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `₹${(value / 1000).toFixed(1)}k`
                        : `₹${value}`
                    }
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={65}
                  />
                  <Tooltip
                    formatter={tooltipCurrency}
                    cursor={{ fill: '#fff7ed' }}
                  />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill={ORANGE}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={58}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {orderChartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-gray-600">{item.name}</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatNumber(item.bills)} bills)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment doughnut chart */}
        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-orange-50 p-2.5 text-orange-600">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                Payment breakdown
              </h2>
              <p className="text-sm text-gray-500">
                Revenue by payment method
              </p>
            </div>
          </div>

          {loading && !report ? (
            <EmptyChart message="Loading payment report..." />
          ) : !hasPaymentRevenue ? (
            <EmptyChart message="No completed payments for this period." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData.filter((item) => item.amount > 0)}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="78%"
                    paddingAngle={4}
                    stroke="none"
                  >
                    {paymentChartData
                      .filter((item) => item.amount > 0)
                      .map((item) => (
                        <Cell
                          key={item.name}
                          fill={
                            CHART_COLORS[
                              PAYMENT_TYPES.findIndex(
                                (payment) => payment.label === item.name,
                              )
                            ]
                          }
                        />
                      ))}
                  </Pie>
                  <Tooltip formatter={tooltipCurrency} />
                  <Legend verticalAlign="bottom" height={30} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            {paymentChartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="text-gray-600">{item.name}</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatNumber(item.bills)} bills)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Reporting notes */}
      {report && (
        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-950">
          <p className="font-semibold">About these figures</p>
          <p className="mt-1 leading-6">
            Revenue and payment/order-type charts exclude cancelled bills,
            following the backend report calculation. Platform revenue is
            grouped under Platform payment method. The report uses Indian
            Standard Time date boundaries.
          </p>
        </div>
      )}
    </div>
  )
}
