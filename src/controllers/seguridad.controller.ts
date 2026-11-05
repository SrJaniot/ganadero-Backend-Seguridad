// Uncomment these imports to begin using these cool features!

import {get, getModelSchemaRef, HttpErrors, post, Request, requestBody, response, RestBindings} from '@loopback/rest';
import {ActualizarPerfil, BuscarCelular, BuscarIdUsuario, EntrarDemo, CambiarClave, CerrarSesion, ClaveUsuario, CrearUsuario, Credenciales, EstadoUsuario, Login, RegistrarDuenio, TokenModel, Usuario} from '../models';
import {repository} from '@loopback/repository';
import {inject, service} from '@loopback/core';
import {LoginRepository, UsuarioRepository} from '../repositories';
import {SeguridadService} from '../services';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, UserProfile} from '@loopback/security';




export class SeguridadController {
  constructor(
    //repotorios------------------------------------------------------------------------
    @repository(UsuarioRepository)
    public usuarioRepository: UsuarioRepository,
    @repository(LoginRepository)
    public loginRepository: LoginRepository,

    //servicios-------------------------------------------------------------------------
    //inyeccion para poder utilizar el servicio de seguridad
    @service(SeguridadService)
    public seguridadService: SeguridadService,


    @inject(RestBindings.Http.REQUEST) private request: Request


  ) {}



  //----------------------------------------------------------------METODOS PARA CREAR Y BUSCAR USUARIOS----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  //EN GANADERO EL DUEÑO SE REGISTRA SOLO (/registrar-duenio, PUBLICO) Y DESDE "MI FINCA" CREA A SUS VAQUEROS Y AL VETERINARIO
  //LOS ENDPOINTS *-servicio LOS LLAMA UNICAMENTE EL MICROSERVICIO DE LOGICA (HEADER x-clave-servicio)    --OJO--
  //LA LOGICA DECIDE QUIEN PUEDE HACER QUE (MENU MI FINCA Y LAS REGLAS DE LA BASE DE NEGOCIO, TAB_FINCAS_PERSONAS)



