import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';
import { proyectos } from '../../interfaces/proyectos/proyecto.interface';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {

  constructor(private http:HttpClient) { }
  private apiUrl = environment.apiUrl;

  getProyectos():Observable<proyectos|proyectos[]>{
    return this.http.get<proyectos|proyectos[]>(`${this.apiUrl}/proyectos`);
  }

  postProyectos(nombre: string, descripcion: string):Observable<proyectos>{
    return this.http.post<proyectos>(`${this.apiUrl}/crearproyecto`, {nombre, descripcion});
  }
  updateProyectos(id_proyecto: number,nombre: string, descripcion: string):Observable<proyectos|proyectos[]>{
    return this.http.put<proyectos|proyectos[]>(`${this.apiUrl}/proyecto/${id_proyecto}`,{nombre, descripcion});
  }
  getProyecto(id_proyecto:any):Observable<proyectos>{
    return this.http.get<proyectos>(`${this.apiUrl}/proyecto/nombre/${id_proyecto}`);
  }
}
