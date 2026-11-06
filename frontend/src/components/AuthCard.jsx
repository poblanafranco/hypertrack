import Logo from "./Logo.jsx";

export default function AuthCard({ subtitle, children, footer }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-darker px-4 py-8">
      <div className="w-full max-w-sm glass-card rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col items-center text-center mb-8">
          <Logo size="lg" />
          <p className="text-gray-400 text-sm mt-3">{subtitle}</p>
        </div>
        {children}
        <p className="text-center text-sm text-gray-400 mt-6">{footer}</p>
      </div>
    </div>
  );
}
