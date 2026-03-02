import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 h-14 flex items-center">
        <Link href="/" className="text-lg font-bold tracking-tight">
          layline
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        {children}
      </main>
    </div>
  );
}
