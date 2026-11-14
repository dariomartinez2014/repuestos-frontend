# Repuestos · POS y tienda web

[Abrir la tienda en Vercel](https://repuestos-frontend-nine.vercel.app)

En PowerShell, abre la carpeta del frontend y ejecuta:

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

VITE_API_URL debe apuntar al backend con el prefijo /api. Para compilar, ejecuta npm run build.

El seed del backend define estas cuentas de demostración:

| Rol | Correo |
| --- | --- |
| Administrador | `admin@repuestos.demo` |
| Cajero | `cajero@repuestos.demo` |
| Cliente web | `cliente@repuestos.demo` |

Las tres cuentas se autenticaron contra la API de producción. La contraseña de demo de producción está en `.local/accesos-publicos.env` del backend, en `SEED_PASSWORD`. Para la demo local, usa la contraseña de `.local/ACCESOS-DEMO.md`, que prepara `npm run local:start`.

Para conectar el frontend a esa demo local, pon `VITE_API_URL=http://localhost:3000/api` en `.env` y reinicia Vite.

## Verificación de la entrega

- El catálogo de producción devolvió nueve repuestos y omitió el costo de adquisición.
- Caja #4 cerrada en producción con Q425 esperados, Q427 contados y Q2 de diferencia.
- El carrito `C-22` y el pedido #21 conservaron el mismo código. MockPay respondió HTTP 502 al crear el intento, que quedó incierto y requiere revisión con el proveedor. La confirmación del pago nuevo queda pendiente.
