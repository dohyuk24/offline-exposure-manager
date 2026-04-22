type WipPlaceholderProps = {
  title?: string;
  message?: string;
};

export function WipPlaceholder({
  title = "공사 중이에요",
  message = "열심히 만들고 있어요. 곧 오픈할게요!",
}: WipPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-center"
      style={{ padding: "48px" }}
    >
      <div className="text-2xl" aria-hidden>
        🚧
      </div>
      <p className="text-[15px] font-medium text-[var(--color-text-primary)]">
        {title}
      </p>
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
    </div>
  );
}
