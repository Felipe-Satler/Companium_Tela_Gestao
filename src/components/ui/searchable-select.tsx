import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  emptyText?: string | undefined;
  allOption?: SearchableSelectOption | null | undefined;
  triggerClassName?: string | undefined;
  contentClassName?: string | undefined;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  allOption = { value: "all", label: "Todos" },
  triggerClassName,
  contentClassName,
}: SearchableSelectProps) {
  const selected =
    allOption && value === allOption.value
      ? allOption
      : options.find((o) => o.value === value);

  const isSelected = Boolean(
    selected && (!allOption || value !== allOption.value)
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          data-selected={isSelected ? "true" : "false"}
          className={cn(
            "neu-select-trigger w-fit shrink-0 justify-between border-0 text-xs font-normal",
            !selected && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="whitespace-nowrap pl-1">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("neu-select-content p-0", contentClassName)}
        align="start"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-xs neu-select-search"
          />
          <CommandList className="neu-scroll">
            <CommandEmpty className="text-xs text-muted-foreground">
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {allOption && (
                <CommandItem
                  value={allOption.label}
                  onSelect={() => onValueChange(allOption.value)}
                  className="neu-select-item"
                  data-selected={value === allOption.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === allOption.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {allOption.label}
                </CommandItem>
              )}
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.label}
                  onSelect={() => onValueChange(opt.value)}
                  className="neu-select-item"
                  data-selected={value === opt.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === opt.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
