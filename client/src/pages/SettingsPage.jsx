
import { useCallback, useEffect, useRef, useState } from "react";
import {
  UserRound,
  ShieldCheck,
  Store,
  ReceiptText,
  Monitor,
  Activity,
  RefreshCw,
  LogOut,
  LockKeyhole,
} from "lucide-react";

import { useAuth } from "../features/auth/AuthContext.jsx";
import { changePassword } from "../api/auth.api.js";
import http from "../api/http.js";

const SHOP_PROFILE_KEY = "dss_shop_profile_v1";

const DEFAULT_SHOP = {
  shopName: "D Shawarma Station",
  phone: "",
  address: "",
  receiptFooter: "Thank you! Visit again.",
};

const sections = [
  { id: "account", label: "Account & Security", icon: UserRound },
  { id: "shop", label: "Shop Information", icon: Store },
  { id: "billing", label: "Billing & Receipts", icon: ReceiptText },
  { id: "health", label: "Health Check", icon: Activity },
  { id: "system", label: "System Information", icon: Monitor },
];

function readShopProfile() {
  try {
    return {
      ...DEFAULT_SHOP,
      ...JSON.parse(localStorage.getItem(SHOP_PROFILE_KEY) || "{}"),
    };
  } catch {
    return { ...DEFAULT_SHOP };
  }
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5">
      <h3 className="mb-4 text-base font-semibold text-stone-900">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      />
    </label>
  );
}

