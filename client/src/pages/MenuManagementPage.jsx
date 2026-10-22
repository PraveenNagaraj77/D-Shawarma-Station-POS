import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Image as ImageIcon,
  X,
  RefreshCw,
  UtensilsCrossed,
  Eye,
  EyeOff,
  LoaderCircle,
  Upload,
} from "lucide-react";

import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  updateMenuItemAvailability,
  deleteMenuItem,
  uploadMenuImage,
} from "../api/menu.api.js";

import { getCategories } from "../api/categories.api.js";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
  isAvailable: true,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getCategoryId = (category) =>
  typeof category === "string" ? category : category?._id || "";

function FoodImage({ src, name, large = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-400 ${
        large ? "h-28 w-28" : "h-16 w-16"
      }`}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name || "Food item"}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon size={large ? 32 : 23} />
      )}
    </div>
  );
}

export default function MenuManagementPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyItemId, setBusyItemId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [menuResponse, categoryResponse] = await Promise.all([
        getMenuItems(),
        getCategories(),
      ]);

      if (menuResponse?.success === false) {
        throw new Error(menuResponse.message || "Unable to load menu items.");
      }

      if (categoryResponse?.success === false) {
        throw new Error(
          categoryResponse.message || "Unable to load categories.",
        );
      }

      setItems(Array.isArray(menuResponse?.data) ? menuResponse.data : []);

      setCategories(
        (Array.isArray(categoryResponse?.data) ? categoryResponse.data : [])
          .filter((category) => category.isActive)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to load menu data."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        getCategoryId(item.category) === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && item.isAvailable) ||
        (statusFilter === "unavailable" && !item.isAvailable);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const availableCount = items.filter((item) => item.isAvailable).length;
  const unavailableCount = items.length - availableCount;

  function openCreateModal() {
    setEditingItem(null);
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?._id || "",
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: String(item.price ?? ""),
      category: getCategoryId(item.category),
      imageUrl: item.imageUrl || "",
      isAvailable: Boolean(item.isAvailable),
    });
    setError("");
    setNotice("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving || uploadingImage) return;

    setModalOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    // Allow selecting the same file again after an upload attempt.
    event.target.value = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setNotice("");
    setUploadingImage(true);

    try {
      const response = await uploadMenuImage(file);
      const imageUrl = response?.data?.imageUrl;

      if (!response?.success || !imageUrl) {
        throw new Error(response?.message || "Image upload failed.");
      }

      updateForm("imageUrl", imageUrl);
      setNotice(
        "Image uploaded successfully. Save the menu item to keep the URL.",
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload image."));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const imageUrl = form.imageUrl.trim();

    if (name.length < 2 || name.length > 100) {
      setError("Name must contain between 2 and 100 characters.");
      return;
    }

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      Math.round(price * 100) !== price * 100
    ) {
      setError("Enter a valid price greater than zero with up to 2 decimals.");
      return;
    }

    if (description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    if (!form.category) {
      setError("Please select a category.");
      return;
    }

    if (imageUrl && !/^https?:\/\/\S+$/i.test(imageUrl)) {
      setError("Image must be a valid HTTP or HTTPS URL.");
      return;
    }

    const payload = {
      name,
      description,
      price,
      category: form.category,
      imageUrl,
      isAvailable: form.isAvailable,
    };

    setSaving(true);

    try {
      const response = editingItem
        ? await updateMenuItem(editingItem._id, payload)
        : await createMenuItem(payload);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to save menu item.");
      }

      setModalOpen(false);
      setEditingItem(null);
      setForm(EMPTY_FORM);
      setNotice(
        editingItem
          ? "Menu item updated successfully."
          : "Menu item added successfully.",
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "Unable to save menu item."));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvailabilityToggle(item) {
    setError("");
    setNotice("");
    setBusyItemId(item._id);

    try {
      const response = await updateMenuItemAvailability(item._id, {
        isAvailable: !item.isAvailable,
      });

      if (response?.success === false) {
        throw new Error(
          response.message || "Unable to update item availability.",
        );
      }

      setItems((current) =>
        current.map((entry) =>
          entry._id === item._id
            ? { ...entry, isAvailable: !item.isAvailable }
            : entry,
        ),
      );

      setNotice(
        `${item.name} is now ${
          item.isAvailable ? "unavailable" : "available"
        }.`,
      );
    } catch (err) {
      setError(getErrorMessage(err, "Unable to update availability."));
    } finally {
      setBusyItemId("");
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Remove "${item.name}" from the active menu?\n\nThis uses your backend's soft-delete endpoint. Historical order references are preserved.`,
    );

    if (!confirmed) return;

    setError("");
    setNotice("");
    setBusyItemId(item._id);

    try {
      const response = await deleteMenuItem(item._id);

      if (response?.success === false) {
        throw new Error(response.message || "Unable to remove menu item.");
      }

      setItems((current) => current.filter((entry) => entry._id !== item._id));

      setNotice(`${item.name} was removed from the active menu.`);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to remove menu item."));
    } finally {
      setBusyItemId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 rounded-2xl bg-[#191714] p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
            <UtensilsCrossed size={17} />
            MENU CONTROL
          </div>

          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Menu Management
          </h2>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-300">
            Manage food items, prices, categories, images and availability.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          disabled={categories.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={19} />
          Add Menu Item
        </button>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Items" value={items.length} />

        <StatCard
          label="Available"
          value={availableCount}
          accent="text-emerald-700"
        />

        <StatCard
          label="Unavailable"
          value={unavailableCount}
          accent="text-stone-500"
        />
      </section>

      {error && (
        <Message type="error" message={error} onClose={() => setError("")} />
      )}

      {notice && (
        <Message
          type="success"
          message={notice}
          onClose={() => setNotice("")}
        />
      )}

      {/* Menu listing */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="space-y-4 border-b border-stone-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by food name or description..."
                className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">All categories</option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-orange-500"
            >
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>

            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh menu"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-semibold transition hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <p className="text-xs text-stone-500">
            Showing {filteredItems.length} of {items.length} menu items
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-stone-500">
            <LoaderCircle size={20} className="animate-spin text-orange-600" />
            Loading menu items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <UtensilsCrossed size={25} />
            </div>

            <h3 className="mt-4 font-bold text-stone-800">
              {items.length === 0 ? "No menu items found" : "No matching items"}
            </h3>

            <p className="mt-1 max-w-sm text-sm leading-6 text-stone-500">
              {items.length === 0
                ? "Add your first menu item to get started."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[minmax(0,2fr)_minmax(110px,1fr)_100px_130px_100px] gap-4 bg-stone-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-stone-500 md:grid">
              <span>Menu item</span>
              <span>Category</span>
              <span>Price</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            <div className="divide-y divide-stone-100">
              {filteredItems.map((item) => {
                const categoryName =
                  typeof item.category === "object"
                    ? item.category?.name
                    : categories.find(
                        (category) => category._id === item.category,
                      )?.name;

                const isBusy = busyItemId === item._id;

                return (
                  <article
                    key={item._id}
                    className="grid gap-4 p-4 transition hover:bg-stone-50/70 md:grid-cols-[minmax(0,2fr)_minmax(110px,1fr)_100px_130px_100px] md:items-center md:px-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <FoodImage src={item.imageUrl} name={item.name} />

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-stone-800">
                          {item.name}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                          {item.description || "No description added"}
                        </p>

                        <p className="mt-1 text-xs text-stone-400 md:hidden">
                          {categoryName || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <div className="hidden text-sm text-stone-600 md:block">
                      {categoryName || "Uncategorized"}
                    </div>

                    <div className="text-sm font-bold text-stone-900">
                      ₹{Number(item.price).toFixed(2)}
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isAvailable
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            item.isAvailable ? "bg-emerald-500" : "bg-stone-400"
                          }`}
                        />

                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit item"
                        aria-label={`Edit ${item.name}`}
                        className="rounded-lg border border-stone-200 p-2.5 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => handleAvailabilityToggle(item)}
                        disabled={isBusy}
                        title={
                          item.isAvailable
                            ? "Mark unavailable"
                            : "Mark available"
                        }
                        aria-label={
                          item.isAvailable
                            ? `Mark ${item.name} unavailable`
                            : `Mark ${item.name} available`
                        }
                        className="rounded-lg border border-stone-200 p-2.5 text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
                      >
                        {item.isAvailable ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(item)}
                        disabled={isBusy}
                        title="Remove item"
                        aria-label={`Remove ${item.name}`}
                        className="rounded-lg border border-stone-200 p-2.5 text-stone-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-item-dialog-title"
            className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4 sm:px-7">
              <div>
                <h2
                  id="menu-item-dialog-title"
                  className="text-xl font-bold text-stone-900"
                >
                  {editingItem ? "Edit menu item" : "Add menu item"}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Enter the details shown in your POS menu.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={saving || uploadingImage || categories.length === 0}
                aria-label="Close form"
                className="rounded-lg p-2 text-stone-500 transition hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
              {error && (
                <Message
                  type="error"
                  message={error}
                  onClose={() => setError("")}
                />
              )}

              <div className="flex flex-col gap-4 rounded-xl bg-stone-50 p-4 sm:flex-row sm:items-center">
                <FoodImage src={form.imageUrl.trim()} name={form.name} large />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-800">Food image</p>

                  <p className="mt-1 text-xs leading-5 text-stone-500">
                    Upload a JPG, PNG, or WebP image up to 5 MB. Adding an image
                    is optional.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage || saving}
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      {uploadingImage
                        ? "Uploading..."
                        : form.imageUrl
                          ? "Replace Image"
                          : "Upload Image"}
                    </button>

                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          updateForm("imageUrl", "");
                          setNotice("");
                        }}
                        disabled={uploadingImage || saving}
                        className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-white disabled:opacity-50"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Food name *
                </label>

                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="e.g. Chicken Shawarma Roll"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">
                    Price (₹) *
                  </label>

                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateForm("price", event.target.value)
                    }
                    placeholder="120.00"
                    className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-stone-700">
                    Category *
                  </label>

                  <select
                    required
                    value={form.category}
                    onChange={(event) =>
                      updateForm("category", event.target.value)
                    }
                    className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Description
                </label>

                <textarea
                  rows={3}
                  maxLength={500}
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Describe the food item..."
                  className="w-full resize-y rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />

                <p className="text-right text-xs text-stone-400">
                  {form.description.length}/500
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-stone-700">
                  Image URL
                </label>

                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={(event) =>
                    updateForm("imageUrl", event.target.value)
                  }
                  placeholder="https://example.com/food-image.jpg"
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-stone-200 p-4">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    Available for billing
                  </p>

                  <p className="mt-1 text-xs text-stone-500">
                    Control whether staff can sell this item.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(event) =>
                    updateForm("isAvailable", event.target.checked)
                  }
                  className="h-5 w-5 accent-orange-600"
                />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || categories.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving && (
                    <LoaderCircle size={17} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingItem
                      ? "Save Changes"
                      : "Add Menu Item"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent = "text-stone-900" }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function Message({ type, message, onClose }) {
  const isError = type === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <p>{message}</p>

      <button
        onClick={onClose}
        aria-label="Dismiss message"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
