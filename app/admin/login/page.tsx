import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { Wordmark } from "@/components/brand/Wordmark";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const params = await searchParams;
  const raw = params?.next;
  const next = typeof raw === "string" ? raw : "/admin";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center">
      <div className="rounded-2xl border border-mist bg-white p-8">
        <Wordmark href={null} markClassName="h-8" />

        <h1 className="mt-7 font-display text-[length:var(--text-h3)] text-ink">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-slate">
          For the BrainLIT team. Ask Haja if you need an account.
        </p>

        <LoginForm next={next} />
      </div>
    </div>
  );
}
