type LayoutProps = {
  children: React.ReactNode;
};

/**
 * 어드민 공통 래퍼. 인증 게이트는 각 페이지에서 requireAdmin() 으로 처리.
 * (/admin/login 자체는 게이트를 호출하면 안 되므로 layout 에서 일괄 처리하지 않는다.)
 */
export default function AdminLayout({ children }: LayoutProps) {
  return <div className="mx-auto max-w-4xl">{children}</div>;
}
