import {Model, model, property} from '@loopback/repository';

@model()
export class EstadoUsuario extends Model {
  @property({
    type: 'string',
    required: true,
  })
  id_usuario: string;

  @property({
    type: 'boolean',
    required: true,
  })
  aceptado: boolean;


  constructor(data?: Partial<EstadoUsuario>) {
    super(data);
  }
}

export interface EstadoUsuarioRelations {
  // describe navigational properties here
}

export type EstadoUsuarioWithRelations = EstadoUsuario & EstadoUsuarioRelations;
