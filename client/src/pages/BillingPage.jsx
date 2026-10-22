
import { useMemo, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  RefreshCw,
  Utensils,
  Package,
  X,
  ChevronRight,
  LayoutGrid,
  Printer,
  CheckCircle2,
  AlertCircle,
  ImageOff,
} from 'lucide-react'

import { getMenuItems } from '../api/menu.api'
import { createOrder } from '../api/orders.api'
import ReceiptPrint from '../components/ReceiptPrint'

const ORDER_TYPES = [
  { value: 'DINE_IN', label: 'Dine In' },
  { value: 'TAKEAWAY', label: 'Takeaway' },
  { value: 'SWIGGY', label: 'Swiggy' },
  { value: 'ZOMATO', label: 'Zomato' },
]

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount ?? 0)

function getMenuImage(item) {
  const image = item.image

  if (typeof image === 'string') return image
  if (image && typeof image === 'object') {
    return image.url || image.secure_url || ''
  }

  return (
    item.imageUrl ||
    item.imageURL ||
    item.photoUrl ||
    item.thumbnail ||
    ''
  )
}

function MenuImage({ item, className = '' }) {
  const [failed, setFailed] = useState(false)
  const imageUrl = getMenuImage(item)

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-orange-50 ${className}`}
    >
      {imageUrl && !failed ? (
        <img
          src={imageUrl}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-orange-500">
          {failed ? <ImageOff size={19} /> : <Utensils size={21} />}
          <span className="text-[9px] font-medium text-orange-700">
            {failed ? 'No image' : 'Food item'}
          </span>
        </div>
      )}
    </div>
  )
}

export default function BillingPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [orderType, setOrderType] = useState('TAKEAWAY')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [cart, setCart] = useState({})
  const [cartOpen, setCartOpen] = useState(false)
  const [savedBill, setSavedBill] = useState(null)
  const [billError, setBillError] = useState('')

  const {
    data: menuResponse,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['menu'],
    queryFn: getMenuItems,
  })

  const menuItems = useMemo(() => {
    const items = menuResponse?.data ?? []

    return items
      .filter((item) => item.isAvailable && !item.isDeleted)
      .sort((a, b) => {
        const order =
          (a.category?.sortOrder ?? 999) -
          (b.category?.sortOrder ?? 999)

        return order || a.name.localeCompare(b.name)
      })
  }, [menuResponse])

  const categories = useMemo(() => {
    const unique = new Map()

    menuItems
      .filter((item) => item.category?.isActive !== false)
      .forEach((item) => {
        const id = item.category?._id ?? 'Other'

        if (!unique.has(id)) {
          unique.set(id, {
            id,
            name: item.category?.name ?? 'Other',
            sortOrder: item.category?.sortOrder ?? 999,
          })
        }
      })

    return [
      { id: 'All', name: 'All Items', sortOrder: -1 },
      ...[...unique.values()].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    ]
  }, [menuItems])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return menuItems.filter((item) => {
      const categoryId = item.category?._id ?? 'Other'
      const matchesCategory =
        activeCategory === 'All' || categoryId === activeCategory

      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.category?.name?.toLowerCase().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [menuItems, search, activeCategory])

  const cartItems = useMemo(
    () =>
      menuItems
        .filter((item) => cart[item._id]?.quantity > 0)
        .map((item) => ({
          ...item,
          quantity: cart[item._id].quantity,
          lineTotal: item.price * cart[item._id].quantity,
        })),
    [menuItems, cart],
  )

  const itemCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  )

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  )

  const parcelCharge =
    orderType === 'TAKEAWAY' && itemCount > 0 ? 10 : 0

  const total = subtotal + parcelCharge

  const effectivePaymentMethod =
    orderType === 'SWIGGY' || orderType === 'ZOMATO'
      ? 'PLATFORM'
      : paymentMethod

  const createBillMutation = useMutation({
    mutationFn: createOrder,
    retry: 0,

    onSuccess: async (response) => {
      const bill = response?.bill

      if (!bill?.id || !bill?.billNumber) {
        setBillError(
          'The response did not contain a valid saved bill. Check Order History before trying again.',
        )
        return
      }

      setSavedBill(bill)
      setCart({})
      setCartOpen(false)
      setBillError('')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ])
    },

    onError: (mutationError) => {
      setBillError(
        mutationError?.message ||
          'Could not confirm the bill. Check Order History before retrying to avoid duplicates.',
      )
    },
  })

  const handleCreateBill = useCallback(() => {
    if (createBillMutation.isPending || cartItems.length === 0) return

    setBillError('')

    createBillMutation.mutate({
      orderType,
      paymentMethod: effectivePaymentMethod,
      items: cartItems.map((item) => ({
        menuItem: item._id,
        quantity: item.quantity,
      })),
    })
  }, [
    createBillMutation,
    cartItems,
    orderType,
    effectivePaymentMethod,
  ])

  function addItem(item) {
    setCart((current) => {
      const quantity = current[item._id]?.quantity ?? 0
      if (quantity >= 1000) return current

      return {
        ...current,
        [item._id]: { quantity: quantity + 1 },
      }
    })
  }

  function changeQuantity(itemId, delta) {
    setCart((current) => {
      const quantity = (current[itemId]?.quantity ?? 0) + delta

      if (quantity <= 0) {
        const next = { ...current }
        delete next[itemId]
        return next
      }

      if (quantity > 1000) return current

      return { ...current, [itemId]: { quantity } }
    })
  }

  function removeItem(itemId) {
    setCart((current) => {
      const next = { ...current }
      delete next[itemId]
      return next
    })
  }

  function clearCart() {
    if (createBillMutation.isPending) return
    setCart({})
    setBillError('')
  }

  function selectOrderType(value) {
    setOrderType(value)

    if (value === 'SWIGGY' || value === 'ZOMATO') {
      setPaymentMethod('PLATFORM')
    } else if (paymentMethod === 'PLATFORM') {
      setPaymentMethod('CASH')
    }
  }

  // Render helpers, not nested React component types.
  // This keeps the order list mounted when cart state changes.
  function renderCategoryButtons() {
    return (
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const active = activeCategory === category.id

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition sm:text-sm ${
                active
                  ? 'bg-orange-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50'
              }`}
            >
              {category.id === 'All' ? (
                <LayoutGrid size={15} />
              ) : (
                <Utensils size={15} />
              )}
              {category.name}
            </button>
          )
        })}
      </div>
    )
  }

  function renderOrderSummary(drawer = false) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Order type */}
        <div className="shrink-0 border-b border-slate-100 px-3 py-3">
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Order type
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {ORDER_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                disabled={createBillMutation.isPending}
                onClick={() => selectOrderType(type.value)}
                className={`min-h-9 rounded-lg border px-2 text-xs font-bold transition disabled:opacity-60 ${
                  orderType === type.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Only this area scrolls */}
        <div
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-3"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {cartItems.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center text-center">
              <ShoppingCart size={27} className="text-orange-400" />
              <p className="mt-2 text-sm font-bold text-slate-800">
                Your cart is empty
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Add items from the menu
              </p>

              {drawer && (
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white"
                >
                  Browse menu
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex min-w-0 gap-2.5 border-b border-slate-100 pb-3 last:border-0"
                >
                  <MenuImage
                    item={item}
                    className="h-12 w-12 rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-bold leading-4 text-slate-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatCurrency(item.price)} each
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name}`}
                        disabled={createBillMutation.isPending}
                        onClick={() => changeQuantity(item._id, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="min-w-4 text-center text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name}`}
                        disabled={createBillMutation.isPending}
                        onClick={() => changeQuantity(item._id, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end justify-between">
                    <span className="text-xs font-extrabold tabular-nums text-slate-900">
                      {formatCurrency(item.lineTotal)}
                    </span>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      disabled={createBillMutation.isPending}
                      onClick={() => removeItem(item._id)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout stays at the bottom */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-3">
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Payment
          </p>

          {effectivePaymentMethod === 'PLATFORM' ? (
            <div className="mb-3 flex min-h-8 items-center gap-2 rounded-lg bg-slate-100 px-2.5 text-xs font-bold text-slate-700">
              <Package size={15} />
              Platform payment
            </div>
          ) : (
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {['CASH', 'UPI'].map((method) => (
                <button
                  key={method}
                  type="button"
                  disabled={createBillMutation.isPending}
                  onClick={() => setPaymentMethod(method)}
                  className={`min-h-8 rounded-lg border text-xs font-bold ${
                    paymentMethod === method
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {parcelCharge > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Parcel charge</span>
                <span className="font-semibold tabular-nums">
                  {formatCurrency(parcelCharge)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2">
              <div>
                <p className="text-sm font-extrabold text-slate-900">
                  Total
                </p>
                <p className="text-[10px] text-slate-500">
                  {itemCount} item{itemCount === 1 ? '' : 's'}
                </p>
              </div>

              <span className="text-lg font-extrabold tabular-nums text-orange-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateBill}
            disabled={
              cartItems.length === 0 ||
              createBillMutation.isPending ||
              isPending ||
              isError
            }
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-3 text-xs font-extrabold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {createBillMutation.isPending ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Printer size={16} />
                Generate &amp; Print Bill
              </>
            )}
          </button>

          {billError && (
            <div
              role="alert"
              className="mt-2 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700"
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{billError}</span>
            </div>
          )}

          <div className={`mt-2 grid ${drawer ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
            <button
              type="button"
              onClick={clearCart}
              disabled={itemCount === 0 || createBillMutation.isPending}
              className="min-h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Clear order
            </button>

            {drawer && (
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="min-h-8 rounded-lg bg-slate-900 text-xs font-bold text-white"
              >
                Back to menu
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full pb-20 text-slate-900 xl:pb-0">
      {savedBill && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={22} className="text-green-700" />
            <div>
              <p className="text-sm font-extrabold text-green-900">
                Bill {savedBill.billNumber} saved
              </p>
              <p className="text-xs text-green-800">
                Total: {formatCurrency(savedBill.totalAmount)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-9 items-center gap-2 rounded-lg bg-green-700 px-3 text-sm font-bold text-white hover:bg-green-800"
          >
            <Printer size={15} />
            Print again
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-600">
            D Shawarma Station
          </p>
          <h2 className="mt-0.5 text-2xl font-extrabold tracking-tight">
            New Bill
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select menu items to add them to your order.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={isFetching ? 'animate-spin' : ''}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Menu left, cart right */}
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <section className="min-w-0">
          {/* Search stays above categories */}
          <div className="mb-3 flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
            <Search size={18} className="shrink-0 text-slate-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items..."
              aria-label="Search menu items"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Horizontal categories above the menu */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-2.5">
            <div className="mb-2 flex items-center gap-2 px-1">
              <LayoutGrid size={15} className="text-orange-600" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Categories
              </span>
            </div>

            {renderCategoryButtons()}
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-extrabold text-slate-900">
                {categories.find(
                  (category) => category.id === activeCategory,
                )?.name ?? 'Menu'}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {filteredItems.length} available item
                {filteredItems.length === 1 ? '' : 's'}
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] font-bold text-orange-700">
              {itemCount} in order
            </span>
          </div>

          {isPending ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-white p-5">
              <p className="text-sm font-bold text-red-700">
                Could not load the menu
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {error?.message || 'Check that the POS backend is running.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center">
              <Search size={26} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-bold text-slate-800">
                No menu items found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try another search or category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
              {filteredItems.map((item) => {
                const quantity = cart[item._id]?.quantity ?? 0

                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => addItem(item)}
                    disabled={createBillMutation.isPending}
                    className={`group flex min-w-0 flex-col overflow-hidden rounded-xl border bg-white text-left transition active:scale-[0.98] disabled:opacity-60 ${
                      quantity > 0
                        ? 'border-orange-400 ring-1 ring-orange-200'
                        : 'border-slate-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="relative w-full">
                      <MenuImage
                        item={item}
                        className="h-20 w-full sm:h-24"
                      />

                      {quantity > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-extrabold text-white">
                          {quantity}
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col p-2.5">
                      <p className="line-clamp-2 min-h-8 break-words text-xs font-bold leading-4 text-slate-800">
                        {item.name}
                      </p>

                      <p className="mt-1 truncate text-[10px] text-slate-500">
                        {item.category?.name ?? 'Other'}
                      </p>

                      <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
                        <span className="text-xs font-extrabold tabular-nums text-slate-900 sm:text-sm">
                          {formatCurrency(item.price)}
                        </span>

                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white transition group-hover:bg-orange-700">
                          <Plus size={16} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Desktop cart remains on the right */}
        <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] min-h-[440px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white xl:flex">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-3.5 py-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Current Order
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Review your items
              </p>
            </div>

            <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-orange-50 px-2 text-xs font-extrabold text-orange-700">
              {itemCount}
            </span>
          </div>

          {renderOrderSummary()}
        </aside>
      </div>

      {/* Mobile/tablet cart launcher */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed inset-x-3 bottom-3 z-30 flex min-h-12 items-center justify-between rounded-xl bg-slate-900 px-4 text-white shadow-xl xl:hidden"
      >
        <span className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <ShoppingCart size={18} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-extrabold">
                {itemCount}
              </span>
            )}
          </span>

          <span className="text-left">
            <span className="block text-xs font-extrabold">
              {itemCount === 0 ? 'Open current order' : 'Review current order'}
            </span>
            <span className="block text-[10px] text-slate-300">
              {itemCount} item{itemCount === 1 ? '' : 's'}
            </span>
          </span>
        </span>

        <span className="flex items-center gap-1.5 text-sm font-extrabold tabular-nums">
          {formatCurrency(total)}
          <ChevronRight size={17} />
        </span>
      </button>

      {/* Mobile/tablet order drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center overscroll-none sm:items-center sm:p-4 xl:hidden">
          <button
            type="button"
            aria-label="Close current order"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/55"
          />

          <section className="relative z-10 flex h-[90dvh] min-h-0 w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[min(88dvh,700px)] sm:max-w-md sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-base font-extrabold">Current Order</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                  {formatCurrency(total)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close order panel"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            {renderOrderSummary(true)}
          </section>
        </div>
      )}

      {savedBill && (
        <ReceiptPrint
          bill={savedBill}
          onClose={() => setSavedBill(null)}
        />
      )}
    </div>
  )
}
