import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {Credenciales, MenuRol, Usuario} from '../models';
import {repository} from '@loopback/repository';
import {LoginRepository, MenuRolRepository, RolRepository, UsuarioRepository} from '../repositories';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {HttpErrors, Request} from '@loopback/rest';




const generator = require('generate-password');//paquete para generar claves aleatorias https://www.npmjs.com/package/generate-password   "npm i generate-password"
const bcrypt = require('bcryptjs');//paquete para cifrar claves con sal https://www.npmjs.com/package/bcryptjs  "npm i bcryptjs" (REEMPLAZA A MD5)
const jwt = require('jsonwebtoken');//paquete para generar token https://www.npmjs.com/package/jsonwebtoken  "npm i jsonwebtoken"
import {randomUUID} from 'crypto';//EL id_usuario LO GENERA ESTE MICROSERVICIO (NO DEPENDE DEL CELULAR, QUE PUEDE CAMBIAR)


//DATOS QUE SE OBTIENEN AL VALIDAR UN TOKEN
export interface DatosToken {
  rol: number;
  id_usuario: string;
  nombre: string;
}

//RESPUESTA ESTANDAR {CODIGO, MENSAJE, DATOS}
export interface RespuestaSeguridad {
  CODIGO: number;
  MENSAJE: string;
  DATOS: any;
}


@injectable({scope: BindingScope.TRANSIENT})
export class SeguridadService {
  constructor(
    //inyeccion para poder utilizar el repositorio de usuario para poder hacer consultas a la base de datos
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,

    //inyeccion para poder utilizar el repositorio de login para poder hacer consultas a la base de datos
    @repository(LoginRepository)
    public loginRepository: LoginRepository,

    //inyeccion para poder utilizar el repositorio de MenuRol para poder hacer consultas a la base de datos
    @repository(MenuRolRepository)
    public menurolRepository: MenuRolRepository,

    //inyeccion para poder utilizar el repositorio de rol para poder hacer consultas a la base de datos
    @repository(RolRepository)
    public RolRepository: RolRepository,


    ){}

    /**
   * Metodo para generar una clave aleatoria
   * @returns string
   */
  //Metodo para generar una texto aleatoria utilizando el paquete de npm "npm i generate-password"
  crearTextoAleatoria(numerocaracteres: number): string {
    let password = generator.generate({
      length: numerocaracteres,
      numbers: true
    });
    return password;
  }

  /**
   * Metodo para cifrar una clave con bcrypt (incluye sal aleatoria)
   * @param clave clave en texto plano
   * @returns string hash bcrypt
   */
  async encriptartexto(texto: string): Promise<string> {
    let cadenacifrada= await bcrypt.hash(texto, ConfiguracionSeguridad.rondasBcrypt);
    return cadenacifrada;
  }

  /**
   * Metodo para comparar una clave en texto plano con el hash guardado
   */
  async compararClave(clave: string, hash: string): Promise<boolean> {
    if (!clave || !hash) {
      return false;
    }
    return bcrypt.compare(clave, hash);
  }

  /**
   * NORMALIZA UN CELULAR SIEMPRE IGUAL (REGISTRO, LOGIN, BUSQUEDA, CREAR CUENTA Y crear-admin)
   * 1. QUITA TODO LO QUE NO SEA DIGITO (ESPACIOS, GUIONES, +, PARENTESIS)
   * 2. SI QUEDAN 12 DIGITOS Y EMPIEZA POR 57 (INDICATIVO DE COLOMBIA) SE QUITA EL 57
   * EJ: "+57 300 123 4567" -> "3001234567"
   */
  normalizarCelular(celular?: string | null): string {
    let digitos = (celular ?? '').toString().replace(/\D/g, '');
    if (digitos.length === 12 && digitos.startsWith('57')) {
      digitos = digitos.substring(2);
    }
    return digitos;
  }

  //CELULAR VALIDO EN COLOMBIA (YA NORMALIZADO): 10 DIGITOS QUE EMPIEZAN POR 3
  celularValido(celular: string): boolean {
    return /^3\d{9}$/.test(celular);
  }

