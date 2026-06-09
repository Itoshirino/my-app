"use client";

import { useState } from "react";
import Texture from "./texture.png";
import {
  RiSearchLine,
  RiCloseLine,
  RiInformationFill,
  RiFileTextLine,
  RiDeleteBinLine,
  RiDownloadLine,
  RiFileCopyLine,
  RiCalendarLine,
} from "@remixicon/react";
import jsPDF from "jspdf";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTariffOpen, setIsTariffOpen] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [insuredCount, setInsuredCount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [todayStr] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [value, setValue] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = parseInt(val);

    if (val === "" || (num >= 0 && num <= 10000000)) {
      setValue(val);
    }
  };

  // Модальные окна
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Данные плательщика
  const [payerPassport, setPayerPassport] = useState("");
  const [payerBirthDate, setPayerBirthDate] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerFullName, setPayerFullName] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [summaryOpenTime, setSummaryOpenTime] = useState<string>("");

  // Список застрахованных
  const [insuredList, setInsuredList] = useState([
    { id: 1, passport: "", birthDate: "", phone: "", fullName: "" },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<
    "click" | "payme" | "paynet"
  >("click");

  const tabs = ["Расчет стоимости", "Застрахованные лица"];

  const tariffs: { [key: string]: { price: string; coverage: string } } = {
    "15000-3000000": { price: "15 000", coverage: "3 000 000" },
    "20000-4000000": { price: "20 000", coverage: "4 000 000" },
    "25000-5000000": { price: "25 000", coverage: "5 000 000" },
    "30000-6000000": { price: "30 000", coverage: "6 000 000" },
    "35000-7000000": { price: "35 000", coverage: "7 000 000" },
    "40000-8000000": { price: "40 000", coverage: "8 000 000" },
    "50000-10000000": { price: "50 000", coverage: "10 000 000" },
  };

  const mockDatabase: { [key: string]: { fullName: string } } = {
    "AE3559776_2004-04-24": { fullName: "XOLIQULOV ELYORBEK JAVLON O‘G‘LI" },
  };

  const getPrices = () => {
    if (!selectedTariff)
      return { basePriceStr: "", totalPriceStr: "", count: 0 };
    const tariff = tariffs[selectedTariff];
    const count = insuredList.length;
    const basePriceNum = parseInt(tariff.price.replace(/\s/g, ""), 10);
    const totalPriceNum = basePriceNum * count;

    return {
      basePriceStr: tariff.price,
      totalPriceStr: totalPriceNum.toLocaleString("ru-RU").replace(/,/g, " "),
      count,
    };
  };

  const handleInsuredCountChange = (val: string) => {
    setInsuredCount(val);
  };

  const handlePayerNameClick = () => {
    if (!payerPassport || !payerBirthDate) {
      alert(
        "Пожалуйста, сначала заполните поля «Серия и номер паспорта» и «Дата рождения»",
      );
      return;
    }
    const cleanPassport = payerPassport.toUpperCase().replace(/\s/g, "");
    const searchKey = `${cleanPassport}_${payerBirthDate}`;
    if (searchKey in mockDatabase) {
      setPayerFullName(mockDatabase[searchKey].fullName);
      setErrors((prev) => {
        const { payerFullName, ...rest } = prev;
        return rest;
      });
    } else {
      alert(
        "Гражданин с такими данными паспорта и даты рождения не найден в базе данных.",
      );
    }
  };

  const handleInsuredNameClick = (
    id: number,
    passport: string,
    birthDate: string,
  ) => {
    if (!passport || !birthDate) {
      alert(
        "Пожалуйста, сначала заполните поля «Серия и номер паспорта» и «Дата рождения» для этого лица",
      );
      return;
    }
    const cleanPassport = passport.toUpperCase().replace(/\s/g, "");
    const searchKey = `${cleanPassport}_${birthDate}`;
    if (searchKey in mockDatabase) {
      updateInsuredField(id, "fullName", mockDatabase[searchKey].fullName);
    } else {
      alert(
        "Гражданин с такими данными паспорта и даты рождения не найден в базе данных.",
      );
    }
  };

  const calculateEndDate = (startStr: string) => {
    if (!startStr) return "";
    const date = new Date(startStr);
    const nextYear = new Date(date);
    nextYear.setFullYear(date.getFullYear() + 1);
    return nextYear.toISOString().split("T")[0];
  };

  const endDate = calculateEndDate(startDate);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}.${month}.${year}`;
  };

  const getCalendarInfo = () => {
    if (!startDate) {
      return {
        monthYear: "",
        day: 9,
        fullDate: "",
        time: "14:01:12",
      };
    }

    const date = new Date(startDate);
    const monthYear = date.toLocaleString("ru", {
      month: "long",
      year: "numeric",
    });
    const day = date.getDate();

    // Если есть время нажатия кнопки — используем его, иначе дефолт
    const displayTime = summaryOpenTime ? summaryOpenTime : "Error Time";

    return {
      monthYear,
      day,
      fullDate: formatDate(startDate),
      time: displayTime,
    };
  };

  const calculateAge = (birthDateStr: string): string => {
    if (!birthDateStr) return "-";

    const birthDate = new Date(birthDateStr);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age.toString();
  };

  // Генерация дней календаря для выбранного месяца
  // Генерация правильного календаря для выбранного месяца
  const generateCalendarDays = (startStr: string) => {
    if (!startStr) return Array(42).fill(null); // пустой календарь

    const date = new Date(startStr);
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = воскресенье
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    // Сдвиг начала (в узбекской/русской неделе: ВС первый)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Дни текущего месяца
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    // Заполняем до конца сетки (6 недель)
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  };

  const calendarInfo = getCalendarInfo();

  const validateTab0 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!insuredCount || parseInt(insuredCount, 10) < 1)
      newErrors.insuredCount = "Пожалуйста, укажите число застрахованных";
    if (!startDate)
      newErrors.startDate = "Пожалуйста, выберите дату начала страхования";
    if (!selectedTariff)
      newErrors.selectedTariff = "Пожалуйста, выберите подходящий тариф";
    return newErrors;
  };

  const validateTab1 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!payerPassport)
      newErrors.payerPassport = "Заполните серию и номер паспорта плательщика";
    if (!payerBirthDate)
      newErrors.payerBirthDate = "Укажите дату рождения плательщика";
    if (!payerPhone || payerPhone.length < 12)
      newErrors.payerPhone = "Введите корректный номер телефона";
    if (!payerFullName)
      newErrors.payerFullName =
        "Нажмите на иконку поиска, чтобы заполнить ФИО из базы данных";
    if (!isAgreed)
      newErrors.isAgreed = "Необходимо подтвердить согласие с условиями оферты";

    insuredList.forEach((insured, index) => {
      if (!insured.passport)
        newErrors[`insured_${insured.id}_passport`] =
          `Заполните паспорт лица #${index + 1}`;
      if (!insured.birthDate)
        newErrors[`insured_${insured.id}_birthDate`] =
          `Укажите дату рождения лица #${index + 1}`;
      if (!insured.phone || insured.phone.length < 12)
        newErrors[`insured_${insured.id}_phone`] =
          `Введите номер телефона лица #${index + 1}`;
      if (!insured.fullName)
        newErrors[`insured_${insured.id}_fullName`] =
          `Заполните ФИО лица #${index + 1} через поиск`;
    });
    return newErrors;
  };

  const handleNextTab = () => {
    const validateErrors = validateTab0();
    if (Object.keys(validateErrors).length > 0) {
      setErrors(validateErrors);
      return;
    }
    setErrors({});
    setActiveTab(1);
  };

  const handleOpenSummaryModal = () => {
    const validateErrors = validateTab1();
    if (Object.keys(validateErrors).length > 0) {
      setErrors(validateErrors);
      return;
    }
    setErrors({});
    setIsSummaryModalOpen(true);
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const currentTime = `${hours}:${minutes}:${seconds}`;
    setSummaryOpenTime(currentTime);
  };

  const handlePolisBerish = () => {
    setIsSummaryModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handlePhoneInput = (
    val: string,
    setter: (v: string) => void,
    fieldKey?: string,
  ) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 0 && !value.startsWith("998")) value = "998" + value;
    const finalVal = value.slice(0, 12);
    setter(finalVal);
    if (fieldKey && finalVal.length === 12)
      setErrors((prev) => {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      });
  };

  const formatPhoneDisplay = (phoneStr: string) => {
    if (!phoneStr) return "";
    return `+${phoneStr.slice(0, 3)} ${phoneStr.slice(3, 5)} ${phoneStr.slice(5, 8)} ${phoneStr.slice(8, 10)} ${phoneStr.slice(10)}`;
  };

  const addInsuredPerson = () => {
    const newList = [
      ...insuredList,
      {
        id: Date.now() + Math.random(),
        passport: "",
        birthDate: "",
        phone: "",
        fullName: "",
      },
    ];
    setInsuredList(newList);
    setInsuredCount(newList.length.toString());
  };

  const removeInsuredPerson = (id: number) => {
    const newList = insuredList.filter((item) => item.id !== id);
    setInsuredList(newList);
    setInsuredCount(newList.length.toString());
  };

  const updateInsuredField = (id: number, field: string, value: string) => {
    setInsuredList(
      insuredList.map((item) => {
        if (item.id === id)
          return {
            ...item,
            [field]:
              field === "passport"
                ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                : value,
          };
        return item;
      }),
    );
    setErrors((prev) => {
      const { [`insured_${id}_${field}`]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Увеличиваем качество текста
    doc.setFontSize(14);
    doc.text("Шартнома маълумотлари", 20, 20);

    let y = 35;
    doc.setFontSize(11);

    // === Мурожаат қилувчи ===
    doc.setFont("helvetica", "bold");
    doc.text("Мурожаат қилувчи:", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");

    doc.text(`Ф.И.О.: ${payerFullName}`, 25, y);
    y += 8;
    doc.text(
      `Туғилган куни: ${formatDate(payerBirthDate)} (Ёши: ${calculateAge(payerBirthDate)})`,
      25,
      y,
    );
    y += 8;
    doc.text(`Паспорт: ${payerPassport}`, 25, y);
    y += 8;
    doc.text(`Телефон: +${payerPhone}`, 25, y);
    y += 12;

    // === Шартнома ===
    doc.setFont("helvetica", "bold");
    doc.text("Шартнома:", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");

    doc.text(`Бошланиши: ${formatDate(startDate)}`, 25, y);
    y += 8;
    doc.text(`Тугаши: ${formatDate(endDate)}`, 25, y);
    y += 8;
    doc.text(`Нархи: ${getPrices().totalPriceStr} сўм`, 25, y);
    y += 12;

    // === Застрахованные ===
    doc.setFont("helvetica", "bold");
    doc.text("Суғурталанган шахслар:", 20, y);
    y += 10;
    doc.setFont("helvetica", "normal");

    insuredList.forEach((ins, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${idx + 1}. ${ins.fullName}`, 25, y);
      y += 7;
      doc.text(`   Паспорт: ${ins.passport}`, 30, y);
      y += 7;
      doc.text(`   Туғилган куни: ${formatDate(ins.birthDate)}`, 30, y);
      y += 7;
      doc.text(`   Телефон: ${formatPhoneDisplay(ins.phone)}`, 30, y);
      y += 10;
    });

    doc.text(
      `Шартнома санаси: ${calendarInfo.fullDate} ${calendarInfo.time}`,
      20,
      y + 10,
    );

    // Сохраняем
    const fileName = `Shartnoma_${payerFullName.replace(/[^a-zA-Z0-9ЎўҒғҚқҲҳ]/g, "_") || "insurance"}.pdf`;
    doc.save(fileName);
  };
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div
        className={`max-w-4xl mx-auto px-6 py-8 ${isSummaryModalOpen || isPaymentModalOpen ? "hidden" : "block"}`}
      >
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm relative">
          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-2xl overflow-hidden pointer-events-none">
            {tabs.map((tab, i) => (
              <button
                key={i}
                tabIndex={-1}
                style={
                  activeTab === i
                    ? {
                        backgroundImage: `url(${Texture.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
                className={`px-8 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex-1 text-center ${activeTab === i ? "border-[#508223] text-[#fefefefe] bg-[#436d1d]" : "border-transparent text-gray-400"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold text-[#508223] mb-6">
              {tabs[activeTab]}
            </h2>

            {activeTab === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2 font-medium">
                    <span className="text-red-500 mr-1">*</span>Число
                    застрахованных:
                  </label>
                  <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.insuredCount
                        ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                        : "border-gray-200 focus:ring-[#508223]"
                    }`}
                  />
                  {errors.insuredCount && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.insuredCount}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                      <span className="text-red-500 mr-1">*</span>Начало
                      страхования:
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      max="2100-12-31"
                      value={startDate}
                      onClick={(e) => {
                        if (e.currentTarget.showPicker)
                          e.currentTarget.showPicker();
                      }}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setErrors((prev) => {
                          const { startDate, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white cursor-pointer transition-all ${errors.startDate ? "border-red-400 focus:ring-red-400 bg-red-50/30" : "border-gray-200 focus:ring-[#508223]"}`}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium">
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                      Конец страхования:
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm text-gray-700 mb-2 font-medium">
                    <span className="text-red-500 mr-1">*</span>Выбор тарифа:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTariffOpen(!isTariffOpen)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:bg-white transition-all ${errors.selectedTariff ? "border-red-400 focus:ring-red-400 bg-red-50/30" : "border-gray-200 focus:ring-[#508223]"}`}
                  >
                    {selectedTariff ? (
                      <span className="text-sm text-gray-700">
                        Стоимость:{" "}
                        <span className="font-bold text-gray-900">
                          {tariffs[selectedTariff].price}
                        </span>
                        , Покрытие:{" "}
                        <span className="font-bold text-gray-900">
                          {tariffs[selectedTariff].coverage}
                        </span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        Выберите тариф
                      </span>
                    )}
                    <span
                      className={`text-gray-400 transition-transform ${isTariffOpen ? "rotate-180" : ""}`}
                    >
                      ▼
                    </span>
                  </button>
                  {errors.selectedTariff && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium">
                      {errors.selectedTariff}
                    </p>
                  )}
                  {isTariffOpen && (
                    <div className="absolute z-50 w-full top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto divide-y divide-gray-100">
                      {Object.entries(tariffs).map(([key, val]) => (
                        <div
                          key={key}
                          onClick={() => {
                            setSelectedTariff(key);
                            setIsTariffOpen(false);
                            setErrors((prev) => {
                              const { selectedTariff, ...rest } = prev;
                              return rest;
                            });
                          }}
                          className="py-2.5 px-4 hover:bg-[#508223]/10 cursor-pointer transition-colors text-sm flex flex-col gap-0.5 text-gray-700"
                        >
                          <div className="flex justify-between">
                            <span>Стоимость:</span>
                            <span className="font-bold text-gray-900">
                              {val.price}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Покрытие:</span>
                            <span className="font-semibold text-gray-800">
                              {val.coverage}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="px-6 py-3 bg-[#446e1e] hover:bg-[#385a18] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Следующий &gt;
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1 */}
            {activeTab === 1 && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-lg font-bold text-[#508223] mb-4">
                    Плательщик
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        <span className="text-red-500 mr-1">*</span>Паспорт:
                      </label>
                      <input
                        type="text"
                        placeholder="AA1234567"
                        value={payerPassport}
                        onChange={(e) => {
                          setPayerPassport(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, ""),
                          );
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 ${errors.payerPassport ? "border-red-400 bg-red-50/30" : "border-gray-200 focus:ring-[#508223]"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        <span className="text-red-500 mr-1">*</span>Дата
                        рождения:
                      </label>
                      <input
                        type="date"
                        value={payerBirthDate}
                        onChange={(e) => {
                          setPayerBirthDate(e.target.value);
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 ${errors.payerBirthDate ? "border-red-400 bg-red-50/30" : "border-gray-200 focus:ring-[#508223]"}`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        <span className="text-red-500 mr-1">*</span>Телефон:
                      </label>
                      <input
                        type="tel"
                        value={formatPhoneDisplay(payerPhone)}
                        placeholder="+998 00 000 00 00"
                        onChange={(e) =>
                          handlePhoneInput(
                            e.target.value,
                            setPayerPhone,
                            "payerPhone",
                          )
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 ${errors.payerPhone ? "border-red-400 bg-red-50/30" : "border-gray-200 focus:ring-[#508223]"}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        <span className="text-red-500 mr-1">*</span>ФИО:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={payerFullName}
                          onClick={handlePayerNameClick}
                          placeholder="Имя и фамилия"
                          className={`w-full pl-4 pr-10 py-2.5 bg-gray-50 border rounded-lg text-sm cursor-pointer ${errors.payerFullName ? "border-red-400 bg-red-50/30" : "border-gray-200"}`}
                        />
                        <button
                          type="button"
                          onClick={handlePayerNameClick}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#508223]"
                        >
                          <RiSearchLine size={24} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#508223] mb-4">
                    Застрахованное лицо(а)
                  </h3>
                  {insuredList.map((insured, index) => (
                    <div
                      key={insured.id}
                      className="bg-gray-50/50 p-4 rounded-xl border border-gray-150 mb-4 space-y-4 relative"
                    >
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => removeInsuredPerson(insured.id)}
                          className="absolute top-3 right-3 text-xs font-semibold text-red-500 bg-red-50 px-2.5 py-1 rounded-md"
                        >
                          Удалить ×
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            <span className="text-red-500 mr-1">*</span>Паспорт
                            #{index + 1}:
                          </label>
                          <input
                            type="text"
                            value={insured.passport}
                            placeholder="AA1234567"
                            onChange={(e) =>
                              updateInsuredField(
                                insured.id,
                                "passport",
                                e.target.value,
                              )
                            }
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 ${errors[`insured_${insured.id}_passport`] ? "border-red-400" : "border-gray-200"}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            <span className="text-red-500 mr-1">*</span>Дата
                            рождения #{index + 1}:
                          </label>
                          <input
                            type="date"
                            value={insured.birthDate}
                            onChange={(e) =>
                              updateInsuredField(
                                insured.id,
                                "birthDate",
                                e.target.value,
                              )
                            }
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 ${errors[`insured_${insured.id}_birthDate`] ? "border-red-400" : "border-gray-200"}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            <span className="text-red-500 mr-1">*</span>Телефон
                            #{index + 1}:
                          </label>
                          <input
                            type="text"
                            value={formatPhoneDisplay(insured.phone)}
                            placeholder="+998 00 000 00 00"
                            onChange={(e) => {
                              let value = e.target.value.replace(/\D/g, "");
                              if (value.length > 0 && !value.startsWith("998"))
                                value = "998" + value;
                              updateInsuredField(
                                insured.id,
                                "phone",
                                value.slice(0, 12),
                              );
                            }}
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:ring-2 ${errors[`insured_${insured.id}_phone`] ? "border-red-400" : "border-gray-200"}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            <span className="text-red-500 mr-1">*</span>ФИО:
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              readOnly
                              value={insured.fullName}
                              onClick={() =>
                                handleInsuredNameClick(
                                  insured.id,
                                  insured.passport,
                                  insured.birthDate,
                                )
                              }
                              placeholder="Имя и фамилия"
                              className={`w-full pl-4 pr-10 py-2.5 bg-white border rounded-lg text-sm cursor-pointer ${errors[`insured_${insured.id}_fullName`] ? "border-red-400" : "border-gray-200"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleInsuredNameClick(
                                  insured.id,
                                  insured.passport,
                                  insured.birthDate,
                                )
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#508223]"
                            >
                              <RiSearchLine size={24} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addInsuredPerson}
                    className="mt-2 px-4 py-2 border border-dashed border-[#508223] text-[#508223] bg-[#508223]/10 hover:bg-[#508223]/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 mx-auto"
                  >
                    <span className="text-base">+</span> Добавить еще
                  </button>
                </div>

                <div className="pt-2">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="oferta"
                      checked={isAgreed}
                      onChange={(e) => {
                        setIsAgreed(e.target.checked);
                        if (e.target.checked)
                          setErrors((prev) => {
                            const { isAgreed, ...rest } = prev;
                            return rest;
                          });
                      }}
                      className="w-4 h-4 mt-1 accent-[#508223] rounded focus:ring-[#508223]"
                    />
                    <label
                      htmlFor="oferta"
                      className="text-sm text-gray-600 select-none"
                    >
                      Ознакомлен(а) и согласен(а) с условиями{" "}
                      <span className="text-[#508223] font-semibold underline cursor-pointer">
                        публичной оферты
                      </span>
                    </label>
                  </div>
                  {errors.isAgreed && (
                    <p className="text-red-500 text-xs mt-1 font-medium ml-7">
                      {errors.isAgreed}
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab(0)}
                    className="px-6 py-3 border border-[#508223] text-[#508223] rounded-lg text-sm font-medium hover:bg-[#508223]/10 transition-colors"
                  >
                    &lt; Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenSummaryModal}
                    className="px-6 py-3 bg-[#446e1e] hover:bg-[#385a18] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Проверить данные &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- МОДАЛЬНОЕ ОКНО 1: Итоги (Вёрстка под скриншоты) --- */}
      {isSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#eef1f5] flex justify-center py-6 px-4 overflow-y-auto">
          <div className="w-full max-w-[1300px] flex flex-col md:flex-row gap-4 h-fit">
            {/* ЛЕВАЯ ЧАСТЬ (Основной контент) */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Фейковые табы (как на скрине 1) */}
              <div className="flex border-b border-[#cbd5e1] text-sm overflow-x-auto bg-[#eef1f5] shadow-sm">
                <div className="py-2.5 px-4 border-b-2 border-[#5a9533] font-semibold text-gray-800 whitespace-nowrap cursor-pointer">
                  Мурожаат қилувчи
                </div>
              </div>

              {/* Блок: Мурожаат қилувчи */}
              <div className="bg-white border border-[#e2e8f0] rounded shadow-sm">
                <div className="px-4 py-3 border-b border-[#e2e8f0] flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-[15px]">
                    Мурожаат қилувчи
                  </h3>
                  <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    Жисмоний шахс
                  </span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
                  <div className="grid grid-cols-[100px_1fr] gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Ф.И.О.</span>
                    <span className="text-gray-900 uppercase">
                      {payerFullName}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">
                      Туғилган куни
                    </span>
                    <span className="text-gray-900">
                      {formatDate(payerBirthDate)}
                      <span className="text-gray-500 ml-2">
                        (Ёши: {calculateAge(payerBirthDate)})
                      </span>
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Паспорт</span>
                    <span className="text-gray-900 uppercase">
                      {payerPassport}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 border-b border-gray-100 pb-2">
                    <span className="text-gray-500 font-medium">Қўшимча</span>
                    <span className="text-gray-900">
                      Телефон: +{payerPhone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Блок: Шартнома (как на скрине 2) */}
              <div className="bg-white border border-[#e2e8f0] rounded shadow-sm">
                <div className="px-4 py-3 border-b border-[#e2e8f0]">
                  <h3 className="font-bold text-gray-800 text-[15px]">
                    Шартнома
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Даври
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Бошланиши
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Тугаши
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Кун
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Нархи
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Коплаши
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-gray-100 text-gray-800">
                          1 йилга
                        </td>
                        <td className="p-3 border-b border-gray-100 text-gray-800">
                          {formatDate(startDate)}
                        </td>
                        <td className="p-3 border-b border-gray-100 text-gray-800">
                          {formatDate(endDate)}
                        </td>
                        <td className="p-3 border-b border-gray-100 text-gray-800">
                          365
                        </td>
                        <td className="p-3 border-b border-gray-100 text-gray-800 font-bold">
                          {getPrices().totalPriceStr} сўм
                        </td>
                        <td className="p-3 border-b border-gray-100 text-gray-800 font-bold">
                          {tariffs[selectedTariff!].coverage}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Блок: Суғурталанган шахслар (как на скрине 2) */}
              <div className="bg-white border border-[#e2e8f0] rounded shadow-sm">
                <div className="px-4 py-3 border-b border-[#e2e8f0]">
                  <h3 className="font-bold text-gray-800 text-[15px]">
                    Суғурталанган шахслар
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold w-10">
                          №
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Ф.И.О.
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Туғилган куни
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Паспорт
                        </th>
                        <th className="p-3 border-b border-gray-200 text-gray-600 font-bold">
                          Телефон
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {insuredList.map((ins, idx) => (
                        <tr key={ins.id} className="hover:bg-gray-50/50">
                          <td className="p-3 border-b border-gray-100 text-gray-800">
                            {idx + 1}
                          </td>
                          <td className="p-3 border-b border-gray-100 text-gray-800 uppercase">
                            {ins.fullName}
                          </td>
                          <td className="p-3 border-b border-gray-100 text-gray-800">
                            {formatDate(ins.birthDate)}
                          </td>
                          <td className="p-3 border-b border-gray-100 text-gray-800 uppercase">
                            {ins.passport}
                          </td>
                          <td className="p-3 border-b border-gray-100 text-gray-800">
                            {formatPhoneDisplay(ins.phone)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 w-fit transition-colors"
              >
                &larr; Назад к редактированию
              </button>
            </div>

            {/* ПРАВАЯ ЧАСТЬ (Сайдбар как на скрине 3) */}
            <div className="w-full md:w-[280px] flex flex-col gap-3 shrink-0">
              {/* ID info box */}
              <div className="bg-white border border-[#e2e8f0] rounded p-4 shadow-sm flex items-start gap-3">
                <div className="bg-[#1b84b8] text-white rounded-full p-1.5 shrink-0 mt-0.5">
                  <RiInformationFill size={20} />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-semibold mb-0.5 uppercase tracking-wide">
                    ID
                  </div>
                  <div className="text-[15px] font-bold text-gray-800 mb-3">
                    4895745
                  </div>

                  <div className="text-[11px] text-gray-500 font-semibold mb-0.5 uppercase tracking-wide">
                    UUID
                  </div>
                  <div className="text-[12px] text-gray-700 break-all leading-tight">
                    ecf1f2bd-31f3-4afa-b77f-0861d78eec9b
                  </div>
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-col gap-2">
                <button className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium text-[13px] rounded hover:bg-gray-50 transition-colors shadow-sm">
                  Асосида <RiFileCopyLine size={16} />
                </button>

                <button
                  onClick={() => setIsSummaryModalOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-[#cc3333] hover:bg-[#b32b2b] text-white font-medium text-[13px] rounded transition-colors shadow-sm"
                >
                  Ўчириш <RiDeleteBinLine size={16} />
                </button>

                <div className="border border-dashed border-[#5a9533] p-1 rounded">
                  <button
                    onClick={handlePolisBerish}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#5a9533] hover:bg-[#4d802b] text-white font-bold text-[14px] rounded transition-colors shadow-sm"
                  >
                    Полис бериш <RiFileTextLine size={18} />
                  </button>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 text-gray-700 font-medium text-[13px] rounded hover:bg-gray-50 transition-colors shadow-sm mt-1"
                >
                  Файл юклаш <RiDownloadLine size={16} />
                </button>
              </div>

              {/* Календарь */}
              <div className="bg-[#f8f9fa] border border-[#e2e8f0] rounded overflow-hidden shadow-sm mt-2">
                <div className="p-3 flex items-center gap-2 border-b border-[#e2e8f0] bg-white">
                  <RiCalendarLine size={16} className="text-gray-500" />
                  <span className="text-[13px] font-bold text-gray-800">
                    Шартнома санаси
                  </span>
                </div>
                <div className="p-4 text-center">
                  <div className="text-[15px] font-semibold text-gray-800 mb-4 capitalize">
                    {calendarInfo.monthYear}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-400 mb-3">
                    <div>ВС</div>
                    <div>ПН</div>
                    <div>ВТ</div>
                    <div>СР</div>
                    <div>ЧТ</div>
                    <div>ПТ</div>
                    <div>СБ</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[12px] text-gray-700">
                    {generateCalendarDays(startDate).map((day, index) => (
                      <div
                        key={index}
                        className={`p-1 flex items-center justify-center h-7 w-7 mx-auto rounded-full transition-all ${
                          day === calendarInfo.day
                            ? "bg-[#cc7a00] text-white font-bold shadow-sm"
                            : day !== null
                              ? "hover:bg-gray-100"
                              : "text-transparent"
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#e2e8f0] bg-[#f8f9fa] divide-y divide-[#e2e8f0] text-[12px]">
                  <div className="p-3 flex gap-4">
                    <span className="text-gray-500 w-6">Я...</span>
                    <span className="text-gray-800">
                      {calendarInfo.fullDate} <br />
                      <span className="text-gray-500">{calendarInfo.time}</span>
                    </span>
                  </div>
                  <div className="p-3 flex gap-4">
                    <span className="text-gray-500 w-6">Ф...</span>
                    <span className="text-gray-800 uppercase leading-tight">
                      {payerFullName.split(" ").join("\n")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            <div className="p-6 pb-0 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Оплата полиса
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaymentMethod("click")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${paymentMethod === "click" ? "border-[#00A5FF] text-[#00A5FF] bg-blue-50/50" : "border-transparent text-gray-500 hover:bg-gray-50"}`}
                >
                  CLICK
                </button>
                <button
                  onClick={() => setPaymentMethod("payme")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${paymentMethod === "payme" ? "border-[#33cccc] text-[#33cccc] bg-cyan-50/50" : "border-transparent text-gray-500 hover:bg-gray-50"}`}
                >
                  PAYME
                </button>
                <button
                  onClick={() => setPaymentMethod("paynet")}
                  className={`flex-1 py-3 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${paymentMethod === "paynet" ? "border-[#33cccc] text-[#33cccc] bg-cyan-50/50" : "border-transparent text-gray-500 hover:bg-gray-50"}`}
                >
                  PAYNET
                </button>
              </div>
            </div>

            <div className="p-8 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-56 h-56 bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center shadow-inner mb-4">
                <span className="text-gray-400 font-medium text-sm text-center px-4">
                  QR код <br /> (
                  {paymentMethod === "click"
                    ? "Click"
                    : paymentMethod === "payme"
                      ? "Payme"
                      : "Paynet"}
                  )
                </span>
              </div>
              <p className="text-xl font-black text-gray-800">
                {getPrices().totalPriceStr} UZS
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
              >
                Рад этиш
              </button>
              <button className="px-6 py-2.5 bg-[#508223] hover:bg-[#436d1d] text-white font-medium rounded-lg text-sm shadow-md transition-colors">
                Тўлаш
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
