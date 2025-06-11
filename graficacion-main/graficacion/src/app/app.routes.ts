import { Routes } from '@angular/router';
import { MenuPrincipalComponent } from './componentes/menu-principal/menu-principal.component';
import { UmlCasosUsoComponent } from './componentes/uml-casos-uso/uml-casos-uso.component';
import { UmlComponentesComponent } from './componentes/uml-componentes/uml-componentes.component';
import { UmlClasesComponent } from './componentes/uml-clases/uml-clases.component';
import { UmlPaquetesComponent } from './componentes/uml-paquetes/uml-paquetes.component';
import { UmlSecuenciasComponent } from './componentes/uml-secuencias/uml-secuencias.component';
import { MenuProyectosComponent } from './componentes/menu-proyectos/menu-proyectos.component';
import { NuevoProyectoComponent } from './nuevo-proyecto/nuevo-proyecto.component';

export const routes: Routes = [
    {path:'diagramas', component:MenuPrincipalComponent},
    {path:'casosuso',component:UmlCasosUsoComponent},
    {path:'componentes', component: UmlComponentesComponent},
    {path:'clases',component:UmlClasesComponent},
    {path:'paquetes',component:UmlPaquetesComponent},
    {path:'secuencias',component:UmlSecuenciasComponent},
    {path:'', component: MenuProyectosComponent},
    {path:'nuevoProyecto', component: NuevoProyectoComponent}
];
