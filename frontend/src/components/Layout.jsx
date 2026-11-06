import Sidebar from "./Sidebar.jsx";

export default function Layout({ children }) {
  return (
    <div className="h-[100dvh] flex flex-col md:flex-row overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 md:p-10">{children}</main>
    </div>
  );
}
