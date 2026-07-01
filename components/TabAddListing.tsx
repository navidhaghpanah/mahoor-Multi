"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Home, Building2, TreePine, Store, Send, CheckCircle2,
  MapPin, ImagePlus, X, Loader2, Map, Info,
} from "lucide-react";
import { addListing, uploadImage, geocodeAddress } from "../lib/listings";
import { toPersianDigits } from "../lib/format";
import { MapModal } from "./MapModal";

const DEAL_TYPES = ["فروش", "اجاره", "رهن کامل", "رهن و اجاره", "پیش‌فروش", "اجاره شبانه"];
const PROP_TYPES = [
  { label: "آپارتمان", Icon: Building2 },
  { label: "ویلا", Icon: Home },
  { label: "زمین", Icon: TreePine },
  { label: "تجاری", Icon: Store },
];
const CHANNELS = [
  { id: "whatsapp", label: "واتساپ", color: "#25D366" },
  { id: "divar", label: "دیوار", color: "#d42b2b" },
  { id: "sheypoor", label: "شیپور", color: "#f97316" },
  { id: "telegram", label: "تلگرام", color: "#229ED9" },
];

export function TabAddListing({ user }: { user?: any }) {
  const [deal, setDeal] = useState("فروش");
  const [propType, setPropType] = useState("آپارتمان");
  const [title, setTitle] = useState("");
  const [size, setSize] = useState("");
  const [rawPrice, setRawPrice] = useState(""); // ASCII digits for submission
  const [beds, setBeds] = useState("");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [desc, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | undefined>();
  const [lng, setLng] = useState<number | undefined>();
  const [buildingArea, setBuildingArea] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["whatsapp"]);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 8;

  // Live price formatting: display with Persian digits + separators; submit raw ASCII.
  const priceDisplay = rawPrice
    ? toPersianDigits(rawPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ','))
    : '';
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 0x0030))
      .replace(/[^0-9]/g, '');
    setRawPrice(v);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const room = MAX_IMAGES - imageFiles.length;
    const accepted = files.slice(0, room).filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`حجم تصویر «${f.name}» بیشتر از ۵ مگابایت است و نادیده گرفته شد`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;
    setImageFiles((prev) => [...prev, ...accepted]);
    setImagePreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeImageAt = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleGeocode = async () => {
    if (!location) return;
    setGeocoding(true);
    const coords = await geocodeAddress(location);
    setGeocoding(false);
    if (coords) {
      setLat(coords.lat);
      setLng(coords.lng);
      setMapOpen(true);
    } else {
      alert("موقعیت پیدا نشد. نقشه روی محمودآباد نشان داده می‌شود.");
      setMapOpen(true);
    }
  };

  const toggleChannel = (id: string) =>
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const reset = () => {
    setTitle(""); setSize(""); setRawPrice(""); setBeds(""); setBuildingArea("");
    setDesc(""); setLocation(""); setLat(undefined); setLng(undefined);
    setImageFiles([]); setImagePreviews([]); setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !phone) return;
    setLoading(true);

    try {
      // Convert all selected images to Base64 data URLs (no Firebase Storage).
      const images: string[] = [];
      for (const file of imageFiles) {
        try {
          images.push(await uploadImage(file, "", setUploadProgress));
        } catch {
          console.warn("Image conversion failed for one file, skipping");
        }
      }

      await addListing({
        title,
        deal,
        propType,
        price: rawPrice, size: parseInt(size) || 0,
        buildingArea: parseInt(buildingArea) || 0,
        beds: parseInt(beds) || 0, phone, location,
        lat, lng, desc, images,
        advisorName: user?.fullName ?? "کارشناس ماهور",
        advisorPhone: phone,
        status: "pending",
      });

      const msg =
        `🏠 *آگهی جدید - املاک ماهور*\n\n` +
        `📋 عنوان: ${title}\n🔑 نوع: ${deal} / ${propType}\n` +
        (size ? `📐 متراژ: ${size} متر\n` : "") +
        (beds ? `🛏 خواب: ${beds}\n` : "") +
        (priceDisplay ? `💰 قیمت: ${priceDisplay}\n` : "") +
        (location ? `📍 موقعیت: ${location}\n` : "") +
        `📞 تماس: ${phone}\n` +
        (desc ? `📝 توضیحات: ${desc}` : "");

      if (selectedChannels.includes("whatsapp")) {
        window.open("https://wa.me/989111134767?text=" + encodeURIComponent(msg), "_blank");
      }
      if (selectedChannels.includes("telegram")) {
        window.open("https://t.me/mahoorrlste?text=" + encodeURIComponent(msg), "_blank");
      }

      setSuccess(true);
      reset();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert("خطا در ثبت آگهی. لطفاً دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pb-10">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">ثبت آگهی ملکی</h1>
        <p className="text-[#a0b0c0] text-sm">
          {user?.isInsider
            ? "آگهی خود را ثبت کرده و به درگاه‌ها ارسال کنید"
            : "آگهی ملکی خود را ثبت کنید — پس از بررسی توسط مدیریت منتشر می‌شود"}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">آگهی ثبت شد!</h2>
            <p className="text-[#a0b0c0] text-center text-sm">
              {user?.isInsider
                ? "آگهی شما منتشر شد و در فهرست آگهی‌ها نمایش داده می‌شود."
                : "آگهی شما دریافت شد و پس از تأیید مدیر منتشر خواهد شد."}
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >
            {/* Deal Type */}
            <Card label="نوع معامله">
              <div className="flex flex-wrap gap-2">
                {DEAL_TYPES.map((d) => (
                  <button key={d} type="button" onClick={() => setDeal(d)}
                    className={pill(deal === d)}>{d}</button>
                ))}
              </div>
            </Card>

            {/* Property Type */}
            <Card label="نوع ملک">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PROP_TYPES.map(({ label, Icon }) => (
                  <button key={label} type="button" onClick={() => setPropType(label)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      propType === label
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                        : "bg-[#1E293B]/50 border-[#1E293B] text-gray-400 hover:border-gray-500"
                    }`}>
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Image Upload — multiple photos (gallery) */}
            <Card label={`تصاویر ملک${imagePreviews.length ? ` (${imagePreviews.length}/${MAX_IMAGES})` : ""}`}>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden h-24">
                      <img src={src} alt={`تصویر ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageAt(i)}
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 right-1 bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                          اصلی
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {imagePreviews.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-[#1E293B] hover:border-[#D4AF37]/50 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-[#D4AF37] transition-all"
                >
                  <ImagePlus className="w-7 h-7" />
                  <span className="text-sm">
                    {imagePreviews.length ? "افزودن تصویر دیگر" : "انتخاب تصاویر (تا ۵ مگابایت هر کدام)"}
                  </span>
                </button>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="h-1.5 bg-black/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </Card>

            {/* Details */}
            <Card label="اطلاعات ملک">
              <Field label="عنوان آگهی *" value={title} onChange={setTitle}
                placeholder="مثال: آپارتمان ۱۲۰ متری نوساز، ۳ خواب" required />

              <div className="grid grid-cols-2 gap-4">
                <Field label="متراژ (متر)" value={size} onChange={setSize} placeholder="۱۲۰" type="number" />
                <Field label="متراژ بنا (متر)" value={buildingArea} onChange={setBuildingArea} placeholder="۹۰" type="number" />
              </div>

              <Field label="اتاق خواب" value={beds} onChange={setBeds} placeholder="۳" type="number" />

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">قیمت / اجاره (تومان)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  placeholder="۲,۵۰۰,۰۰۰,۰۰۰"
                  className={inputCls}
                />
              </div>

              {/* Location + Map */}
              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">موقعیت ملک</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="محمودآباد، خیابان امام..."
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={handleGeocode}
                    disabled={geocoding || !location}
                    title="نمایش روی نقشه"
                    className="flex-shrink-0 w-11 h-11 bg-[#1E293B] hover:bg-[#D4AF37]/10 border border-[#1E293B] hover:border-[#D4AF37]/40 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#D4AF37] transition-all disabled:opacity-40"
                  >
                    {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
                  </button>
                </div>
                {lat && lng && (
                  <button
                    type="button"
                    onClick={() => setMapOpen(true)}
                    className="mt-2 flex items-center gap-1.5 text-xs text-[#D4AF37] hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    موقعیت روی نقشه ثبت شد — کلیک برای مشاهده
                  </button>
                )}
              </div>

              <Field label="شماره تماس *" value={phone} onChange={setPhone}
                placeholder="۰۹۱۱..." type="tel" dir="ltr" required />

              <div>
                <label className="block text-sm text-gray-300 font-medium mb-2">توضیحات</label>
                <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="ویژگی‌ها، امکانات، شرایط معامله..."
                  className={inputCls + " resize-none"} />
              </div>
            </Card>

            {/* Channels */}
            <Card label="ارسال به درگاه‌ها">
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => toggleChannel(ch.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedChannels.includes(ch.id)
                        ? "border-opacity-60 bg-opacity-10"
                        : "bg-[#1E293B]/50 border-[#1E293B] hover:border-gray-600"
                    }`}
                    style={selectedChannels.includes(ch.id) ? {
                      borderColor: ch.color + "66",
                      backgroundColor: ch.color + "11",
                    } : {}}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ backgroundColor: ch.color + "22", color: ch.color }}>
                      {ch.label[0]}
                    </div>
                    <span className={`text-sm font-medium ${selectedChannels.includes(ch.id) ? "text-white" : "text-gray-400"}`}>
                      {ch.label}
                    </span>
                    {selectedChannels.includes(ch.id) && (
                      <CheckCircle2 className="w-4 h-4 mr-auto" style={{ color: ch.color }} />
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title || !phone}
              className="w-full bg-[#D4AF37] hover:bg-[#B8962E] disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] text-base"
            >
              {loading
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <><Send className="w-5 h-5" /> ثبت و ارسال آگهی</>
              }
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <MapModal
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        location={location || "محمودآباد"}
        lat={lat}
        lng={lng}
        title={title || undefined}
      />
    </div>
  );
}

/* ── helpers ── */
const inputCls =
  "w-full bg-[#030D1E] border border-[#1E293B] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder:text-gray-600";

const pill = (active: boolean) =>
  `px-4 py-2 rounded-full text-sm font-medium transition-all ${
    active ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]" : "bg-[#1E293B] text-gray-300 hover:bg-[#1E293B]/80"
  }`;

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0C2C54]/40 border border-[#1E293B] rounded-2xl p-5 flex flex-col gap-4">
      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", dir, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; dir?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-300 font-medium mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={dir}
        className={inputCls}
      />
    </div>
  );
}
