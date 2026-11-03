import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from "react";
import { createPortal } from "react-dom";
import api from "../../api";
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiX,
    FiImage,
    FiUploadCloud,
    FiSearch,
    FiGrid,
    FiList,
    FiChevronLeft,
    FiChevronRight,
    FiCheckCircle,
    FiAlertCircle,
    FiBox,
    FiLayers,
    FiFilter,
    FiDownload,
    FiChevronDown
} from "react-icons/fi";
import imageCompression from "browser-image-compression";
import { toast, Toaster } from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";

const CATEGORY_TYPES = [
    "Gadgets & Electronics",
    "Natural Products",
    "Clothing & Fashion",
];

const CategoryTypeDropdown = ({ value, onChange, invalid }) => {
    const dropdownId = useId();
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [position, setPosition] = useState(null);
    const selectedIndex = CATEGORY_TYPES.indexOf(value);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom - 8;
        const spaceAbove = rect.top - 8;
        const openBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;
        const maxHeight = Math.max(100, Math.min(220, openBelow ? spaceBelow : spaceAbove));
        setPosition({
            left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
            top: openBelow ? rect.bottom + 6 : Math.max(8, rect.top - maxHeight - 6),
            width: rect.width,
            maxHeight,
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return undefined;
        updatePosition();
        const closeOnOutsideClick = (event) => {
            if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("pointerdown", closeOnOutsideClick);
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition, true);
        return () => {
            document.removeEventListener("pointerdown", closeOnOutsideClick);
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition, true);
        };
    }, [isOpen, updatePosition]);

    const open = () => {
        setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
        setIsOpen(true);
    };

    const select = (categoryType) => {
        onChange(categoryType);
        setIsOpen(false);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!isOpen) {
                open();
                return;
            }
            const direction = event.key === "ArrowDown" ? 1 : -1;
            setActiveIndex(index => (index + direction + CATEGORY_TYPES.length) % CATEGORY_TYPES.length);
        } else if (event.key === "Home" && isOpen) {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === "End" && isOpen) {
            event.preventDefault();
            setActiveIndex(CATEGORY_TYPES.length - 1);
        } else if ((event.key === "Enter" || event.key === " ") && isOpen) {
            event.preventDefault();
            select(CATEGORY_TYPES[activeIndex]);
        } else if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen(false);
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                id="category-type"
                type="button"
                role="combobox"
                aria-label="Category Type"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${dropdownId}-listbox`}
                aria-activedescendant={isOpen ? `${dropdownId}-option-${activeIndex}` : undefined}
                aria-invalid={invalid || undefined}
                data-validation-field="categoryType"
                onClick={() => isOpen ? setIsOpen(false) : open()}
                onKeyDown={handleKeyDown}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl border bg-white px-4 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm transition-all focus:outline-none focus:ring-4 ${invalid ? "border-red-400 bg-red-50/40 focus:ring-red-100" : "border-gray-200 focus:border-purple-500 focus:ring-purple-100"} hover:border-purple-300`}
            >
                <span className={value ? "" : "text-slate-400"}>{value || "Select category type"}</span>
                <FiChevronDown className={`shrink-0 text-gray-400 transition-transform group-hover:text-purple-700 ${isOpen ? "rotate-180 text-purple-700" : ""}`} />
            </button>
            {isOpen && position && createPortal(
                <div
                    ref={menuRef}
                    id={`${dropdownId}-listbox`}
                    role="listbox"
                    aria-label="Category Type"
                    className="fixed z-[10000] overflow-y-auto rounded-xl border border-violet-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(31,10,60,0.18)]"
                    style={position}
                >
                    {CATEGORY_TYPES.map((categoryType, index) => {
                        const selected = categoryType === value;
                        const active = index === activeIndex;
                        return (
                            <button
                                key={categoryType}
                                id={`${dropdownId}-option-${index}`}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => select(categoryType)}
                                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${selected ? "bg-violet-50 font-bold text-violet-700" : "font-medium text-gray-700"} ${active ? "bg-violet-100 text-slate-900" : "hover:bg-violet-50"}`}
                            >
                                {categoryType}
                                {selected && <FiCheckCircle className="h-4 w-4 shrink-0 text-violet-700" />}
                            </button>
                        );
                    })}
                </div>,
                document.body
            )}
        </>
    );
};

const resolveCategoryImageUrl = (image) => {
    if (!image || typeof image !== "string") return "";
    if (/^(https?:|data:|blob:)/i.test(image)) return image;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const cleanPath = image.replace(/\\/g, "/");
    return `${backendUrl}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const Category = () => {
    const { user } = useAuth();
    // ---- Global State ----
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get("/categories");
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    };

    // ---- View & Pagination State ----
    const [viewMode, setViewMode] = useState("table"); 
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // ---- Modal State ----
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [formData, setFormData] = useState({
        catId: "",
        name: "",
        categoryType: "",
        description: "",
        subcategory: "",
        images: []
    });

    const [subcategories, setSubcategories] = useState([]);
    const [subInput, setSubInput] = useState("");
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (!isModalOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isSavingCategory && !isImageUploading) setIsModalOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isModalOpen, isSavingCategory, isImageUploading]);

    // ---- Derived Data (Search & Pagination) ----
    const filteredCategories = useMemo(() => {
        return categories.filter(cat => {
            const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  cat.catId.toLowerCase().includes(searchQuery.toLowerCase());
            const catStatus = cat.status || 'Active';
            const matchesStatus = statusFilter === 'All' || catStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [categories, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
    const currentCategories = filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Stats calculations
    const activeCount = categories.filter(c => (c.status || 'Active') === 'Active').length;
    const inactiveCount = categories.filter(c => c.status === 'Inactive').length;

    // ---- Event Handlers ----
    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const addSubcategory = () => {
        const subcategory = subInput.trim();
        if (subcategory) {
            setSubcategories(current =>
                current.includes(subcategory) ? current : [...current, subcategory]
            );
            setValidationErrors(current => {
                if (!current.subcategories) return current;
                const next = { ...current };
                delete next.subcategories;
                return next;
            });
            setSubInput("");
        }
    };

    const handleAddSubcategory = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSubcategory();
        }
    };

    const removeSubcategory = (subToRemove) => {
        const remaining = subcategories.filter(sub => sub !== subToRemove);
        setSubcategories(remaining);
        if (!remaining.length) {
            setValidationErrors(current => ({ ...current, subcategories: "Add at least one subcategory." }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(current => ({ ...current, [name]: value }));
        if (name === "name" && value.trim()) {
            setValidationErrors(current => {
                if (!current.name) return current;
                const next = { ...current };
                delete next.name;
                return next;
            });
        }
    };

    const handleCategoryTypeChange = (categoryType) => {
        setFormData(current => ({ ...current, categoryType }));
        setValidationErrors(current => {
            if (!current.categoryType) return current;
            const next = { ...current };
            delete next.categoryType;
            return next;
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Choose an image file for the category.");
            return;
        }

        setIsImageUploading(true);
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.2,
                maxWidthOrHeight: 600,
            });
            const uploadData = new FormData();
            uploadData.append("image", compressed);
            const response = await api.post("/categories/upload", uploadData);
            if (!response.data?.image) {
                throw new Error("The category image URL was not returned by the server.");
            }
            setFormData(p => ({ ...p, images: [response.data.image] }));
            setValidationErrors(current => {
                if (!current.image) return current;
                const next = { ...current };
                delete next.image;
                return next;
            });
            toast.success("Category image updated!");
        } catch (error) {
            console.error("Image upload failed:", error);
            toast.error(error.response?.data?.message || error.message || "Image upload failed.");
        } finally {
            setIsImageUploading(false);
        }
    };

    const removeImage = () => {
        setFormData(p => ({ ...p, images: [] }));
        setValidationErrors(current => ({ ...current, image: "Category image is required." }));
    };

    const handleSaveCategory = async () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Category name is required.";
        if (!formData.categoryType) errors.categoryType = "Select a category type.";
        if (!subcategories.some(subcategory => typeof subcategory === "string" && subcategory.trim())) {
            errors.subcategories = "Add at least one subcategory.";
        }
        if (!formData.images?.length || !formData.images[0]) errors.image = "Upload a category image.";
        if (!formData.catId) {
            toast.error("Category ID is unavailable. Close and reopen the form.");
            return;
        }
        if (isImageUploading || isSavingCategory) return;
        if (Object.keys(errors).length) {
            setValidationErrors(errors);
            const firstInvalidField = Object.keys(errors)[0];
            requestAnimationFrame(() => {
                const invalidElement = document.querySelector(`[data-validation-field="${firstInvalidField}"]`);
                invalidElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                invalidElement?.focus({ preventScroll: true });
            });
            toast.error("Please complete all required category fields.");
            return;
        }
        setValidationErrors({});

        const newCatData = {
            ...formData,
            subcategory: subcategories,
            user_id: user?.user_id || formData.user_id || null,
        };

        setIsSavingCategory(true);
        try {
            if (isEditing) {
                await api.put(`/categories/${formData.catId}`, newCatData);
                setCategories(categories.map(cat =>
                    cat.catId === formData.catId ? { ...newCatData, id: cat.id } : cat
                ));
            } else {
                const response = await api.post("/categories", newCatData);
                setCategories([{ ...newCatData, id: response.data.id }, ...categories]);
                toast.success("Category created successfully!");
            }
            setIsModalOpen(false);
            resetModalForm();
        } catch (error) {
            console.error("Failed to save category:", error);
            toast.error(error.response?.data?.message || "Failed to save category.");
        } finally {
            setIsSavingCategory(false);
        }
    };

    const handleDeleteCategory = async (catIdToDelete) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await api.delete(`/categories/${catIdToDelete}`);
                setCategories(categories.filter(cat => cat.catId !== catIdToDelete));

                if (currentCategories.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }
            } catch (error) {
                console.error("Failed to delete category:", error);
                alert("Failed to delete category.");
            }
        }
    };

    const resetModalForm = () => {
        setFormData({ catId: "", name: "", categoryType: "", description: "", subcategory: "", images: [] });
        setSubcategories([]);
        setSubInput("");
        setValidationErrors({});
        setIsEditing(false);
    };

    const openAddModal = () => {
        let nextId = "CAT001";
        if (categories.length > 0) {
            const existingIds = categories.map(c => {
                const match = c.catId.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            });
            const maxId = Math.max(...existingIds);
            nextId = `CAT${String(maxId + 1).padStart(3, '0')}`;
        }
        resetModalForm();
        setFormData(prev => ({ ...prev, catId: nextId }));
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setFormData({
            catId: category.catId,
            name: category.name,
            categoryType: category.categoryType || "",
            description: category.description,
            subcategory: "",
            images: Array.isArray(category.images)
                ? category.images.slice(0, 1)
                : (category.images ? [category.images] : [])
        });
        setSubcategories(category.subcategory || []);
        setSubInput("");
        setValidationErrors({});
        setIsEditing(true);
        setIsModalOpen(true);
    };

    // Helper for dummy date formatting if missing
    const formatDate = (dateString) => {
        if (!dateString) {
            return {
                date: "20 May 2024",
                time: "10:30 AM"
            };
        }
        const d = new Date(dateString);
        return {
            date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // ---- Renderers ----
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen pb-20 font-sans">
            <Toaster position="top-right" />

           

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[20px] bg-[#8B5CF6] flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                        <FiBox className="text-white text-2xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Total Categories</p>
                        <h3 className="text-3xl font-black text-slate-800 leading-none mb-1">{categories.length}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">All category collections</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[20px] bg-[#10B981] flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                        <FiCheckCircle className="text-white text-2xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Active</p>
                        <h3 className="text-3xl font-black text-slate-800 leading-none mb-1">{activeCount}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Active collections</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[20px] bg-[#F59E0B] flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                        <FiAlertCircle className="text-white text-2xl" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1">Inactive</p>
                        <h3 className="text-3xl font-black text-slate-800 leading-none mb-1">{inactiveCount}</h3>
                        <p className="text-[11px] text-gray-400 font-medium">Inactive collections</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search categories by name, ID..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-700 outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100 transition-all font-medium placeholder:text-gray-400"
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            className="appearance-none bg-white border border-gray-200 text-sm font-bold text-gray-600 pl-4 pr-10 py-2.5 rounded-xl outline-none focus:border-purple-300 cursor-pointer"
                        >
                            <option value="All">Select Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                   
                    <div className="flex items-center gap-3">
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'admin-button-toggle-active' : 'admin-button-toggle-inactive'}`}>
                            <FiList size={18} />
                        </button>
                        <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'admin-button-toggle-active' : 'admin-button-toggle-inactive'}`}>
                            <FiGrid size={18} />
                        </button>
                    </div>
                    <button onClick={openAddModal} className="admin-button-primary flex items-center gap-2 py-3 px-5 rounded-md text-sm font-bold shadow-md active:scale-95">
                        <FiPlus size={18} /> Add New Category
                    </button>
                </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-bold">Loading Categories...</p>
                </div>
            ) : currentCategories.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                        <FiSearch size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No categories found</h3>
                    <p className="text-gray-400 text-sm mt-1">Adjust your search or filter to find what you're looking for.</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="admin-table-header border-b border-[#3c096c]">
                                    <th className="px-4 py-4 text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider w-10">S.NO.</th>
                                    <th className="px-4 py-4 text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider w-10">CATEGORY</th>
                                    <th className="px-4 py-4 text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider">SUBCATEGORIES</th>
                                    <th className="px-4 py-4 text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider w-10">STATUS</th>
                                    <th className="px-4 py-4 text-[10px] font-bold text-[#FCD34D] uppercase tracking-wider w-10">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {currentCategories.map((cat, ind) => {
                                    const sNo = (currentPage - 1) * itemsPerPage + ind + 1;
                                    const status = cat.status || (ind % 4 === 3 ? 'Inactive' : 'Active');
                                    return (
                                        <tr key={cat.catId} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-4 py-4 text-sm font-bold text-gray-500">{sNo}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                        {cat.images && cat.images.length > 0 ? (
                                                            <img src={resolveCategoryImageUrl(Array.isArray(cat.images) ? cat.images[0] : cat.images)} alt={cat.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><FiImage className="text-gray-400" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800 mb-0.5">{cat.name}</h4>
                                                        {cat.categoryType && <span className="inline-block mb-1 px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold">{cat.categoryType}</span>}
                                                        <p className="text-[11px] text-gray-400 font-medium">ID: {cat.catId || "N/A"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex max-w-md flex-wrap gap-1.5">
                                                    {Array.isArray(cat.subcategory) && cat.subcategory.length > 0 ? (
                                                        cat.subcategory.map((subcategory) => (
                                                            <span key={subcategory} className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                                                {subcategory}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm font-medium text-gray-400">No subcategories</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {status === 'Active' ? (
                                                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-3 py-1 bg-orange-50 text-orange-600 text-[11px] font-bold rounded-lg">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openEditModal(cat)} className="admin-button-icon w-8 h-8 flex items-center justify-center rounded-full border transition-colors" title="Edit">
                                                        <FiEdit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteCategory(cat.catId)} className="admin-button-danger w-8 h-8 flex items-center justify-center rounded-full border transition-colors" title="Delete">
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                    {currentCategories.map((cat, ind) => {
                        const status = cat.status || (ind % 4 === 3 ? 'Inactive' : 'Active');
                        const totalProds = cat.totalProducts || Math.floor(Math.random() * 20 + 2);

                        return (
                            <div key={cat.catId} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0">
                                        {cat.images && cat.images.length > 0 ? (
                                            <img src={resolveCategoryImageUrl(Array.isArray(cat.images) ? cat.images[0] : cat.images)} alt={cat.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <FiImage className="text-gray-400 text-xl" />
                                        )}
                                    </div>
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded">
                                        {cat.catId || "N/A"}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-slate-800 mb-1">{cat.name}</h3>
                                    {cat.categoryType && <span className="inline-block mb-2 px-2 py-0.5 rounded bg-violet-50 text-violet-700 text-[10px] font-bold">{cat.categoryType}</span>}
                                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                                        {cat.description || "No description provided."}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-medium">Products</p>
                                            <p className="text-sm font-bold text-gray-800">{totalProds}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-medium">Status</p>
                                            {status === 'Active' ? (
                                                <span className="inline-block px-2 py-0.5 mt-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded">Active</span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 mt-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">Inactive</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 shrink-0">
                                    <button onClick={() => openEditModal(cat)} className="admin-button-icon flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg border transition-colors text-xs font-bold">
                                        <FiEdit2 size={12} /> Edit
                                    </button>
                                    <button onClick={() => handleDeleteCategory(cat.catId)} className="admin-button-danger flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg border transition-colors text-xs font-bold">
                                        <FiTrash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination / Footer */}
            {!loading && totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-bold text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCategories.length)} of {filteredCategories.length} categories
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="admin-button-pagination w-9 h-9 flex items-center justify-center rounded-xl transition-colors shadow-sm"
                        >
                            <FiChevronLeft size={16} />
                        </button>
                        <button className="admin-button-pagination admin-button-pagination-active w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold shadow-sm">
                            {currentPage}
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="admin-button-pagination w-9 h-9 flex items-center justify-center rounded-xl transition-colors shadow-sm"
                        >
                            <FiChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Add/Edit Category Modal */}
            {isModalOpen && createPortal(
                <div
                    className="fixed inset-0 flex items-start justify-center overflow-y-auto overscroll-contain bg-slate-950/65 p-3 backdrop-blur-sm sm:items-center sm:p-5"
                    style={{ zIndex: 9999 }}
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isSavingCategory && !isImageUploading) setIsModalOpen(false);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="category-modal-title"
                        className="my-0 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/30 animate-in zoom-in-95 duration-200 sm:my-auto sm:max-h-[calc(100dvh-2.5rem)]"
                    >
                        <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 px-5 py-4 sm:px-7">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm shadow-violet-900/10">
                                    <FiLayers size={21} />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Category management</p>
                                    <h2 id="category-modal-title" className="mt-0.5 text-lg font-bold text-slate-900">
                                        {isEditing ? "Edit category" : "Add new category"}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {isEditing ? `Editing ${formData.catId}` : "Organize products with a name, type, and image."}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                type="button"
                                disabled={isSavingCategory || isImageUploading}
                                aria-label="Close category dialog"
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-50"
                            >
                                <FiX size={20} />
                            </button>
                        </header>

                        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-7">
                            {Object.keys(validationErrors).length > 0 && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3" role="alert" aria-live="polite">
                                    <p className="text-sm font-bold text-red-800">Please complete the required category fields:</p>
                                    <ul className="mt-1 list-inside list-disc text-xs text-red-700">
                                        {Object.values(validationErrors).map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}
                                    </ul>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Category ID (Auto)</label>
                                        <input
                                            type="text"
                                            name="catId"
                                            value={formData.catId}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-200 text-gray-500 font-bold rounded-xl px-4 py-2.5 cursor-not-allowed focus:outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="category-name" className="mb-1.5 block text-xs font-bold text-gray-700">Category Name *</label>
                                        <input
                                            type="text"
                                            id="category-name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            data-validation-field="name"
                                            aria-invalid={Boolean(validationErrors.name)}
                                            aria-required="true"
                                            placeholder="e.g. Wireless Earbuds"
                                            className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-slate-800 transition-all focus:outline-none focus:ring-2 ${validationErrors.name ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-100" : "border-gray-200 bg-white focus:border-purple-500 focus:ring-purple-500/20"}`}
                                        />
                                        {validationErrors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{validationErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="category-type" className="mb-1.5 block text-xs font-bold text-gray-700">Category Type *</label>
                                        <CategoryTypeDropdown
                                            value={formData.categoryType}
                                            onChange={handleCategoryTypeChange}
                                            invalid={Boolean(validationErrors.categoryType)}
                                        />
                                        {validationErrors.categoryType && <p className="mt-1.5 text-xs font-medium text-red-600">{validationErrors.categoryType}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Brief description..."
                                            rows="4"
                                            className="w-full bg-white border border-gray-200 text-slate-800 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none font-medium text-sm"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Right Column: Advanced */}
                                <div className="space-y-4">
                                    {/* Multiple Subcategories Input */}
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1.5">
                                            <span>Subcategories *</span>
                                            <span className="text-[10px] text-gray-400 font-medium">Press Enter or + to add</span>
                                        </label>
                                        <div data-validation-field="subcategories" tabIndex={-1} aria-invalid={Boolean(validationErrors.subcategories)} className={`rounded-xl border bg-white p-2 min-h-[100px] transition-all focus-within:ring-2 ${validationErrors.subcategories ? "border-red-400 ring-2 ring-red-100" : "border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-500/20"}`}>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {subcategories.map((sub, idx) => (
                                                    <span key={idx} className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-2 py-1 rounded-lg text-xs font-bold">
                                                        {sub}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSubcategory(sub)}
                                                            aria-label={`Remove ${sub} subcategory`}
                                                            className="admin-button-danger rounded transition-colors"
                                                        >
                                                            <FiX size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={subInput}
                                                    onChange={(e) => setSubInput(e.target.value)}
                                                    onKeyDown={handleAddSubcategory}
                                                    placeholder={subcategories.length === 0 ? "Type and press Enter..." : "Add another..."}
                                                    className="min-w-0 flex-1 bg-transparent border-none outline-none text-slate-800 px-1 py-1 text-sm font-medium placeholder:text-gray-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={addSubcategory}
                                                    disabled={!subInput.trim()}
                                                    aria-label="Add subcategory"
                                                    className="admin-button-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:cursor-not-allowed"
                                                >
                                                    <FiPlus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {validationErrors.subcategories && <p className="mt-1.5 text-xs font-medium text-red-600">{validationErrors.subcategories}</p>}
                                    </div>

                                    {/* Image Dropzone */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Category Image *</label>
                                        {formData.images && formData.images.length > 0 ? (
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={resolveCategoryImageUrl(formData.images[0])}
                                                    alt="Category"
                                                    className="h-20 w-20 rounded-xl border border-gray-200 object-cover"
                                                />
                                                <label className="admin-button-secondary cursor-pointer rounded-lg px-3 py-2 text-xs font-bold">
                                                    Change Image
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    aria-label="Remove category image"
                                                    className="admin-button-danger rounded-lg p-2"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label data-validation-field="image" tabIndex={-1} className={`relative flex min-h-[130px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-6 text-center transition-all hover:bg-purple-50/50 hover:border-purple-400 ${validationErrors.image ? "border-red-300 bg-red-50/40" : "border-gray-300 bg-gray-50"}`}>
                                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                <div className="w-8 h-8 bg-white shadow-sm rounded-full flex items-center justify-center mb-2 text-purple-500">
                                                    <FiUploadCloud size={16} />
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">Upload Image</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">PNG, JPG up to 5MB</p>
                                            </label>
                                        )}
                                        {validationErrors.image && <p className="mt-1.5 text-xs font-medium text-red-600">{validationErrors.image}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <footer className="z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                            <p className="text-xs text-slate-500">Category ID is generated automatically.</p>
                            <div className="flex flex-col-reverse gap-2 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSavingCategory || isImageUploading}
                                className="admin-button-secondary rounded-xl px-5 py-3 text-sm font-semibold transition-all disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCategory}
                                disabled={isImageUploading || isSavingCategory}
                                className="admin-button-primary px-6 py-2.5 text-sm font-bold rounded-xl shadow-md active:scale-95 flex items-center gap-2"
                            >
                                {isImageUploading ? 'Uploading image...' : isEditing ? 'Update Category' : 'Save Category'}
                            </button>
                            </div>
                        </footer>
                    </section>
                </div>
            , document.body)}
        </div>
    );
};

export default Category;
