"use client";

import {
  Check,
  Clipboard,
  Download,
  Edit2,
  FileUp,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { formatNumber, formatRupiah, sortText, toNumber } from "@/lib/format";
import {
  DEFAULT_OFFER_MULTIPLIER,
  createEstimationDraft,
  loadEstimationDrafts,
  loadMaster,
  loadOfferMultiplier,
  normalizePriceRows,
  saveEstimationDrafts,
  saveMaster,
  saveOfferMultiplier,
} from "@/lib/storage";
import {
  CalculatorInput,
  CuttingPrice,
  CUSTOMER_PRICE_MODES,
  CustomerPriceMode,
  DENSITY_OPTIONS,
  Density,
  ESTIMATION_DRAFT_STATUSES,
  EstimationDraft,
  EstimationDraftStatus,
  EstimationItem,
} from "@/lib/types";

const emptyCalculator: CalculatorInput = {
  material: "",
  density: "",
  thickness: "",
  lengthCm: "",
  widthCm: "",
  qty: "1",
};

const emptyForm = {
  material: "",
  materialCode: "",
  density: "Low" as Density,
  densityCode: "LO",
  thickness: "",
  itemCode: "",
  pricePerCm2: "",
  isActive: true,
};

const densityCodeMap: Record<Density, string> = {
  "Super Low": "SL",
  Low: "LO",
  Med: "ME",
  High: "HI",
  "Super High": "SH",
};

function formatThickness(value: string) {
  return value.toLowerCase().includes("mm") ? value : `${value} mm`;
}

async function copyTextToClipboard(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);

  try {
    const copied = document.execCommand("copy");
    if (copied) return true;
  } finally {
    document.body.removeChild(textArea);
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  return false;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"calculator" | "master">(
    "calculator",
  );
  const [master, setMaster] = useState<CuttingPrice[]>([]);
  const [drafts, setDrafts] = useState<EstimationDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState("");
  const [calculator, setCalculator] =
    useState<CalculatorInput>(emptyCalculator);
  const [offerMultiplier, setOfferMultiplier] = useState(
    DEFAULT_OFFER_MULTIPLIER,
  );
  const [notice, setNotice] = useState("");
  const [masterForm, setMasterForm] = useState(emptyForm);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [showReferenceFields, setShowReferenceFields] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [densityFilter, setDensityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMaster(loadMaster());
    const storedDrafts = loadEstimationDrafts();
    const initialDrafts = storedDrafts.length
      ? storedDrafts
      : [createEstimationDraft()];
    setDrafts(initialDrafts);
    setActiveDraftId(initialDrafts[0]?.id || "");
    setOfferMultiplier(loadOfferMultiplier());
  }, []);

  useEffect(() => {
    if (master.length) saveMaster(master);
  }, [master]);

  useEffect(() => {
    if (drafts.length) saveEstimationDrafts(drafts);
  }, [drafts]);

  useEffect(() => {
    saveOfferMultiplier(offerMultiplier);
  }, [offerMultiplier]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  const activeMaster = useMemo(
    () => master.filter((row) => row.isActive),
    [master],
  );

  const materialOptions = useMemo(
    () =>
      [...new Set(activeMaster.map((row) => row.material))]
        .filter(Boolean)
        .sort(sortText),
    [activeMaster],
  );

  const densityOptions = useMemo(() => {
    if (!calculator.material) return [];
    return [
      ...new Set(
        activeMaster
          .filter((row) => row.material === calculator.material)
          .map((row) => row.density),
      ),
    ].sort((a, b) => DENSITY_OPTIONS.indexOf(a) - DENSITY_OPTIONS.indexOf(b));
  }, [activeMaster, calculator.material]);

  const thicknessOptions = useMemo(() => {
    if (!calculator.material || !calculator.density) return [];
    return [
      ...new Set(
        activeMaster
          .filter(
            (row) =>
              row.material === calculator.material &&
              row.density === calculator.density,
          )
          .map((row) => row.thickness),
      ),
    ].sort(sortText);
  }, [activeMaster, calculator.material, calculator.density]);

  const selectedPrice = useMemo(
    () =>
      activeMaster.find(
        (row) =>
          row.material === calculator.material &&
          row.density === calculator.density &&
          row.thickness === calculator.thickness,
      ),
    [activeMaster, calculator],
  );

  const calculation = useMemo(() => {
    const length = toNumber(calculator.lengthCm);
    const width = toNumber(calculator.widthCm);
    const qty = toNumber(calculator.qty);
    const area = length > 0 && width > 0 ? length * width : 0;
    const bottomRate = selectedPrice?.pricePerCm2 || 0;
    const offerRate = bottomRate * offerMultiplier;
    const offerUnitPrice = area * offerRate;
    const unitPrice = area * bottomRate;
    const validQty = qty > 0 ? qty : 0;
    const offerTotal = offerUnitPrice * validQty;
    const total = unitPrice * validQty;

    return {
      length,
      width,
      qty,
      area,
      offerRate,
      bottomRate,
      offerUnitPrice,
      unitPrice,
      offerTotal,
      total,
    };
  }, [calculator, offerMultiplier, selectedPrice]);

  const validationMessage = useMemo(() => {
    if (!calculator.material) return "Pilih bahan terlebih dahulu.";
    if (!calculator.density) return "Pilih density terlebih dahulu.";
    if (!calculator.thickness) return "Pilih ketebalan terlebih dahulu.";
    if (!selectedPrice) return "Harga belum tersedia di master data.";
    if (calculation.length <= 0) return "Panjang wajib lebih dari 0.";
    if (calculation.width <= 0) return "Lebar wajib lebih dari 0.";
    if (calculation.qty <= 0) return "Qty wajib lebih dari 0.";
    return "";
  }, [calculator, calculation, selectedPrice]);

  const filteredMaster = useMemo(() => {
    return master
      .filter((row) =>
        row.material.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      )
      .filter((row) => densityFilter === "all" || row.density === densityFilter)
      .filter((row) => {
        if (statusFilter === "all") return true;
        return statusFilter === "active" ? row.isActive : !row.isActive;
      })
      .sort((a, b) => sortText(a.material, b.material) || sortText(a.thickness, b.thickness));
  }, [densityFilter, master, searchQuery, statusFilter]);

  const activeDraft = useMemo(
    () => drafts.find((draft) => draft.id === activeDraftId) || drafts[0],
    [activeDraftId, drafts],
  );

  const items = activeDraft?.items || [];
  const customerName = activeDraft?.customerName || "";

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.total, 0),
    [items],
  );

  function getOfferUnitPrice(item: EstimationItem) {
    return item.areaCm2 * item.pricePerCm2 * offerMultiplier;
  }

  function getOfferTotal(item: EstimationItem) {
    return getOfferUnitPrice(item) * item.qty;
  }

  function getCustomerUnitPrice(item: EstimationItem) {
    return activeDraft?.customerPriceMode === "Bottom Price"
      ? item.unitPrice
      : getOfferUnitPrice(item);
  }

  function getCustomerTotal(item: EstimationItem) {
    return activeDraft?.customerPriceMode === "Bottom Price"
      ? item.total
      : getOfferTotal(item);
  }

  const grandOfferTotal = useMemo(
    () => items.reduce((sum, item) => sum + getOfferTotal(item), 0),
    [items, offerMultiplier],
  );

  const grandCustomerTotal = useMemo(
    () => items.reduce((sum, item) => sum + getCustomerTotal(item), 0),
    [activeDraft?.customerPriceMode, items, offerMultiplier],
  );

  function updateActiveDraft(
    updater: (draft: EstimationDraft) => EstimationDraft,
  ) {
    if (!activeDraft) return;

    setDrafts((current) =>
      current.map((draft) =>
        draft.id === activeDraft?.id
          ? { ...updater(draft), updatedAt: new Date().toISOString() }
          : draft,
      ),
    );
  }

  function createDraft() {
    const nextDraft = createEstimationDraft(
      `Customer ${drafts.length + 1}`,
    );
    setDrafts((current) => [nextDraft, ...current]);
    setActiveDraftId(nextDraft.id);
    setCalculator(emptyCalculator);
    flash("Draft customer baru dibuat.");
  }

  function deleteDraft(id: string) {
    setDrafts((current) => {
      const nextDrafts = current.filter((draft) => draft.id !== id);
      if (activeDraftId === id) {
        setActiveDraftId(nextDrafts[0]?.id || "");
        setCalculator(emptyCalculator);
      }
      return nextDrafts;
    });
    flash("Draft customer dihapus.");
  }

  function updateCalculator(key: keyof CalculatorInput, value: string) {
    setCalculator((current) => {
      const next = { ...current, [key]: value };
      if (key === "material") {
        next.density = "";
        next.thickness = "";
      }
      if (key === "density") next.thickness = "";
      return next;
    });
  }

  function addOrUpdateItem() {
    if (!activeDraft) {
      flash("Buat draft customer terlebih dahulu.");
      return;
    }

    if (validationMessage || !selectedPrice) {
      flash(validationMessage || "Lengkapi input cutting terlebih dahulu.");
      return;
    }

    const item: EstimationItem = {
      id: crypto.randomUUID(),
      priceId: selectedPrice.id,
      material: selectedPrice.material,
      density: selectedPrice.density,
      thickness: selectedPrice.thickness,
      lengthCm: calculation.length,
      widthCm: calculation.width,
      areaCm2: calculation.area,
      qty: calculation.qty,
      offerPricePerCm2: calculation.offerRate,
      pricePerCm2: selectedPrice.pricePerCm2,
      offerUnitPrice: calculation.offerUnitPrice,
      offerTotal: calculation.offerTotal,
      unitPrice: calculation.unitPrice,
      total: calculation.total,
    };

    updateActiveDraft((draft) => ({ ...draft, items: [...draft.items, item] }));
    setCalculator((current) => ({ ...current, lengthCm: "", widthCm: "", qty: "1" }));
    flash("Berhasil tambah data estimasi.");
  }

  function editItem(item: EstimationItem) {
    setCalculator({
      material: item.material,
      density: item.density,
      thickness: item.thickness,
      lengthCm: String(item.lengthCm),
      widthCm: String(item.widthCm),
      qty: String(item.qty),
    });
    updateActiveDraft((draft) => ({
      ...draft,
      items: draft.items.filter((row) => row.id !== item.id),
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
    flash("Item dibuka lagi di form kalkulator.");
  }

  async function copyWhatsApp() {
    if (!activeDraft) {
      flash("Buat draft customer terlebih dahulu.");
      return;
    }

    if (!items.length) {
      flash("Belum ada item estimasi untuk dicopy.");
      return;
    }

    const text = [
      "Estimasi Jasa Cutting",
      customerName.trim() ? `Customer: ${customerName.trim()}` : "",
      "",
      ...items.flatMap((item, index) => [
        `${index + 1}. ${item.material} ${formatThickness(item.thickness)}`,
        `Ukuran: ${formatNumber(item.lengthCm)} x ${formatNumber(item.widthCm)} cm`,
        `Qty: ${formatNumber(item.qty)} pcs`,
        `Harga satuan: ${formatRupiah(getCustomerUnitPrice(item))}`,
        `Total: ${formatRupiah(getCustomerTotal(item))}`,
        "",
      ]),
      `Grand Total: ${formatRupiah(grandCustomerTotal)}`,
    ]
      .filter((line, index, array) => line !== "" || array[index - 1] !== "")
      .join("\n");

    try {
      const copied = await copyTextToClipboard(text);
      flash(
        copied
          ? "Berhasil dicopy ke WhatsApp."
          : "Gagal copy. Browser tidak mengizinkan akses clipboard.",
      );
    } catch {
      flash("Gagal copy. Browser tidak mengizinkan akses clipboard.");
    }
  }

  function resetItems() {
    updateActiveDraft((draft) => ({ ...draft, items: [] }));
    flash("Daftar estimasi sudah direset.");
  }

  function submitMasterForm() {
    const material = masterForm.material.trim();
    const thickness = masterForm.thickness.trim();
    const pricePerCm2 = Number(masterForm.pricePerCm2);

    if (
      !material ||
      !masterForm.density ||
      !thickness ||
      pricePerCm2 <= 0
    ) {
      flash("Lengkapi bahan, density, ketebalan, dan bottom price.");
      return;
    }

    const duplicate = master.some(
      (row) =>
        row.id !== editingPriceId &&
        row.material.toLowerCase() === material.toLowerCase() &&
        row.density === masterForm.density &&
        row.thickness.toLowerCase() === thickness.toLowerCase(),
    );

    if (duplicate) {
      flash("Kombinasi bahan, density, dan ketebalan ini sudah ada.");
      return;
    }

    const now = new Date().toISOString();
    const row: CuttingPrice = {
      id: editingPriceId || crypto.randomUUID(),
      material,
      materialCode: masterForm.materialCode.trim(),
      density: masterForm.density,
      densityCode: masterForm.densityCode.trim() || densityCodeMap[masterForm.density],
      thickness,
      itemCode: masterForm.itemCode.trim(),
      pricePerCm2,
      isActive: masterForm.isActive,
      createdAt:
        master.find((item) => item.id === editingPriceId)?.createdAt || now,
      updatedAt: now,
    };

    setMaster((current) =>
      editingPriceId
        ? current.map((item) => (item.id === editingPriceId ? row : item))
        : [...current, row],
    );
    setMasterForm(emptyForm);
    setEditingPriceId(null);
    setShowReferenceFields(false);
    flash(editingPriceId ? "Berhasil update data harga." : "Berhasil tambah data harga.");
  }

  function startEditPrice(row: CuttingPrice) {
    setEditingPriceId(row.id);
    setMasterForm({
      material: row.material,
      materialCode: row.materialCode || "",
      density: row.density,
      densityCode: row.densityCode || densityCodeMap[row.density],
      thickness: row.thickness,
      itemCode: row.itemCode || "",
      pricePerCm2: String(row.pricePerCm2),
      isActive: row.isActive,
    });
    setShowReferenceFields(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deletePrice(id: string) {
    setMaster((current) => current.filter((row) => row.id !== id));
    flash("Berhasil hapus data harga.");
  }

  function togglePrice(row: CuttingPrice) {
    setMaster((current) =>
      current.map((item) =>
        item.id === row.id
          ? { ...item, isActive: !item.isActive, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    flash(row.isActive ? "Data dinonaktifkan." : "Data diaktifkan.");
  }

  function exportMaster() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            settings: { offerMultiplier },
            rows: master,
          },
          null,
          2,
        ),
      ],
      {
      type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cutting-price-master.json";
    link.click();
    URL.revokeObjectURL(url);
    flash("Master data berhasil diexport.");
  }

  async function importMaster(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const rows = normalizePriceRows(parsed);
      if (!rows.length) throw new Error("Invalid rows");
      if (!window.confirm("Import akan mengganti master data saat ini. Lanjutkan?")) return;
      const importedMultiplier = Number(parsed?.settings?.offerMultiplier);
      if (importedMultiplier > 0) setOfferMultiplier(importedMultiplier);
      setMaster(rows);
      flash("Master data berhasil diimport.");
    } catch {
      flash("Format file tidak valid.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className="min-h-screen px-4 py-5 text-[#17202a] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-[#d9dee7] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#0f766e]">
              Kalkulator Harga Jasa Cutting
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Hitung cepat dari master harga lokal
            </h1>
          </div>
          <nav className="flex w-full rounded-lg border border-[#cfd6e2] bg-white p-1 sm:w-auto">
            <button
              className={`btn flex-1 sm:min-w-36 ${
                activeTab === "calculator" ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setActiveTab("calculator")}
            >
              Kalkulator
            </button>
            <button
              className={`btn flex-1 sm:min-w-36 ${
                activeTab === "master" ? "btn-primary" : "btn-secondary"
              }`}
              onClick={() => setActiveTab("master")}
            >
              Master Data
            </button>
          </nav>
        </header>

        {notice ? (
          <div className="rounded-lg border border-[#99f6e4] bg-[#ecfdf3] px-4 py-3 text-sm font-bold text-[#115e59]">
            {notice}
          </div>
        ) : null}

        {activeTab === "calculator" ? (
          <>
            <section className="card p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Draft Customer</h2>
                    <p className="mt-1 text-sm text-[#667085]">
                      Pisahkan estimasi per customer.
                    </p>
                  </div>
                  <button className="btn btn-primary" title="Draft baru" onClick={createDraft}>
                    <Plus size={18} />
                    Draft Baru
                  </button>
                </div>

                {drafts.length ? (
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {drafts.map((draft) => {
                    const draftOfferTotal = draft.items.reduce(
                      (sum, item) =>
                        sum + item.areaCm2 * item.pricePerCm2 * offerMultiplier * item.qty,
                      0,
                    );
                    const draftBottomTotal = draft.items.reduce(
                      (sum, item) => sum + item.total,
                      0,
                    );

                      return (
                        <button
                          key={draft.id}
                          className={`rounded-lg border p-3 text-left ${
                            draft.id === activeDraft?.id
                              ? "border-[#0f766e] bg-[#f0fdfa]"
                              : "border-[#e5e9f0] bg-white"
                          }`}
                          onClick={() => setActiveDraftId(draft.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-[#17202a]">
                              {draft.customerName || "Customer Baru"}
                            </p>
                            <span className="badge bg-[#eef2ff] text-[#3730a3]">
                              {draft.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[#667085]">
                            {draft.items.length} item | Offer {formatRupiah(draftOfferTotal)} | Bottom{" "}
                            {formatRupiah(draftBottomTotal)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#0f766e]">
                            Kirim: {draft.customerPriceMode}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="Belum ada draft customer."
                    body="Klik tombol tambah untuk mulai estimasi customer baru."
                  />
                )}
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="card p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Input Cutting</h2>
                    <p className="mt-1 text-sm text-[#667085]">
                      Pilih urutan bahan, density, ketebalan, lalu isi ukuran.
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    title="Reset input"
                    onClick={() => setCalculator(emptyCalculator)}
                  >
                    <RotateCcw size={18} />
                    Reset
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="field">
                    <label>Bahan</label>
                    <select
                      className="input"
                      value={calculator.material}
                      onChange={(event) =>
                        updateCalculator("material", event.target.value)
                      }
                    >
                      <option value="">Pilih bahan</option>
                      {materialOptions.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Density</label>
                    <select
                      className="input"
                      value={calculator.density}
                      disabled={!calculator.material}
                      onChange={(event) =>
                        updateCalculator("density", event.target.value)
                      }
                    >
                      <option value="">Pilih density</option>
                      {densityOptions.map((density) => (
                        <option key={density} value={density}>
                          {density}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Ketebalan</label>
                    <select
                      className="input"
                      value={calculator.thickness}
                      disabled={!calculator.material || !calculator.density}
                      onChange={(event) =>
                        updateCalculator("thickness", event.target.value)
                      }
                    >
                      <option value="">Pilih ketebalan</option>
                      {thicknessOptions.map((thickness) => (
                        <option key={thickness} value={thickness}>
                          {formatThickness(thickness)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>Qty</label>
                    <input
                      className="input"
                      min="1"
                      type="number"
                      value={calculator.qty}
                      onChange={(event) => updateCalculator("qty", event.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label>Panjang (cm)</label>
                    <input
                      className="input"
                      min="0"
                      step="0.01"
                      type="number"
                      value={calculator.lengthCm}
                      onChange={(event) =>
                        updateCalculator("lengthCm", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label>Lebar (cm)</label>
                    <input
                      className="input"
                      min="0"
                      step="0.01"
                      type="number"
                      value={calculator.widthCm}
                      onChange={(event) =>
                        updateCalculator("widthCm", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="btn btn-primary sm:w-auto"
                    disabled={!activeDraft || Boolean(validationMessage)}
                    onClick={addOrUpdateItem}
                  >
                    <Plus size={18} />
                    Tambah ke Daftar
                  </button>
                  {!activeDraft ? (
                    <p className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#9a3412]">
                      Buat draft customer terlebih dahulu.
                    </p>
                  ) : validationMessage ? (
                    <p className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#9a3412]">
                      {validationMessage}
                    </p>
                  ) : null}
                </div>
              </div>

            <div className="card p-5">
                <h2 className="text-xl font-bold">Preview Harga</h2>
                <div className="mt-5 grid gap-3">
                  <Metric label="Luas per pcs" value={`${formatNumber(calculation.area)} cm2`} />
                  <Metric label="Rate" value={`${formatRupiah(calculation.bottomRate)} / cm2`} />
                  <Metric label="Offer Price Satuan" value={formatRupiah(calculation.offerUnitPrice)} highlight />
                  <Metric label="Bottom Price Satuan" value={formatRupiah(calculation.unitPrice)} highlight />
                  <Metric label="Offer Price Total" value={formatRupiah(calculation.offerTotal)} highlight strong />
                  <Metric label="Bottom Price Total" value={formatRupiah(calculation.total)} highlight strong />
                </div>
                {selectedPrice ? (
                  <div className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#475467]">
                    Kode barang: <b>{selectedPrice.itemCode || "-"}</b>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="card p-5">
              <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
                <div className="grid gap-4 lg:grid-cols-[1.2fr_170px_210px]">
                  <div>
                    <h2 className="text-xl font-bold">Daftar Estimasi</h2>
                    <div className="mt-3 field">
                      <label>Nama Customer</label>
                      <input
                        className="input"
                        placeholder="Contoh: Bu Rina / PT Maju Jaya"
                        value={customerName}
                        onChange={(event) =>
                          updateActiveDraft((draft) => ({
                            ...draft,
                            customerName: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="field lg:self-end">
                    <label>Status</label>
                    <select
                      className="input"
                      value={activeDraft?.status || "Draft"}
                      onChange={(event) =>
                        updateActiveDraft((draft) => ({
                          ...draft,
                          status: event.target.value as EstimationDraftStatus,
                        }))
                      }
                    >
                      {ESTIMATION_DRAFT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field lg:self-end">
                    <label>Harga Dikirim</label>
                    <select
                      className="input"
                      value={activeDraft?.customerPriceMode || "Offer Price"}
                      onChange={(event) =>
                        updateActiveDraft((draft) => ({
                          ...draft,
                          customerPriceMode: event.target.value as CustomerPriceMode,
                        }))
                      }
                    >
                      {CUSTOMER_PRICE_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 xl:justify-end">
                  <button className="btn btn-primary" onClick={copyWhatsApp}>
                    <Clipboard size={18} />
                    Copy WhatsApp
                  </button>
                  <button
                    className="btn btn-secondary"
                    disabled={!activeDraft}
                    onClick={() => activeDraft && deleteDraft(activeDraft.id)}
                  >
                    <Trash2 size={18} />
                    Hapus Draft
                  </button>
                  <button className="btn btn-danger" onClick={resetItems}>
                    <Trash2 size={18} />
                    Reset Semua
                  </button>
                </div>
              </div>

              {items.length ? (
                <>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Bahan</th>
                          <th>Density</th>
                          <th>Tebal</th>
                          <th>Ukuran</th>
                          <th>Qty</th>
                          <th>Offer Satuan</th>
                          <th>Bottom Satuan</th>
                          <th>Offer Total</th>
                          <th>Bottom Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.material}</td>
                            <td>{item.density}</td>
                            <td>{formatThickness(item.thickness)}</td>
                            <td>
                              {formatNumber(item.lengthCm)} x{" "}
                              {formatNumber(item.widthCm)} cm
                            </td>
                            <td>{formatNumber(item.qty)}</td>
                            <td>{formatRupiah(getOfferUnitPrice(item))}</td>
                            <td>{formatRupiah(item.unitPrice)}</td>
                            <td className="font-bold">{formatRupiah(getOfferTotal(item))}</td>
                            <td className="font-bold">{formatRupiah(item.total)}</td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-secondary"
                                  title="Edit item"
                                  onClick={() => editItem(item)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="btn btn-danger"
                                  title="Hapus item"
                                  onClick={() =>
                                    updateActiveDraft((draft) => ({
                                      ...draft,
                                      items: draft.items.filter(
                                        (row) => row.id !== item.id,
                                      ),
                                    }))
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
                    <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-5 py-4 text-right">
                      <p className="text-sm font-bold text-[#1d4ed8]">Grand Harga Customer</p>
                      <p className="text-2xl font-bold text-[#1e3a8a]">
                        {formatRupiah(grandCustomerTotal)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#d9dee7] bg-white px-5 py-4 text-right">
                      <p className="text-sm font-bold text-[#1d4ed8]">Grand Offer Price</p>
                      <p className="text-2xl font-bold text-[#1e3a8a]">
                        {formatRupiah(grandOfferTotal)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-5 py-4 text-right">
                      <p className="text-sm font-bold text-[#0f766e]">Grand Bottom Price</p>
                      <p className="text-2xl font-bold text-[#115e59]">
                        {formatRupiah(grandTotal)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState
                  title="Belum ada item cutting."
                  body="Tambahkan item dari kalkulator di atas."
                />
              )}
            </section>
          </>
        ) : (
          <section className="flex flex-col gap-5">
            <div className="card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">
                      {editingPriceId ? "Edit Harga" : "Tambah Harga"}
                    </h2>
                    <p className="mt-1 text-sm text-[#667085]">
                      Bottom price diatur per bahan. Offer price dihitung otomatis dari multiplier global.
                    </p>
                  </div>
                  {editingPriceId ? (
                    <button
                      className="btn btn-secondary"
                      title="Batal edit"
                      onClick={() => {
                        setEditingPriceId(null);
                        setMasterForm(emptyForm);
                        setShowReferenceFields(false);
                      }}
                    >
                      <X size={18} />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-5">
                  <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-4">
                    <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-end">
                      <div>
                        <p className="text-sm font-bold text-[#1d4ed8]">
                          Setting Offer Price Global
                        </p>
                        <p className="mt-1 text-xs text-[#475467]">
                          Offer price = bottom price x multiplier ini.
                        </p>
                      </div>
                      <div className="field">
                        <label>Multiplier</label>
                        <input
                          className="input"
                          min="0.01"
                          step="0.01"
                          type="number"
                          value={offerMultiplier}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setOfferMultiplier(value > 0 ? value : DEFAULT_OFFER_MULTIPLIER);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e5e9f0] bg-[#f8fafc] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#344054]">Field utama</p>
                        <p className="text-xs text-[#667085]">
                          Cukup isi bagian ini untuk dipakai di kalkulator.
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          masterForm.isActive
                            ? "bg-[#dcfce7] text-[#166534]"
                            : "bg-[#fee2e2] text-[#991b1b]"
                        }`}
                      >
                        {masterForm.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
                      <div className="field">
                        <label>Bahan</label>
                        <input
                          className="input"
                          placeholder="Contoh: Besi Esser"
                          value={masterForm.material}
                          onChange={(event) =>
                            setMasterForm((current) => ({
                              ...current,
                              material: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="contents">
                        <div className="field">
                          <label>Density</label>
                          <select
                            className="input"
                            value={masterForm.density}
                            onChange={(event) => {
                              const density = event.target.value as Density;
                              setMasterForm((current) => ({
                                ...current,
                                density,
                                densityCode: densityCodeMap[density],
                              }));
                            }}
                          >
                            {DENSITY_OPTIONS.map((density) => (
                              <option key={density} value={density}>
                                {density}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="field">
                          <label>Ketebalan</label>
                          <input
                            className="input"
                            placeholder="Contoh: 3"
                            value={masterForm.thickness}
                            onChange={(event) =>
                              setMasterForm((current) => ({
                                ...current,
                                thickness: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Bottom Price / cm2</label>
                          <input
                            className="input"
                            min="0"
                            placeholder="Contoh: 100"
                            type="number"
                            value={masterForm.pricePerCm2}
                            onChange={(event) =>
                              setMasterForm((current) => ({
                                ...current,
                                pricePerCm2: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#d9dee7] bg-white">
                    <button
                      className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold text-[#344054]"
                      onClick={() => setShowReferenceFields((value) => !value)}
                    >
                      <span>Kode referensi</span>
                      <span className="text-xs font-bold text-[#667085]">
                        {showReferenceFields ? "Sembunyikan" : "Opsional"}
                      </span>
                    </button>

                    {showReferenceFields ? (
                      <div className="grid gap-4 border-t border-[#e5e9f0] p-4 sm:grid-cols-3">
                        <div className="field">
                          <label>Kode Bahan</label>
                          <input
                            className="input"
                            value={masterForm.materialCode}
                            onChange={(event) =>
                              setMasterForm((current) => ({
                                ...current,
                                materialCode: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Kode Density</label>
                          <input
                            className="input"
                            value={masterForm.densityCode}
                            onChange={(event) =>
                              setMasterForm((current) => ({
                                ...current,
                                densityCode: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="field">
                          <label>Kode Barang</label>
                          <input
                            className="input"
                            value={masterForm.itemCode}
                            onChange={(event) =>
                              setMasterForm((current) => ({
                                ...current,
                                itemCode: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-[#e5e9f0] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-[#344054]">
                      <input
                        type="checkbox"
                        checked={masterForm.isActive}
                        onChange={(event) =>
                          setMasterForm((current) => ({
                            ...current,
                            isActive: event.target.checked,
                          }))
                        }
                      />
                      Aktifkan harga ini
                    </label>

                    <button className="btn btn-primary" onClick={submitMasterForm}>
                      {editingPriceId ? <Save size={18} /> : <Plus size={18} />}
                      {editingPriceId ? "Update Harga" : "Tambah Data"}
                    </button>
                  </div>
                </div>
              </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="card p-5">
                <h2 className="text-xl font-bold">Filter & Search</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_180px]">
                  <div className="field">
                    <label>Cari bahan</label>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667085]"
                        size={18}
                      />
                      <input
                        className="input pl-10"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Density</label>
                    <select
                      className="input"
                      value={densityFilter}
                      onChange={(event) => setDensityFilter(event.target.value)}
                    >
                      <option value="all">Semua</option>
                      {DENSITY_OPTIONS.map((density) => (
                        <option key={density} value={density}>
                          {density}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Status</label>
                    <select
                      className="input"
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                    >
                      <option value="all">Semua</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-xl font-bold">Backup Data</h2>
                <div className="mt-4 grid gap-3">
                  <button className="btn btn-secondary" onClick={exportMaster}>
                    <Download size={18} />
                    Export Master Data
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp size={18} />
                    Import Master Data
                  </button>
                  <input
                    ref={fileInputRef}
                    className="hidden"
                    type="file"
                    accept="application/json"
                    onChange={importMaster}
                  />
                </div>
              </div>
            </div>

              <div className="card p-5">
                <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Tabel Master Data</h2>
                    <p className="text-sm text-[#667085]">
                      {filteredMaster.length} data tampil dari {master.length} data.
                    </p>
                  </div>
                </div>

                {filteredMaster.length ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Bahan</th>
                          <th>Kode Bahan</th>
                          <th>Density</th>
                          <th>Kode Density</th>
                          <th>Ketebalan</th>
                          <th>Kode Barang</th>
                          <th>Offer / cm2</th>
                          <th>Bottom / cm2</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMaster.map((row) => (
                          <tr key={row.id}>
                            <td className="font-bold">{row.material}</td>
                            <td>{row.materialCode || "-"}</td>
                            <td>{row.density}</td>
                            <td>{row.densityCode || "-"}</td>
                            <td>{formatThickness(row.thickness)}</td>
                            <td>{row.itemCode || "-"}</td>
                            <td>{formatRupiah(row.pricePerCm2 * offerMultiplier)}</td>
                            <td>{formatRupiah(row.pricePerCm2)}</td>
                            <td>
                              <span
                                className={`badge ${
                                  row.isActive
                                    ? "bg-[#dcfce7] text-[#166534]"
                                    : "bg-[#fee2e2] text-[#991b1b]"
                                }`}
                              >
                                {row.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  className="btn btn-secondary"
                                  title="Edit harga"
                                  onClick={() => startEditPrice(row)}
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  title="Aktif/nonaktif"
                                  onClick={() => togglePrice(row)}
                                >
                                  {row.isActive ? <X size={16} /> : <Check size={16} />}
                                </button>
                                <button
                                  className="btn btn-danger"
                                  title="Hapus harga"
                                  onClick={() => deletePrice(row.id)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="Belum ada master data."
                    body="Tambahkan harga cutting pertama untuk mulai menggunakan kalkulator."
                  />
                )}
              </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  highlight,
  strong,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight
          ? "border-[#99f6e4] bg-[#f0fdfa]"
          : "border-[#e5e9f0] bg-[#f8fafc]"
      }`}
    >
      <p className="text-sm font-bold text-[#667085]">{label}</p>
      <p
        className={`mt-1 font-bold ${
          strong ? "text-3xl text-[#115e59]" : "text-2xl text-[#17202a]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cfd6e2] bg-[#f8fafc] px-5 py-10 text-center">
      <p className="font-bold text-[#344054]">{title}</p>
      <p className="mt-1 text-sm text-[#667085]">{body}</p>
    </div>
  );
}
