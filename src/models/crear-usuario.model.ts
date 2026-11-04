import {Model, model, property} from '@loopback/repository';

//DATOS PARA CREAR UN USUARIO DESDE ms-logica-ganadero (EL DUEÑO CREA A SUS VAQUEROS Y AL VETERINARIO)
//EL id_usuario LO GENERA ms-seguridad (crypto.randomUUID()); rolid 2 DUEÑO, 3 VAQUERO O 4 VETERINARIO
@model()
export class CrearUsuario extends Model {
  @property({
    type: 'string',
    required: true,
  })
  nombre: string;

  @property({
    type: 'string',
    required: true,
  })
  celular: string;

  @property({
    type: 'string',
    required: true,
  })
  clave: string;

  @property({
    type: 'number',
    required: true,
  })
  rolid: number;


  constructor(data?: Partial<CrearUsuario>) {
    super(data);
  }
}

export interface CrearUsuarioRelations {
  // describe navigational properties here
}

export type CrearUsuarioWithRelations = CrearUsuario & CrearUsuarioRelations;
