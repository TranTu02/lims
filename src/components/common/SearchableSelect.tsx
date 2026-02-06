import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type Option = {
  value: string;
  label: string;
  keywords?: string;
};

type Props = {
  value: string | null;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;

  disabled?: boolean;
  loading?: boolean;
  error?: boolean;

  onChange: (value: string | null) => void;
  listMaxHeightClassName?: string;

  resetKey?: string | number;
};

export function SearchableSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  disabled,
  loading,
  error,
  onChange,
  listMaxHeightClassName = "max-h-64",
  resetKey,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [resetKey]);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-background",
            !selected?.label && "text-muted-foreground",
          )}
        >
          {loading
            ? t("common.loading")
            : error
              ? t("common.error")
              : selected?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={8}
          className="z-50 w-[--radix-popover-trigger-width] rounded-md border border-border bg-popover p-0 shadow-md"
        >
          <Command key={String(resetKey ?? "default")} shouldFilter>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList className={cn("overflow-y-auto", listMaxHeightClassName)}>
              <CommandEmpty>{t("common.noResults")}</CommandEmpty>

              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={`${o.label} ${o.value} ${o.keywords ?? ""}`}
                    onSelect={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span>{o.label}</span>
                      {o.label !== o.value ? (
                        <span className="text-xs text-muted-foreground">
                          {o.value}
                        </span>
                      ) : null}
                    </div>

                    {value === o.value ? <Check className="h-4 w-4" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
