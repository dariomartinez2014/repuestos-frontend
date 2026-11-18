export type Role = 'ADMIN' | 'CASHIER' | 'CUSTOMER'
export interface Usuario { id: number; name: string; email: string; role: Role }
export interface Categoria { id: number; name: string }
export interface Producto { id: number; sku: string; name: string; description: string | null; salePrice: string; stock: number; category: Categoria; active: boolean; images?: { id: number }[]; referenceImageSku?: string | null; primaryImageId?: number | null }
export interface ProductoInterno extends Producto { acquisitionCost: string }
export interface Pagina<T> { data: T[]; total: number; page: number; limit: number }
export interface Carrito { id: number; status: string; items: { productId: number; quantity: number; product: Producto }[] }
export interface Pedido {
  id: number
  cartId: number
  total: string
  status: string
  createdAt?: string
  payment?: { method: 'CASH' | 'CARD' | 'TRANSFER' } | null
  deliveryAddress?: string | null
  deliveryReference?: string | null
  items: { id: number; productName: string; quantity: number; unitPrice: string }[]
}
export interface Direccion { id: number; recipientName: string; phone: string; addressLine: string }
