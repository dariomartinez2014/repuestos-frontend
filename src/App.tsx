import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { Catalogo } from './Catalogo'
import { CarritoPage, PagoPage } from './Compra'
import { useAuthStore } from './store'
import type { Role } from './types'

function Protegida({ roles }: { roles: Role[] }) {
  const sesion = useAuthStore(s => s.sesion)
  if (!sesion) return <Navigate to="/login" replace />
  return roles.includes(sesion.usuario.role) ? <Outlet /> : <Navigate to="/sin-acceso" replace />
}
function Visitante() {
  const sesion = useAuthStore(s => s.sesion)
  return sesion ? <Navigate to={sesion.usuario.role === 'CUSTOMER' ? '/' : '/panel'} replace /> : <Outlet />
}
function Layout() {
  const sesion = useAuthStore(s => s.sesion)
  const salir = useAuthStore(s => s.salir)
  return <>
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4" aria-label="Navegación principal">
        <Link to="/" className="font-bold">Repuestos</Link>
        {sesion?.usuario.role === 'CUSTOMER' && <Link to="/carrito">Carrito</Link>}
        {sesion && sesion.usuario.role !== 'CUSTOMER' && <Link to="/panel">Panel operativo</Link>}
        {sesion?.usuario.role === 'ADMIN' && <><Link to="/panel/productos">Inventario</Link><Link to="/panel/personal">Personal</Link></>}
        {sesion ? <><span>{sesion.usuario.name}</span><button onClick={salir}>Cerrar sesión</button></>
          : <><Link to="/login">Ingresar</Link><Link to="/registro">Registrarse</Link></>}
      </nav>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-8"><Outlet /></main>
  </>
}
function Panel() {
  const usuario = useAuthStore(s => s.sesion?.usuario)
  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">Panel de {usuario?.role === 'ADMIN' ? 'administración' : 'caja'}</h1>
    <p>Bienvenido, {usuario?.name}.</p>
    {usuario?.role === 'ADMIN' ? <div className="flex gap-4"><Link to="/panel/productos">Gestionar inventario</Link><Link to="/panel/personal">Crear cuenta de personal</Link></div> : <Link to="/">Consultar catálogo</Link>}
  </section>
}
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Catalogo />} />
    <Route element={<Visitante />}>
      <Route path="login" element={<AuthForm key="login" modo="login" />} />
      <Route path="registro" element={<AuthForm key="registro" modo="registro" />} />
    </Route>
    <Route element={<Protegida roles={['CUSTOMER']} />}>
      <Route path="carrito" element={<CarritoPage />} />
      <Route path="pago/:id" element={<PagoPage />} />
    </Route>
    <Route element={<Protegida roles={['ADMIN', 'CASHIER']} />}>
      <Route path="panel" element={<Panel />} />
    </Route>
    <Route element={<Protegida roles={['ADMIN']} />}>
      <Route path="panel/productos" element={<Catalogo interno />} />
      <Route path="panel/personal" element={<AuthForm modo="staff" />} />
    </Route>
    <Route path="sin-acceso" element={<p>Tu cuenta no tiene permiso para esta sección. <Link to="/">Ir al inicio</Link></p>} />
    <Route path="*" element={<p>Página no encontrada. <Link to="/">Ir al inicio</Link></p>} />
  </Route></Routes>
}
