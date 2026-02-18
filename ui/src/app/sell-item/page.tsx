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
import { categories as fallbackCategories, type Category } from "../../data/categories";
import { useState, ChangeEvent, useContext, useEffect } from "react";
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

  const [formData, setFormData] = useState<SellFormData>({
    title: "",
    category: "",
    subcategory: "",
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
        router.push("/auth/login");
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
  }, [isEditMode, editId, loading, user?.id, accessToken, router]);

  useEffect(() => {
    if (!isEditMode && !loading && (!user?.id || !accessToken)) {
      toast.error("You must be logged in to post an item.");
      router.replace("/auth/login");
    }
  }, [isEditMode, loading, user?.id, accessToken, router]);

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

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("You must be logged in to post an item.");
      router.replace("/auth/login");
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
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 outline-none transition";

  if (loading || (!isEditMode && (!user?.id || !accessToken))) {
    return <PageLoader message="Checking access..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
          {isEditMode ? "Edit Advertisement" : "Post New Advertisement"}
        </h1>
        <p className="text-slate-500 mb-12">
          {isEditMode
            ? "Update your listing details and save your changes."
            : "Create a high-quality listing to attract more buyers."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-10 md:p-14 space-y-14"
        >
          {loadingEditData && (
            <p className="text-sm text-slate-500">Loading item details...</p>
          )}

          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              General Information
            </h3>

            <div className="space-y-6">
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Item title"
                className={inputClass}
                required
              />

              <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border">
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
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Product Condition
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="rounded-2xl border p-5 text-center shadow-sm hover:shadow-md peer-checked:border-blue-600 peer-checked:bg-blue-50 transition">
                      <p className="font-bold">{item}</p>
                    </div>
                  </label>
                ),
              )}
            </div>
          </section>

          {/* ================= DESCRIPTION ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Description
            </h3>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your item in detail"
              className="w-full min-h-[160px] rounded-xl border border-slate-300 bg-white p-4 shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 outline-none transition"
              required
            />
          </section>

          {/* ================= PHOTOS ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Photos
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-5 grid md:grid-cols-[1fr_auto] gap-3">
                <Input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={inputClass}
                />
                <Button type="button" onClick={handleAddImageUrl}>
                  Add Image Link
                </Button>
              </div>

              {formData.images.map((img, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden border shadow hover:shadow-lg transition"
                >
                  <img
                    src={img}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white transition"
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* ================= CONTACT ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Contact Information
            </h3>

            <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border">
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

          {/* ================= DELIVERY ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Delivery & Location
            </h3>

            <div className="flex gap-6 mb-6">
              <label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  name="deliveryPickup"
                  checked={formData.deliveryPickup}
                  onChange={handleChange}
                />
                Self Pickup
              </label>

              <label className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  name="deliveryShipping"
                  checked={formData.deliveryShipping}
                  onChange={handleChange}
                />
                Shipping Available
              </label>
            </div>

            <Input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className={inputClass}
            />
          </section>

          <Button
            type="submit"
            disabled={loadingEditData}
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition shadow-lg"
          >
            {isEditMode ? "Save Changes" : "Publish Advertisement"}
          </Button>
        </form>
      </div>
    </div>
  );
}
