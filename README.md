# ms-seguridad-ganadero

Microservicio de seguridad de **Ganadero** (LoopBack 4), la app para ganaderos de doble propósito. Plantilla más reciente de monchis: bcrypt, header `x-clave-servicio` y bloqueo tras 5 intentos.

- Usuarios, roles, menús, permisos, login y JWT de 12 h.
- **Login con celular y clave.** El celular se guarda solo con números (10 dígitos que empiezan por 3; se acepta `+57` y se quita). El correo es opcional.
- `id_usuario` lo genera este microservicio (`crypto.randomUUID()`).
- Claves cifradas con **bcrypt** (12 rondas, mínimo 8 caracteres).
- Un solo mensaje para celular o clave incorrectos y **bloqueo de 15 minutos** después de 5 intentos fallidos seguidos.
- El dueño se registra solo (`/registrar-duenio`); sus vaqueros y el veterinario los crea ms-logica-ganadero (endpoints `*-servicio`, con el header `x-clave-servicio`).
- El primer administrador se crea con `npm run crear-admin -- "<nombre>" <celular> <clave>` en este microservicio.

Documentación completa: `V:\proyectos\documentacion general\proyectos\ganadero\` (contrato en `PLAN_GANADERO.md`, sección 8.2).

## Instalación

```sh
npm install
# copiar ejemplo.env.txt como .env y llenarlo
npm run migrate
# ejecutar db/SEGURIDAD/DML_SEGURIDAD_GANADERO.SQL (roles, menus y permisos)
npm run crear-admin -- "<nombre>" <celular> <clave>
npm start   # puerto 3020
```

## Endpoints

| Endpoint | Acceso |
|---|---|
| `POST /registrar-duenio` | público |
| `POST /identificar-usuario-SIN-2fa` | público |
| `POST /cerrar-sesion`, `POST /consultar-rol` | token en el body |
| `POST /validar-permisos` | lo usa ms-logica |
| `POST /actualizar-mi-perfil`, `POST /cambiar-clave` | menú Mi perfil (9), editar |
| `POST /buscar-usuario-celular-servicio`, `/crear-usuario-servicio`, `/cambiar-estado-usuario-servicio`, `/restablecer-clave-usuario-servicio` | solo ms-logica (`x-clave-servicio`) |
| `/usuarios/count`, `/usuarios/valores` | menú Usuarios (1) |
| `/rol`, `/menu`, `/permiso` | menú Usuarios (1), guardar (solo el administrador) |
