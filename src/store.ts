import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from './types'
interface Sesion { token: string; usuario: Usuario }
interface Estado {
  sesion: Sesion | null
  carrito: number | null
  entrar: (sesion: Sesion) => void
  salir: () => void
  guardarCarrito: (carrito: number | null) => void
}
export const useAuthStore = create<Estado>()(persist(set => ({
  sesion: null, carrito: null,
  entrar: sesion => set({ sesion, carrito: null }),
  salir: () => set({ sesion: null, carrito: null }),
  guardarCarrito: carrito => set({ carrito }),
}), { name: 'repuestos-sesion' }))
