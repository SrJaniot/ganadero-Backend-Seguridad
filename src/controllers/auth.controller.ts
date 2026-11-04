// Uncomment these imports to begin using these cool features!

import {getModelSchemaRef, post, requestBody, response} from '@loopback/rest';
import {PermisosRolMenu} from '../models';
import {service} from '@loopback/core';
import {AuthService, SeguridadService} from '../services';
import {UserProfile} from '@loopback/security';


export class AuthController {
  constructor(
    @service(AuthService)
    private authService: AuthService,
    @service(SeguridadService)
    private seguridadService: SeguridadService,
  ) {}


  /**
   * METODO QUE ME PERMITE VALIDAR LOS PERMISOS DE UN USUARIO PARA LA LOGICA DE NEGOCIOS ENDPOINT
   * DEVUELVE {permitido:"OK", id_usuario, rol, nombre} PARA QUE LA LOGICA SEPA QUIEN HACE LA PETICION
   * EL nombre SALE DE LA BASE (SI EL USUARIO LO CAMBIO EN MI PERFIL, EL TOKEN TIENE EL VIEJO)
   * @param datos de tipo PermisosRolMenu
   */


  @post('/validar-permisos')
  @response(200, {
    description: 'validacion de permisos de usuario para la logica de negocios',
    content: {'application/json': {schema: getModelSchemaRef(PermisosRolMenu)}},
  })
  async ValidarPermisosDeUsuario(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(PermisosRolMenu ),
        },
      },
    })
    datos: PermisosRolMenu,
  ): Promise<UserProfile | undefined>{
    let datosToken = await this.seguridadService.obtenerDatosDesdeToken(datos.token);
    let usuario = await this.seguridadService.usuarioRepository.findOne({
      where: {id_usuario: datosToken.id_usuario},
      fields: {id_usuario: true, nombre: true},
    });
    let nombre = usuario?.nombre ?? datosToken.nombre;
    return this.authService.VerificarPermisoDeUsuarioPorRol(datosToken.rol, datos.idMenu, datos.accion, datosToken.id_usuario, nombre);
  }



}
