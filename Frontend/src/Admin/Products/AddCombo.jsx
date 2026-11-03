import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes, Check, Edit2, ImagePlus, LoaderCircle, PackagePlus, Plus, Search, Trash2, Video, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";

const emptyForm = {
  name: "",
  code: "",
  category_type: "",
  category: "",
  subcategory: "",
  description: "",
  gallery_images: [],
  video: "",
  status: "Active",
  products: [],
  mrp: "",
  offer: "0",
  track_inventory: true,
  allow_backorders: false,
  specifications: [],
  warranty: "",
  return_policy: "",
  delivery_information: "",
  rating: "5",
  featured: false,
  trending: false,
  new_arrival: false,
};

const currency = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const resolveImage = (image) => {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const sectionCard = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";
const fieldClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10";

function SectionHeader({ icon: Icon, title, description, number }) {
  return (
    <div className="flex items-center gap-3 bg-gradient-to-r from-[#35106d] via-[#5625a5] to-[#783ed0] px-5 py-4 text-white">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><Icon size={19} /></span>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold">{title}</h2>
        <p className="mt-0.5 text-xs text-violet-100">{description}</p>
      </div>
      {number && <span className="hidden rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-violet-100 sm:block">{number}</span>}
    </div>
  );
}

function Field({ label, required, children, error }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">
        {label}{required && <span className="ml-1 text-rose-500">*</span>}
      </span>
      {children}
      {error && <span className="block text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

function AddCombo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [categoryTypes, setCategoryTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [productPagination, setProductPagination] = useState({ total: 0, totalPages: 1 });
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productSubcategory, setProductSubcategory] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState("");
  const [errors, setErrors] = useState({});
  const [specificationDraft, setSpecificationDraft] = useState({ key: "", value: "" });
  const [editingSpecificationIndex, setEditingSpecificationIndex] = useState(null);

  const categoriesForType = categories.filter((category) => category.category_type === form.category_type);
  const selectedCategory = categoriesForType.find((category) => category.name === form.category);
  const subcategories = selectedCategory?.subcategory || [];
  const selectedProductsById = useMemo(
    () => new Map(form.products.map((item) => [Number(item.id), item])),
    [form.products],
  );
  const originalTotal = form.products.reduce((total, item) => total + Number(item.mrp) * Number(item.quantity), 0);
  const comboMrp = Number(form.mrp) || originalTotal;
  const offerPrice = Math.max(0, comboMrp * (1 - (Number(form.offer) || 0) / 100));
  const totalSavings = Math.max(0, originalTotal - offerPrice);
  const finalPrice = offerPrice;
  const availableStock = form.track_inventory && form.products.length
    ? Math.min(...form.products.map((item) => Math.floor(Number(item.stock || 0) / Math.max(1, Number(item.quantity) || 1))))
    : 0;
  const stockStatus = availableStock > 10 ? "In Stock" : availableStock > 0 ? "Low Stock" : "Out of Stock";

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/combos/categories"),
      isEditing ? api.get(`/combos/${id}`) : api.get("/combos/next-code"),
    ]).then(([categoryResponse, comboResponse]) => {
      if (!active) return;
      const loadedCategories = Array.isArray(categoryResponse.data) ? categoryResponse.data : [];
      setCategories(loadedCategories);
      setCategoryTypes([...new Set(loadedCategories.map((category) => category.category_type).filter(Boolean))]);
      if (isEditing) {
        const combo = comboResponse.data.combo;
        setForm({
          ...emptyForm,
          ...combo,
          code: combo.code || "",
          gallery_images: Array.isArray(combo.gallery_images) ? combo.gallery_images : [],
          products: Array.isArray(combo.products) ? combo.products.map((product) => ({
            ...product,
            image: product.image || product.images?.[0] || "",
            offer_price: Number(product.offer_price ?? product.mrp) || 0,
            mrp: Number(product.mrp) || 0,
            stock: Number(product.stock ?? product.total_stock) || 0,
          })) : [],
          specifications: Array.isArray(combo.specifications) ? combo.specifications : [],
          track_inventory: Boolean(combo.track_inventory),
          allow_backorders: Boolean(combo.allow_backorders),
          featured: Boolean(combo.featured),
          trending: Boolean(combo.trending),
          new_arrival: Boolean(combo.new_arrival),
          mrp: String(combo.mrp ?? ""),
          offer: String(combo.offer ?? "0"),
        });
      } else {
        setForm((current) => ({ ...current, code: comboResponse.data.code || "" }));
      }
    }).catch((error) => {
      console.error("Failed to load combo form options:", error);
      toast.error(error.response?.data?.message || (isEditing ? "Unable to load combo details." : "Unable to load categories or combo code."));
    });
    return () => { active = false; };
  }, [id, isEditing]);

  useEffect(() => {
    if (!form.category_type) {
      setProducts([]);
      setProductPagination({ total: 0, totalPages: 1 });
      setLoadingProducts(false);
      return undefined;
    }

    let active = true;
    const timeout = setTimeout(async () => {
      setLoadingProducts(true);
      try {
        const { data } = await api.get("/combos/products", {
          params: {
            page: productPage,
            limit: 24,
            ...(productSearch.trim() ? { search: productSearch.trim() } : {}),
            categoryType: form.category_type,
            ...(productCategory ? { category: productCategory } : {}),
            ...(productSubcategory ? { subcategory: productSubcategory } : {}),
          },
        });
        if (active) {
          setProducts(Array.isArray(data.products) ? data.products : []);
          setProductPagination(data.pagination || { total: 0, totalPages: 1 });
        }
      } catch (error) {
        if (active) {
          console.error("Failed to load combo products:", error);
          toast.error(error.response?.data?.message || "Unable to load products.");
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [form.category_type, productPage, productSearch, productCategory, productSubcategory]);

  const updateForm = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleCategoryType = (value) => {
    setForm((current) => ({ ...current, category_type: value, category: "", subcategory: "" }));
    setProductCategory("");
    setProductSubcategory("");
    setProductPage(1);
  };

  const handleCategory = (value) => {
    setForm((current) => ({ ...current, category: value, subcategory: "" }));
  };

  const addProduct = (product) => {
    if (selectedProductsById.has(Number(product.id))) return;
    setForm((current) => ({
      ...current,
      products: [...current.products, {
        id: product.id,
        name: product.name,
        product_code: product.product_code,
        image: product.images?.[0] || "",
        mrp: Number(product.mrp) || 0,
        offer_price: Number(product.offer_price ?? product.mrp) || 0,
        stock: Number(product.total_stock) || 0,
        quantity: 1,
      }],
    }));
    setErrors((current) => ({ ...current, products: "" }));
  };

  const updateQuantity = (id, value) => {
    const quantity = Math.min(10000, Math.max(1, Number.parseInt(value, 10) || 1));
    setForm((current) => ({
      ...current,
      products: current.products.map((item) => Number(item.id) === Number(id) ? { ...item, quantity } : item),
    }));
  };

  const uploadFiles = async (field, files) => {
    if (!files.length) return;
    setUploading(field);
    try {
      const data = new FormData();
      if (field === "gallery") files.slice(0, 10 - form.gallery_images.length).forEach((file) => data.append("gallery", file));
      else data.append("video", files[0]);
      const { data: result } = await api.post("/combos/upload", data);
      if (field === "gallery") updateForm("gallery_images", [...form.gallery_images, ...result.gallery_images]);
      if (field === "video") updateForm("video", result.video);
      toast.success("Media uploaded.");
    } catch (error) {
      console.error("Combo media upload failed:", error);
      toast.error(error.response?.data?.message || "Media upload failed.");
    } finally {
      setUploading("");
    }
  };

  const addSpecification = () => {
    const key = specificationDraft.key.trim();
    const value = specificationDraft.value.trim();
    if (!key || !value) {
      toast.error("Enter both a specification title and value.");
      return;
    }
    setForm((current) => ({ ...current, specifications: [...current.specifications, { key, value }] }));
    setSpecificationDraft({ key: "", value: "" });
  };

  const saveSpecification = () => {
    const key = specificationDraft.key.trim();
    const value = specificationDraft.value.trim();
    if (!key || !value) {
      toast.error("Enter both a specification title and value.");
      return;
    }
    setForm((current) => ({
      ...current,
      specifications: current.specifications.map((specification, index) =>
        index === editingSpecificationIndex ? { key, value } : specification,
      ),
    }));
    setSpecificationDraft({ key: "", value: "" });
    setEditingSpecificationIndex(null);
  };

  const submit = async (status) => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Enter a combo name.";
    if (!form.category_type) nextErrors.category_type = "Select a category type.";
    if (!form.category) nextErrors.category = "Select a category.";
    if (!form.subcategory) nextErrors.subcategory = "Select a subcategory.";
    if (status !== "Draft" && !form.products.length) nextErrors.products = "Select at least one product.";
    if (Number(form.mrp || originalTotal) <= 0) nextErrors.mrp = "Add products or enter a combo MRP.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast.error("Please complete the required fields.");
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        status,
        mrp: comboMrp,
        offer_price: offerPrice,
        total_savings: totalSavings,
        final_price: finalPrice,
        available_stock: availableStock,
        stock_status: stockStatus,
      };
      const { data } = isEditing
        ? await api.put(`/combos/${id}`, payload)
        : await api.post("/combos", payload);
      toast.success(isEditing ? "Combo product updated successfully." : status === "Draft" ? "Combo saved as draft." : "Combo product added successfully.");
      if (data.success) navigate("/admin/products/all");
    } catch (error) {
      console.error("Failed to save combo:", error);
      toast.error(error.response?.data?.message || "Unable to save combo.");
    } finally {
      setLoading(false);
    }
  };

  const selectClass = `${fieldClass} appearance-none`;

  return (
    <div className="min-h-full bg-slate-50/70 px-3 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="product-editor-heading relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white shadow-lg shadow-violet-950/10">
          <div className="relative flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <Link to="/admin/products/all" aria-label="Back to products" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20">
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Inventory management</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{isEditing ? "Edit Combo Product" : "Add Combo Product"}</h1>
                <p className="mt-1 text-sm text-violet-100/80">Bundle products, set pricing, and manage combo inventory.</p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white">
              <span className={`h-2 w-2 rounded-full ${form.status === "Active" ? "bg-emerald-300" : form.status === "Draft" ? "bg-amber-300" : "bg-gray-300"}`} />
              {form.status || "Active"} listing
            </span>
          </div>
        </header>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
          <div className="space-y-5">
            <section className={sectionCard}>
              <SectionHeader icon={Boxes} title="Combo Basic Details" description="Identity, category, and presentation" number="01" />
              <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <Field label="Combo Name" required error={errors.name}>
                  <input name="name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="e.g. Complete Home Essentials Bundle" className={fieldClass} maxLength={191} />
                </Field>
                <Field label="Combo Code / SKU">
                  <input value={form.code || "Generating..."} readOnly className={`${fieldClass} cursor-not-allowed bg-slate-100 font-bold text-violet-800`} />
                </Field>
                <Field label="Category Type" required error={errors.category_type}>
                  <select name="category_type" value={form.category_type} onChange={(event) => handleCategoryType(event.target.value)} className={selectClass}>
                    <option value="">Select category type</option>
                    {categoryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Category" required error={errors.category}>
                  <select name="category" value={form.category} onChange={(event) => handleCategory(event.target.value)} className={selectClass} disabled={!form.category_type}>
                    <option value="">Select category</option>
                    {categoriesForType.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                </Field>
                <Field label="Subcategory" required error={errors.subcategory}>
                  <select name="subcategory" value={form.subcategory} onChange={(event) => updateForm("subcategory", event.target.value)} className={selectClass} disabled={!subcategories.length}>
                    <option value="">Select subcategory</option>
                    {subcategories.map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={(event) => updateForm("status", event.target.value)} className={selectClass}>
                    <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Draft">Draft</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Full Description">
                    <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Describe the combo and its benefits..." rows={4} className={`${fieldClass} resize-y`} maxLength={20000} />
                  </Field>
                </div>
              </div>
            </section>

            <section className={sectionCard}>
              <SectionHeader icon={ImagePlus} title="Combo Media" description="Upload gallery images and video" number="02" />
              <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6">
                <div>
                  <Field label="Multiple Gallery Images">
                    <label className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-center transition hover:border-violet-300">
                      <ImagePlus className="mb-2 text-violet-600" size={27} /><span className="text-sm font-bold text-slate-700">Add gallery images</span><span className="mt-1 text-xs text-slate-500">{form.gallery_images.length}/10 images</span>
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => uploadFiles("gallery", [...(event.target.files || [])])} />
                    </label>
                    {uploading === "gallery" && <p className="mt-2 text-xs font-semibold text-violet-700">Uploading images...</p>}
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {form.gallery_images.map((image, index) => (
                        <div key={`${image}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                          <img src={resolveImage(image)} alt={`Combo gallery ${index + 1}`} className="h-full w-full object-cover" />
                          <button type="button" aria-label="Remove gallery image" onClick={() => updateForm("gallery_images", form.gallery_images.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-1 top-1 rounded-full bg-slate-900/75 p-1 text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"><X size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Product Video">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-violet-300 hover:text-violet-700">
                        <Video size={17} />{form.video ? "Replace video" : "Upload video"}
                        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => uploadFiles("video", [...(event.target.files || [])])} />
                      </label>
                      {form.video && <button type="button" onClick={() => updateForm("video", "")} className="text-sm font-bold text-rose-600">Remove video</button>}
                      {uploading === "video" && <span className="text-xs text-violet-700">Uploading video...</span>}
                    </div>
                    {form.video && <video src={resolveImage(form.video)} controls className="mt-3 max-h-48 w-full rounded-xl bg-black sm:w-96" />}
                  </Field>
                </div>
              </div>
            </section>

            <section className={sectionCard}>
              <SectionHeader icon={PackagePlus} title="Select Products for Combo" description="Find and add products to your bundle" number="03" />
              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="relative block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input value={productSearch} onChange={(event) => { setProductSearch(event.target.value); setProductPage(1); }} placeholder="Search name or product code..." className={`${fieldClass} pl-10`} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={productCategory} onChange={(event) => { setProductCategory(event.target.value); setProductSubcategory(""); setProductPage(1); }} className={selectClass}>
                      <option value="">All categories</option>
                      {[...new Set(categoriesForType.map((category) => category.name))].map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <select value={productSubcategory} onChange={(event) => { setProductSubcategory(event.target.value); setProductPage(1); }} className={selectClass} disabled={!productCategory}>
                      <option value="">All subcategories</option>
                      {[...new Set(categories.filter((category) => category.name === productCategory).flatMap((category) => category.subcategory || []))].map((subcategory) => <option key={subcategory} value={subcategory}>{subcategory}</option>)}
                    </select>
                  </div>
                </div>
                {errors.products && <p className="text-xs font-semibold text-rose-600">{errors.products}</p>}
                <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
                  {!form.category_type ? <p className="py-10 text-center text-sm text-slate-500">Select a category type above to see matching products.</p>
                    : loadingProducts ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18} /> Loading products...</div>
                    : products.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No matching products found.</p>
                      : products.map((product) => {
                        const selected = selectedProductsById.has(Number(product.id));
                        return (
                          <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-violet-200 sm:flex-nowrap">
                            <img src={resolveImage(product.images?.[0]) || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=35106d"} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-slate-50 object-contain" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-800">{product.name}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{product.product_code} · Stock: {product.total_stock}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700">{currency(product.offer_price)} <span className="ml-1 text-slate-400 line-through">{currency(product.mrp)}</span></p>
                            </div>
                            <button type="button" onClick={() => addProduct(product)} disabled={selected} className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-default sm:w-auto ${selected ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-800 hover:bg-violet-100"}`}>
                              {selected ? <Check size={15} /> : <Plus size={15} />}{selected ? "Added" : "Add Product"}
                            </button>
                          </div>
                        );
                      })}
                </div>
                {productPagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{productPagination.total} products</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setProductPage((page) => Math.max(1, page - 1))} disabled={productPage <= 1} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Previous</button>
                    <span>{productPage} / {productPagination.totalPages}</span>
                    <button type="button" onClick={() => setProductPage((page) => Math.min(productPagination.totalPages, page + 1))} disabled={productPage >= productPagination.totalPages} className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold disabled:opacity-40">Next</button>
                  </div>
                </div>}
              </div>
            </section>

            <section className={sectionCard}>
              <SectionHeader icon={Boxes} title="Selected Products" description={`${form.products.length} product${form.products.length === 1 ? "" : "s"} in this combo`} number="04" />
              <div className="space-y-3 p-4 sm:p-6">
                {form.products.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">Choose products above to build this combo.</p>
                  : form.products.map((item) => (
                    <div key={item.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[64px_minmax(0,1fr)_90px_100px_36px]">
                      <img src={resolveImage(item.image) || "https://ui-avatars.com/api/?name=Product&background=f3f4f6&color=35106d"} alt="" className="h-13 w-13 rounded-lg bg-slate-50 object-contain sm:h-16 sm:w-16" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.product_code}</p>
                        <p className="mt-1 text-xs text-slate-600"><span className="line-through">{currency(item.mrp)}</span> <b className="ml-1 text-violet-700">{currency(item.offer_price)}</b></p>
                        <p className="mt-1 text-xs font-bold text-slate-700 sm:hidden">{currency(item.offer_price * item.quantity)} subtotal</p>
                      </div>
                      <label className="col-start-2 flex items-center gap-2 text-xs font-semibold text-slate-500 sm:col-start-auto">
                        Qty
                        <input type="number" min="1" max="10000" value={item.quantity} onChange={(event) => updateQuantity(item.id, event.target.value)} className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-center text-sm font-bold text-slate-800 outline-none focus:border-violet-400" />
                      </label>
                      <span className="hidden text-right text-sm font-bold text-slate-800 sm:block">{currency(item.offer_price * item.quantity)}</span>
                      <button type="button" aria-label={`Remove ${item.name}`} onClick={() => setForm((current) => ({ ...current, products: current.products.filter((product) => product.id !== item.id) }))} className="col-start-3 row-start-1 rounded-lg p-2 text-rose-500 transition hover:bg-rose-50 sm:col-start-auto sm:row-auto"><Trash2 size={17} /></button>
                    </div>
                  ))}
              </div>
            </section>
          </div>

          <div className="space-y-5 xl:sticky xl:top-5">
            <section className={sectionCard}>
              <SectionHeader icon={Boxes} title="Pricing Details" description="Live combo price calculation" number="05" />
              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Total Original MRP">
                    <input readOnly value={originalTotal.toFixed(2)} className={`${fieldClass} bg-slate-100 font-bold`} />
                  </Field>
                  <Field label="Combo MRP" error={errors.mrp}>
                    <input type="number" min="0" step="0.01" value={form.mrp} onChange={(event) => updateForm("mrp", event.target.value)} placeholder={originalTotal.toFixed(2)} className={fieldClass} />
                  </Field>
                  <Field label="Offer Percentage">
                    <input type="number" min="0" max="100" step="0.01" value={form.offer} onChange={(event) => updateForm("offer", event.target.value)} className={fieldClass} />
                  </Field>
                  <Field label="Offer Price">
                    <input readOnly value={offerPrice.toFixed(2)} className={`${fieldClass} bg-slate-100 font-bold`} />
                  </Field>
                  <Field label="Total Savings">
                    <input readOnly value={totalSavings.toFixed(2)} className={`${fieldClass} bg-emerald-50 font-bold text-emerald-700`} />
                  </Field>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-[#35106d] to-[#7037c3] p-4 text-white">
                  <p className="text-xs font-semibold text-violet-100">Final Selling Price</p>
                  <p className="mt-1 text-2xl font-black">{currency(finalPrice)}</p>
                </div>
              </div>
            </section>

            <section className={sectionCard}>
              <SectionHeader icon={PackagePlus} title="Stock Details" description="Combo inventory and order limits" number="06" />
              <div className="space-y-4 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Available Combo Stock">
                    <input readOnly value={availableStock} className={`${fieldClass} bg-slate-100 font-bold`} />
                  </Field>
                  <Field label="Stock Status">
                    <input readOnly value={stockStatus} className={`${fieldClass} bg-slate-100 font-bold`} />
                  </Field>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[["track_inventory", "Track inventory"], ["allow_backorders", "Allow backorders"]].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700">
                      <input type="checkbox" checked={form[key]} onChange={(event) => updateForm(key, event.target.checked)} className="h-4 w-4 accent-violet-700" />{label}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            <section className={sectionCard}>
              <SectionHeader icon={Check} title="Combo Specifications" description="Add details customers should know" number="07" />
              <div className="space-y-3 p-4 sm:p-6">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input value={specificationDraft.key} onChange={(event) => setSpecificationDraft((current) => ({ ...current, key: event.target.value }))} placeholder="Specification title" className={fieldClass} maxLength={100} />
                  <input value={specificationDraft.value} onChange={(event) => setSpecificationDraft((current) => ({ ...current, value: event.target.value }))} placeholder="Specification value" className={fieldClass} maxLength={500} />
                  <button type="button" onClick={editingSpecificationIndex === null ? addSpecification : saveSpecification} aria-label={editingSpecificationIndex === null ? "Add specification" : "Save specification"} className="flex items-center justify-center rounded-xl bg-violet-100 px-4 py-3 font-bold text-violet-800 hover:bg-violet-200">
                    {editingSpecificationIndex === null ? <Plus size={18} /> : <Check size={18} />}
                  </button>
                </div>
                {form.specifications.map((specification, index) => (
                  <div key={`${specification.key}-${index}`} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">{specification.key}</p>
                      <p className="truncate text-xs text-slate-500">{specification.value}</p>
                    </div>
                    <button type="button" aria-label={`Edit ${specification.key}`} onClick={() => {
                      setSpecificationDraft(specification);
                      setEditingSpecificationIndex(index);
                    }} className="rounded-lg p-2 text-violet-600 hover:bg-violet-50"><Edit2 size={15} /></button>
                    <button type="button" aria-label={`Delete ${specification.key}`} onClick={() => updateForm("specifications", form.specifications.filter((_, specIndex) => specIndex !== index))} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col gap-2 sm:flex-row xl:flex-col 2xl:flex-row">
              <button type="button" onClick={() => navigate("/admin/products/all")} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Cancel</button>
              {!isEditing && <button type="button" onClick={() => submit("Draft")} disabled={loading || Boolean(uploading)} className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-100 disabled:opacity-60">Save as Draft</button>}
              <button type="button" onClick={() => submit(isEditing ? form.status : "Active")} disabled={loading || Boolean(uploading)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#35106d] to-[#7037c3] px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-900/15 transition hover:brightness-110 disabled:opacity-60">
                {loading ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />}{isEditing ? "Save Changes" : "Add Combo Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddCombo;
