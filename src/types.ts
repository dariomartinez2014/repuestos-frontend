export type Role = 'ADMIN' | 'CASHIER' | 'CUSTOMER'
export interface Usuario { id: number; name: string; email: string; role: Role }
export interface Categoria { id: number; name: string }
export interface Producto { id: number; sku: string; name: string; description: string | null; salePrice: string; stock: number; category: Categoria; active: boolean }
export interface ProductoInterno extends Producto { acquisitionCost: string }
export interface Pagina<T> { data: T[]; total: number; page: number; limit: number }
export interface Carrito { id: number; status: string; items: { productId: number; quantity: number; product: Producto }[] }
export interface Pedido { id: number; cartId: number; total: string; status: string }
export interface Direccion { id: number; recipientName: string; phone: string; addressLine: string }
