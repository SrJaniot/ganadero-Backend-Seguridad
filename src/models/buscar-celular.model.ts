import {Model, model, property} from '@loopback/repository';

//BUSCAR UNA CUENTA POR CELULAR DESDE ms-logica-ganadero (SI LA PERSONA YA TIENE CUENTA NO SE CREA OTRA)
@model()
export class BuscarCelular extends Model {
  @property({
    type: 'string',
    required: true,
  })
  celular: string;


  constructor(data?: Partial<BuscarCelular>) {
    super(data);
  }
}

export interface BuscarCelularRelations {
  // describe navigational properties here
}

export type BuscarCelularWithRelations = BuscarCelular & BuscarCelularRelations;
