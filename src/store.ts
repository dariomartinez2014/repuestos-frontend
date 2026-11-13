import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from './types'
interface Sesion { token: string; usuario: Usuario }
type CanalStaff = 'POS' | 'SOCIAL'
const carritosVacios = { POS: null, SOCIAL: null }
interface Estado {
  sesion: Sesion | null
  carrito: number | null
  carritosStaff: Record<CanalStaff, number | null>
  guardarCarritoStaff: (canal: CanalStaff, id: number | null) => void
  entrar: (sesion: Sesion) => void
  salir: () => void
  guardarCarrito: (carrito: number | null) => void
}
export const useAuthStore = create<Estado>()(persist(set => ({
  sesion: null, carrito: null, carritosStaff: carritosVacios,
  // Separa los carritos internos del carrito web y de otras sesiones.
  guardarCarritoStaff: (canal, id) => set(estado => ({
    carritosStaff: { ...estado.carritosStaff, [canal]: id },
  })),
  entrar: sesion => set({ sesion, carrito: null, carritosStaff: carritosVacios }),
  salir: () => set({ sesion: null, carrito: null, carritosStaff: carritosVacios }),
  guardarCarrito: carrito => set({ carrito }),
}), { name: 'repuestos-sesion' }))
