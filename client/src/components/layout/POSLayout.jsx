import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  UtensilsCrossed,
  ChartNoAxesCombined,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../features/auth/AuthContext.jsx";
import DashboardPage from "../../pages/DashboardPage.jsx";
import BillingPage from "../../pages/BillingPage.jsx";
import MenuManagementPage from "../../pages/MenuManagementPage.jsx";
import OrderHistoryPage from "../../pages/OrderHistoryPage.jsx";
import ReportsPage from "../../pages/ReportsPage.jsx";
import SettingsPage from "../../pages/SettingsPage.jsx";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "New Bill", icon: ShoppingCart },
  { label: "Order History", icon: ReceiptText },
  { label: "Menu Management", icon: UtensilsCrossed },
  { label: "Reports", icon: ChartNoAxesCombined },
  { label: "Settings", icon: Settings },
];

export default function POSLayout({ children }) {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function selectPage(label) {
    setActivePage(label);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {mobileMenuOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#191714] text-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-600">
            <UtensilsCrossed size={23} />
          </div>
          <div>
            <p className="font-bold tracking-wide">D SHAWARMA</p>
            <p className="text-xs tracking-[0.22em] text-orange-400">
              STATION POS
            </p>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-stone-400 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, icon: Icon }) => {
              const isActive = activePage === label;

              return (
                <button
                  key={label}
                  onClick={() => selectPage(label)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                    isActive
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-950/20"
                      : "text-stone-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  {isActive && <ChevronRight size={16} className="ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-600/20 font-bold text-orange-400">
              {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {user?.name || user?.username}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                {user?.role?.replaceAll("_", " ")}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-stone-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-stone-200 p-2 hover:bg-stone-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs font-medium text-stone-500">
                D Shawarma Station
              </p>
              <h1 className="text-lg font-bold sm:text-xl">{activePage}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {user?.name || user?.username}
              </p>
              <p className="text-xs text-stone-500">Authorized access</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
              {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-8">
          {children || (
            <>
              {activePage === "Dashboard" && <DashboardPage />}

              {activePage === "New Bill" && <BillingPage />}

              {activePage === "Order History" && <OrderHistoryPage />}

              {activePage === "Menu Management" && <MenuManagementPage />}

              {activePage === "Reports" && <ReportsPage />}
              {activePage === "Settings" && <SettingsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
