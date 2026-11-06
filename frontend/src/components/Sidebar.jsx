import { NavLink } from "react-router-dom";
import { ClipboardList, History, LayoutDashboard, LogOut, PlusCircle, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "./Logo.jsx";

const links = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/historial", label: "Historial", Icon: History },
  { to: "/rutina", label: "Mi Rutina", Icon: ClipboardList },
  { to: "/registrar", label: "Registrar", Icon: PlusCircle },
  { to: "/ajustes", label: "Ajustes", Icon: Settings },
];

export default function Sidebar() {
  const { logout, user } = useAuth();

  return (
    <nav
      aria-label="Navegación principal"
      className="bg-card border-t md:border-t-0 md:border-r border-gray-800 w-full md:w-64 flex-shrink-0 z-10 flex md:flex-col justify-between order-last md:order-first"
    >
      <div className="hidden md:flex items-center p-6 border-b border-gray-800">
        <Logo />
      </div>

      <div className="flex md:flex-col w-full md:flex-1 justify-around md:justify-start md:p-4">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-full flex flex-col md:flex-row items-center md:justify-start p-3 md:mb-2 rounded-lg transition-all ${
                isActive
                  ? "text-white bg-white/10 shadow-[0_0_14px_rgba(255,46,196,0.35)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={`md:mr-3 mb-1 md:mb-0 ${isActive ? "text-primary" : ""}`} aria-hidden="true" />
                <span className="text-xs md:text-base font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="hidden md:block p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-2 truncate">{user?.email}</p>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-danger font-semibold py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
