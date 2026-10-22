
import { useEffect } from 'react'

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value ?? 0)

export default function ReceiptPrint({ bill, onClose }) {
  useEffect(() => {
    if (!bill) return

    const timer = window.setTimeout(() => {
      window.print()
    }, 350)

    const afterPrint = () => onClose?.()
    window.addEventListener('afterprint', afterPrint)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [bill, onClose])

  if (!bill) return null

  const date = bill.createdAt
    ? new Date(bill.createdAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : ''

  return (
    <div className="receipt-screen fixed inset-0 z-[100] overflow-y-auto bg-slate-100 p-4">
      <style>{`
        @page {
          size: 80mm auto;
          margin: 3mm;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .receipt-print,
          .receipt-print * {
            visibility: visible !important;
          }

          .receipt-screen {
            position: absolute !important;
            inset: 0 !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
          }

          .receipt-print {
            position: relative !important;
            width: 72mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            color: black !important;
            font: 12px/1.4 monospace !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-xl flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="min-h-12 rounded-xl bg-orange-600 px-5 font-bold text-white"
        >
          Print Again
        </button>
        <button
          type="button"
          onClick={onClose}
          className="min-h-12 rounded-xl border border-slate-300 bg-white px-5 font-bold"
        >
          Back to POS
        </button>
      </div>

      <article className="receipt-print mx-auto w-full max-w-[72mm] bg-white p-3 font-mono text-xs text-black">
        <header className="text-center">
          <h1 className="text-lg font-extrabold">D SHAWARMA</h1>
          <p className="font-bold">STATION</p>
          <p className="mt-2 border-b border-dashed border-black pb-2">
            CUSTOMER RECEIPT
          </p>
        </header>

        <div className="my-3 space-y-1">
          <p><strong>Bill:</strong> {bill.billNumber}</p>
          <p><strong>Date:</strong> {date}</p>
          <p><strong>Type:</strong> {bill.orderType?.replace('_', ' ')}</p>
          <p><strong>Payment:</strong> {bill.paymentMethod}</p>
        </div>

        <div className="border-y border-dashed border-black py-2">
          <div className="mb-2 grid grid-cols-[1fr_auto] gap-2 font-bold">
            <span>Item / Qty × Price</span>
            <span>Amount</span>
          </div>

          {bill.items?.map((item, index) => (
            <div key={`${item.name}-${index}`} className="mb-3">
              <p className="break-words">{item.name}</p>
              <div className="flex justify-between gap-2">
                <span>{item.quantity} × {money(item.unitPrice)}</span>
                <span>{money(item.lineTotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="my-3 space-y-1">
          <div className="flex justify-between gap-2">
            <span>Subtotal</span>
            <span>{money(bill.subtotal)}</span>
          </div>

          {(bill.parcelCharge ?? 0) > 0 && (
            <div className="flex justify-between gap-2">
              <span>Parcel charge</span>
              <span>{money(bill.parcelCharge)}</span>
            </div>
          )}

          {(bill.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between gap-2">
              <span>Discount</span>
              <span>-{money(bill.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between gap-2 border-t border-dashed border-black pt-2 text-base font-extrabold">
            <span>TOTAL</span>
            <span>{money(bill.totalAmount)}</span>
          </div>
        </div>

        <footer className="mt-5 border-t border-dashed border-black pt-3 text-center">
          <p>Thank you for your order!</p>
          <p>Please visit again.</p>
        </footer>
      </article>
    </div>
  )
}
