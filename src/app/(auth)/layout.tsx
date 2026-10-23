export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
