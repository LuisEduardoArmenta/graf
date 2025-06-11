import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import { ProyectosService } from '../services/proyectos/proyectos.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatDialogContent } from '@angular/material/dialog';
import { VersionesService } from '../services/versiones/versiones.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nuevo-proyecto',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogActions, MatFormFieldModule, MatDialogContent],
  templateUrl: './nuevo-proyecto.component.html',
  styleUrl: './nuevo-proyecto.component.css'
})
export class NuevoProyectoComponent {

  nuevoProyecto: FormGroup = new FormGroup({});
  nombre: any;
  descripcion: any;
 

  constructor(private router: Router, private verSvc: VersionesService, private dialogRef: MatDialogRef<NuevoProyectoComponent>, private proyectosSvc: ProyectosService, private toastr: ToastrService){}

/*Hola*/
  ngOnInit(){
    this.nuevoProyecto = new FormGroup({
        nombre: new FormControl('',Validators.required),
        descripcion: new FormControl('', Validators.required)
    });
  }

  onSubmit(){
    const formData = this.nuevoProyecto.value;
    this.proyectosSvc.postProyectos(
      formData.nombre,
      formData.descripcion
    ).subscribe(response =>{
      this.toastr.success('Proyecto Creado con Éxito', 'Nice!');
      const newProjectID = response.id_proyecto;
      localStorage.setItem("proyectoId",newProjectID.toString());
      localStorage.setItem("nombrePro",response.nombre);
      this.dialogRef.close(newProjectID);
      this.crearVersiones(newProjectID);
      console.log("ID DEL PROYECTO CREADO", newProjectID);
     // this.router.navigate(['proyectos']);


    
     
    });
  }
  crearVersiones(proyecto: number){
    const initialVersion = "1.0 - Version Inicial";
      const defaultJsonCU = {  "class": "GraphLinksModel", "nodeDataArray": [
      {"key":"Sistema","isGroup":true}
      ] }; // customize as needed
      
      const defaultJsonSecuencias = { "class": "GraphLinksModel",
        "nodeDataArray": [
      {"key":"Fred","text":"Fred: Patron","isGroup":true,"loc":"0 0","duration":300},
      {"key":"Bob","text":"Bob: Waiter","isGroup":true,"loc":"120 0","duration":300},
      {"key":"Hank","text":"Hank: Cook","isGroup":true,"loc":"240 0","duration":300},
      {"key":"Renee","text":"Renee: Cashier","isGroup":true,"loc":"360 0","duration":300},
      {"key":-5,"group":"Bob","loc":"120 30"},
      {"key":-6,"group":"Hank","loc":"240 60"},
      {"key":-7,"group":"Fred","loc":"0 90"},
      {"key":-8,"group":"Bob","loc":"120 120"},
      {"key":-9,"group":"Fred","loc":"0 150"},
      {"key":-10,"group":"Renee","loc":"360 180"}
      ],
        "linkDataArray": [
      {"from":-5,"to":-6,"text":"order food","fromPortId":"BOTTOM_PORT","toPortId":"TOP_PORT"},
      {"from":-5,"to":-7,"text":"serve drinks","fromPortId":"BOTTOM_PORT","toPortId":"TOP_PORT"},
      {"from":-6,"to":-8,"text":"finish cooking","fromPortId":"BOTTOM_PORT","toPortId":"TOP_PORT"},
      {"from":-8,"to":-9,"text":"serve food","fromPortId":"BOTTOM_PORT","toPortId":"TOP_PORT"},
      {"from":-9,"to":-10,"text":"pay","fromPortId":"BOTTOM_PORT","toPortId":"TOP_PORT"}
      ]}

      const defaultJsonPaquetes = { "class": "GraphLinksModel",
          "nodeDataArray": [],
          "linkDataArray": []}

      const defaultJsonComponentes =
        { "class": "GraphLinksModel",
          "nodeDataArray": [
        {"key":"Main","name":"Main","category":"subsistema"},
        {"key":"Subsistema1","name":"Subsistema 1","category":"subsistema"},
        {"key":"Subsistema2","name":"Subsistema 2","category":"subsistema"},
        {"key":"Subsistema3","name":"Subsistema 3","category":"subsistema"},
        {"key":"Subsistema4","name":"Subsistema 4","category":"subsistema"}
        ],
          "linkDataArray": [
        {"from":"Main","to":"Subsistema1","category":"asociar"},
        {"from":"Main","to":"Subsistema2","category":"asociar"},
        {"from":"Main","to":"Subsistema3","category":"asociar"},
        {"from":"Main","to":"Subsistema4","category":"asociar"}
        ]}

      const defaultJsonClases={ "class": "GraphLinksModel",
        "nodeDataArray": [{"key":1,"name":"ClaseA","properties":[{"name":"atributo1","type":"string","visibility":"+"}],"methods":[{"name":"metodo1","type":"void","visibility":"+"}]}],
        "linkDataArray": []}
      
      this.verSvc.postVersiones(proyecto,2,initialVersion,defaultJsonComponentes).subscribe(()=>{
        console.log('Version inicial creada de componentes');
      })

      this.verSvc.postVersiones(proyecto,3,initialVersion,defaultJsonPaquetes).subscribe(()=>{
        console.log('Version inicial creada de Paquetes');
      })

      this.verSvc.postVersiones(proyecto,4,initialVersion,defaultJsonSecuencias).subscribe(()=>{
        console.log('Version inicial de Secuencias');
      })

      this.verSvc.postVersiones(proyecto,5,initialVersion,defaultJsonCU).subscribe(()=>{
        console.log('Version inicial de CU')
      })
      this.verSvc.postVersiones(proyecto,1,initialVersion,defaultJsonClases).subscribe(()=>{
        console.log(defaultJsonClases)
        console.log('Version creada de Clases')
      })
  }
  onClose(){
    this.dialogRef.close();
  }
}
