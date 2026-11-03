import React, { useState, useEffect } from "react";
import { FiArrowLeft, FiSearch, FiSave, FiLayers, FiBox, FiPlus, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { toast, Toaster } from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const getImageUrl = (imagePath) => {
  if (!imagePath) return `https://ui-avatars.com/api/?name=Product&background=random`;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const AddStock = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loading, setLoading] = useState(false);

    // UI state for inputs
    const [stockAdditions, setStockAdditions] = useState({});
    const [manualTotalStockAdd, setManualTotalStockAdd] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = { search };
            const res = await api.get("/products", { params });
            const data = res.data;
            setProducts(Array.isArray(data) ? data : (data.products || []));
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = async (prod) => {
        setSelectedProduct(null);
        setStockAdditions({});
        setManualTotalStockAdd("");
        setSearch("");
        try {
            const res = await api.get(`/products/${prod.id}`);
            const p = res.data;
            let variants = [];
            if (p.variants) {
                variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants;
            }
            setSelectedProduct({ ...p, variants: Array.isArray(variants) ? variants : [] });
        } catch (error) {
            toast.error("Failed to fetch product details");
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        if (selectedProduct) setSelectedProduct(null); // Clear selection if user searches again
    };

    const filteredProducts = products;

    const handleAdditionChange = (key, value) => {
        const val = value.replace(/[^0-9]/g, '');
        setStockAdditions(prev => ({ ...prev, [key]: val }));
    };

    const getCurrentStockValue = (product) => {
        const current = Number.parseInt(product?.total_stock ?? product?.stock ?? 0, 10) || 0;
        return Math.max(0, current);
    };

    const handleSave = async () => {
        if (!selectedProduct) return;
        setIsSaving(true);
        try {
            const updatedVariants = [...selectedProduct.variants];
            let addedTotal = 0;
            const hasVariantsWithSizes = updatedVariants.some(v => v.sizesStock && Object.keys(v.sizesStock).length > 0);
            const hasColorQuantities = updatedVariants.some(v => v.quantity !== undefined);

            if (hasVariantsWithSizes) {
                updatedVariants.forEach((v, vIndex) => {
                    if (v.sizesStock) {
                        Object.keys(v.sizesStock).forEach(size => {
                            const key = `${vIndex}-${size}`;
                            const addition = parseInt(stockAdditions[key]) || 0;
                            v.sizesStock[size] = (parseInt(v.sizesStock[size]) || 0) + addition;
                            addedTotal += addition;
                        });
                    }
                });
            } else if (hasColorQuantities) {
                updatedVariants.forEach((variant, vIndex) => {
                    if (variant.quantity === undefined) return;
                    const addition = parseInt(stockAdditions[`${vIndex}-quantity`], 10) || 0;
                    variant.quantity = (parseInt(variant.quantity, 10) || 0) + addition;
                    addedTotal += addition;
                });
            } else {
                addedTotal = parseInt(manualTotalStockAdd) || 0;
            }

            if (addedTotal === 0) {
                toast.error("Please add a quantity greater than 0");
                setIsSaving(false);
                return;
            }

            const oldTotal = getCurrentStockValue(selectedProduct);
            const newTotalStock = oldTotal + addedTotal;
            const status = newTotalStock <= 0 ? "Out of Stock" : newTotalStock < 10 ? "Low Stock" : "Active";

            const payload = {
                ...selectedProduct,
                total_stock: newTotalStock.toString(),
                stock: newTotalStock.toString(),
                status: status,
                variants: updatedVariants
            };

            await api.put(`/products/${selectedProduct.id}`, payload);
            toast.success(`Successfully added ${addedTotal} to stock!`);
            setTimeout(() => navigate(-1), 1500);
        } catch (error) {
            toast.error("Failed to add stock");
        } finally {
            setIsSaving(false);
        }
    };

    const hasSizes = selectedProduct && selectedProduct.variants && selectedProduct.variants.some(v => v.sizesStock && Object.keys(v.sizesStock).length > 0);
    const hasColorQuantities = selectedProduct?.variants?.some(v => v.quantity !== undefined) || false;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <Toaster position="top-right" />

            <header className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#2e1065] via-[#4c1d95] to-[#86198f] text-white shadow-lg shadow-violet-950/10">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} aria-label="Go back" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20">
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Inventory management</p>
                            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Add stock</h1>
                            <p className="mt-1 text-sm text-violet-100/80">Choose a product and update its inventory.</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.65fr)]">
                {/* Search & Selection Section */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-50 text-violet-700">
                                <FiSearch size={17} />
                            </span>
                            <div>
                                <h2 className="text-sm font-extrabold text-slate-800">Find a product</h2>
                                <p className="text-xs text-slate-500">Search by name or product code</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 sm:p-5">
                        <div className="relative mb-4">
                            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearchChange}
                                placeholder="Search by name or SKU..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                            />
                        </div>

                        {!selectedProduct && (
                            <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
                                {filteredProducts.map(prod => (
                                    <button
                                        key={prod.id}
                                        onClick={() => handleSelectProduct(prod)}
                                        className="group flex w-full items-center gap-3 rounded-xl border border-transparent bg-white p-3 text-left transition hover:border-violet-200 hover:bg-violet-50/60"
                                    >
                                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                                            <img
                                                src={getImageUrl((prod.variants && prod.variants.length > 0 && prod.variants[0].images?.length > 0) ? prod.variants[0].images[0] : (prod.images && prod.images.length > 0) ? prod.images[0] : null)}
                                                alt={prod.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-800">{prod.name}</p>
                                            <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-400">{prod.product_code || `#SKU-${1000 + prod.id}`}</p>
                                        </div>
                                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white">
                                            <FiPlus />
                                        </div>
                                    </button>
                                ))}
                                {loading && <p className="py-8 text-center text-sm font-medium text-slate-400">Loading products...</p>}
                                {!loading && filteredProducts.length === 0 && search && (
                                    <p className="py-8 text-center text-sm font-medium text-slate-400">No products found for “{search}”.</p>
                                )}
                                {!loading && filteredProducts.length === 0 && !search && (
                                    <p className="py-8 text-center text-sm font-medium text-slate-400">Search to find a product.</p>
                                )}
                            </div>
                        )}
                        {selectedProduct && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                                    <FiCheck /> Product selected
                                </div>
                                <button onClick={() => setSelectedProduct(null)} className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 transition hover:bg-emerald-100">
                                    Change
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Addition Section */}
                <section className="min-w-0">
                    {selectedProduct ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                                <div className="flex min-w-0 items-center gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                                        <img
                                            src={getImageUrl((selectedProduct.variants && selectedProduct.variants.length > 0 && selectedProduct.variants[0].images?.length > 0) ? selectedProduct.variants[0].images[0] : (selectedProduct.images && selectedProduct.images.length > 0) ? selectedProduct.images[0] : null)}
                                            alt={selectedProduct.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">Selected product</p>
                                        <h2 className="mt-1 truncate text-lg font-extrabold text-slate-800 sm:text-xl">{selectedProduct.name}</h2>
                                        <p className="mt-1 truncate text-xs font-medium text-slate-500">{selectedProduct.product_code || `#SKU-${1000 + selectedProduct.id}`}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:min-w-36 sm:justify-center">
                                    <FiLayers className="text-violet-700" size={18} />
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current stock</p>
                                        <p className="text-lg font-black text-slate-800">{getCurrentStockValue(selectedProduct)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 p-5 sm:p-6">
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800">Add quantities</h3>
                                    <p className="mt-1 text-xs text-slate-500">Enter the number of units to add to each variant.</p>
                                </div>

                                {hasSizes || hasColorQuantities ? (
                                    <div className="space-y-4">
                                        {selectedProduct.variants.map((v, vIndex) => {
                                            const hasVariantSizes = v.sizesStock && Object.keys(v.sizesStock).length > 0;
                                            if (!hasVariantSizes && v.quantity === undefined) return null;
                                            return (
                                                <div key={vIndex} className="overflow-hidden rounded-xl border border-slate-200">
                                                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                                                        <div className="h-4 w-4 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: v.color || "#7c3aed" }}></div>
                                                        <span className="text-sm font-bold text-slate-800">{v.colorName || "Default shade"}</span>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                                                        {(hasVariantSizes ? Object.entries(v.sizesStock) : [["quantity", v.quantity]]).map(([size, currentStock]) => {
                                                            const key = `${vIndex}-${size}`;
                                                            const added = parseInt(stockAdditions[key]) || 0;
                                                            const oldTotal = parseInt(currentStock) || 0;
                                                            const newTotalMatch = oldTotal + added;
                                                            return (
                                                                <div key={size} className="rounded-xl border border-slate-200 bg-white p-3">
                                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                                        <label className="text-xs font-bold text-slate-700">{size === "quantity" ? "Color stock" : `Size ${size}`}</label>
                                                                        <span className="text-[10px] font-medium text-slate-500">Current: {oldTotal}</span>
                                                                    </div>
                                                                    <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                                                                        <span className="px-3 text-sm font-bold text-violet-700">+</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            inputMode="numeric"
                                                                            aria-label={`Quantity to add for ${v.colorName || "variant"} ${size}`}
                                                                            value={stockAdditions[key] || ""}
                                                                            onChange={(e) => handleAdditionChange(key, e.target.value)}
                                                                            className="w-full min-w-0 border-0 py-2.5 pr-3 text-sm font-bold text-slate-800 outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                    {added > 0 && <p className="mt-2 text-right text-[11px] font-semibold text-emerald-700">New total: {newTotalMatch}</p>}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                            <label htmlFor="manual-stock-add" className="text-sm font-bold text-slate-700">Quantity to add</label>
                                            {parseInt(manualTotalStockAdd) > 0 && (
                                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                                    New total: {getCurrentStockValue(selectedProduct) + (parseInt(manualTotalStockAdd) || 0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                                            <span className="px-4 text-lg font-bold text-violet-700">+</span>
                                            <input
                                                id="manual-stock-add"
                                                type="number"
                                                min="0"
                                                step="1"
                                                inputMode="numeric"
                                                value={manualTotalStockAdd}
                                                onChange={(e) => setManualTotalStockAdd(e.target.value.replace(/[^0-9]/g, ""))}
                                                placeholder="0"
                                                className="w-full border-0 py-3 pr-4 text-lg font-bold text-slate-800 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs text-slate-500">Stock changes are saved to this product’s inventory.</p>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-900 to-fuchsia-800 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-900/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                    >
                                        {isSaving ? (
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                                        ) : (
                                            <FiSave size={17} />
                                        )}
                                        {isSaving ? "Saving stock..." : "Save stock"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                            <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-violet-50 text-violet-700">
                                <FiBox size={30} />
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800">Select a product</h3>
                            <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">Choose a product from the list to see its current stock and add quantities.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AddStock;
