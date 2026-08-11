import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
};

export function AuthShell({
  title,
  description,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <section className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-8">
          <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">Vibe Chat</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {footerText}{" "}
          <Link
            href={footerLink}
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-white"
          >
            {footerLinkText}
          </Link>
        </p>
      </section>
    </main>
  );
}
