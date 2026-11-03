import { useEffect, useState } from "react";
import { ArrowLeft, Edit2, Image as ImageIcon, LoaderCircle, Package, Tag } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const imageUrl = (image) => {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

function ComboDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState({ id: null, combo: null, loading: true });

  useEffect(() => {
    let active = true;
    api.get(`/combos/${id}`).then(({ data }) => {
      if (active) setResult({ id, combo: data.combo, loading: false });
    }).catch((error) => {
      console.error("Failed to load combo details:", error);
      if (active) toast.error(error.response?.data?.message || "Unable to load combo details.");
      if (active) setResult({ id, combo: null, loading: false });
    }).finally(() => {
      if (active) setResult((current) => current.id === id ? { ...current, loading: false } : current);
    });
    return () => { active = false; };
  }, [id]);

  const loading = result.id !== id || result.loading;
  const combo = result.id === id ? result.combo : null;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle className="animate-spin text-violet-700" size={34} />
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-black text-slate-800">Combo product not found</h1>
        <Link to="/admin/products/all" className="mt-4 inline-flex items-center gap-2 font-bold text-violet-700 hover:text-violet-900">
          <ArrowLeft size={16} /> Back to products
        </Link>
      </div>
    );
  }

  const gallery = parseList(combo.gallery_images);
  const products = parseList(combo.products);
  const specifications = parseList(combo.specifications);
  const heroImage = imageUrl(gallery[0]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white shadow-lg shadow-violet-950/10">
        <div className="relative flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-4">
            <button type="button" onClick={() => navigate("/admin/products/all")} aria-label="Back to products" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Inventory management</p>
              <h1 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">{combo.name}</h1>
              <p className="mt-1 text-sm text-violet-100/80">Review combo details, included products, pricing, and stock.</p>
            </div>
          </div>
          <div className="flex w-fit shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white">
              <span className={`h-2 w-2 rounded-full ${combo.status === "Active" ? "bg-emerald-300" : combo.status === "Draft" ? "bg-amber-300" : "bg-gray-300"}`} />
              {combo.status || "Active"} listing
            </span>
            <button type="button" onClick={() => navigate(`/admin/products/combos/edit/${combo.id}`)} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">
              <Edit2 size={16} /> Edit Combo
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {heroImage ? (
            <img src={heroImage} alt={combo.name} className="h-72 w-full bg-violet-50 object-cover sm:h-96" />
          ) : (
            <div className="flex h-72 items-center justify-center bg-violet-50 text-violet-300 sm:h-96"><ImageIcon size={56} /></div>
          )}
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-6">
              {gallery.slice(1).map((image, index) => (
                <img key={`${image}-${index}`} src={imageUrl(image)} alt={`${combo.name} gallery ${index + 2}`} className="aspect-square w-full rounded-lg border border-slate-100 object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">{combo.category_type || "Combo"} · {combo.category || "Uncategorized"}</p>
                <h2 className="mt-1 text-2xl font-black text-slate-900">{combo.name}</h2>
                <p className="mt-1 text-sm text-slate-400">SKU: {combo.code}</p>
              </div>
              <span className={`shrink-0 rounded-lg border px-3 py-1 text-xs font-bold ${
                combo.status === "Active" ? "border-emerald-100 bg-emerald-50 text-emerald-700" :
                  combo.status === "Draft" ? "border-amber-100 bg-amber-50 text-amber-700" :
                    "border-slate-200 bg-slate-50 text-slate-600"
              }`}>{combo.status || "Active"}</span>
            </div>
            {combo.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{combo.description}</p>}
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selling price</p>
                <p className="mt-1 text-2xl font-black text-slate-900">₹{Number(combo.final_price ?? combo.offer_price ?? 0).toLocaleString("en-IN")}</p>
                {Number(combo.mrp) > Number(combo.offer_price) && <p className="text-sm text-slate-400 line-through">₹{Number(combo.mrp).toLocaleString("en-IN")}</p>}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Combo stock</p>
                <p className="mt-1 text-xl font-black text-slate-900">{combo.available_stock ?? 0}</p>
                <p className="text-xs text-slate-500">{combo.stock_status || "—"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-slate-800"><Tag size={17} className="text-violet-700" /> Combo information</h3>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-xs text-slate-400">Subcategory</dt><dd className="mt-0.5 font-semibold text-slate-700">{combo.subcategory || "—"}</dd></div>
              <div><dt className="text-xs text-slate-400">Original MRP</dt><dd className="mt-0.5 font-semibold text-slate-700">₹{Number(combo.mrp || 0).toLocaleString("en-IN")}</dd></div>
              <div><dt className="text-xs text-slate-400">Savings</dt><dd className="mt-0.5 font-semibold text-emerald-700">₹{Number(combo.total_savings || 0).toLocaleString("en-IN")}</dd></div>
              <div><dt className="text-xs text-slate-400">Offer</dt><dd className="mt-0.5 font-semibold text-slate-700">{Number(combo.offer || 0)}%</dd></div>
            </dl>
          </section>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5">
          <Package size={18} className="text-violet-700" />
          <h2 className="font-bold text-slate-800">Included products <span className="ml-1 text-slate-400">({products.length})</span></h2>
        </div>
        {products.length ? (
          <div className="divide-y divide-slate-100">
            {products.map((product) => {
              const productImage = imageUrl(product.image || product.images?.[0]);
              return (
                <div key={product.id} className="flex items-center gap-3 p-4 sm:gap-4 sm:px-5">
                  {productImage ? <img src={productImage} alt="" className="h-12 w-12 rounded-xl bg-slate-100 object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-300"><Package size={20} /></div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-800">{product.name || `Product #${product.id}`}</p>
                    <p className="mt-0.5 text-xs text-slate-400">SKU: {product.product_code || "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-700">₹{Number(product.offer_price ?? product.mrp ?? 0).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-slate-400">Qty: {product.quantity}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="p-5 text-sm text-slate-500">No products have been added to this combo.</p>}
      </section>

      {specifications.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-800">Specifications</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specifications.map((specification, index) => (
              <div key={`${specification.key}-${index}`} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs font-bold text-slate-500">{specification.key}</dt>
                <dd className="mt-1 text-sm text-slate-800">{specification.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

export default ComboDetail;
