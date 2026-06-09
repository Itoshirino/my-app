"use client";

import { useState } from "react";
import Texture from "./texture.png";
import { RiSearchLine } from "@remixicon/react";

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

  // Данные плательщика
  const [payerPassport, setPayerPassport] = useState("");
  const [payerBirthDate, setPayerBirthDate] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [payerFullName, setPayerFullName] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);

  const [insuredList, setInsuredList] = useState([
    { id: 1, passport: "", birthDate: "", phone: "", fullName: "" },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const tabs = ["Расчет стоимости", "Застрахованные лица", "Оплата"];

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

    const totalPriceNum = activeTab === 0 ? basePriceNum : basePriceNum * count;

    return {
      basePriceStr: tariff.price,
      totalPriceStr: totalPriceNum.toLocaleString("ru-RU").replace(/,/g, " "),
      count,
    };
  };

  const handleInsuredCountChange = (val: string) => {
    setInsuredCount(val);
    const count = parseInt(val, 10);

    if (!isNaN(count) && count > 0) {
      setInsuredList((prev) => {
        if (prev.length === count) return prev;
        if (prev.length < count) {
          const added = Array.from({ length: count - prev.length }, (_, i) => ({
            id: Date.now() + i + Math.random(),
            passport: "",
            birthDate: "",
            phone: "",
            fullName: "",
          }));
          return [...prev, ...added];
        }
        return prev.slice(0, count);
      });
    } else {
      setInsuredList([
        { id: 1, passport: "", birthDate: "", phone: "", fullName: "" },
      ]);
    }
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
      const user = mockDatabase[searchKey];
      setPayerFullName(user.fullName);
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
      const user = mockDatabase[searchKey];
      updateInsuredField(id, "fullName", user.fullName);
      setErrors((prev) => {
        const { [`insured_${id}_fullName`]: _, ...rest } = prev;
        return rest;
      });
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

  const validateTab0 = () => {
    const newErrors: { [key: string]: string } = {};
    if (!insuredCount || parseInt(insuredCount, 10) < 1) {
      newErrors.insuredCount = "Пожалуйста, укажите число застрахованных";
    }
    if (!startDate) {
      newErrors.startDate = "Пожалуйста, выберите дату начала страхования";
    }
    if (!selectedTariff) {
      newErrors.selectedTariff = "Пожалуйста, выберите подходящий тариф";
    }
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

  const handleNextTab = (nextTabIndex: number) => {
    let validateErrors = {};
    if (activeTab === 0) validateErrors = validateTab0();
    if (activeTab === 1) validateErrors = validateTab1();

    if (Object.keys(validateErrors).length > 0) {
      setErrors(validateErrors);
      return;
    }
    setErrors({});
    setActiveTab(nextTabIndex);
  };

  const handlePhoneInput = (
    val: string,
    setter: (v: string) => void,
    fieldKey?: string,
  ) => {
    let value = val.replace(/\D/g, "");
    if (value.length > 0 && !value.startsWith("998")) {
      value = "998" + value;
    }
    const finalVal = value.slice(0, 12);
    setter(finalVal);
    if (fieldKey && finalVal.length === 12) {
      setErrors((prev) => {
        const { [fieldKey]: _, ...rest } = prev;
        return rest;
      });
    }
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
        if (item.id === id) {
          const updated = {
            ...item,
            [field]:
              field === "passport"
                ? value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                : value,
          };
          return updated;
        }
        return item;
      }),
    );
    setErrors((prev) => {
      const { [`insured_${id}_${field}`]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm relative">
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
                className={`px-8 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex-1 text-center
                  ${
                    activeTab === i
                      ? "border-[#508223] text-[#fefefefe] bg-[#436d1d]"
                      : "border-transparent text-gray-400"
                  }`}
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
                    Число застрахованных:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={insuredCount}
                    onChange={(e) => handleInsuredCountChange(e.target.value)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.insuredCount
                        ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                        : "border-gray-200 focus:ring-[#508223]"
                    }`}
                  />
                  {errors.insuredCount && (
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                      {errors.insuredCount}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2 font-medium">
                      Начало страхования:
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      max="2100-12-31"
                      value={startDate}
                      onKeyDown={(e) => e.preventDefault()}
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
                      className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white cursor-pointer transition-all ${
                        errors.startDate
                          ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                          : "border-gray-200 focus:ring-[#508223]"
                      }`}
                    />
                    {errors.startDate && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                        {" "}
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
                    Выбор тарифа:
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsTariffOpen(!isTariffOpen)}
                    className={`w-full px-4 py-3.5 bg-gray-50 border rounded-xl flex justify-between items-center text-left focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      errors.selectedTariff
                        ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                        : "border-gray-200 focus:ring-[#508223]"
                    }`}
                  >
                    {selectedTariff ? (
                      <span className="text-sm text-gray-700">
                        Стоимость полиса:{" "}
                        <span className="font-bold text-gray-900">
                          {tariffs[selectedTariff].price}
                        </span>
                        , Сумма покрытия:{" "}
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
                    <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                      {" "}
                      {errors.selectedTariff}
                    </p>
                  )}

                  {isTariffOpen && (
                    <div className="absolute z-50 w-full bottom-full mb-2 min-[800px]:top-full min-[800px]:bottom-auto min-[800px]:mb-0 min-[800px]:mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[220px] overflow-y-auto divide-y divide-gray-100">
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
                            <span>Стоимость полиса:</span>
                            <span className="font-bold text-gray-900">
                              {val.price}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Сумма покрытия:</span>
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
                    onClick={() => handleNextTab(1)}
                    className="px-6 py-3 bg-[#446e1e] hover:bg-[#385a18] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Следующий &gt;
                  </button>
                </div>
              </div>
            )}

            {activeTab === 1 && (
              <div className="space-y-8">
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-lg font-bold text-[#508223] mb-4">
                    Плательщик
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        Серия и номер паспорта:
                      </label>
                      <input
                        type="text"
                        placeholder="AA1234567"
                        value={payerPassport}
                        onChange={(e) => {
                          const cleanVal = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          setPayerPassport(cleanVal);
                          setErrors((prev) => {
                            const { payerPassport, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                          errors.payerPassport
                            ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                            : "border-gray-200 focus:ring-[#508223]"
                        }`}
                      />
                      {errors.payerPassport && (
                        <p className="text-red-500 text-xs mt-1 font-medium">
                          {" "}
                          {errors.payerPassport}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        Дата рождения:
                      </label>
                      <input
                        type="date"
                        value={payerBirthDate}
                        onChange={(e) => {
                          setPayerBirthDate(e.target.value);
                          setErrors((prev) => {
                            const { payerBirthDate, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                          errors.payerBirthDate
                            ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                            : "border-gray-200 focus:ring-[#508223]"
                        }`}
                      />
                      {errors.payerBirthDate && (
                        <p className="text-red-500 text-xs mt-1 font-medium">
                          {" "}
                          {errors.payerBirthDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        Номер телефона:
                      </label>
                      <input
                        type="tel"
                        placeholder="+998 00 123 45 67"
                        value={formatPhoneDisplay(payerPhone)}
                        onChange={(e) =>
                          handlePhoneInput(
                            e.target.value,
                            setPayerPhone,
                            "payerPhone",
                          )
                        }
                        className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                          errors.payerPhone
                            ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                            : "border-gray-200 focus:ring-[#508223]"
                        }`}
                      />
                      {errors.payerPhone && (
                        <p className="text-red-500 text-xs mt-1 font-medium">
                          {" "}
                          {errors.payerPhone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1 font-medium">
                        Имя и фамилия:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={payerFullName}
                          onClick={handlePayerNameClick}
                          placeholder="Имя и фамилия"
                          className={`w-full pl-4 pr-10 py-2.5 bg-gray-50 border rounded-lg text-sm cursor-pointer text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                            errors.payerFullName
                              ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                              : "border-gray-200 focus:ring-[#508223]"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handlePayerNameClick}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#508223] transition-colors"
                          title="Поиск ФИО по паспорту"
                        >
                          <RiSearchLine size={24} />
                        </button>
                      </div>
                      {errors.payerFullName && (
                        <p className="text-red-500 text-xs mt-1 font-medium">
                          {errors.payerFullName}
                        </p>
                      )}
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
                          className="absolute top-3 right-3 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          Удалить ×
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            Серия и номер паспорта лица #{index + 1}:
                          </label>
                          <input
                            type="text"
                            placeholder="AA7654321"
                            value={insured.passport}
                            onChange={(e) =>
                              updateInsuredField(
                                insured.id,
                                "passport",
                                e.target.value,
                              )
                            }
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                              errors[`insured_${insured.id}_passport`]
                                ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                                : "border-gray-200 focus:ring-[#508223]"
                            }`}
                          />
                          {errors[`insured_${insured.id}_passport`] && (
                            <p className="text-red-500 text-xs mt-1 font-medium">
                              {" "}
                              {errors[`insured_${insured.id}_passport`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            Дата рождения лица #{index + 1}:
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
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                              errors[`insured_${insured.id}_birthDate`]
                                ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                                : "border-gray-200 focus:ring-[#508223]"
                            }`}
                          />
                          {errors[`insured_${insured.id}_birthDate`] && (
                            <p className="text-red-500 text-xs mt-1 font-medium">
                              {" "}
                              {errors[`insured_${insured.id}_birthDate`]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            Номер телефона лица #{index + 1}:
                          </label>
                          <input
                            type="text"
                            placeholder="+998 00 123 45 67"
                            value={formatPhoneDisplay(insured.phone)}
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
                            className={`w-full px-4 py-2.5 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                              errors[`insured_${insured.id}_phone`]
                                ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                                : "border-gray-200 focus:ring-[#508223]"
                            }`}
                          />
                          {errors[`insured_${insured.id}_phone`] && (
                            <p className="text-red-500 text-xs mt-1 font-medium">
                              {" "}
                              {errors[`insured_${insured.id}_phone`]}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-gray-600 mb-1 font-medium">
                            Имя и фамилия застрахованного:
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
                              className={`w-full pl-4 pr-10 py-2.5 bg-white border rounded-lg text-sm cursor-pointer text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                errors[`insured_${insured.id}_fullName`]
                                  ? "border-red-400 focus:ring-red-400 bg-red-50/30"
                                  : "border-gray-200 focus:ring-[#508223]"
                              }`}
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
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#508223] transition-colors"
                              title="Поиск ФИО по паспорту"
                            >
                              <RiSearchLine size={24} />
                            </button>
                          </div>
                          {errors[`insured_${insured.id}_fullName`] && (
                            <p className="text-red-500 text-xs mt-1 font-medium">
                              {" "}
                              {errors[`insured_${insured.id}_fullName`]}
                            </p>
                          )}
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
                      <span className="text-[#508223] font-semibold underline cursor-pointer hover:text-[#446e1e]">
                        публичной оферты
                      </span>
                    </label>
                  </div>
                  {errors.isAgreed && (
                    <p className="text-red-500 text-xs mt-1 font-medium ml-7">
                      {" "}
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
                    onClick={() => handleNextTab(2)}
                    className="px-6 py-3 bg-[#446e1e] hover:bg-[#385a18] text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                  >
                    Следующий &gt;
                  </button>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-4 font-medium">
                    Выберите способ оплаты:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("click")}
                      className={`p-6 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-4 ${
                        paymentMethod === "click"
                          ? "bg-blue-50 border-[#00A5FF]/50 shadow-md"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center">
                        <svg
                          height="32"
                          viewBox="0 0 120 32"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <text
                            x="50%"
                            y="24"
                            textAnchor="middle"
                            fontFamily="Arial, Helvetica, sans-serif"
                            fontWeight="900"
                            fontSize="28"
                            fill="#00A5FF"
                            letterSpacing="-1"
                          >
                            CLICK
                          </text>
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        Click
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("payme")}
                      className={`p-6 border-2 rounded-xl transition-all flex flex-col items-center justify-center gap-4 ${
                        paymentMethod === "payme"
                          ? "bg-cyan-50 border-[#33cccc]/50 shadow-md"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-10 flex items-center justify-center">
                        <img
                          src="https://cdn.payme.uz/logo/payme_color.svg"
                          alt="Payme"
                          className="h-8 object-contain"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        Payme
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="px-6 py-3 border border-[#508223] text-[#508223] rounded-lg text-sm font-medium hover:bg-[#508223]/10 transition-colors"
                  >
                    &lt; Назад
                  </button>
                  <button
                    type="button"
                    disabled={!paymentMethod}
                    className="px-8 py-3 bg-[#446e1e] hover:bg-[#385a18] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
                  >
                    Оплатить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-72 bg-white rounded-2xl border border-gray-200 p-6 h-fit sticky top-8 shadow-sm">
          <h3 className="text-base font-bold text-[#508223] mb-4 border-b pb-2">
            Результаты расчета
          </h3>
          <div className="space-y-4 text-sm">
            {startDate && (
              <div>
                <p className="text-gray-400 text-xs">Начало страхования:</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(startDate)}
                </p>
              </div>
            )}
            {endDate && (
              <div>
                <p className="text-gray-400 text-xs">Конец страхования:</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(endDate)}
                </p>
              </div>
            )}

            {selectedTariff &&
              (() => {
                const { basePriceStr, totalPriceStr, count } = getPrices();
                return (
                  <>
                    <div>
                      <p className="text-gray-400 text-xs">Сумма покрытия:</p>
                      <p className="font-bold text-[#508223]">
                        {tariffs[selectedTariff].coverage} UZS
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Стоимость полиса:</p>
                      <p className="font-semibold text-gray-700">
                        {basePriceStr} UZS
                      </p>
                    </div>
                    <div className="pt-2 border-t border-dashed border-gray-200 bg-[#508223]/10 p-2 rounded-lg">
                      <p className="text-gray-500 text-xs font-medium">
                        Общая сумма оплаты{" "}
                        {activeTab > 0 && count > 1 && (
                          <span className="text-xs text-gray-400 font-normal italic mt-0.5">
                            ({count}×):
                          </span>
                        )}
                      </p>
                      <p className="font-black text-[#508223] text-base">
                        {totalPriceStr} UZS
                      </p>
                    </div>
                  </>
                );
              })()}

            {insuredList.some((ins) => ins.fullName || ins.passport) && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-400 text-xs mb-1">
                  Застрахованные лица:
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {insuredList.map((insured, index) => {
                    if (!insured.fullName && !insured.passport) return null;
                    return (
                      <p
                        key={insured.id}
                        className="font-semibold text-gray-900 text-xs leading-tight"
                      >
                        {index + 1}. {insured.fullName || "—"}{" "}
                        {insured.passport ? `• ${insured.passport}` : ""}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {paymentMethod && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-gray-400 text-xs">Способ оплаты:</p>
                <p className="font-bold text-[#508223] flex items-center gap-1.5 capitalize">
                  {paymentMethod === "click" ? " CLICK" : "PAYME"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
