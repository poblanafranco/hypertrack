export default function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8 flex justify-between items-end flex-wrap gap-4">
      <div>
        <h2 className="neon-sign neon-pink text-xl sm:text-2xl mb-3">{title}</h2>
        {subtitle && <p className="text-gray-400">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}
