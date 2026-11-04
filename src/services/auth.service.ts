import {injectable, /* inject, */ BindingScope} from '@loopback/core';
import {repository} from '@loopback/repository';
import {MenuRolRepository} from '../repositories';
import {HttpErrors} from '@loopback/rest';
import {UserProfile} from '@loopback/security';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @repository(MenuRolRepository)
    private repositorioMenuRol : MenuRolRepository,

  ) {}


  /**
   * VERIFICA SI UN ROL TIENE PERMISO PARA UNA ACCION SOBRE UN MENU
   * @param idRol rol del usuario (sale del token)
   * @param idMenu menu sobre el que se quiere actuar
   * @param Accion listar, guardar, eliminar, editar, buscar_id
   * @param idUsuario id del usuario (sale del token), se devuelve en el perfil para que la logica sepa QUIEN hace la peticion
   * @param nombre nombre del usuario, se devuelve en el perfil para que la logica lo use en la auditoria
   * @returns perfil {permitido, id_usuario, rol, nombre} o undefined si no tiene permiso
   */
  async VerificarPermisoDeUsuarioPorRol(idRol: number, idMenu: number, Accion: string, idUsuario: string, nombre?: string): Promise<UserProfile | undefined>{
    let permiso = await this.repositorioMenuRol.findOne({
      where:{
        rolid:idRol,
        menuid:idMenu,
      }
    });
    let continuar: boolean = false;
    if(permiso){
      switch (Accion) {
        case "guardar":
          continuar=permiso.guardar;
          break;
        case "listar":
          continuar=permiso.listar;
          break;
        case "eliminar":
          continuar=permiso.eliminar;
          break;
        case "editar":
          continuar=permiso.editar;
          break;
        case "buscar_id":
          continuar=permiso.buscar_id;
          break;



        default:
          throw new HttpErrors[401]("El usuario no tiene permiso para realizar esta accion por que no existe esa accion");
      }
      if(continuar){
        let perfil: UserProfile= Object.assign({
          permitido:"OK",
          id_usuario: idUsuario,
          rol: idRol,
          nombre: nombre ?? null,
        });
        return perfil;
      }else{
        return undefined;
      }

    }else{
      throw new HttpErrors[401]("El usuario no tiene permiso para realizar esta accion");
    }
  }



}
