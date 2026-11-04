import {Model, model, property} from '@loopback/repository';

//MI PERFIL: EL USUARIO CAMBIA SU NOMBRE Y SU CORREO (OPCIONAL). EL USUARIO SALE DEL TOKEN, NO DEL BODY
@model()
export class ActualizarPerfil extends Model {
  @property({
    type: 'string',
    required: true,
  })
  nombre: string;

  @property({
    type: 'string',
    jsonSchema: {nullable: true},
  })
  correo?: string | null;


  constructor(data?: Partial<ActualizarPerfil>) {
    super(data);
  }
}

export interface ActualizarPerfilRelations {
  // describe navigational properties here
}

export type ActualizarPerfilWithRelations = ActualizarPerfil & ActualizarPerfilRelations;
