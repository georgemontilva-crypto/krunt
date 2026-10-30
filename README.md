# Krunk'd

E-commerce retail + wholesale de Krunk'd (disposables y pre-rolls botánicos, Blue Lotus infused).

**Stack:** React 19 + Vite + Tailwind 4 · tRPC 11 · Drizzle ORM + MySQL · three.js / react-three-fiber (visor 3D) · Railway.

## Qué incluye

- **Home**: muro de grafiti donde se puede pintar con spray (mantener clic / modo "Tag the wall" en móvil), stickers arrastrables, producto en 3D, el sitio entero cambia al color del sabor elegido, sección "Pop the top" con el tubo 3D que se abre al hacer scroll.
- **Products / Product**: visor 3D interactivo tipo Apple (arrastrar 360°, frente/lado/atrás, zoom). Pouch, dispositivo desechable, conos, y el tubo que se abre y saca el pre-roll.
- **Lab Reports**: "Coming soon" (página y modal en cada producto).
- **About us**, **Contact** (guarda en BD + email opcional), verificación 21+.
- **Wholesale**: registro de tiendas → aprobación manual en el admin → ven precio mayorista y compran por cajas.
- **Checkout sin cobro**: el pedido queda "Awaiting payment" y el equipo envía el link de pago. La pasarela se conecta después.
- **Admin** (`/admin`): dashboard, pedidos (estado, tracking, email al cliente), mayoristas (aprobar/rechazar), productos (precios retail/mayorista, tamaño de caja, stock por sabor), mensajes, ajustes (contacto, envío, texto de pago), admins.

## Deploy en Railway

1. Servicio desde este repo + plugin MySQL.
2. Variables: `DATABASE_URL=${{MySQL.MYSQL_URL}}`, `JWT_SECRET`, `ADMIN_SETUP_TOKEN` (ver `.env.example`).
3. Build `pnpm build`, start `pnpm start` (ya en `railway.json`). Las tablas y el catálogo (3 productos × 6 sabores) se crean solos al arrancar.
4. Entrar a `/admin`, crear el primer admin con el token y luego borrar `ADMIN_SETUP_TOKEN`.

## Local

```bash
pnpm install
cp .env.example .env   # completar DATABASE_URL y JWT_SECRET
pnpm dev
```

## Assets

- `client/public/products/<producto>/<sabor>.webp`: fotos sin fondo.
- `client/public/tex/`: texturas del visor 3D (frente/espalda del pouch, etiqueta desenrollada del tubo).
- `client/public/brand/`: logo vectorizado (SVG), favicon, imagen OG.
