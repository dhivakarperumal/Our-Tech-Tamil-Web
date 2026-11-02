import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { toast } from "react-hot-toast";
import { QRCodeCanvas } from "qrcode.react";
import {
    FiArrowLeft,
    FiEdit,
    FiTrash2,
} from "react-icons/fi";
import { BsQrCode } from "react-icons/bs";

const resolveMediaUrl = (media) => {
    if (!media || typeof media !== "string") return "";
    if (media.startsWith("http") || media.startsWith("data:") || media.startsWith("blob:")) return media;
    return `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${media.startsWith("/") ? media : `/${media}`}`;
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeVariant, setActiveVariant] = useState(0);
    const [activeImage, setActiveImage] = useState(0);

    const fetchProduct = async () => {
        try {
            const response = await api.get(`/products/${id}`);
            setProduct(response.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load product.");
            navigate("/admin/products/all");
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm("Delete this product?")) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success("Creation removed.");
            navigate("/admin/products/all");
        } catch (error) {
            toast.error("Removal failed.");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-bold">Loading product details...</p>
        </div>
    );

    const currentVariant = product.variants?.[activeVariant] || {};
    const displayImages = currentVariant.images?.length > 0 ? currentVariant.images : (product.images || []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/admin/products/all" className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm">
                        <FiArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800">{product.name}</h1>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${product.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                {product.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium mt-1">SKU: {product.product_code || `PRD${product.id}`}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to={`/admin/products/edit/${id}`} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-slate-700 rounded-xl font-bold transition-all hover:bg-gray-50 shadow-sm active:scale-95">
                        <FiEdit /> Edit Product
                    </Link>
                    <button onClick={handleDelete} className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-100 active:scale-95">
                        <FiTrash2 /> Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Product Images */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group">
                        <div className="aspect-[3/4] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-gray-50">
                            {displayImages.length > 0 ? (
                                <img src={resolveMediaUrl(displayImages[activeImage] || displayImages[0])} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">No images</div>
                            )}
                        </div>
                    </div>
                    {product.video && (
                        <video src={resolveMediaUrl(product.video)} controls className="w-full rounded-2xl bg-black" />
                    )}
                    {displayImages.length > 1 && (
                        <div className="grid grid-cols-4 gap-2 sm:gap-4 px-1 sm:px-2">
                            {displayImages.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`aspect-square rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all shadow-sm ${activeImage === i ? 'border-blue-500 scale-95 ring-2 ring-blue-50' : 'border-white hover:border-blue-200 opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={resolveMediaUrl(img)} alt="thumb" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details & Stats */}
                <div className="lg:col-span-8 space-y-6 sm:space-y-8">
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 sm:pb-8 border-b border-gray-50">
                            <div className="space-y-4 max-w-xl text-slate-800">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                        {product.cat_type || "Product"} · {product.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs sm:text-sm">
                                        ★ {product.rating}                                         <span className="text-gray-300 font-medium">Customer rating</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 uppercase tracking-widest text-[10px] sm:text-xs">Description</h3>
                                <p className="text-slate-500 text-sm sm:text-base leading-relaxed font-medium">{product.description || "No description provided."}</p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center min-w-[180px] sm:min-w-[200px] shadow-inner">
                                <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Commercials</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-gray-300 font-bold line-through text-xs sm:text-sm">₹{parseFloat(product.mrp || 0).toLocaleString()}</span>
                                    <p className="text-2xl sm:text-3xl font-black text-blue-600">₹{parseFloat(product.offer_price || 0).toLocaleString()}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Inventory</p>
                                    <p className="text-lg sm:text-xl font-black text-slate-800 mt-1">{product.total_stock || 0} {product.unit || "Piece"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8">
                            {[
                                { label: "Category Type", value: product.cat_type },
                                { label: "Category", value: product.category },
                                { label: "Subcategory", value: product.subcategory },
                                { label: "SKU", value: product.product_code },
                                { label: "Slug", value: product.slug },
                                { label: "Brand", value: product.brand },
                                { label: "Model Number", value: product.model_number },
                                { label: "Connectivity", value: product.connectivity },
                                { label: "Weight", value: product.weight !== null && product.weight !== undefined ? `${product.weight} kg` : "" },
                                { label: "Dimensions", value: product.dimensions },
                                { label: "Power / Battery", value: product.power_battery },
                                { label: "Stock Status", value: product.stock_status },
                                { label: "Warranty", value: product.warranty },
                                { label: "Return Policy", value: product.return_policy },
                                { label: "Featured", value: product.featured ? "Yes" : "" },
                                { label: "Trending", value: product.trending ? "Yes" : "" },
                                { label: "New Arrival", value: product.new_arrival ? "Yes" : "" },
                                { label: "Created At", value: product.created_at ? new Date(product.created_at).toLocaleString() : "" },
                                { label: "Updated At", value: product.updated_at ? new Date(product.updated_at).toLocaleString() : "" },
                                { label: "Gender", value: product.gender },
                                { label: "Material / Fabric", value: product.material },
                                { label: "Available Sizes", value: product.available_sizes?.join(", ") },
                                { label: "Available Colors", value: product.available_colors?.join(", ") },
                                { label: "Pattern", value: product.pattern },
                                { label: "Fit Type", value: product.fit_type },
                                { label: "Sleeve Type", value: product.sleeve_type },
                                { label: "Neck Type", value: product.neck_type },
                                { label: "Care", value: product.wash_care },
                                { label: "Product Type", value: product.natural_product_type },
                                { label: "Ingredients", value: product.ingredients },
                                { label: "Net Quantity", value: product.net_quantity !== null && product.net_quantity !== undefined ? `${product.net_quantity} ${product.quantity_unit || "g"}` : "" },
                                { label: "Manufacturing Date", value: product.manufacturing_date ? String(product.manufacturing_date).slice(0, 10) : "" },
                                { label: "Expiry Date", value: product.expiry_date ? String(product.expiry_date).slice(0, 10) : "" },
                                { label: "Shelf Life", value: product.shelf_life },
                                { label: "Organic Certification", value: product.organic_certification },
                                { label: "Storage Instructions", value: product.storage_instructions },
                                { label: "Country of Origin", value: product.country_of_origin },
                            ].filter(s => s.value && s.value.toString().trim() !== "").map((spec, i) => (
                                <div key={i} className="space-y-1 p-3 sm:p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all cursor-default">
                                    <p className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">{spec.label}</p>
                                    <p className="text-xs sm:text-sm font-bold text-slate-700">{spec.value}</p>
                                </div>
                            ))}
                        </div>
                        {product.specifications?.length > 0 && (
                            <div className="mt-6 grid grid-cols-1 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-2">
                                {product.specifications.map((specification, index) => (
                                    <div key={`${specification.key}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{specification.key}</p>
                                        <p className="mt-1 text-sm font-bold text-slate-700">{specification.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {product.size_chart && (
                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-700">Clothing Size Chart</h3>
                                <a href={resolveMediaUrl(product.size_chart)} target="_blank" rel="noreferrer" className="inline-block max-w-full overflow-hidden rounded-xl border border-gray-200">
                                    <img src={resolveMediaUrl(product.size_chart)} alt={`${product.name} size chart`} className="max-h-96 max-w-full object-contain" />
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Variants Management */}
                        {product.variants?.length > 0 && (
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Available Shades</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {product.variants.map((v, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => { setActiveVariant(idx); setActiveImage(0); }}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${activeVariant === idx ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-50/50' : 'bg-gray-50 border-gray-100 hover:border-blue-100'}`}
                                        >
                                            <div className="flex items-center gap-4 text-slate-800">
                                                <div className="w-10 h-10 rounded-xl shadow-inner border-2 border-white" style={{ backgroundColor: v.color }}></div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-700 uppercase tracking-tight">{v.colorName || "Color"}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        {v.selectedSizes?.join(", ") || "No Sizes"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-blue-600">
                                                    {v.quantity !== undefined
                                                        ? Number(v.quantity) || 0
                                                        : Object.values(v.sizesStock || {}).reduce((a, b) => a + (parseInt(b) || 0), 0)} {product.unit || "Piece"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Product Passport (QR Code) */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Product Passport</h3>
                                <BsQrCode className="text-blue-500" size={18} />
                            </div>
                            <div className="flex flex-col items-center justify-center gap-4 bg-gray-50/50 p-6 rounded-[2rem] border border-dashed border-gray-200">
                                <div className="p-4 bg-white rounded-3xl shadow-sm border border-gray-100">
                                    <QRCodeCanvas
                                        value={window.location.href}
                                        size={120}
                                        level={"H"}
                                        includeMargin={false}
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Digital Authenticity</p>
                                    <p className="text-[9px] font-bold text-blue-500 uppercase mt-1 tracking-tighter">Scan to view product details</p>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
