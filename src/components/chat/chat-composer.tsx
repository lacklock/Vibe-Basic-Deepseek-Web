import { ArrowUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type ChatComposerProps = {
  id: string;
  ariaLabel: string;
  placeholder: string;
  variant: "home" | "chat";
};

export function ChatComposer({ id, ariaLabel, placeholder, variant }: ChatComposerProps) {
  return (
    <InputGroup
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
        className="min-h-20 px-5 pt-5 text-base leading-7 placeholder:text-muted-foreground"
      />
      <InputGroupAddon align="block-end" className="justify-between px-4 pb-4">
        <span className="text-xs font-normal text-muted-foreground">
          按 Enter 发送，Shift + Enter 换行
        </span>
        <Button type="button" size="icon" aria-label="发送消息" disabled>
          <ArrowUpIcon />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
