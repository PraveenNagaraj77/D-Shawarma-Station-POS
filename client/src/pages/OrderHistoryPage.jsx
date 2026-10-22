
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ReceiptText,
  Eye,
  X,
  Ban,
  LoaderCircle,
  CalendarDays,
  ShoppingBag,
  IndianRupee,
  Printer,
  AlertCircle,
} from "lucide-react";
import { getOrders, getOrder, cancelOrder } from "../api/orders.api.js";

const ORDER_TYPES = ["DINE_IN", "TAKEAWAY", "SWIGGY", "ZOMATO"];
const PAYMENT_METHODS = ["CASH", "UPI", "PLATFORM"];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) =>
  String(status || "COMPLETED").replaceAll("_", " ");

const getError = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

const inputClass =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

function StatusBadge({ status }) {
  const cancelled = status === "CANCELLED";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        cancelled
          ? "bg-red-50 text-red-700"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {statusLabel(status)}
    </span>
  );
}

function DetailModal({ order, loading, onClose, onCancel }) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  if (!order && !loading) return null;

  const items = order?.items || [];
  const status = order?.status || "COMPLETED";
  const cancelled = status === "CANCELLED";

  async function handleCancel() {
    if (!order?._id || cancelling || cancelled) return;

    setCancelling(true);
    setError("");

    try {
      await onCancel(order._id);
      setConfirmCancel(false);
    } catch (err) {
      setError(getError(err));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4">
          <div>
            <h2 id="order-detail-title" className="text-lg font-bold text-stone-900">
              Order details
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {order?.billNumber || "Loading order..."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Close order details"
          >
            <X size={20} />
          </button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-stone-500">
            <LoaderCircle className="animate-spin" size={22} />
            Loading saved order...
          </div>
        ) : (
          <>
            <div id="order-print-area" className="space-y-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Bill reference
                  </p>
                  <p className="mt-1 text-xl font-bold text-stone-900">
                    {order.billNumber || "—"}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">Order type</p>
                  <p className="mt-1 text-sm font-semibold">
                    {order.orderType?.replaceAll("_", " ") || "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3">
                  <p className="text-xs text-stone-500">Payment</p>
                  <p className="mt-1 text-sm font-semibold">
                    {order.paymentMethod || "—"}
                  </p>
                </div>
                <div className="col-span-2 rounded-xl bg-orange-50 p-3 sm:col-span-1">
                  <p className="text-xs text-stone-500">Bill total</p>
                  <p className="mt-1 text-lg font-bold text-orange-700">
                    {money(order.totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-stone-900">Items</h3>
                <div className="overflow-hidden rounded-xl border border-stone-200">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-500">
                    <span>Item</span>
                    <span className="text-right">Qty</span>
                    <span className="text-right">Amount</span>
                  </div>

                  {items.map((item, index) => (
                    <div
                      key={item._id || `${item.name}-${index}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-3 border-t border-stone-100 px-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-stone-800">
                          {item.name || "Menu item"}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {money(item.unitPrice)} each
                        </p>
                      </div>
                      <span className="text-right">{item.quantity}</span>
                      <span className="text-right font-medium">
                        {money(
                          item.lineTotal ??
                            Number(item.unitPrice || 0) *
                              Number(item.quantity || 0)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-t border-dashed border-stone-200 pt-4 text-sm">
                <div className="flex justify-between gap-4 text-stone-600">
                  <span>Subtotal</span>
                  <span>{money(order.subtotal)}</span>
                </div>
                <div className="flex justify-between gap-4 text-stone-600">
                  <span>Parcel charge</span>
                  <span>{money(order.parcelCharge)}</span>
                </div>
                <div className="flex justify-between gap-4 text-stone-600">
                  <span>Discount</span>
                  <span>−{money(order.discountAmount)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-stone-200 pt-3 text-base font-bold text-stone-900">
                  <span>Total</span>
                  <span>{money(order.totalAmount)}</span>
                </div>
              </div>

              {cancelled && order.cancelledAt && (
                <p className="text-xs text-red-600">
                  Cancelled on {formatDate(order.cancelledAt)}
                </p>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {confirmCancel && (
              <div className="mx-5 mb-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-800">Cancel this bill?</p>
                <p className="mt-1 text-sm text-red-700">
                  This changes the order status. The saved order will remain in
                  the database.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling..." : "Confirm cancellation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelling}
                    className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700"
                  >
                    Keep order
                  </button>
                </div>
              </div>
            )}

            <footer className="flex flex-wrap justify-between gap-2 border-t border-stone-100 bg-white p-4">
              <div>
                {!cancelled && (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={confirmCancel || cancelling}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Ban size={16} />
                    Cancel order
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                <Printer size={16} />
                Print details
              </button>
            </footer>
          </>
        )}
      </section>
    </div>
  );
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getOrders();
      setOrders(Array.isArray(response?.orders) ? response.orders : []);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        String(order.billNumber || "").toLowerCase().includes(query) ||
        String(order.orderType || "").toLowerCase().includes(query) ||
        String(order.paymentMethod || "").toLowerCase().includes(query) ||
        (order.items || []).some((item) =>
          String(item.name || "").toLowerCase().includes(query)
        );

      const matchesType =
        typeFilter === "ALL" || order.orderType === typeFilter;

      const matchesPayment =
        paymentFilter === "ALL" || order.paymentMethod === paymentFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "CANCELLED"
          ? order.status === "CANCELLED"
          : statusFilter === "COMPLETED"
            ? order.status !== "CANCELLED"
            : false);

      const orderDate = order.createdAt ? new Date(order.createdAt) : null;
      const matchesFrom =
        !fromDate ||
        (orderDate &&
          !Number.isNaN(orderDate.getTime()) &&
          orderDate >= new Date(`${fromDate}T00:00:00`));
      const matchesTo =
        !toDate ||
        (orderDate &&
          !Number.isNaN(orderDate.getTime()) &&
          orderDate <= new Date(`${toDate}T23:59:59.999`));

      return (
        matchesSearch &&
        matchesType &&
        matchesPayment &&
        matchesStatus &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [
    orders,
    search,
    typeFilter,
    paymentFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  async function openOrder(id) {
    setSelectedOrder(null);
    setDetailLoading(true);
    setError("");

    try {
      const response = await getOrder(id);
      if (!response?.bill) throw new Error("Order details were not returned.");
      setSelectedOrder(response.bill);
    } catch (err) {
      setError(getError(err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCancel(id) {
    // Do not automatically retry this mutation; duplicate cancellation
    // requests should not be sent.
    await cancelOrder(id);

    setNotice("Order cancelled successfully.");
    setSelectedOrder((current) =>
      current && current._id === id
        ? {
            ...current,
            status: "CANCELLED",
            cancelledAt: new Date().toISOString(),
          }
        : current
    );

    setRefreshKey((key) => key + 1);
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("ALL");
    setPaymentFilter("ALL");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
  }

  const cancelledCount = orders.filter(
    (order) => order.status === "CANCELLED"
  ).length;

  const totalValue = orders.reduce(
    (sum, order) =>
      sum + (order.status === "CANCELLED" ? 0 : Number(order.totalAmount) || 0),
    0
  );

  return (
    <main className="min-h-full bg-stone-50 p-4 text-stone-900 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">
              D Shawarma Station
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Order History
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Search, review, and manage saved bills.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNotice("");
              setRefreshKey((key) => key + 1);
            }}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-stone-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </header>

        {notice && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <ReceiptText size={17} />
            {notice}
            <button
              type="button"
              className="ml-auto"
              onClick={() => setNotice("")}
              aria-label="Dismiss notice"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <ShoppingBag size={17} />
              Total saved orders
            </div>
            <p className="mt-2 text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <IndianRupee size={17} />
              Non-cancelled bill value
            </div>
            <p className="mt-2 text-2xl font-bold">{money(totalValue)}</p>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Ban size={17} />
              Cancelled orders
            </div>
            <p className="mt-2 text-2xl font-bold">{cancelledCount}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search bill number, item, order type, or payment..."
              className={`${inputClass} pl-10`}
              aria-label="Search orders"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="space-y-1.5 text-xs font-semibold text-stone-600">
              Order type
              <select
                className={inputClass}
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">All types</option>
                {ORDER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-stone-600">
              Payment
              <select
                className={inputClass}
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
              >
                <option value="ALL">All payments</option>
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-stone-600">
              Status
              <select
                className={inputClass}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                <option value="COMPLETED">Not cancelled</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-stone-600">
              From date
              <input
                type="date"
                className={inputClass}
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>

            <label className="space-y-1.5 text-xs font-semibold text-stone-600">
              To date
              <input
                type="date"
                className={inputClass}
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-3">
            <p className="text-sm text-stone-500">
              Showing{" "}
              <span className="font-semibold text-stone-800">
                {filteredOrders.length}
              </span>{" "}
              of {orders.length} orders
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Clear filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 p-12 text-stone-500">
              <LoaderCircle size={22} className="animate-spin" />
              Loading order history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-14 text-center">
              <div className="rounded-2xl bg-orange-50 p-4 text-orange-600">
                <ReceiptText size={30} />
              </div>
              <h2 className="mt-4 font-semibold">No matching orders</h2>
              <p className="mt-1 max-w-sm text-sm text-stone-500">
                Try a different search or clear the filters. Existing orders
                have not been changed.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-4">Bill</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Type / Payment</th>
                      <th className="px-5 py-4">Items</th>
                      <th className="px-5 py-4">Total</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-t border-stone-100 hover:bg-orange-50/30"
                      >
                        <td className="px-5 py-4 font-bold text-stone-900">
                          {order.billNumber || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-stone-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {order.orderType?.replaceAll("_", " ") || "—"}
                          </p>
                          <p className="mt-1 text-xs text-stone-500">
                            {order.paymentMethod || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {(order.items || []).reduce(
                            (sum, item) => sum + Number(item.quantity || 0),
                            0
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-bold">
                          {money(order.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openOrder(order._id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold hover:border-orange-300 hover:bg-orange-50"
                          >
                            <Eye size={15} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-stone-100 md:hidden">
                {filteredOrders.map((order) => (
                  <article key={order._id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{order.billNumber || "—"}</h3>
                        <p className="mt-1 text-xs text-stone-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-lg bg-stone-100 px-2.5 py-1.5">
                        {order.orderType?.replaceAll("_", " ") || "—"}
                      </span>
                      <span className="rounded-lg bg-stone-100 px-2.5 py-1.5">
                        {order.paymentMethod || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-stone-500">
                          {(order.items || []).reduce(
                            (sum, item) => sum + Number(item.quantity || 0),
                            0
                          )}{" "}
                          item(s)
                        </p>
                        <p className="mt-1 text-lg font-bold text-orange-700">
                          {money(order.totalAmount)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openOrder(order._id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white"
                      >
                        <Eye size={16} />
                        View order
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {(selectedOrder || detailLoading) && (
        <DetailModal
          order={selectedOrder}
          loading={detailLoading}
          onClose={() => {
            setSelectedOrder(null);
            setDetailLoading(false);
          }}
          onCancel={handleCancel}
        />
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #order-print-area, #order-print-area * { visibility: visible !important; }
          #order-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 16px;
            background: white;
          }
          @page { margin: 12mm; }
        }
      `}</style>
    </main>
  );
}
