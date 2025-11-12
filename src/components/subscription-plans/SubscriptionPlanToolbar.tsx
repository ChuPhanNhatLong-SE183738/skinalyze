"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FindSubscriptionPlansDto,
  SubscriptionPlanSortBy,
} from "@/types/subscription-plan";
import { Search, ArrowDown, ArrowUp } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface SubscriptionPlanToolbarProps {
  dermatologistId?: string;
  onFiltersChange: (newFilters: FindSubscriptionPlansDto) => void;
}

export function SubscriptionPlanToolbar({
  dermatologistId,
  onFiltersChange,
}: SubscriptionPlanToolbarProps) {
  const [localFilters, setLocalFilters] = useState<FindSubscriptionPlansDto>(
    {}
  );

  const debouncedFilters = useDebounce(localFilters, 500); // 500ms debounce

  useEffect(() => {
    if (dermatologistId) {
      setLocalFilters((prev) => ({
        ...prev,
        dermatologistId: dermatologistId,
      }));
    }
  }, [dermatologistId]);

  useEffect(() => {
    onFiltersChange(debouncedFilters);
  }, [debouncedFilters, onFiltersChange]);

  const handleFilterChange = (
    key: keyof FindSubscriptionPlansDto,
    value: any
  ) => {
    // If value is "ALL", set undefined to remove the filter
    const newValue = value === "ALL" ? undefined : value;

    setLocalFilters((prev) => ({ ...prev, [key]: newValue }));
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* 1. Search Box */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm theo tên gói..."
          className="pl-10"
          value={localFilters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
        />
      </div>

      <div className="flex gap-4">
        {/* 2. Filter status */}
        <Select
          value={
            localFilters.isActive === undefined
              ? "ALL"
              : localFilters.isActive
              ? "true"
              : "false"
          }
          onValueChange={(value) =>
            handleFilterChange(
              "isActive",
              value === "ALL" ? undefined : value === "true"
            )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả Trạng Thái</SelectItem>
            <SelectItem value="true">Kích hoạt</SelectItem>
            <SelectItem value="false">Ẩn</SelectItem>
          </SelectContent>
        </Select>

        {/* 3. Sort By*/}
        <Select
          value={localFilters.sortBy || SubscriptionPlanSortBy.CREATED_AT}
          onValueChange={(value) => handleFilterChange("sortBy", value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sắp xếp theo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SubscriptionPlanSortBy.CREATED_AT}>
              Mới nhất
            </SelectItem>
            <SelectItem value={SubscriptionPlanSortBy.PLAN_NAME}>
              Tên (A-Z)
            </SelectItem>
            <SelectItem value={SubscriptionPlanSortBy.BASE_PRICE}>
              Giá
            </SelectItem>
            <SelectItem value={SubscriptionPlanSortBy.TOTAL_SESSIONS}>
              Số buổi
            </SelectItem>
          </SelectContent>
        </Select>

        {/* --- 4. Sort Order */}
        <Select
          value={localFilters.sortOrder || "DESC"}
          onValueChange={(value) => handleFilterChange("sortOrder", value)}
        >
          <SelectTrigger className="w-[130px]">
            {localFilters.sortOrder === "ASC" ? (
              <ArrowUp className="mr-2 h-4 w-4 text-muted-foreground" />
            ) : (
              <ArrowDown className="mr-2 h-4 w-4 text-muted-foreground" />
            )}
            <SelectValue placeholder="Thứ tự..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DESC">
              <span>Giảm dần</span>
            </SelectItem>
            <SelectItem value="ASC">
              <span>Tăng dần</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
