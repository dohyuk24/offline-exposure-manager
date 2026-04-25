import Link from "next/link";

import type { Branch } from "@/types";
import { createServerSupabase } from "@/lib/supabase/client";
import { listBranchSummaries } from "@/lib/supabase/queries/branches";
import { currentYearMonth } from "@/lib/date";
import { requireAdmin } from "@/lib/admin-auth";
import { formatError } from "@/lib/format-error";
import { ConnectionError } from "@/components/ui/connection-error";

import {
  createBranchAction,
  logoutAdminAction,
  toggleBranchActiveAction,
  updateBranchAction,
} from "./actions";

export default async function AdminPage() {
  await requireAdmin();

  const yearMonth = currentYearMonth();

  let allBranches: Branch[] = [];
  let summaries: Awaited<ReturnType<typeof listBranchSummaries>> = [];
  let loadError: string | null = null;

  try {
    const supabase = await createServerSupabase();
    const { data: branchesData, error } = await supabase
      .from("branches")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    allBranches = (branchesData ?? []) as Branch[];

    summaries = await listBranchSummaries(yearMonth);
  } catch (err) {
    loadError = formatError(err);
  }

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            운영
          </p>
          <h1 className="text-[20px] font-semibold">어드민</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            마케팅실 전용 · {yearMonth} 기준
          </p>
        </div>
        <form action={logoutAdminAction}>
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            로그아웃
          </button>
        </form>
      </header>

      {loadError ? <ConnectionError detail={loadError} /> : null}

      <Section title="전체 랭킹">
        <RankingTable summaries={summaries} />
      </Section>

      <Section title="지점 관리">
        <AddBranchForm />
        <BranchTable branches={allBranches} />
      </Section>

      <Section title="기타 설정">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          점수 가중치 · Slack 설정 · BP 콘텐츠 관리는 후속 브랜치에서 열릴
          예정이에요.
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-medium">{title}</h2>
      {children}
    </section>
  );
}

function RankingTable({
  summaries,
}: {
  summaries: Awaited<ReturnType<typeof listBranchSummaries>>;
}) {
  if (summaries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        지점 데이터가 없어요.
      </p>
    );
  }

  const sorted = [...summaries].sort(
    (a, b) => b.monthlyScore - a.monthlyScore
  );

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--color-bg-secondary)] text-left text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-3 py-2">#</th>
            <th className="px-3 py-2">지점</th>
            <th className="px-3 py-2 text-right">점수</th>
            <th className="px-3 py-2 text-right">매체</th>
            <th className="px-3 py-2 text-right">예산 사용</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b, index) => (
            <tr
              key={b.id}
              className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]/50"
            >
              <td className="px-3 py-2 text-[var(--color-text-tertiary)]">
                {index + 1}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/branches/${b.slug}`}
                  className="font-medium hover:underline"
                >
                  {b.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {b.monthlyScore}점
              </td>
              <td className="px-3 py-2 text-right">{b.mediaCount}</td>
              <td className="px-3 py-2 text-right">
                {b.monthlyBudgetUsed.toLocaleString("ko-KR")}원
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddBranchForm() {
  return (
    <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-4">
      <summary className="cursor-pointer text-sm font-medium">
        + 새 지점 추가
      </summary>
      <form action={createBranchAction} className="mt-4 space-y-3">
        <Field name="name" label="이름" placeholder="예: 역삼ARC" required />
        <Field
          name="slug"
          label="슬러그 (URL)"
          placeholder="비워두면 이름에서 자동 생성"
        />
        <Field
          name="budget_monthly"
          label="월 예산 (원)"
          type="number"
          defaultValue="500000"
          required
        />
        <Field
          name="slack_channel"
          label="Slack 채널 ID"
          placeholder="C_EXAMPLE"
        />
        <Field
          name="slack_user_group_id"
          label="Slack 그룹 태그 ID"
          placeholder="S_EXAMPLE (예: S0XXXXX)"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          지점 추가
        </button>
      </form>
    </details>
  );
}

function BranchTable({ branches }: { branches: Branch[] }) {
  if (branches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">
        등록된 지점이 없어요.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {branches.map((branch) => (
        <BranchRow key={branch.id} branch={branch} />
      ))}
    </div>
  );
}

function BranchRow({ branch }: { branch: Branch }) {
  return (
    <details className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3">
      <summary className="flex cursor-pointer items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{branch.name}</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">
            /{branch.slug}
          </span>
          {branch.is_active ? null : (
            <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
              비활성
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--color-text-tertiary)]">
          월 {branch.budget_monthly.toLocaleString("ko-KR")}원
        </span>
      </summary>

      <div className="mt-4 space-y-3">
        <form action={updateBranchAction} className="space-y-3">
          <input type="hidden" name="id" value={branch.id} />
          <Field
            name="name"
            label="이름"
            defaultValue={branch.name}
            required
          />
          <Field
            name="budget_monthly"
            label="월 예산 (원)"
            type="number"
            defaultValue={String(branch.budget_monthly)}
            required
          />
          <Field
            name="slack_channel"
            label="Slack 채널 ID"
            defaultValue={branch.slack_channel ?? ""}
          />
          <Field
            name="slack_user_group_id"
            label="Slack 그룹 태그 ID"
            defaultValue={branch.slack_user_group_id ?? ""}
            placeholder="S_EXAMPLE (예: S0XXXXX)"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            저장
          </button>
        </form>

        <form action={toggleBranchActiveAction}>
          <input type="hidden" name="id" value={branch.id} />
          <input
            type="hidden"
            name="is_active"
            value={branch.is_active ? "false" : "true"}
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {branch.is_active ? "비활성화" : "활성화"}
          </button>
        </form>
      </div>
    </details>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      />
    </label>
  );
}
