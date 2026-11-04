// SCRIPT PARA CREAR EL PRIMER ADMINISTRADOR (ROL 1) DE GANADERO
// USO (DESDE POWERSHELL O CMD; DESDE GIT BASH npm METE ^ EN LOS NOMBRES CON ESPACIOS):
//      npm run crear-admin -- "<nombre>" <celular> <clave>
// EJ:  npm run crear-admin -- "Esteban" 3001234567 MiClaveSegura123
// CREA EL USUARIO DIRECTAMENTE EN LA BASE seguridadganadero CON EL REPOSITORIO (CLAVE CIFRADA CON BCRYPT)
// USA SeguridadService.crearCuenta: EL CELULAR SE NORMALIZA IGUAL QUE EN EL LOGIN Y FALLA SI YA TIENE CUENTA
// NO NECESITA QUE EL SERVICIO ESTE CORRIENDO. LA PERSONA ENTRA CON SU CELULAR Y LA CLAVE
import {App} from './application';
import {ConfiguracionSeguridad} from './config/seguridad.config';
import {SeguridadService} from './services';


export async function crearAdmin(args: string[]) {
  const [nombre, celular, clave] = args.slice(2);
  if (!nombre || !celular || !clave) {
    console.error('USO: npm run crear-admin -- "<nombre>" <celular> <clave>');
    process.exit(1);
  }

  const app = new App();
  await app.boot();
  const seguridadService = await app.get<SeguridadService>('services.SeguridadService');

  //LA MISMA VALIDACION Y CREACION QUE EL REGISTRO (NOMBRE, CELULAR, CLAVE MINIMA Y CELULAR REPETIDO)
  const respuesta = await seguridadService.crearCuenta(
    nombre,
    celular,
    clave,
    ConfiguracionSeguridad.rolAdministradorID,
    [ConfiguracionSeguridad.rolAdministradorID],
  );
  if (respuesta.CODIGO !== 200) {
    console.error(`No fue posible crear el administrador: ${respuesta.MENSAJE}`);
    process.exit(1);
  }

  console.log(`Administrador creado correctamente (id_usuario ${respuesta.DATOS.id_usuario}). Entra con el celular ${seguridadService.normalizarCelular(celular)}`);
  process.exit(0);
}

crearAdmin(process.argv).catch(err => {
  console.error('No fue posible crear el administrador', err.message);
  process.exit(1);
});
