import { api } from '../lib/axios'
import type { Usuario } from '../types'
type Credenciales = { email: string; password: string }
type Registro = Credenciales & { name: string }
export const auth = {
  registrar: (datos: Registro) => api.post('/auth/register', datos),
  crearCuenta: (datos: Registro & { role: 'ADMIN' | 'CASHIER' }) => api.post('/users', datos),
  async entrar(datos: Credenciales) {
    const { data } = await api.post<{ accessToken: string }>('/auth/login', datos)
    const { data: usuario } = await api.get<Usuario>('/auth/me', { headers: { Authorization: `Bearer ${data.accessToken}` } })
    return { token: data.accessToken, usuario }
  },
}
