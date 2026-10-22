import { useQuery } from '@tanstack/react-query'
import {
  Banknote,
  ReceiptText,
  CircleX,
  ChartNoAxesCombined,
  ShoppingBag,
  Utensils,
  Truck,
  Smartphone,
  RefreshCw,
  CalendarDays,
  Wallet,
} from 'lucide-react'
import { getDashboard } from '../api/dashboard.api.js'

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

const paymentItems = [
  { key: 'CASH', label: 'Cash', icon: Banknote },
  { key: 'UPI', label: 'UPI', icon: Smartphone },
  { key: 'PLATFORM', label: 'Delivery platforms', icon: Truck },
]

const orderItems = [
  { key: 'DINE_IN', label: 'Dine-in', icon: Utensils },
  { key: 'TAKEAWAY', label: 'Takeaway', icon: ShoppingBag },
  { key: 'SWIGGY', label: 'Swiggy', icon: Truck },
  { key: 'ZOMATO', label: 'Zomato', icon: Smartphone },
]

function MetricCard({ label, value, detail, icon: Icon }) {
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-stone-900">
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
          <Icon size={21} />
        </div>
      </div>
      <p className="mt-3 text-xs text-stone-500">{detail}</p>
    </article>
  )
}

function BreakdownRow({ label, count, amount, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="rounded-lg bg-stone-100 p-2 text-stone-600">
          <Icon size={17} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-800">{label}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            {count} {count === 1 ? 'bill' : 'bills'}
          </p>
        </div>
      </div>
      <p className="shrink-0 text-sm font-semibold text-stone-900">
        {currency.format(Number(amount) || 0)}
      </p>
    </div>
  )
}

function formatBusinessDate(dateString) {
  if (!dateString) return 'Today'

  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function DashboardPage() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboard(),
  })

  const summary = data?.summary
  const paymentBreakdown = data?.paymentBreakdown
  const orderBreakdown = data?.orderTypeBreakdown

  if (isPending) {
    return (
      <div className="space-y-5">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-stone-200" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="font-semibold text-stone-900">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-stone-600">
          {error.message || 'Unable to load the latest shop figures.'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-500"
        >
          Try again
        </button>
      </section>
    )
  }

  const completedCount = Number(summary?.completedBillCount) || 0
  const totalBills = Number(summary?.totalBillCount) || 0
  const cancelledCount = Number(summary?.cancelledBillCount) || 0

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-orange-600">SHOP OVERVIEW</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
            Today's dashboard
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {formatBusinessDate(data?.date)} · {data?.timezone || 'Asia/Kolkata'}
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Today's revenue"
          value={currency.format(Number(summary?.totalRevenue) || 0)}
          detail="Revenue recorded for this business day"
          icon={Banknote}
        />
        <MetricCard
          label="Completed bills"
          value={completedCount.toLocaleString('en-IN')}
          detail={`${totalBills.toLocaleString('en-IN')} total bills`}
          icon={ReceiptText}
        />
        <MetricCard
          label="Average bill value"
          value={currency.format(Number(summary?.averageBillValue) || 0)}
          detail="Average value reported by the backend"
          icon={ChartNoAxesCombined}
        />
        <MetricCard
          label="Cancelled bills"
          value={cancelledCount.toLocaleString('en-IN')}
          detail="Cancelled bills reported for this day"
          icon={CircleX}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Payment breakdown</h3>
              <p className="mt-1 text-sm text-stone-500">
                Recorded bills by payment method
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {paymentItems.map(({ key, label, icon }) => (
              <BreakdownRow
                key={key}
                label={label}
                count={Number(paymentBreakdown?.[key]?.count) || 0}
                amount={Number(paymentBreakdown?.[key]?.amount) || 0}
                icon={icon}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <CalendarDays size={20} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900">Order type breakdown</h3>
              <p className="mt-1 text-sm text-stone-500">
                Sales grouped by how customers ordered
              </p>
            </div>
          </div>

          <div className="mt-4 divide-y divide-stone-100">
            {orderItems.map(({ key, label, icon }) => (
              <BreakdownRow
                key={key}
                label={label}
                count={Number(orderBreakdown?.[key]?.count) || 0}
                amount={Number(orderBreakdown?.[key]?.amount) || 0}
                icon={icon}
              />
            ))}
          </div>
        </section>
      </div>

      <p className="text-xs leading-5 text-stone-500">
        Figures are loaded from the POS backend. Cancelled bills are shown
        separately; the backend remains the source of truth for sales totals.
      </p>
    </div>
  )
}