function Message({ message }) {
  if (!message) return null;

  return (
    <p
      role="status"
      className={`rounded-lg p-3 text-sm ${
        message.type === "success"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {message.text}
    </p>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const [active, setActive] = useState("account");
  const [shop, setShop] = useState(readShopProfile);
  const [shopMessage, setShopMessage] = useState(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [health, setHealth] = useState({
    status: "Not checked",
    responseTime: null,
    checkedAt: null,
    message: "",
    checking: false,
  });

  const healthLock = useRef(false);
  const username = user?.username || user?.name || "User";
  const role = user?.role || "USER";

  const checkHealth = useCallback(async () => {
    if (healthLock.current) return;

    healthLock.current = true;
    setHealth((previous) => ({
      ...previous,
      checking: true,
      message: "Checking backend...",
    }));

    const started = Date.now();

    try {
      const response = await http.get("/health");
      const data = response.data;

      const healthy =
        response.status >= 200 &&
        response.status < 300 &&
        data?.success !== false &&
        data?.healthy !== false &&
        data?.status !== "unhealthy" &&
        data?.status !== "error";

      setHealth({
        status: healthy ? "Connected" : "Unhealthy",
        responseTime: Date.now() - started,
        checkedAt: new Date(),
        message:
          data?.message ||
          (healthy ? "Backend is responding." : "Backend reported an error."),
        checking: false,
      });
    } catch (error) {
      setHealth({
        status: "Unavailable",
        responseTime: Date.now() - started,
        checkedAt: new Date(),
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Unable to reach the backend.",
        checking: false,
      });
    } finally {
      healthLock.current = false;
      setHealth((previous) => ({ ...previous, checking: false }));
    }
  }, []);

  useEffect(() => {
    if (active !== "health") return undefined;

    void checkHealth();
    const interval = window.setInterval(() => void checkHealth(), 30_000);

    return () => window.clearInterval(interval);
  }, [active, checkHealth]);

  async function handlePasswordChange(event) {
    event.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Please complete all password fields.",
      });
      return;
    }

    if (newPassword.length < 12) {
      setPasswordMessage({
        type: "error",
        text: "Password must contain at least 12 characters.",
      });
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setPasswordMessage({
        type: "error",
        text: "Password must not exceed 72 UTF-8 bytes.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Choose a password different from the current one.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordMessage({
        type: "success",
        text: "Password changed. Please sign in again with your new password.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => logout(), 1800);
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: error?.message || "Unable to change password.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  function saveShop(event) {
    event.preventDefault();
    setShopMessage(null);

    const cleaned = {
      shopName: shop.shopName.trim(),
      phone: shop.phone.trim(),
      address: shop.address.trim(),
      receiptFooter: shop.receiptFooter.trim(),
    };

    if (!cleaned.shopName) {
      setShopMessage({
        type: "error",
        text: "Shop name is required.",
      });
      return;
    }

    try {
      localStorage.setItem(SHOP_PROFILE_KEY, JSON.stringify(cleaned));
      setShop(cleaned);
      setShopMessage({
        type: "success",
        text: "Shop profile saved in this browser.",
      });
    } catch {
      setShopMessage({
        type: "error",
        text: "Could not save shop profile in browser storage.",
      });
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage your account, shop details, and system.
        </p>
      </header>

      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-stone-200 bg-white p-2">
          <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {sections.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium ${
                  active === id
                    ? "bg-orange-50 text-orange-700"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-4">
          {active === "account" && (
            <>
              <Card title="Account Information">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900">{username}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                      <ShieldCheck size={15} />
                      {role}
                    </p>
                  </div>
                </div>
              </Card>

              <Card title="Change Password">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <Field
                    label="Current password"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Field
                    label="New password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <Field
                    label="Confirm new password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />

                  <p className="text-xs text-stone-500">
                    Minimum 12 characters and maximum 72 UTF-8 bytes.
                  </p>

                  <Message message={passwordMessage} />

                  <PrimaryButton type="submit" disabled={savingPassword}>
                    <LockKeyhole size={16} />
                    {savingPassword ? "Updating..." : "Update Password"}
                  </PrimaryButton>
                </form>
              </Card>
            </>
          )}

          {active === "shop" && (
            <Card title="Shop Information">
              <form onSubmit={saveShop} className="space-y-4">
                <Field
                  label="Shop name"
                  value={shop.shopName}
                  onChange={(e) =>
                    setShop({ ...shop, shopName: e.target.value })
                  }
                  required
                />
                <Field
                  label="Contact number"
                  type="tel"
                  value={shop.phone}
                  onChange={(e) =>
                    setShop({ ...shop, phone: e.target.value })
                  }
                />
                <Field
                  label="Address"
                  value={shop.address}
                  onChange={(e) =>
                    setShop({ ...shop, address: e.target.value })
                  }
                />

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-stone-700">
                    Receipt footer
                  </span>
                  <textarea
                    rows={3}
                    value={shop.receiptFooter}
                    onChange={(e) =>
                      setShop({ ...shop, receiptFooter: e.target.value })
                    }
                    className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>

                <p className="text-xs text-stone-500">
                  Saved in this browser only. This does not update the backend
                  or existing receipt-generation logic.
                </p>

                <Message message={shopMessage} />

                <PrimaryButton type="submit">
                  Save Shop Information
                </PrimaryButton>
              </form>
            </Card>
          )}

          {active === "billing" && (
            <>
              <Card title="Billing Rules">
                <div className="divide-y divide-stone-100">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Currency</span>
                    <span className="text-sm font-semibold text-stone-900">
                      Indian Rupee (₹ INR)
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">
                      Takeaway parcel charge
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      ₹10 per order
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Swiggy payment</span>
                    <span className="text-sm font-semibold text-stone-900">
                      PLATFORM
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Zomato payment</span>
                    <span className="text-sm font-semibold text-stone-900">
                      PLATFORM
                    </span>
                  </div>
                </div>
              </Card>

              <p className="text-xs leading-5 text-stone-500">
                These are informational settings. Order totals remain
                controlled by the backend; no billing calculations are changed.
              </p>
            </>
          )}

          {active === "health" && (
            <Card title="Backend Health Check">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    API Status:{" "}
                    <span
                      className={
                        health.status === "Connected"
                          ? "text-green-700"
                          : health.status === "Not checked"
                            ? "text-stone-500"
                            : "text-red-700"
                      }
                    >
                      {health.checking ? "Checking..." : health.status}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-stone-500">
                    GET /api/health
                  </p>
                </div>

                <PrimaryButton
                  type="button"
                  onClick={() => void checkHealth()}
                  disabled={health.checking}
                >
                  <RefreshCw
                    size={16}
                    className={health.checking ? "animate-spin" : ""}
                  />
                  Check Again
                </PrimaryButton>
              </div>

              {health.message && (
                <p className="mt-4 break-words text-sm text-stone-600">
                  {health.message}
                </p>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Response time</p>
                  <p className="mt-1 font-semibold text-stone-900">
                    {health.responseTime == null
                      ? "—"
                      : `${health.responseTime} ms`}
                  </p>
                </div>

                <div className="rounded-lg bg-stone-50 p-4">
                  <p className="text-xs text-stone-500">Last checked</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">
                    {health.checkedAt
                      ? health.checkedAt.toLocaleString()
                      : "Not checked yet"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-stone-500">
                Automatically checks every 30 seconds while this panel is open.
              </p>
            </Card>
          )}

          {active === "system" && (
            <>
              <Card title="System Information">
                <div className="divide-y divide-stone-100">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Application</span>
                    <span className="text-right text-sm font-medium text-stone-900">
                      D Shawarma Station POS
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Version</span>
                    <span className="text-sm font-medium text-stone-900">
                      V1
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Username</span>
                    <span className="break-all text-right text-sm font-medium text-stone-900">
                      {username}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-3">
                    <span className="text-sm text-stone-600">Role</span>
                    <span className="text-sm font-medium text-stone-900">
                      {role}
                    </span>
                  </div>
                </div>
              </Card>

              <Card title="Sign Out">
                <p className="mb-4 text-sm text-stone-500">
                  Sign out of your current session on this device.
                </p>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}