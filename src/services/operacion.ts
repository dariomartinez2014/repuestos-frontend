import { api } from '../lib/axios'
import type { Pagina, Pedido } from '../types'

export type Metodo = 'CASH' | 'CARD' | 'TRANSFER'
export interface Caja {
  id: number
  closedAt: string | null
  openingAmount: string
}
export interface Corte extends Caja {
  expectedAmount: string
  countedAmount: string | null
  difference: string | null
  totalsByMethod: { method: Metodo; _sum: { amount: string | null } }[]
}
export const operacion = {
  async cajas(signal: AbortSignal) { return (await api.get<Caja[]>('/cash-sessions', { signal })).data },
  abrir: (openingAmount: number) => api.post('/cash-sessions', { openingAmount }),
  async corte(id: number, signal: AbortSignal) {
    return (await api.get<Corte>(`/cash-sessions/${id}`, { signal })).data
  },
  cerrar: (id: number, countedAmount: number) => api.post(`/cash-sessions/${id}/close`, { countedAmount }),
  async pedidos(page: number, status: string, signal: AbortSignal) {
    return (await api.get<Pagina<Pedido>>('/orders', { params: { page, status: status || undefined }, signal })).data
  },
  cancelar: (id: number) => api.post(`/orders/${id}/cancel`),
  estado: (id: number, status: 'IN_TRANSIT' | 'DELIVERED') => api.patch(`/orders/${id}/status`, { status }),
  pago: (id: number, method: Metodo) => api.post(`/orders/${id}/payment`, { method }),
}
