import {App} from './application';

export async function migrate(args: string[]) {
  const existingSchema = args.includes('--rebuild') ? 'drop' : 'alter';
  console.log('Migrating schemas (%s existing schema)', existingSchema);

  const app = new App();
  await app.boot();
  //SE MIGRA MODELO POR MODELO EN ORDEN DE DEPENDENCIAS (LAS LLAVES FORANEAS NECESITAN QUE LA TABLA PADRE EXISTA)
  const ordenModelos = ['Rol', 'Menu', 'Usuario', 'MenuRol', 'Login'];
  for (const modelo of ordenModelos) {
    await app.migrateSchema({existingSchema, models: [modelo]});
  }

  // Connectors usually keep a pool of opened connections,
  // this keeps the process running even after all work is done.
  // We need to exit explicitly.
  process.exit(0);
}

migrate(process.argv).catch(err => {
  console.error('Cannot migrate database schema', err);
  process.exit(1);
});
