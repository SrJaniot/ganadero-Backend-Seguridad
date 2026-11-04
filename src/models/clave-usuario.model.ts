import {Model, model, property} from '@loopback/repository';

@model()
export class ClaveUsuario extends Model {
  @property({
    type: 'string',
    required: true,
  })
  id_usuario: string;

  @property({
    type: 'string',
    required: true,
  })
  clave: string;


  constructor(data?: Partial<ClaveUsuario>) {
    super(data);
  }
}

export interface ClaveUsuarioRelations {
  // describe navigational properties here
}

export type ClaveUsuarioWithRelations = ClaveUsuario & ClaveUsuarioRelations;
