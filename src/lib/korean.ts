/** 한글 조사 헬퍼 — 받침 유무로 을/를 / 이/가 / 와/과 자동 선택. */

function endsInBatchim(word: string): boolean {
  if (!word) return false;
  const last = word.slice(-1);
  const code = last.charCodeAt(0);
  // 한글 음절 범위: AC00–D7A3
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0;
  }
  // 영문/숫자 fallback: 마지막 알파벳 모음/자음 추정
  const lower = last.toLowerCase();
  if (/[aeiou]/.test(lower)) return false;
  return true;
}

export function objectMarker(word: string): string {
  return endsInBatchim(word) ? "을" : "를";
}

export function subjectMarker(word: string): string {
  return endsInBatchim(word) ? "이" : "가";
}

export function withMarker(word: string): string {
  return endsInBatchim(word) ? "과" : "와";
}
