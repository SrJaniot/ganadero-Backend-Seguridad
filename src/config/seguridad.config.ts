export namespace ConfiguracionSeguridad {
  //-------------------------jwt -------------------------------------
  export const claveJWT = process.env.CLAVE_JWT;
  //SOLO LA DEMO (demoganadera.ejaniot.com): ENTRADA RAPIDA SIN CLAVE A TRES CUENTAS DE EJEMPLO. EN CUALQUIER OTRO SITIO QUEDA APAGADA
  //DEMO_ENTRADA=SI Y DEMO_CELULARES="DUENIO:3100000001,VAQUERO:3100000002,VETERINARIO:3100000003"
  export const demoEntrada = process.env.DEMO_ENTRADA === 'SI';
  export const demoCelulares: Record<string, string> = Object.fromEntries(
    (process.env.DEMO_CELULARES ?? '').split(',').map(p => p.split(':').map(x => x.trim())).filter(p => p.length === 2 && p[0] && p[1]));
  //-------------------------menus -------------------------------------
  //TENER EN CUENTA QUE TOCA INSERTAR LOS MENUS EN LA BASE DE DATOS (db/SEGURIDAD/DML_SEGURIDAD_GANADERO.SQL)
  //LOS IDS DEBEN COINCIDIR CON ConfiguracionSeguridad DE ms-logica-ganadero
  export const MenuUsuarios = 1; //CUENTAS DE LA PLATAFORMA (ADMINISTRADOR): USUARIOS, ROLES, MENUS Y PERMISOS
  export const MenuMiFinca = 2; //DATOS DE LA FINCA Y SUS PERSONAS
  export const MenuHato = 3; //ANIMALES, LOTES Y FICHA CON LA LINEA DE TIEMPO
  export const MenuQuePasoHoy = 4; //REGISTRAR EVENTOS: ORDEÑO, PESAJE, VACUNA, SERVICIO, PARTO, SALIDA
  export const MenuHoyAlertas = 5; //PARTOS PROXIMOS, VACAS VACIAS, VACUNAS Y RETIROS DE LECHE
  export const MenuIndicadores = 6; //INDICADORES Y EXCEL
  export const MenuConfiguracion = 7; //VACUNAS, RAZAS Y CICLOS DEL ICA
  export const MenuSincronizacion = 8; //SUBIR Y BAJAR CAMBIOS DEL CELULAR
  export const MenuMiPerfil = 9; //MIS DATOS Y CAMBIAR LA CLAVE

  //-------------------------acciones -------------------------------------
  export const listarAccion = "listar";
  export const guardarAccion = "guardar";
  export const eliminarAccion = "eliminar";
  export const editarAccion = "editar";
  export const buscarAccion_id = "buscar_id";

  //-------------------------roles -------------------------------------
  //TENER EN CUENTA QUE TOCA INSERTAR LOS ROLES EN LA BASE DE DATOS
  export const rolAdministradorID = 1;
  export const rolDuenioID = 2; //MANEJA SU FINCA: PERSONAS, HATO Y EVENTOS; CORRIGE Y ANULA (SE REGISTRA SOLO)
  export const rolVaqueroID = 3; //REGISTRA ANIMALES Y EVENTOS; NO CORRIGE NI ANULA
  export const rolVeterinarioID = 4; //REGISTRA SANIDAD Y REPRODUCCION Y CONSULTA INDICADORES

  //-------------------------seguridad -------------------------------------
  //NUMERO DE RONDAS DE BCRYPT PARA CIFRAR LAS CLAVES
  export const rondasBcrypt = 12;
  //LONGITUD MINIMA DE LA CONTRASEÑA
  export const longitudMinimaClave = 8;
  //BLOQUEO DEL LOGIN: DESPUES DE 5 INTENTOS FALLIDOS SEGUIDOS LA CUENTA QUEDA BLOQUEADA 15 MINUTOS
  export const intentosMaximosLogin = 5;
  export const minutosBloqueoLogin = 15;



  //------------------------variables de entorno-------------------------------------
  //instalar el paquete dotenv npm i dotenv para poder leer variables de entorno  y
  //importar en application.ts require('dotenv').config();
  export const connection_user_postgres = process.env.CONNECTION_USER_POSTGRES ;
  export const connection_password_postgres = process.env.CONNECTION_PASSWORD_POSTGRES ;
  export const connection_database_postgres = process.env.CONNECTION_DATABASE_POSTGRES ;
  export const connection_port_postgres = process.env.CONNECTION_PORT_POSTGRES ;
  //CLAVE COMPARTIDA ENTRE MICROSERVICIOS PARA LAS LLAMADAS QUE NO TIENEN USUARIO (CREAR USUARIOS, ACTIVARLOS Y RESTABLECER CLAVES DESDE ms-logica-ganadero)
  export const claveServicios = process.env.CLAVE_SERVICIOS ;


}
