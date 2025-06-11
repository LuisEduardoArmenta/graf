import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environments';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoilerService {

  constructor(private http: HttpClient) { }

  private apiUrl = environment.apiUrl;

  hacerBoiler(nombrePro: any, credenciales: any, graphModel:any, paquetesGraph:any):Observable<any>{
    console.log("Nombre proyecto",nombrePro);
    console.log("credenciales",credenciales);
    console.log("grapgModel",graphModel);
    console.log("paquetes",paquetesGraph);
     return this.http.post<any>(`${this.apiUrl}/api/project/crear`,{nombreProyecto:nombrePro,graphModel:graphModel,credenciales:credenciales,paquetesGraph:paquetesGraph});
  }
}