  //CORREO OPCIONAL: SIN ESPACIOS Y EN MINUSCULAS; VACIO -> null
  normalizarCorreo(correo?: string | null): string | null {
    let limpio = (correo ?? '').toString().trim().toLowerCase();
    return limpio === '' ? null : limpio;
  }

  //FORMATO BASICO DE CORREO (algo@dominio.ext)
  correoValido(correo: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  }

  //NOMBRE SIN ESPACIOS DE SOBRA
  normalizarNombre(nombre?: string | null): string {
    return (nombre ?? '').toString().trim().replace(/\s+/g, ' ');
  }

  /**
   * BUSCA UNA CUENTA POR CELULAR (YA NORMALIZADO O NO)
   */
  async buscarPorCelular(celular?: string | null): Promise<Usuario | null> {
    let normalizado = this.normalizarCelular(celular);
    if (!this.celularValido(normalizado)) {
      return null;
    }
    return this.usuarioRepository.findOne({where: {celular: normalizado}});
  }

  /**
   * CREA UNA CUENTA (REGISTRO DEL DUEÑO, CUENTAS QUE CREA EL DUEÑO DESDE LA LOGICA Y crear-admin)
   * VALIDA NOMBRE, CELULAR, CLAVE, ROL Y QUE EL CELULAR NO TENGA CUENTA. GENERA EL id_usuario CON crypto.randomUUID()
   * @param rolesPermitidos roles que puede recibir quien llama
   * @returns {CODIGO, MENSAJE, DATOS: {id_usuario}}
   */
  async crearCuenta(nombre: string, celular: string, clave: string, rolid: number, rolesPermitidos: number[]): Promise<RespuestaSeguridad> {
    let nombreLimpio = this.normalizarNombre(nombre);
    let celularLimpio = this.normalizarCelular(celular);
    //VALIDACIONES
    if (nombreLimpio === '') {
      return {CODIGO: 400, MENSAJE: 'El nombre es obligatorio', DATOS: null};
    }
    if (!this.celularValido(celularLimpio)) {
      return {CODIGO: 400, MENSAJE: 'El celular debe tener 10 números y empezar por 3', DATOS: null};
    }
    if (!rolesPermitidos.includes(Number(rolid))) {
      return {CODIGO: 400, MENSAJE: 'El rol no es válido', DATOS: null};
    }
    if (!clave || clave.length < ConfiguracionSeguridad.longitudMinimaClave) {
      return {CODIGO: 400, MENSAJE: `La contraseña debe tener mínimo ${ConfiguracionSeguridad.longitudMinimaClave} caracteres`, DATOS: null};
    }
    let existeCelular = await this.usuarioRepository.findOne({where: {celular: celularLimpio}});
    if (existeCelular) {
      return {CODIGO: 400, MENSAJE: 'Ya existe una cuenta con ese celular', DATOS: null};
    }
    //CREAR EL USUARIO CON LA CLAVE CIFRADA CON BCRYPT
    let id_usuario = randomUUID();
    try {
      await this.usuarioRepository.create({
        id_usuario: id_usuario,
        nombre: nombreLimpio,
        celular: celularLimpio,
        correo: null,
        clave: await this.encriptartexto(clave),
        rolid: Number(rolid),
        aceptado: true,
        intentoslogin: 0,
      });
    } catch (err: any) {
      //DOS REGISTROS A LA VEZ CON EL MISMO CELULAR: EL INDICE UNICO DETIENE EL SEGUNDO
      if (err?.code === '23505') {
        return {CODIGO: 400, MENSAJE: 'Ya existe una cuenta con ese celular', DATOS: null};
      }
      throw err;
    }
    return {CODIGO: 200, MENSAJE: 'Cuenta creada exitosamente', DATOS: {id_usuario: id_usuario}};
  }

