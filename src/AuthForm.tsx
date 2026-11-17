import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { auth } from './services/auth'
import { mensajeError } from './lib/errores'
import { useAuthStore } from './store'

// Zod valida los campos y define el tipo que recibe el formulario.
const schema = z.object({
  name: z.string().trim().max(150),
  email: z.email('Ingresa un correo válido').max(254),
  password: z.string().min(10, 'Usa al menos 10 caracteres').max(64),
  role: z.enum(['ADMIN', 'CASHIER']),
})
type Datos = z.infer<typeof schema>

export function AuthForm({ modo }: { modo: 'login' | 'registro' | 'staff' }) {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Datos>({
    resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', role: 'CASHIER' },
  })
  const [mensaje, setMensaje] = useState('')
  const [error, setFallo] = useState('')
  const entrar = useAuthStore(s => s.entrar)
  const navegar = useNavigate()
  async function enviar({ name, email, password, role }: Datos) {
    setFallo('')
    setMensaje('')
    if (modo !== 'login' && name.length < 2) {
      setError('name', { message: 'Ingresa al menos dos caracteres' })
      return
    }
    try {
      if (modo === 'staff') {
        await auth.crearCuenta({ name, email, password, role })
        reset()
        setMensaje('Cuenta creada.')
        return
      }
      if (modo === 'registro') await auth.registrar({ name, email, password })
      // Guarda la sesión y abre la pantalla inicial según el rol.
      const sesion = await auth.entrar({ email, password })
      entrar(sesion)
      navegar(sesion.usuario.role === 'CUSTOMER' ? '/' : '/panel', { replace: true })
    } catch (err) { setFallo(mensajeError(err)) }
  }

  return <form noValidate onSubmit={handleSubmit(enviar)} className="max-w-md space-y-4 rounded-xl bg-white p-6">
    <h1 className="text-xl font-bold">{modo === 'login' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear cuenta de cliente' : 'Crear cuenta de personal'}</h1>
    {modo !== 'login' && <label>Nombre<input {...register('name')} autoComplete="name" />{errors.name?.message}</label>}
    <label>Correo<input type="email" {...register('email')} autoComplete="email" />{errors.email?.message}</label>
    <label>Contraseña<input type="password" {...register('password')} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} />{errors.password?.message}</label>
    {modo === 'staff' && <label>Rol<select {...register('role')}><option value="CASHIER">Cajero</option><option value="ADMIN">Administrador</option></select></label>}
    {error && <p role="alert" className="text-rose-700">{error}</p>}
    {mensaje && <p role="status">{mensaje}</p>}
    <button disabled={isSubmitting}>{isSubmitting ? 'Procesando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
  </form>
}