  // REGISTRO PUBLICO DEL DUEÑO DE UNA FINCA: ROL 2, aceptado = true. EL id_usuario LO GENERA ESTE MICROSERVICIO
  @post('/registrar-duenio')
  @response(200, {
    description: 'registro publico del dueño de una finca',
  })
  async registrarDuenio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(RegistrarDuenio),
        },
      },
    })
    data: RegistrarDuenio,
  ): Promise<object> {
    try {
      return await this.seguridadService.crearCuenta(data.nombre, data.celular, data.clave, ConfiguracionSeguridad.rolDuenioID, [ConfiguracionSeguridad.rolDuenioID]);
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al registrar la cuenta",
        "DATOS": null
      };
    }
  }



  // BUSCA UNA CUENTA POR CELULAR: SI LA PERSONA YA TIENE CUENTA (TRABAJA EN OTRA FINCA) LA LOGICA LA AGREGA SIN CREAR OTRA
  @post('/buscar-usuario-celular-servicio')
  @response(200, {
    description: 'buscar un usuario por celular desde la logica',
  })
  async buscarUsuarioCelularServicio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BuscarCelular),
        },
      },
    })
    data: BuscarCelular,
  ): Promise<object> {
    this.seguridadService.validarClaveServicio(this.request);
    try {
      let celular = this.seguridadService.normalizarCelular(data.celular);
      if (!this.seguridadService.celularValido(celular)) {
        return {
          "CODIGO": 400,
          "MENSAJE": "El celular debe tener 10 números y empezar por 3",
          "DATOS": null
        };
      }
      let usuario = await this.seguridadService.buscarPorCelular(celular);
      if (!usuario) {
        return {
          "CODIGO": 404,
          "MENSAJE": "No hay ninguna cuenta con ese celular",
          "DATOS": null
        };
      }
      return {
        "CODIGO": 200,
        "MENSAJE": "Operación exitosa",
        "DATOS": {
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          rolid: usuario.rolid,
          aceptado: usuario.aceptado ?? false,
        }
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al buscar el usuario",
        "DATOS": null
      };
    }
  }



  // EL CELULAR DE UNA CUENTA (FASE 5D: EL RESUMEN DIARIO POR WHATSAPP). SOLO PARA ms-logica (x-clave-servicio); NO DEVUELVE NADA MAS
  @post('/obtener-celular-servicio')
  @response(200, {
    description: 'celular de un usuario para el resumen por whatsapp',
  })
  async obtenerCelularServicio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(BuscarIdUsuario),
        },
      },
    })
    data: BuscarIdUsuario,
  ): Promise<object> {
    this.seguridadService.validarClaveServicio(this.request);
    try {
      let usuario = await this.usuarioRepository.findOne({where: {id_usuario: data.id_usuario}, fields: {id_usuario: true, celular: true, aceptado: true}});
      if (!usuario) {
        return {
          "CODIGO": 404,
          "MENSAJE": "No hay ninguna cuenta con ese id",
          "DATOS": null
        };
      }
      if (usuario.aceptado === false) {
        return {
          "CODIGO": 400,
          "MENSAJE": "La cuenta está desactivada",
          "DATOS": null
        };
      }
      return {
        "CODIGO": 200,
        "MENSAJE": "Operación exitosa",
        "DATOS": {
          celular: usuario.celular,
        }
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al buscar el celular",
        "DATOS": null
      };
    }
  }



  // CREA LA CUENTA DE UNA PERSONA DE LA FINCA (rolid 2 DUEÑO, 3 VAQUERO O 4 VETERINARIO). EL id_usuario LO GENERA ESTE MICROSERVICIO
  @post('/crear-usuario-servicio')
  @response(200, {
    description: 'creacion de un usuario desde la logica',
  })
  async crearUsuarioServicio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CrearUsuario),
        },
      },
    })
    data: CrearUsuario,
  ): Promise<object> {
    this.seguridadService.validarClaveServicio(this.request);
    try {
      return await this.seguridadService.crearCuenta(data.nombre, data.celular, data.clave, Number(data.rolid), [
        ConfiguracionSeguridad.rolDuenioID,
        ConfiguracionSeguridad.rolVaqueroID,
        ConfiguracionSeguridad.rolVeterinarioID,
      ]);
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al crear el usuario",
        "DATOS": null
      };
    }
  }



  // ACTIVA O DESACTIVA LA CUENTA DE UNA PERSONA (aceptado = false NO PUEDE INICIAR SESION). AL DESACTIVAR SE CIERRAN SUS SESIONES
  @post('/cambiar-estado-usuario-servicio')
  @response(200, {
    description: 'activar o desactivar un usuario desde la logica',
  })
  async cambiarEstadoUsuarioServicio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EstadoUsuario),
        },
      },
    })
    data: EstadoUsuario,
  ): Promise<object> {
    this.seguridadService.validarClaveServicio(this.request);
    try {
      let existeUsuario = await this.usuarioRepository.findOne({where: {id_usuario: data.id_usuario}});
      if (!existeUsuario) {
        return {
          "CODIGO": 404,
          "MENSAJE": "La cuenta no existe",
          "DATOS": null
        };
      }
      //AL ACTIVAR TAMBIEN SE QUITA UN BLOQUEO POR INTENTOS FALLIDOS
      await this.usuarioRepository.updateById(data.id_usuario, data.aceptado ? {aceptado: true, intentoslogin: 0, bloqueadohasta: null} : {aceptado: false});
      if (!data.aceptado) {
        await this.usuarioRepository.logins(data.id_usuario).patch({estado_token: false}, {estado_token: true});
      }
      return {
        "CODIGO": 200,
        "MENSAJE": data.aceptado ? "Cuenta activada: ya puede entrar" : "Cuenta desactivada: sus sesiones abiertas se cerraron",
        "DATOS": null
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al cambiar el estado del usuario",
        "DATOS": null
      };
    }
  }



  // EL ADMINISTRADOR LE PONE UNA CONTRASEÑA NUEVA A UNA PERSONA QUE LA OLVIDO (NO HAY CORREOS: EL DUEÑO SE LA DICE A LA PERSONA)
  // SE CIERRAN SUS SESIONES PARA QUE ENTRE CON LA NUEVA Y SE QUITA UN BLOQUEO POR INTENTOS FALLIDOS
  @post('/restablecer-clave-usuario-servicio')
  @response(200, {
    description: 'restablecer la clave de un usuario desde la logica',
  })
  async restablecerClaveUsuarioServicio(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ClaveUsuario),
        },
      },
    })
    data: ClaveUsuario,
  ): Promise<object> {
    this.seguridadService.validarClaveServicio(this.request);
    try {
      if (!data.clave || data.clave.length < ConfiguracionSeguridad.longitudMinimaClave) {
        return {
          "CODIGO": 400,
          "MENSAJE": `La contraseña debe tener mínimo ${ConfiguracionSeguridad.longitudMinimaClave} caracteres`,
          "DATOS": null
        };
      }
      let existeUsuario = await this.usuarioRepository.findOne({where: {id_usuario: data.id_usuario}});
      if (!existeUsuario) {
        return {
          "CODIGO": 404,
          "MENSAJE": "La cuenta no existe",
          "DATOS": null
        };
      }
      const clavecifrada = await this.seguridadService.encriptartexto(data.clave);
      await this.usuarioRepository.updateById(data.id_usuario, {clave: clavecifrada, intentoslogin: 0, bloqueadohasta: null});
      await this.usuarioRepository.logins(data.id_usuario).patch({estado_token: false}, {estado_token: true});
      return {
        "CODIGO": 200,
        "MENSAJE": "Contraseña restablecida: dísela a la persona. Sus sesiones abiertas se cerraron",
        "DATOS": null
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al restablecer la contraseña",
        "DATOS": null
      };
    }
  }




   //-------------------------------------METODOS PARA EL LOGIN----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


    /**
   * Metodo para identificar un usuario por medio de su celular y su clave sin generar un codigo 2fa
   * UN SOLO MENSAJE PARA CELULAR O CLAVE INCORRECTOS (NO REVELA QUE CELULARES EXISTEN)
   * DESPUES DE intentosMaximosLogin FALLOS SEGUIDOS LA CUENTA QUEDA BLOQUEADA minutosBloqueoLogin MINUTOS
   * @param credenciales
   * @returns usuario, token y menu
   */
    @post('/identificar-usuario-SIN-2fa')
    @response(200, {
      description: 'Identificar usuario por celular y clave',
      content: {'application/json': {schema: getModelSchemaRef(Usuario)}},
    })
    async identificarUsuarioSin2fa(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Credenciales),
          },
        },
      })
      credenciales: Credenciales,
    ): Promise<object> {
      //EL CELULAR SE NORMALIZA IGUAL QUE AL CREAR LA CUENTA (+57, ESPACIOS Y GUIONES)
      let existe = await this.seguridadService.buscarPorCelular(credenciales.celular);

      //SI LA CUENTA ESTA BLOQUEADA NO SE REVISA LA CLAVE
      if (existe?.bloqueadohasta && new Date(existe.bloqueadohasta) > new Date()) {
        const minutos = Math.ceil((new Date(existe.bloqueadohasta).getTime() - Date.now()) / 60000);
        return {
          "CODIGO": 429,
          "MENSAJE": `La cuenta está bloqueada por intentos fallidos. Intenta de nuevo en ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`,
          "DATOS": null
        };
      }

      let usuario = await this.seguridadService.identificarusuario(credenciales);
      if (usuario) {
        //SE REINICIAN LOS INTENTOS FALLIDOS (UN bloqueadohasta YA VENCIDO NO BLOQUEA)
        await this.usuarioRepository.updateById(usuario.id_usuario, {intentoslogin: 0});
        //genera el login
        let login: Login = new Login();
        //genera token
        let token = this.seguridadService.CrearToken(usuario);
        //genera el menu de permisos la lista por rol
        let menu = await this.seguridadService.ConsultarPermisosDeMenuPorUsuario(usuario.rolid);
        //inicializa el login
        login.usuarioid = usuario.id_usuario!;
        login.codigo_2fa = this.seguridadService.crearTextoAleatoria(5);
        login.estado_codigo2fa = true;
        login.token = token;
        login.estado_token = true;

        await this.loginRepository.create(login);

        return {
          "CODIGO": 200,
          "MENSAJE": "Operación exitosa",
          "DATOS": {
            //SOLO SE DEVUELVEN LOS DATOS PUBLICOS DEL USUARIO (NUNCA LA CLAVE)
            usuario: {
              id_usuario: usuario.id_usuario,
              nombre: usuario.nombre,
              celular: usuario.celular,
              correo: usuario.correo ?? null,
              rolid: usuario.rolid,
            },
            token,
            menu: menu
          }
        };
      }

      if (existe) {
        //CUENTA DESACTIVADA CON LA CLAVE CORRECTA: SE AVISA (SOLO QUIEN TIENE LA CLAVE LO VE)
        if (!existe.aceptado && await this.seguridadService.compararClave(credenciales.clave, existe.clave)) {
          return {
            "CODIGO": 403,
            "MENSAJE": "Esta cuenta está desactivada",
            "DATOS": null
          };
        }
        //SE CUENTA EL INTENTO FALLIDO Y SE BLOQUEA AL LLEGAR AL MAXIMO
        const intentos = (existe.intentoslogin ?? 0) + 1;
        if (intentos >= ConfiguracionSeguridad.intentosMaximosLogin) {
          await this.usuarioRepository.updateById(existe.id_usuario, {
            intentoslogin: 0,
            bloqueadohasta: new Date(Date.now() + ConfiguracionSeguridad.minutosBloqueoLogin * 60000).toISOString(),
          });
          return {
            "CODIGO": 429,
            "MENSAJE": `Demasiados intentos fallidos: la cuenta quedó bloqueada ${ConfiguracionSeguridad.minutosBloqueoLogin} minutos`,
            "DATOS": null
          };
        }
        await this.usuarioRepository.updateById(existe.id_usuario, {intentoslogin: intentos});
      }
      return {
        "CODIGO": 401,
        "MENSAJE": "El celular o la contraseña no son correctos",
        "DATOS": null
      }
    }




  // ¿ESTE SITIO ES LA DEMO? (LA PANTALLA DE INGRESO MUESTRA LOS BOTONES DE ENTRADA RAPIDA SOLO SI DICE QUE SI)
  @get('/demo-activa')
  @response(200, {
    description: 'Dice si la entrada rápida de la demo está prendida',
  })
  async demoActiva(): Promise<object> {
    return {"CODIGO": 200, "MENSAJE": ConfiguracionSeguridad.demoEntrada ? 'Demo' : 'No es la demo', "DATOS": {activa: ConfiguracionSeguridad.demoEntrada}};
  }



  // ENTRADA RAPIDA A LA DEMO (demoganadera.ejaniot.com): DA LA SESION DE UNA DE LAS TRES CUENTAS DE EJEMPLO SIN PEDIR CLAVE
  // SOLO SI EL .env DICE DEMO_ENTRADA=SI (EN EL SITIO REAL Y EN EL PC RESPONDE 404). LA RESIEMBRA NOCTURNA DEJA LAS CUENTAS COMO NUEVAS
  @post('/entrar-demo')
  @response(200, {
    description: 'Entrada rápida a la demo',
  })
  async entrarDemo(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(EntrarDemo),
        },
      },
    })
    data: EntrarDemo,
  ): Promise<object> {
    if (!ConfiguracionSeguridad.demoEntrada) {
      return {"CODIGO": 404, "MENSAJE": "La entrada rápida solo existe en la demo", "DATOS": null};
    }
    try {
      let celular = ConfiguracionSeguridad.demoCelulares[data.rol];
      let usuario = celular ? await this.seguridadService.buscarPorCelular(celular) : null;
      if (!usuario || usuario.aceptado === false) {
        return {"CODIGO": 404, "MENSAJE": "La cuenta de ejemplo no está lista: la demo se vuelve a sembrar en la madrugada", "DATOS": null};
      }
      let token = this.seguridadService.CrearToken(usuario);
      let menu = await this.seguridadService.ConsultarPermisosDeMenuPorUsuario(usuario.rolid);
      let login: Login = new Login();
      login.usuarioid = usuario.id_usuario!;
      login.codigo_2fa = this.seguridadService.crearTextoAleatoria(5);
      login.estado_codigo2fa = true;
      login.token = token;
      login.estado_token = true;
      await this.loginRepository.create(login);
      return {
        "CODIGO": 200,
        "MENSAJE": "Operación exitosa",
        "DATOS": {
          usuario: {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            celular: usuario.celular,
            correo: usuario.correo ?? null,
            rolid: usuario.rolid,
          },
          token,
          menu: menu
        }
      };
    } catch (err) {
      return {"CODIGO": 500, "MENSAJE": "Error al entrar a la demo", "DATOS": null};
    }
  }




  //-------------------------------------METODOS PARA LA CLAVE----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



  // MI PERFIL: EL USUARIO AUTENTICADO CAMBIA SU NOMBRE Y SU CORREO (OPCIONAL). EL USUARIO SALE DEL TOKEN, NO DEL BODY
  // EL CELULAR NO SE CAMBIA AQUI (ES CON LO QUE ENTRA)
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiPerfil, ConfiguracionSeguridad.editarAccion]
  })
  @post('/actualizar-mi-perfil')
  @response(200, {
    description: 'actualizar el nombre y el correo del usuario autenticado',
  })
  async actualizarMiPerfil(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ActualizarPerfil),
        },
      },
    })
    data: ActualizarPerfil,
  ): Promise<object> {
    try {
      let nombre = this.seguridadService.normalizarNombre(data.nombre);
      let correo = this.seguridadService.normalizarCorreo(data.correo);
      if (nombre === '') {
        return {
          "CODIGO": 400,
          "MENSAJE": "El nombre es obligatorio",
          "DATOS": null
        };
      }
      if (correo !== null && !this.seguridadService.correoValido(correo)) {
        return {
          "CODIGO": 400,
          "MENSAJE": "El correo no tiene un formato válido",
          "DATOS": null
        };
      }
      let existeUsuario = await this.usuarioRepository.findOne({where: {id_usuario: perfil.id_usuario}});
      if (!existeUsuario) {
        return {
          "CODIGO": 404,
          "MENSAJE": "La cuenta no existe",
          "DATOS": null
        };
      }
      await this.usuarioRepository.updateById(existeUsuario.id_usuario, {
        nombre: nombre,
        correo: correo,
      });
      return {
        "CODIGO": 200,
        "MENSAJE": "Perfil actualizado exitosamente",
        "DATOS": {
          id_usuario: existeUsuario.id_usuario,
          nombre: nombre,
          celular: existeUsuario.celular,
          correo: correo,
          rolid: existeUsuario.rolid,
        }
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al actualizar el perfil",
        "DATOS": null
      };
    }
  }



  // CAMBIO DE CLAVE DEL USUARIO AUTENTICADO (EL USUARIO SALE DEL TOKEN, NO DEL BODY)
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuMiPerfil, ConfiguracionSeguridad.editarAccion]
  })
  @post('/cambiar-clave')
  @response(200, {
    description: 'cambio de clave del usuario autenticado',
  })
  async cambiarClave(
    @inject(SecurityBindings.USER) perfil: UserProfile,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CambiarClave),
        },
      },
    })
    data: CambiarClave,
  ): Promise<object> {
    try {
      if (!data.clave_nueva || data.clave_nueva.length < ConfiguracionSeguridad.longitudMinimaClave) {
        return {
          "CODIGO": 400,
          "MENSAJE": `La nueva contraseña debe tener mínimo ${ConfiguracionSeguridad.longitudMinimaClave} caracteres`,
          "DATOS": null
        };
      }
      let usuario = await this.usuarioRepository.findById(perfil.id_usuario);
      let claveValida = await this.seguridadService.compararClave(data.clave_actual, usuario.clave);
      if (!claveValida) {
        return {
          "CODIGO": 400,
          "MENSAJE": "La contraseña actual no es correcta",
          "DATOS": null
        };
      }
      await this.usuarioRepository.updateById(usuario.id_usuario, {
        clave: await this.seguridadService.encriptartexto(data.clave_nueva),
      });
      return {
        "CODIGO": 200,
        "MENSAJE": "Contraseña actualizada exitosamente",
        "DATOS": null
      };
    } catch (err) {
      return {
        "CODIGO": 500,
        "MENSAJE": "Error al cambiar la contraseña",
        "DATOS": null
      };
    }
  }





  //METODO QUE ME INAVILITA EL TOKEN ES DECIR PONE ESTADO_TOKEN EN FALSE
  @post('/cerrar-sesion')
  @response(200, {
    description: 'logout',
  })
  async logout(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CerrarSesion),
        },
      },
    })
    CerrarSesion: CerrarSesion,
  ): Promise<object> {
    try {

      let key = await this.usuarioRepository.logins(CerrarSesion.id_usuario).patch({
        estado_token: false,
      },
        {
          estado_token: true,
          token: CerrarSesion.token,
        });

      if (key.count === 0) {
        return {
          "CODIGO": 404,
          "MENSAJE": "Operación fallida",
          "DATOS": "Token o usuario no encontrado"
        };
      }
      return {
        "CODIGO": 200,
        "MENSAJE": "Operación exitosa",
        "DATOS": "Token invalidado"
      };


    } catch (err) {
      throw new HttpErrors[500](`Error al actualizar el estado del token`);
    }
  }



  //METODO QUE RECIBE UN TOKEN Y DEVUELVE EL ROL Y SU NOMBRE
  @post('/consultar-rol')
  @response(200, {
    description: 'consultar rol por token',
  })
  async consultarRol(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TokenModel),
        },
      },
    })
    token: TokenModel,
  ): Promise<object> {
    let rol = await this.seguridadService.obtenerRolDesdeToken(token.token);
    if (rol) {
      let nombre_rol = await this.seguridadService.obtenerNombreRol(rol);
      return {
        "CODIGO": 200,
        "MENSAJE": "Operación exitosa",
        "DATOS": {rol, nombre_rol}
      };
    }
    return {
      "CODIGO": 404,
      "MENSAJE": "Operación fallida",
      "DATOS": "Usuario no encontrado"
    }
  }



}
