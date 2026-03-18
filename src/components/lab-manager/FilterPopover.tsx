import { useState, useMemo } from "react";
import { ChevronsUpDown, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface FilterPopoverProps {
    title: string;
    value: string | null;
    options: { value: string; label: string }[];
    onSelect: (val: string | null) => void;
    isLoading?: boolean;
    className?: string;
}

export function FilterPopover({ title, value, options, onSelect, isLoading = false, className }: FilterPopoverProps) {
    const [open, setOpen] = useState(false);
    const selectedOption = useMemo(() => options.find((o) => o.value === value), [value, options]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                        "h-8 gap-1 p-0 px-2 font-medium hover:bg-muted/50 rounded-none w-full justify-start text-muted-foreground shadow-none",
                        className
                    )}
                >
                    <span className="truncate">{title}</span>
                    {value && <span className="text-primary truncate max-w-[80px] text-xs">({selectedOption?.label ?? value})</span>}
                    <ChevronsUpDown className="ml-auto h-3 w-3 opacity-50 shrink-0" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Tìm kiếm ${title.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>Không có dữ liệu</CommandEmpty>
                        <CommandGroup>
                            <CommandItem 
                                onSelect={() => { 
                                    onSelect(null); 
                                    setOpen(false); 
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                                -- Tất cả --
                            </CommandItem>
                            {isLoading ? (
                                <div className="p-4 flex justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                </div>
                            ) : (
                                options.map((opt) => (
                                    <CommandItem 
                                        key={opt.value} 
                                        value={opt.label} 
                                        onSelect={() => { 
                                            onSelect(opt.value); 
                                            setOpen(false); 
                                        }}
                                    >
                                        <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                                        {opt.label}
                                    </CommandItem>
                                ))
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
