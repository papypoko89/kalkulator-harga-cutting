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
  loadEstimationItems,
  loadMaster,
  loadCustomerName,
  normalizePriceRows,
  saveCustomerName,
  saveEstimationItems,
  saveMaster,
} from "@/lib/storage";
import {
  CalculatorInput,
  CuttingPrice,
  DENSITY_OPTIONS,
  Density,
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<"calculator" | "master">(
    "calculator",
  );
  const [master, setMaster] = useState<CuttingPrice[]>([]);
  const [items, setItems] = useState<EstimationItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [calculator, setCalculator] =
    useState<CalculatorInput>(emptyCalculator);
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
    setItems(loadEstimationItems());
    setCustomerName(loadCustomerName());
  }, []);

  useEffect(() => {
    if (master.length) saveMaster(master);
  }, [master]);

  useEffect(() => {
    saveEstimationItems(items);
  }, [items]);

  useEffect(() => {
    saveCustomerName(customerName);
  }, [customerName]);

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
    const rate = selectedPrice?.pricePerCm2 || 0;
    const unitPrice = area * rate;
    const total = unitPrice * (qty > 0 ? qty : 0);

    return { length, width, qty, area, rate, unitPrice, total };
  }, [calculator, selectedPrice]);

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

  const grandTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.total, 0),
    [items],
  );

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
      pricePerCm2: selectedPrice.pricePerCm2,
      unitPrice: calculation.unitPrice,
      total: calculation.total,
    };

    setItems((current) => [...current, item]);
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
    setItems((current) => current.filter((row) => row.id !== item.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
    flash("Item dibuka lagi di form kalkulator.");
  }

  async function copyWhatsApp() {
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
        `Harga satuan: ${formatRupiah(item.unitPrice)}`,
        `Total: ${formatRupiah(item.total)}`,
        "",
      ]),
      `Grand Total: ${formatRupiah(grandTotal)}`,
    ]
      .filter((line, index, array) => line !== "" || array[index - 1] !== "")
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      flash("Berhasil dicopy ke WhatsApp.");
    } catch {
      flash("Gagal copy. Browser tidak mengizinkan akses clipboard.");
    }
  }

  function resetItems() {
    setItems([]);
    flash("Daftar estimasi sudah direset.");
  }

  function submitMasterForm() {
    const material = masterForm.material.trim();
    const thickness = masterForm.thickness.trim();
    const pricePerCm2 = Number(masterForm.pricePerCm2);

    if (!material || !masterForm.density || !thickness || pricePerCm2 <= 0) {
      flash("Lengkapi bahan, density, ketebalan, dan harga lebih dari 0.");
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
    const blob = new Blob([JSON.stringify(master, null, 2)], {
      type: "application/json",
    });
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
      const rows = normalizePriceRows(JSON.parse(text));
      if (!rows.length) throw new Error("Invalid rows");
      if (!window.confirm("Import akan mengganti master data saat ini. Lanjutkan?")) return;
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

                <div className="mb-4 rounded-lg border border-[#e5e9f0] bg-[#f8fafc] p-4">
                  <div className="field">
                    <label>Nama Customer</label>
                    <input
                      className="input"
                      placeholder="Contoh: Bu Rina / PT Maju Jaya"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                    />
                  </div>
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
                    disabled={Boolean(validationMessage)}
                    onClick={addOrUpdateItem}
                  >
                    <Plus size={18} />
                    Tambah ke Daftar
                  </button>
                  {validationMessage ? (
                    <p className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#9a3412]">
                      {validationMessage}
                    </p>
                  ) : null}
                </div>
              </div>

            <div className="card p-5">
                <h2 className="text-xl font-bold">Preview Harga</h2>
                <div className="mt-5 grid gap-3">
                  <Metric label="Luas per pcs" value={`${formatNumber(calculation.area)} cm²`} />
                  <Metric label="Rate" value={`${formatRupiah(calculation.rate)} / cm²`} />
                  <Metric label="Harga Satuan" value={formatRupiah(calculation.unitPrice)} highlight />
                  <Metric label="Total" value={formatRupiah(calculation.total)} highlight strong />
                </div>
                {selectedPrice ? (
                  <div className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#475467]">
                    Kode barang: <b>{selectedPrice.itemCode || "-"}</b>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="card p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Daftar Estimasi</h2>
                  <p className="mt-1 text-sm text-[#667085]">
                    Item tersimpan sementara di browser meski halaman direfresh.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-secondary" onClick={copyWhatsApp}>
                    <Clipboard size={18} />
                    Copy WhatsApp
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
                          <th>Harga Satuan</th>
                          <th>Total</th>
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
                            <td>{formatRupiah(item.unitPrice)}</td>
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
                                    setItems((current) =>
                                      current.filter((row) => row.id !== item.id),
                                    )
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
                  <div className="mt-5 flex justify-end">
                    <div className="rounded-lg border border-[#99f6e4] bg-[#f0fdfa] px-5 py-4 text-right">
                      <p className="text-sm font-bold text-[#0f766e]">Grand Total</p>
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
                      Area pengaturan harga jasa cutting per cm².
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
                          <label>Harga / cm²</label>
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
                          <th>Harga / cm²</th>
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
