import {Model, model, property} from '@loopback/repository';

//REGISTRO PUBLICO DEL DUEÑO DE UNA FINCA (ROL 2). EL id_usuario LO GENERA ms-seguridad
@model()
export class RegistrarDuenio extends Model {
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


  constructor(data?: Partial<RegistrarDuenio>) {
    super(data);
  }
}

export interface RegistrarDuenioRelations {
  // describe navigational properties here
}

export type RegistrarDuenioWithRelations = RegistrarDuenio & RegistrarDuenioRelations;
