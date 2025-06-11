import { Component } from '@angular/core';
import { ProyectosService } from '../../services/proyectos/proyectos.service';
import {MatDialog, MatDialogModule} from '@angular/material/dialog'
import { NuevoProyectoComponent } from '../../nuevo-proyecto/nuevo-proyecto.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-menu-proyectos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-proyectos.component.html',
  styleUrl: './menu-proyectos.component.css'
})
export class MenuProyectosComponent {
    proyectos: any={};
    nombre:any;
    itemsPorPagina = 9; // Número de proyectos por página
    paginaActual = 1;   // Página actual
    descripcion:any;
   constructor(private proyectosSvc: ProyectosService, private dialog: MatDialog, private router: Router){}
   ngOnInit(){
    this.getProyectos();
   }
   getProyectos(): void{
      this.proyectosSvc.getProyectos().subscribe(
        (data)=>{
          this.proyectos = data;
          this.proyectos.reverse(); // Invertir el orden de los proyectos
          console.log(this.proyectos);
        },(error)=>{
          const errorMessage = error.error?.message || 'Error al obtener proyectos';
          console.log(errorMessage);
        }
      )
   }
   OpenModal(){
    const dialogRef = this.dialog.open(NuevoProyectoComponent,{
      width:'1000 px'});

      dialogRef.afterClosed().subscribe((result)=>{
        if(result){
          this.getProyectos();
          this.router.navigate(['diagramas']);
        }
      })
   }

   Ingresar(id: number, nombre:string){
    localStorage.setItem('proyectoId', id.toString());
    localStorage.setItem('nombrePro',nombre);
    console.log('Proyecto guardado en local storage: ', id);
    this.router.navigate(["diagramas"]);
   }


   // Calcula el número total de páginas
  get totalPages(): number {
    return Math.ceil(this.proyectos.length / this.itemsPorPagina);
  }

  // Devuelve los proyectos de la página actual
  proyectosPaginados(): any[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.proyectos.slice(inicio, fin);
  }

  // Cambia la página actual
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPages) {
      this.paginaActual = pagina;
    }
  }

  // Genera un array con los números de página
  generarPaginas(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
