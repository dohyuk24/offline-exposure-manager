import { WipPlaceholder } from "@/components/ui/wip-placeholder";

export default function MediaGuidePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[20px] font-semibold">매체별 가이드</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          현수막·족자·전단지 제작 가이드
        </p>
      </header>
      <WipPlaceholder />
    </div>
  );
}
