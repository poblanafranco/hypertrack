export default function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="text-center py-10 px-4 text-gray-500">
      {Icon && <Icon size={34} className="mx-auto mb-3 text-gray-600" aria-hidden="true" />}
      <p className="font-semibold text-gray-300">{title}</p>
      {children && <p className="text-sm mt-1">{children}</p>}
    </div>
  );
}
