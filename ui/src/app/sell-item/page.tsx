"use client";

import { useState, ChangeEvent, FormEvent } from "react";

/* ================= TYPES ================= */

type ConditionType = "New" | "Like New" | "Good" | "Fair";

interface SellFormData {
  title: string;
  category: string;
  subcategory: string;
  price: string;
  condition: ConditionType | "";
  description: string;
  email: string;
  phone: string;
  location: string;
  deliveryPickup: boolean;
  deliveryShipping: boolean;
}

type CategoryMap = Record<string, string[]>;

/* ================= COMPONENT ================= */

export default function SellPage() {
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
  });

  const [images, setImages] = useState<File[]>([]);

  /* ================= CONSTANTS ================= */

  const CATEGORY_MAP: CategoryMap = {
    Electronics: ["Mobile", "Laptop", "Tablet", "Camera", "Accessories"],
    Vehicles: ["Car", "Bike", "Scooter", "Truck"],
    "Home & Garden": ["Furniture", "Appliances", "Decor"],
    Fashion: ["Men", "Women", "Kids", "Footwear"],
  };

  /* ================= HANDLERS ================= */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;

    const { name, value } = target;

    if (target.type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (target as HTMLInputElement).checked,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files: File[] = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log("POST AD 👉", { ...formData, images });
  };

  /* ================= UI ================= */

  const inputClass =
    "w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 outline-none transition";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
          Post New Advertisement
        </h1>
        <p className="text-slate-500 mb-12">
          Create a high-quality listing to attract more buyers.
        </p>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-10 md:p-14 space-y-14"
        >
          {/* ================= GENERAL INFO ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              General Information
            </h3>

            <div className="space-y-6">
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Item title"
                className={inputClass}
              />

              <div className="grid md:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border">
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {Object.keys(CATEGORY_MAP).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                  <option value="">
                    {formData.category
                      ? "Select subcategory"
                      : "Select category first"}
                  </option>

                  {formData.category &&
                    CATEGORY_MAP[formData.category].map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Price"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* ================= CONDITION ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Product Condition
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["New", "Like New", "Good", "Fair"] as ConditionType[]).map(
                (item) => (
                  <label key={item} className="cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={item}
                      onChange={handleChange}
                      className="peer hidden"
                    />
                    <div className="rounded-2xl border p-5 text-center shadow-sm hover:shadow-md peer-checked:border-blue-600 peer-checked:bg-blue-50 transition">
                      <p className="font-bold">{item}</p>
                    </div>
                  </label>
                )
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
            />
          </section>

          {/* ================= PHOTOS ================= */}
          <section>
            <h3 className="text-2xl font-extrabold flex items-center gap-3 mb-8">
              <span className="w-2 h-8 bg-blue-600 rounded-full" />
              Photos
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <label className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
                <span className="text-4xl">+</span>
                <span className="text-xs mt-2">Add Photo</span>
              </label>

              {images.map((file, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-2xl overflow-hidden border shadow hover:shadow-lg transition"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white transition"
                  >
                    ✕
                  </button>
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
              <input
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
                <input
                  type="checkbox"
                  name="deliveryPickup"
                  checked={formData.deliveryPickup}
                  onChange={handleChange}
                />
                Self Pickup
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="deliveryShipping"
                  checked={formData.deliveryShipping}
                  onChange={handleChange}
                />
                Shipping Available
              </label>
            </div>

            <input
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, State"
              className={inputClass}
            />
          </section>

          {/* ================= ACTION ================= */}
          <button
            type="submit"
            className="w-full h-14 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition shadow-lg"
          >
            Publish Advertisement
          </button>
        </form>
      </div>
    </div>
  );
}
