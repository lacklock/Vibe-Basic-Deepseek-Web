import type { FormEvent, KeyboardEvent } from "react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  id: string;
  ariaLabel: string;
  placeholder: string;
  variant: "home" | "chat";
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
};

export function ChatComposer({
  id,
  ariaLabel,
  placeholder,
  variant,
  value,
  onValueChange,
  onSubmit,
  onStop,
  disabled = false,
}: ChatComposerProps) {
  const canSubmit = value.trim().length > 0 && !disabled;
  const canStop = disabled && onStop !== undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (canSubmit) {
      onSubmit();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (canSubmit) {
      onSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <InputGroup
        data-disabled={disabled || undefined}
        className={cn(
          "rounded-2xl bg-card shadow-[0_12px_40px_-28px_rgb(41_40_38/0.4)]",
          variant === "home" ? "min-h-44" : "min-h-32",
        )}
      >
        <label className="sr-only" htmlFor={id}>
          {ariaLabel}
        </label>
        <InputGroupTextarea
          id={id}
          aria-label={ariaLabel}
          rows={variant === "home" ? 3 : 2}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          className="min-h-20 px-5 pt-5 text-base leading-7 placeholder:text-muted-foreground"
        />
        <InputGroupAddon align="block-end" className="justify-between px-4 pb-4">
          <span className="text-xs font-normal text-muted-foreground">
            按 Enter 发送，Shift + Enter 换行
          </span>
          {canStop ? (
            <Button type="button" size="icon" aria-label="停止生成" onClick={onStop}>
              <SquareIcon className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button type="submit" size="icon" aria-label="发送消息" disabled={!canSubmit}>
              <ArrowUpIcon />
            </Button>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
