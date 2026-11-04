import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  param,
  get,
  getModelSchemaRef,
  response,
} from '@loopback/rest';
import {Usuario} from '../models';
import {UsuarioRepository} from '../repositories';
import {authenticate} from '@loopback/authentication';
import {ConfiguracionSeguridad} from '../config/seguridad.config';
import {service} from '@loopback/core';
import {SeguridadService} from '../services';


//CAMPOS PUBLICOS DEL USUARIO, NUNCA SE DEVUELVE LA CLAVE NI LOS HASH
const camposPublicosUsuario = {
  id_usuario: true,
  nombre: true,
  celular: true,
  correo: true,
  rolid: true,
  aceptado: true,
};


export class UsuarioController {
  constructor(
    @repository(UsuarioRepository)
    public usuarioRepository : UsuarioRepository,
    @service(SeguridadService)
    public seguridadService: SeguridadService,
  ) {}

  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuUsuarios, ConfiguracionSeguridad.listarAccion]
  })
  @get('/usuarios/count')
  @response(200, {
    description: 'Usuario model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Usuario) where?: Where<Usuario>,
  ): Promise<Count> {
    return this.usuarioRepository.count(where);
  }



  //FUNCION PARA OBTENER USUARIOS PERO UNICAMENTE LOS VALORES PUBLICOS
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuUsuarios, ConfiguracionSeguridad.listarAccion]
  })
  @get('/usuarios/valores')
  @response(200, {
    description: 'Array of Usuario model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Usuario),
        },
      },
    },
  })
  async findValores(
    @param.filter(Usuario, {exclude: 'fields'}) filter?: Filter<Usuario>,
  ): Promise<Usuario[]> {
    return this.usuarioRepository.find({
      ...filter,
      fields: camposPublicosUsuario,
    });
  }



  //funcion para obtener un usuario por id_usuario pero unicamente los valores publicos
  @authenticate({
    strategy: 'auth',
    options: [ConfiguracionSeguridad.MenuUsuarios, ConfiguracionSeguridad.buscarAccion_id]
  })
  @get('/usuarios/valores/{id}')
  @response(200, {
    description: 'Usuario model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Usuario),
      },
    },
  })
  async findValoresById(
    @param.path.string('id') id: string,
  ): Promise<Usuario> {
    return this.usuarioRepository.findById(id, {
      fields: camposPublicosUsuario,
    });
  }


  //ACTIVAR, DESACTIVAR Y RESTABLECER LA CLAVE LO HACE ms-logica-ganadero CON LOS ENDPOINTS *-servicio DE seguridad.controller.ts

}
