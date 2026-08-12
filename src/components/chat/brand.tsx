import { TriangleIcon } from "lucide-react";

export function Brand() {
  return (
    <div className="flex h-10 items-center gap-2.5 px-2">
      <span className="relative grid size-7 place-items-center text-primary" aria-hidden="true">
        <TriangleIcon className="size-6 stroke-[1.8]" />
        <span className="absolute right-0.5 bottom-1 size-2.5 rounded-sm bg-ring/80" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">Vibe chat</span>
    </div>
  );
}
