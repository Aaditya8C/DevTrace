// Analyze flow uses a minimal layout (no Navbar/Footer)
// to keep the user focused during the analysis flow.
export default function AnalyzeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[var(--bg-surface)]">
      {children}
    </div>
  );
}
