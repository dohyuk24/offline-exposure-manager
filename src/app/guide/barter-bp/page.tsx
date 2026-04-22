import { WipPlaceholder } from "@/components/ui/wip-placeholder";

export default function BarterBpPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">바터제휴 BP</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          우수 바터제휴 사례 아카이브
        </p>
      </header>
      <WipPlaceholder />
    </div>
  );
}
