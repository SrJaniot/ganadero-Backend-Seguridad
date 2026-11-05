import {Model, model, property} from '@loopback/repository';

//ENTRADA RAPIDA A LA DEMO (SOLO CON DEMO_ENTRADA=SI): CON QUE CUENTA DE EJEMPLO SE ENTRA
@model()
export class EntrarDemo extends Model {
  @property({
    type: 'string',
    required: true,
    jsonSchema: {enum: ['DUENIO', 'VAQUERO', 'VETERINARIO']},
  })
  rol: string;


  constructor(data?: Partial<EntrarDemo>) {
    super(data);
  }
}

export interface EntrarDemoRelations {
  // describe navigational properties here
}

export type EntrarDemoWithRelations = EntrarDemo & EntrarDemoRelations;
