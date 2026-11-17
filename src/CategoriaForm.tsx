import { useState, type FormEvent } from 'react'
import { mensajeError } from './lib/errores'
import { productos } from './services/productos'

export function CategoriaForm({ alCrear }: { alCrear: () => void }) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState('')

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formulario = event.currentTarget
    const nombre = String(new FormData(formulario).get('nombre')).trim()
    setError('')
    setResultado('')
    if (nombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }

    setGuardando(true)
    try {
      const { data } = await productos.crearCategoria(nombre)
      // Recarga las opciones del filtro y del formulario de productos.
      alCrear()
      formulario.reset()
      setResultado(`Categoría «${data.name}» creada.`)
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  return <div className="space-y-3 rounded-xl bg-white p-4">
    <h2 className="font-bold">Crear categoría</h2>
    <form onSubmit={crear} className="flex flex-wrap items-end gap-3">
      <label>Nombre<input name="nombre" required minLength={2} maxLength={100} /></label>
      <button disabled={guardando}>{guardando ? 'Creando…' : 'Crear categoría'}</button>
    </form>
    {error && <p role="alert">{error}</p>}
    {resultado && <p role="status">{resultado}</p>}
  </div>
}
