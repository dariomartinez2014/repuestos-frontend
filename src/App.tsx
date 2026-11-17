import { Link, Navigate, Outlet, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthForm } from './AuthForm'
import { Catalogo } from './Catalogo'
import { CarritoPage, PagoPage } from './Compra'
import { lazy, Suspense } from 'react'

// Las pantallas de operación se descargan cuando el usuario entra a una de ellas.
const CajaPage = lazy(() => import('./Operacion').then(modulo => ({ default: modulo.CajaPage })))
const PedidosPage = lazy(() => import('./Operacion').then(modulo => ({ default: modulo.PedidosPage })))
const VentaPage = lazy(() => import('./Operacion').then(modulo => ({ default: modulo.VentaPage })))
// Pantalla de prueba independiente del checkout de los pedidos reales.
const MockPayDemo = lazy(() => import('./MockPayDemo').then(modulo => ({ default: modulo.MockPayDemo })))
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
  const [params] = useSearchParams()
  const navegar = useNavigate()
  return <>
    {/* CABECERA: cambia bg-slate-950 para ajustar el fondo de la tienda. */}
    <header className="bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-4" aria-label="Navegación principal">
        <Link to="/" className="text-2xl font-bold text-white no-underline">Repuestos<span className="text-amber-400">.</span></Link>
        <form role="search" className="order-last flex w-full gap-2 sm:order-none sm:w-auto sm:flex-1" onSubmit={event => {
          event.preventDefault()
          const search = String(new FormData(event.currentTarget).get('search') ?? '').trim()
          navegar(search ? '/?' + new URLSearchParams({ search }) : '/')
        }}>
          <input key={params.get('search') ?? ''} name="search" type="search" aria-label="Buscar repuestos" defaultValue={params.get('search') ?? ''} placeholder="Busca por nombre o código" className="min-w-0 text-slate-900" />
          <button type="submit">Buscar</button>
        </form>
        {sesion?.usuario.role === 'CUSTOMER' && <Link to="/carrito">Carrito</Link>}
        {sesion && <Link to="/pedidos">Pedidos</Link>}
        {sesion && sesion.usuario.role !== 'CUSTOMER' && <Link to="/panel">Panel operativo</Link>}
        {sesion?.usuario.role === 'ADMIN' && <><Link to="/panel/productos">Inventario</Link><Link to="/panel/personal">Personal</Link></>}
        {sesion ? <><span>{sesion.usuario.name}</span><button onClick={salir}>Cerrar sesión</button></>
          : <><Link to="/login">Ingresar</Link><Link to="/registro">Registrarse</Link></>}
      </nav>
      <div className="bg-slate-800 px-5 py-2 text-sm">
        <div className="mx-auto max-w-6xl"><Link to="/">Todos los repuestos</Link></div>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-5 py-8"><Suspense fallback={<p role="status">Cargando pantalla…</p>}><Outlet /></Suspense></main>
  </>
}
function Panel() {
  const usuario = useAuthStore(s => s.sesion?.usuario)
  return <section className="space-y-4">
    <h1 className="text-2xl font-bold">Panel de {usuario?.role === 'ADMIN' ? 'administración' : 'caja'}</h1>
    <p>Bienvenido, {usuario?.name}.</p>
    <div className="flex flex-wrap gap-4">
      <Link to="/panel/venta">Venta de mostrador</Link>
      {usuario?.role === 'ADMIN' && <>
        <Link to="/panel/caja">Administrar caja</Link>
        <Link to="/panel/social">Pedido por redes sociales</Link>
        <Link to="/panel/productos">Gestionar inventario</Link>
        <Link to="/panel/personal">Crear cuenta de personal</Link>
      </>}
    </div>
  </section>
}
function Tienda() {
  const [params] = useSearchParams()
  const search = params.get('search')?.trim().slice(0, 100) ?? ''
  return <Catalogo key={search} search={search} />
}
export default function App() {
  return <Routes><Route element={<Layout />}>
    <Route index element={<Tienda />} />
    <Route path="demo/mockpay" element={<MockPayDemo />} />
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
      <Route path="panel/venta" element={<VentaPage />} />
    </Route>
    <Route element={<Protegida roles={['ADMIN', 'CASHIER', 'CUSTOMER']} />}>
      <Route path="pedidos" element={<PedidosPage />} />
    </Route>
    <Route element={<Protegida roles={['ADMIN']} />}>
      <Route path="panel/caja" element={<CajaPage />} />
      <Route path="panel/social" element={<VentaPage key="social" social />} />
      <Route path="panel/productos" element={<Catalogo interno />} />
      <Route path="panel/personal" element={<AuthForm modo="staff" />} />
    </Route>
    <Route path="sin-acceso" element={<p>Tu cuenta no tiene permiso para esta sección. <Link to="/">Ir al inicio</Link></p>} />
    <Route path="*" element={<p>Página no encontrada. <Link to="/">Ir al inicio</Link></p>} />
  </Route></Routes>
}