  /**
   *
   * @param credenciales
   * @returns Usuario|null
   */
  //Metodo para identificar un usuario por medio de su celular y su clave
  async identificarusuario(credenciales:Credenciales): Promise< Usuario|null> {
    let celular = this.normalizarCelular(credenciales.celular);
    if (!this.celularValido(celular)) {
      return null;
    }
    let usuario=await this.usuarioRepository.findOne({
      where:{
        celular:celular,
        aceptado:true
      }
    });
    if (!usuario) {
      return null;
    }
    //COMPARA LA CLAVE CON EL HASH BCRYPT GUARDADO
    let claveValida = await this.compararClave(credenciales.clave, usuario.clave);
    if (!claveValida) {
      return null;
    }
    return usuario;
    }



    /**
   * Metodo para crear un token
   * @param usuario
   * @returns retorna un token con los datos del usuario
   */
  //Metodo para crear token
  CrearToken(usuario:Usuario):string{
    let datos = {
      nombre: usuario.nombre,
      rol: usuario.rolid,
      celular: usuario.celular,
      id_usuario: usuario.id_usuario,
    }
    let token = jwt.sign(datos, ConfiguracionSeguridad.claveJWT, { expiresIn: '12h' });
    return token;
  }




  /**
   * Metodo para verificar un token y obtener el rol y el id del usuario
   * @param token
   * @returns {rol, id_usuario}
   */
  async obtenerDatosDesdeToken(token:string): Promise<DatosToken> {
    try {
      let datos = jwt.verify(token, ConfiguracionSeguridad.claveJWT);
      //valida el estado del token que esta en la base de datos
      let estado_tokendb = await this.validarEstadoToken(token);
      if(datos && estado_tokendb){
        return {
          rol: parseInt(datos.rol),
          id_usuario: datos.id_usuario,
          nombre: datos.nombre,
        };
      } else {
        throw new HttpErrors.Unauthorized("El token es invalido");
      }
    } catch (err) {
      //lanzar un error de token invalido
      throw new HttpErrors.Unauthorized("El token es invalido");
    }
  }



  /**
   * Metodo para verificar y obtener el rol de un token
   * @param token
   * @returns el id del rol
   */
  async obtenerRolDesdeToken(token:string): Promise<number> {
    let datos = await this.obtenerDatosDesdeToken(token);
    return datos.rol;
  }



  //funcion que valida si el estado del token es true
  async validarEstadoToken(token:string):Promise<boolean>{
    let estado_tokendb= await this.loginRepository.findOne({
      where:{
        token:token,
        estado_token:true
      }
    });
    if(estado_tokendb){
      return true;
    }
    return false;
  }



  /**
   * Retorna los permisos del rol en un menu, esto es para pintar los menus
   * @param id_rol
   */
  async ConsultarPermisosDeMenuPorUsuario(id_rol:number): Promise<MenuRol[]>{
    let menu: MenuRol[] = await this.menurolRepository.find(
      {
      where:{
        listar:true, // solo los que tengan permiso de listar ya que es el indicador para mostrar el menu
        rolid:id_rol
      }
    });
    return menu;
  }

  //metodo para obtener el nombre del rol
  async obtenerNombreRol(id_rol:number): Promise<string>{
    let nombreRol = await this.RolRepository.findOne({
      where:{
        id_rol:id_rol
      }
    });
    return nombreRol?.nombre as string;
  }



  /**
   * VALIDA LA CLAVE COMPARTIDA ENTRE MICROSERVICIOS (HEADER x-clave-servicio)
   * SE USA EN LOS ENDPOINTS QUE LLAMA EL MICROSERVICIO DE LOGICA SIN USUARIO (BUSCAR Y CREAR CUENTAS DE LAS PERSONAS DE UNA FINCA)
   */
  validarClaveServicio(request: Request): void {
    let claveRecibida = request.headers['x-clave-servicio'];
    if (!ConfiguracionSeguridad.claveServicios || claveRecibida !== ConfiguracionSeguridad.claveServicios) {
      throw new HttpErrors[401]("No autorizado");
    }
  }




}
