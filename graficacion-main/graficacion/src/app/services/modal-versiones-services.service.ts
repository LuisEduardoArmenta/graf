import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';
import { ProyectosService } from './proyectos/proyectos.service';
import { modalVersion } from '../interfaces/modalVersion/modalVersion.interface';
@Injectable({
  providedIn: 'root'
})
export class ModalVersionesServicesService {

  // constructor() { }
   constructor(private http:HttpClient) { }
     private apiUrl = environment.apiUrl;

      getVersiones(proyecto:any):Observable<modalVersion|modalVersion[]>{
        console.log("proyecto");
         return this.http.get<modalVersion|modalVersion[]>(`${this.apiUrl}/versiones/${proyecto}`);
      }
      postVersiones(proyecto:any, secuencias:any, componentes:any,cu:any,paquetes:any, clases:any, bddHost:any, bddUser:any, bddPass:any):Observable<any>{
        console.log("id_proyecto");
        console.log(proyecto);
        console.log(secuencias);
        console.log(componentes);
        console.log(cu);
        console.log(paquetes);
        console.log(clases);
        console.log("id_proyecto");
        return this.http.post<any>(`${this.apiUrl}/crear/proyecto/bp`, {proyecto, secuencias, clases,cu,paquetes,componentes, bdd_host:bddHost, bdd_user:bddUser, bdd_contra:bddPass});
      }
}


// asi esta mi service segun yo esta
