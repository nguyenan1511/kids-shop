import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Đăng nhập quản trị", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ loi?: string }> }) {
  const { loi } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <LoginForm notAdmin={loi === "khong-co-quyen"} />
    </main>
  );
}
