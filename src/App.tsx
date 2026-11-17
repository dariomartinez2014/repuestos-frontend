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

// Cada grupo de rutas indica los roles que pueden entrar.
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
    {/* CABECERA: los colores bg-tienda-* se editan en la paleta de index.css. */}
    <header className="bg-tienda-cabecera text-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6" aria-label="Navegación principal">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-white no-underline">Repuestos<span className="text-tienda-accion">.</span></Link>
        <form role="search" className="order-last flex w-full min-w-0 overflow-hidden rounded-lg bg-tienda-tarjeta focus-within:ring-2 focus-within:ring-tienda-accion lg:order-none lg:w-auto lg:flex-1" onSubmit={event => {
          event.preventDefault()
          const search = String(new FormData(event.currentTarget).get('search') ?? '').trim()
          navegar(search ? '/?' + new URLSearchParams({ search }) : '/')
        }}>
          <input key={params.get('search') ?? ''} name="search" type="search" aria-label="Buscar repuestos" defaultValue={params.get('search') ?? ''} placeholder="Busca por nombre o código" className="min-w-0 flex-1 rounded-none border-0 px-4 text-tienda-texto focus-visible:outline-none" />
          <button type="submit" className="shrink-0 rounded-none px-5 focus-visible:-outline-offset-4">Buscar</button>
        </form>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {sesion?.usuario.role === 'CUSTOMER' && <Link className="font-semibold no-underline hover:underline" to="/carrito">Carrito</Link>}
          {sesion && <Link to="/pedidos">Pedidos</Link>}
          {sesion && sesion.usuario.role !== 'CUSTOMER' && <Link to="/panel">Panel operativo</Link>}
          {sesion?.usuario.role === 'ADMIN' && <><Link to="/panel/productos">Inventario</Link><Link to="/panel/personal">Personal</Link></>}
          {sesion ? <><span>{sesion.usuario.name}</span><button onClick={salir}>Cerrar sesión</button></>
            : <><Link className="font-semibold no-underline hover:underline" to="/login">Ingresar</Link><Link className="no-underline hover:underline" to="/registro">Registrarse</Link></>}
        </div>
      </nav>
      <div className="bg-tienda-barra text-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link className="font-medium no-underline hover:underline" to="/">Todos los repuestos</Link>
          <Link className="font-semibold text-tienda-accion no-underline hover:underline" to="/demo/mockpay">Demo MockPay</Link>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"><Suspense fallback={<p role="status">Cargando pantalla…</p>}><Outlet /></Suspense></main>
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
    {/* La demo queda fuera de las rutas protegidas para que cualquiera pueda abrirla. */}
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
