import {Model, model, property} from '@loopback/repository';

//EL CELULAR DE UNA CUENTA DESDE ms-logica-ganadero (FASE 5D: A QUE NUMERO VA EL RESUMEN DIARIO POR WHATSAPP)
@model()
export class BuscarIdUsuario extends Model {
  @property({
    type: 'string',
    required: true,
  })
  id_usuario: string;


  constructor(data?: Partial<BuscarIdUsuario>) {
    super(data);
  }
}

export interface BuscarIdUsuarioRelations {
  // describe navigational properties here
}

export type BuscarIdUsuarioWithRelations = BuscarIdUsuario & BuscarIdUsuarioRelations;
