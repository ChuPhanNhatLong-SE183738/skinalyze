"use client";

import { useTreatment } from "@/contexts/TreatmentContext";
import { ProductDisplayCard } from "./ProductDisplayCard";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Sunset,
  Moon,
  Pill,
  Layers,
  Stethoscope,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  History,
} from "lucide-react";
import Image from "next/image";
import type { RoutineDetail } from "@/types/routine-detail";
import { Button } from "../ui/button";

export function RoutineViewer() {
  const {
    activeRoutine,
    productCache,
    timelineEvents,
    currentActiveRoutine,
    resetToCurrent,
  } = useTreatment();

  if (!activeRoutine) return null;
  const originalRoutineId = currentActiveRoutine?.routineId;
  const isViewingHistory =
    originalRoutineId && activeRoutine.routineId !== originalRoutineId;
  // const safeDetails = activeRoutine.routineDetails ?? [];
  const safeDetails = (activeRoutine.routineDetails ?? []).filter((detail) => {
    // If view timeline history, show all details
    if (isViewingHistory) {
      return true;
    }
    // If view current routine, hide those that are inactive
    return detail.isActive !== false;
  });

  // Helper find Timeline info (Note & Images)
  const matchedEvent = timelineEvents.find(
    (event) =>
      event.routine &&
      ((event.routine as any).routineId === activeRoutine.routineId ||
        activeRoutine.createdFromAppointmentId === event.id)
  );

  // Helper filter type
  const getDetailsByType = (type: string) =>
    safeDetails.filter((d) => d.stepType === type);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    details: RoutineDetail[],
    colorClass: string
  ) => {
    if (!details.length) return null;

    return (
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header Section */}
        <div
          className={`flex items-center gap-2 mb-4 pb-2 border-b-2 ${colorClass}`}
        >
          {icon}
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {title}
          </h2>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {details.map((detail) => (
            <div
              key={detail.routineDetailId}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              {/* Instructions */}
              <div className="mb-4">
                <p className="text-slate-600 italic text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {detail.content}
                </p>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(detail.products ?? []).map((prod, idx) => {
                  const cachedProduct = prod.productId
                    ? productCache[prod.productId]
                    : null;
                  return (
                    <ProductDisplayCard
                      key={`${detail.routineDetailId}-${idx}`}
                      routineProduct={prod}
                      inventoryProduct={cachedProduct}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2 pb-20">
      {isViewingHistory && (
        <div className=" top-0 z-20 -mx-6 px-6 py-3 bg-amber-50/90 backdrop-blur border-b border-amber-200 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <History className="w-4 h-4" />
            <span className="text-xs font-semibold">Viewing Timeline </span>
          </div>

          <Button
            size="sm"
            variant="default"
            className="h-8 bg-amber-600 hover:bg-amber-700 text-white border-none shadow-none"
            onClick={resetToCurrent}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Back to Current Routine
          </Button>
        </div>
      )}

      {/* 1. Header Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {activeRoutine.routineName}
        </h1>
        <div className="flex gap-2 mt-2 items-center">
          <Badge
            variant="outline"
            className={
              activeRoutine.status === "ACTIVE"
                ? "bg-green-50 text-green-700 border-green-200"
                : ""
            }
          >
            {activeRoutine.status}
          </Badge>
          <span className="text-sm text-slate-500">
            Updated: {new Date(activeRoutine.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* 2. Clinical Snapshot */}
      {matchedEvent &&
        (matchedEvent.doctorNote ||
          (matchedEvent.skinAnalysisImages &&
            matchedEvent.skinAnalysisImages.length > 0)) && (
          <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 animate-in fade-in duration-700 mb-10">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-200/60">
              <Stethoscope className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-blue-900">
                Clinical Context
              </h2>
              <span className="text-xs text-blue-600 font-medium ml-auto bg-blue-100 px-2 py-1 rounded-full">
                Visit: {new Date(matchedEvent.date).toLocaleDateString()}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Doctor Note */}
              {matchedEvent.doctorNote && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Medical Note
                  </p>
                  <div className="bg-white p-4 rounded-xl border border-blue-100 text-slate-700 text-sm italic shadow-sm h-full">
                    {matchedEvent.doctorNote}
                  </div>
                </div>
              )}

              {/* Skin Images */}
              {matchedEvent.skinAnalysisImages &&
                matchedEvent.skinAnalysisImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-blue-400 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Skin status
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {matchedEvent.skinAnalysisImages.map((src, idx) => (
                        <a
                          key={idx}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="block group relative aspect-square overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm hover:ring-2 hover:ring-blue-400 transition-all"
                        >
                          <Image
                            src={src}
                            alt="Skin analysis"
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="(max-width: 768px) 33vw, 150px"
                            unoptimized
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

      {renderSection(
        "Morning Routine",
        <Sun className="text-yellow-500" />,
        getDetailsByType("morning"),
        "border-orange-200"
      )}
      {renderSection(
        "Noon / Midday",
        <Sunset className="text-red-500" />,
        getDetailsByType("noon"),
        "border-yellow-200"
      )}
      {renderSection(
        "Evening Routine",
        <Moon className="text-indigo-500" />,
        getDetailsByType("evening"),
        "border-indigo-200"
      )}
      {renderSection(
        "Oral Medications",
        <Pill className="text-blue-500" />,
        getDetailsByType("oral"),
        "border-blue-200"
      )}

      {/* 4. Routine Sections (OTHER - Custom Titles) */}
      {getDetailsByType("other").map((detail, index) => {
        // Logic lấy tiêu đề: Nếu có description -> Dùng làm Title. Nếu không -> "Additional Guidance"
        const customTitle = detail.description?.trim() || "Additional Guidance";

        return (
          <div key={detail.routineDetailId || index}>
            {/* Tái sử dụng hàm renderSection nhưng truyền vào mảng chỉ chứa 1 phần tử */}
            {renderSection(
              customTitle,
              <Layers className="text-slate-500" />,
              [detail], // Wrap detail vào array
              "border-slate-200"
            )}
          </div>
        );
      })}
    </div>
  );
}
