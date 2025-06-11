import { Component } from '@angular/core';
import { ProyectosService } from '../../services/proyectos/proyectos.service';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../../services/versiones/versiones.service';
import { Router } from 'gojs';
import { MatDialogActions, MatDialogRef } from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import { MatDialogContent } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-nueva-version',
  standalone: true,
  imports: [MatDialogActions, ReactiveFormsModule, MatFormFieldModule, MatDialogContent],
  templateUrl: './nueva-version.component.html',
  styleUrl: './nueva-version.component.css'
})
export class NuevaVersionComponent {

  constructor( private verSvc: VersionesService, private dialogRef: MatDialogRef<NuevaVersionComponent>, private toastr: ToastrService){}

  nuevaVersion: FormGroup = new FormGroup({});
  versionName=''; 
  ngOnInit(){
      this.nuevaVersion = new FormGroup({
        version: new FormControl('',Validators.required)
          //descripcion: new FormControl('', Validators.required)
      });
    }
  
    onSubmit(){
      this.versionName = this.nuevaVersion.value;
      console.log("version",this.versionName);
      localStorage.setItem('versionName',this.versionName);
      this.dialogRef.close(this.versionName);
      
      // this.router.navigate(['proyectos']);
      }

    onCancel(): void {
      this.dialogRef.close();
    }
}
