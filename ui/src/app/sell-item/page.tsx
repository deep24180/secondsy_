"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { UserContext } from "../../context/user-context";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../../lib/api/product";
import { getCategories } from "../../lib/api/category";
import {
  categories as fallbackCategories,
  type Category,
} from "../../data/categories";
import {
  useState,
  ChangeEvent,
  KeyboardEvent,
  useContext,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { Input } from "../../components/ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import PageLoader from "../../components/ui/page-loader";

/* ================= TYPES ================= */

type ConditionType = "New" | "Like New" | "Good" | "Fair";

export type SellFormData = {
  title: string;
  category: string;
  subcategory: string;
  tags: string[];
  price: number | "";
  condition: ConditionType | "";
  description: string;
  email: string;
  phone: string;
  location: string;
  deliveryPickup: boolean;
  deliveryShipping: boolean;
  images: string[];
};

type CategoryMap = Record<string, string[]>;

export default function SellPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const sellPath = isEditMode && editId ? `/sell-item?edit=${editId}` : "/sell-item";
  const loginRedirectPath = `/auth/login?redirect=${encodeURIComponent(sellPath)}`;

  const [formData, setFormData] = useState<SellFormData>({
    title: "",
    category: "",
    subcategory: "",
    tags: [],
    price: "",
    condition: "",
    description: "",
    email: "",
    phone: "",
    location: "",
    deliveryPickup: true,
    deliveryShipping: false,
    images: [],
  });

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [loadingEditData, setLoadingEditData] = useState(isEditMode);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);

  const { accessToken, user, loading } = useContext(UserContext);

  const CATEGORY_MAP: CategoryMap = categories.reduce<CategoryMap>(
    (acc, category) => {
      acc[category.name] = category.subcategories;
      return acc;
    },
    {},
  );

  const validateRequiredFields = (data: SellFormData) => {
    const {
      title,
      category,
      price,
      condition,
      description,
      email,
      phone,
      location,
    } = data;

    if (
      !title ||
      !category ||
      price === "" ||
      !condition ||
      !description ||
      !email ||
      !phone ||
      !location
    ) {
      return false;
    }

    return true;
  };

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data);
    };

    loadCategories();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProductForEdit = async () => {
      if (!isEditMode) {
        setLoadingEditData(false);
        return;
      }

      if (loading) {
        return;
      }

      if (!user?.id || !accessToken) {
        toast.error("You must be logged in to edit an item.");
        router.push(loginRedirectPath);
        return;
      }

      setLoadingEditData(true);

      try {
        const response = await getProductById(editId!);
        const product = response?.data || response;

        if (!product) {
          throw new Error("Product not found.");
        }

        if (product.userId !== user.id) {
          toast.error("Only the owner can edit this item.");
          router.push(`/product/${editId}`);
          return;
        }

        if (!isMounted) return;

        setFormData({
          title: product.title ?? "",
          category: product.category ?? "",
          subcategory: product.subcategory ?? "",
          tags: Array.isArray(product.tags) ? product.tags : [],
          price: Number(product.price) || "",
          condition: (product.condition as ConditionType) ?? "",
          description: product.description ?? "",
          email: product.email ?? "",
          phone: product.phone ?? "",
          location: product.location ?? "",
          deliveryPickup: Boolean(product.deliveryPickup),
          deliveryShipping: Boolean(product.deliveryShipping),
          images: Array.isArray(product.images) ? product.images : [],
        });
      } catch {
        if (isMounted) {
          toast.error("Failed to load product for editing.");
          router.push("/profile");
        }
      } finally {
        if (isMounted) {
          setLoadingEditData(false);
        }
      }
    };

    loadProductForEdit();

    return () => {
      isMounted = false;
    };
  }, [
    isEditMode,
    editId,
    loading,
    user?.id,
    accessToken,
    router,
    loginRedirectPath,
  ]);

  useEffect(() => {
    if (!isEditMode && !loading && (!user?.id || !accessToken)) {
      toast.error("You must be logged in to post an item.");
      router.replace(loginRedirectPath);
    }
  }, [isEditMode, loading, user?.id, accessToken, router, loginRedirectPath]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    const { name, value, type } = target;

    // checkbox handling
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (target as HTMLInputElement).checked,
      }));
      return;
    }

    if (name === "price") {
      setFormData((prev) => ({
        ...prev,
        price: value === "" ? "" : Number(value),
      }));
      return;
    }

    // default
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isValidImageUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();

    if (!trimmed) {
      return;
    }

    if (!isValidImageUrl(trimmed)) {
      toast.error("Please enter a valid image URL.");
      return;
    }

    if (formData.images.includes(trimmed)) {
      toast.warning("This image URL is already added.");
      return;
    }

    if (formData.images.length >= 5) {
      toast.warning("You can add up to 5 image links.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, trimmed],
    }));
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const MAX_TAGS = 5;
  const MAX_TAG_LENGTH = 20;

  const normalizeTag = (tag: string) => tag.trim().toLowerCase();

  const handleAddTag = () => {
    const normalized = normalizeTag(tagInput);

    if (!normalized) {
      return;
    }

    if (normalized.length > MAX_TAG_LENGTH) {
      toast.warning(`Tag must be ${MAX_TAG_LENGTH} characters or less.`);
      return;
    }

    if (formData.tags.includes(normalized)) {
      toast.warning("This tag is already added.");
      return;
    }

    if (formData.tags.length >= MAX_TAGS) {
      toast.warning(`You can add up to ${MAX_TAGS} tags.`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, normalized],
    }));
    setTagInput("");
  };

  const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((item) => item !== tag),
    }));
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("You must be logged in to post an item.");
      router.replace(loginRedirectPath);
      return;
    }

    if (!validateRequiredFields(formData)) {
      toast.warning("Please fill all required fields");
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!PHONE_REGEX.test(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      if (isEditMode && editId) {
        await updateProduct(editId, formData, accessToken);
        toast.success("Advertisement updated successfully.");
        router.push("/profile");
        return;
      }

      await createProduct(formData, accessToken);
      toast.success("Advertisement posted successfully.");
    } catch {
      toast.error(
        isEditMode
          ? "Failed to update advertisement. Try again."
          : "Failed to post advertisement. Try again.",
      );
    }
  };

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_REGEX = /^[6-9]\d{9}$/;

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20";

  const sectionTitleClass =
    "text-lg font-semibold tracking-tight text-slate-900 md:text-xl";
  const sectionCardClass =
    "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";

  if (loading || (!isEditMode && (!user?.id || !accessToken))) {
    return <PageLoader message="Checking access..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font- semibold tracking-tight text-slate-900 md:text-3xl">
            {isEditMode ? "Edit Advertisement" : "Post New Advertisement"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isEditMode
              ? "Update your listing and save changes."
              : "Add the details below to publish your listing."}
          </p>
          {loadingEditData && (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Loading item details...
            </p>
          )}
        </section>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className={sectionCardClass}>
            <h3 className={sectionTitleClass}>General Information</h3>

            <div className="mt-4 space-y-4">
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Item title"
                className={inputClass}
                required
              />

              <div className="grid gap-4 md:grid-cols-3">
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: value,
                      subcategory: "",
                    }))
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.keys(CATEGORY_MAP).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={formData.subcategory}
                  disabled={!formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      subcategory: value,
                    }))
                  }
                >
                  <SelectTrigger
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <SelectValue
                      placeholder={
                        formData.category
                          ? "Select subcategory"
                          : "Select category first"
                      }
                    />
                  </SelectTrigger>

                  <SelectContent> 
                    {formData.category &&
                      CATEGORY_MAP[formData.category]?.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price"
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add optional tag (e.g. special, negotiable)"
                  className={inputClass}
                />
                <Button type="button" onClick={handleAddTag} className="h-12">
                  Add Tag
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full px-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                      aria-label={`Remove ${tag}`}
                    >
                      x
                    </button>
                  </span>
                ))}
                <p className="w-full text-xs text-slate-500">
                  Optional. Up to {MAX_TAGS} tags, {MAX_TAG_LENGTH} characters
                  each.
                </p>
              </div>
            </div>
          </section>

          <section className={sectionCardClass}>
            <h3 className={sectionTitleClass}>Product Condition</h3>

            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {(["New", "Like New", "Good", "Fair"] as ConditionType[]).map(
                (item) => (
                  <label key={item} className="cursor-pointer">
                    <Input
                      type="radio"
                      name="condition"
                      value={item}
                      checked={formData.condition === item}
                      onChange={handleChange}
                      className="peer hidden"
                      required
                    />
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-700 transition peer-checked:border-blue-600 peer-checked:bg-blue-50">
                      {item}
                    </div>
                  </label>
                ),
              )}
            </div>
          </section>

          <section className={sectionCardClass}>
            <h3 className={sectionTitleClass}>Description</h3>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item in detail"
              className="mt-4 min-h-[150px] w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20"
              required
            />
          </section>

          <section className={sectionCardClass}>
            <div className="flex items-center justify-between">
              <h3 className={sectionTitleClass}>Photos</h3>
              <p className="text-xs text-slate-500">
                {formData.images.length}/5
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
              <div className="col-span-2 grid gap-3 md:col-span-5 md:grid-cols-[1fr_auto]">
                <Input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClass}
                />
                <Button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="h-12"
                >
                  Add Image Link
                </Button>
              </div>

              {formData.images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
                >
                  <img
                    src={img}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 h-7 min-w-7 rounded-full bg-white px-2 text-xs font-semibold text-rose-600 hover:bg-rose-600 hover:text-white"
                  >
                    X
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className={sectionCardClass}>
            <h3 className={sectionTitleClass}>Contact Information</h3>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={inputClass}
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className={inputClass}
              />
            </div>
          </section>

          <section className={sectionCardClass}>
            <h3 className={sectionTitleClass}>Delivery & Location</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <Input
                  type="checkbox"
                  name="deliveryPickup"
                  checked={formData.deliveryPickup}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 p-0 shadow-none focus:ring-0"
                />
                Self Pickup
              </label>

              <label className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                <Input
                  type="checkbox"
                  name="deliveryShipping"
                  checked={formData.deliveryShipping}
                  onChange={handleChange}
                  className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 p-0 shadow-none focus:ring-0"
                />
                Shipping Available
              </label>
            </div>

            <Input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className="mt-4 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20"
            />
          </section>

          <div className="pt-1">
            <Button
              type="submit"
              disabled={loadingEditData}
              className="h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {isEditMode ? "Save Changes" : "Publish Advertisement"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
