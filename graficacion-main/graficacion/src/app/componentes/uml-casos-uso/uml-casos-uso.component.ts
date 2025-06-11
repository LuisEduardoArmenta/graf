import { Component } from '@angular/core';
import * as go from 'gojs';
import jsPDF from "jspdf";
import html2canvas from 'html2canvas';
import { catchError, groupBy } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../../services/versiones/versiones.service';
import { MatDialog } from '@angular/material/dialog';
import { NuevaVersionComponent } from '../nueva-version/nueva-version.component';
import { Route, Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-uml-casos-uso',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './uml-casos-uso.component.html',
  styleUrl: './uml-casos-uso.component.css'
})
export class UmlCasosUsoComponent {
  diagram!: go.Diagram;
  private palette!: go.Palette;
  tipoRelacion: string = "";
  versiones: any = {};
  constructor(private verSvc: VersionesService,  private toastr: ToastrService, private dialog: MatDialog, private router:Router){}


  ngOnInit() {
    this.initDiagram();
    this.initPalette();
    this.getVersiones();
  }

  title = 'pruebago';

  initDiagram() {
    const $ = go.GraphObject.make;

    this.diagram = $(go.Diagram, 'myDiagramDiv', {
      'undoManager.isEnabled': true,
      'linkingTool.isEnabled': true,
      'linkingTool.direction': go.LinkingTool.ForwardsOnly,
      'linkReshapingTool.isEnabled': true,
      'relinkingTool.isEnabled': true,
      'grid.visible': true,
    });

    

    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'normal' };
    
    this.diagram.groupTemplate = $(go.Group, "Auto", { isSubGraphExpanded: true, movable: true, handlesDragDropForMembers: true, computesBoundsAfterDrag: true, background: "transparent", resizable: true,
      memberValidation: (group: any, node: any) => node.category === "cu",
      mouseDrop: function(e, grp) {
        const diagram = grp.diagram;
        const tool = diagram!.currentTool as any;
        if(!tool.doingDragSelecting){
          e.handled = true;
          const group = grp as go.Group;
          const groupKey = group.data.key;
          diagram!.model.startTransaction("grouping");
          diagram!.selection.each((part: go.Part) => {
            if(part instanceof go.Node && part.category === "cu"){
              diagram!.model.setDataProperty(part.data, "group", groupKey);
            }
          });
          diagram!.model.commitTransaction("grouping");
        }
      }
    },
      $(go.Shape, "Rectangle", { fill: "rgba(128,128,128,0.2)", stroke: "gray", strokeWidth: 2 }),
      $(go.Panel, "Vertical",
        { defaultAlignment: go.Spot.Top, margin: 5 },
        $(go.TextBlock, { font: "Bold 12pt Sans-Serif", alignment: go.Spot.Top, editable: true}, new go.Binding("text", "key")),
        $(go.Placeholder, {padding: 10})
      )
    );
    
    // Define la plantilla de nodo con puerto
    this.diagram.nodeTemplateMap.add('stickman', 
      $(go.Node, 'Vertical', { 
        locationSpot: go.Spot.Center, 
        movable: true, groupable: false
         },
        new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.Picture, { source: 'images/stickman.png', width: 50, height: 50 }),
        $(go.TextBlock, { margin: 5, editable: true, font: '14px sans-serif', stroke: 'black'}, new go.Binding('text', 'text').makeTwoWay()),
          $(go.Shape, "Circle", { width: 8, height: 8, fill: "black", strokeWidth: 0, portId: "", fromLinkable: true, toLinkable: true, cursor: "pointer"})));
        
    this.diagram.nodeTemplateMap.add('cu', 
      $(go.Node, 'Auto',{ groupable: true, /*movable: true, isInGroup: true, locationSpot: go.Spot.Center*/ },
        $(go.Shape, 'RoundedRectangle', {fill: '#f9a200',stroke: 'black',strokeWidth: 1}, new go.Binding('fill', 'color')), new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
        $(go.TextBlock, {margin: 5, editable: true, font: '14px sans-serif', stroke: 'black'},new go.Binding('text', 'text').makeTwoWay()),
          $(go.Shape, "Circle", {width: 8, height: 8, fill: "transparent", strokeWidth: 0, portId: "left", fromLinkable: true, toLinkable: true, cursor: "pointer"})));

        //Adicion de la relacion extend
    this.diagram.linkTemplateMap.add('extend',
      $(go.Link, { routing: go.Link.AvoidsNodes, adjusting: go.Link.Stretch,corner: 5, relinkableFrom: true, relinkableTo: true, reshapable: true},
        $(go.Shape, {stroke: 'blue', strokeDashArray: [4,2]}),
        $(go.Shape, {toArrow: 'OpenTriangle', stroke: 'blue'}),
        $(go.TextBlock, '<<entend>>', {segmentFraction: 0.5, segmentOffset: new go.Point(-20, -10), font: "bold 20px sans-serif", stroke: "blue", editable: true})
      )
    );
    //console.log("Se añade modo extension")
    //Adicion de la relacion extend
    this.diagram.linkTemplateMap.add('include',
      $(go.Link, { routing: go.Link.AvoidsNodes, corner: 5, relinkableFrom: true, relinkableTo: true, reshapable:true, adjusting: go.Link.Stretch},
        $(go.Shape, {stroke: 'green', strokeDashArray: [4,2]}),
        $(go.Shape, {toArrow: 'OpenTriangle', stroke: 'green'}),
        $(go.TextBlock, '<<include>>', {segmentFraction: 0.5, segmentOffset: new go.Point(-20, -10), font: "bold 20px sans-serif", stroke: "green", editable: true})
      )
    );
    //console.log("se añade modo inclusion")

    this.diagram.linkTemplateMap.add('normal',
      $(go.Link, {routing: go.Link.AvoidsNodes, corner:5, relinkableFrom: true, relinkableTo: true, reshapable: true, adjusting: go.Link.Stretch},
        $(go.Shape, { stroke: 'black', strokeWidth: 2}),
        $(go.Shape, {toArrow: 'Standard', stroke: 'black', fill: 'black'})
      )
    );
    this.diagram.linkTemplate.selectionAdornmentTemplate =
  $(go.Adornment, 'Link',
    $(go.Shape, // Reshape handle
      {
        isPanelMain: true, 
        stroke: "dodgerblue", 
        strokeWidth: 3
      }),
    $(go.Shape, "Diamond", 
      {
        segmentIndex: 1, 
        segmentFraction: 0.5, 
        fill: "white", 
        stroke: "dodgerblue", 
        width: 10, 
        height: 10
      })
  );



    // Define el modelo de datos inicial
    this.diagram.model = $(go.GraphLinksModel, {
      nodeDataArray: [
        { key: "Sistema", isGroup: true},
      ],
    });

    this.diagram.addDiagramListener("ExternalObjectsDropped", (e)=>{
      e.subject.each((part: Node)=> {
        if(part instanceof go.Node && part.category === "cu" && part.containingGroup === null){
          this.error();
          this.diagram.remove(part);
        }
      });
    });
  }

  
  initPalette() {
    const $ = go.GraphObject.make;

    this.palette = $(go.Palette, 'myPaletteDiv', {
      nodeTemplateMap: this.diagram.nodeTemplateMap,
    });

    this.palette.model = $(go.GraphLinksModel, {
      nodeDataArray: [
        { text: "Actor", category: 'stickman' },
        { text: "Caso de Uso", category: 'cu' }
      ]
    });
  }

  // Guardar el diagrama en formato JSON
  guardarDiagrama() {
    if(!this.diagram) return;
    const jsonData = this.diagram.model.toJson();
    //localStorage.setItem("diagramaGuardado",jsonData);
    //let proyecto = localStorage.getItem('proyectoId');
    //let contenido = localStorage.getItem("diagramaGuardado");
    let version = localStorage.getItem('version');
    this.verSvc.updateVersion(version, jsonData).subscribe(
      (data)=>{
        this.guardadoConExito();
      },(error)=>{
        this.toastr.error(`Error al guardar ${error}`, 'Error');
      }
    )
   // this.guardadoConExito();
    
  }

  // Cargar el diagrama desde JSON
  cargarDiagrama() {
    const jsonData = localStorage.getItem("diagramaGuardado");
    if(jsonData) {
      this.diagram.model = go.Model.fromJson(jsonData);
      
    }else{
      this.errorCargar();
    }
  }

  eliminarElemento(){
    const selectedParts = this.diagram.selection;
    this.diagram.startTransaction('delete');
    selectedParts.each((part) => {
      this.diagram.remove(part);
    });

    this.diagram.commitTransaction('delete');
  }

  guardarComoImagen(diagram: go.Diagram) {
    const imageData = this.diagram.makeImageData({ scale:1, background: "white", returnType: "image/png"});

    if(typeof imageData !== "string"){
      console.error("Error: No se pudo generar la imagen del diagrama");
      return;
    }
    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imageData, "PNG", 10, 10, 280, 150); // Adjust position & size
    pdf.save("diagrama.pdf");
  }

  extensionAsociacion(){
      this.tipoRelacion = 'extend';
      this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'extend' };
      console.log("Modo de Extensión")
  }
  inclusionAsociacion(){
    this.tipoRelacion = 'include';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'include' };
    //this.diagram.model.setDataProperty((this.diagram.model as go.GraphLinksModel), "archetypeLinkData", { category: 'extend' });
    console.log("Modo de Inclusión")
  }

  volver(){
    this.router.navigate(['diagramas']);
  }
  asociacion(){
    this.tipoRelacion = 'normal';
    this.diagram.toolManager.linkingTool.archetypeLinkData = {  category: 'normal' };
  }

  guardadoConExito(){
    this.toastr.success('Diagrama Guardado con Éxito', 'Nice!');
  }

  cargadoConExito(){
    this.toastr.success('Diagrama Guardado con Éxito', 'Nice');
  }

  error(){
    this.toastr.error('Los nodos no pueden estar fuera del grupo', 'Error');
  }

  errorCargar(){
    this.toastr.error('No hay un diagrama guardado', 'Error');
  }

  guardarNuevaVersion(){

    const dialogRef = this.dialog.open(NuevaVersionComponent,{
          width:'500 px'});
              dialogRef.afterClosed().subscribe(versionName => {
                if (versionName) {
                  const jsonDiagram = this.diagram.model.toJson();
                  const id_proyecto = localStorage.getItem("proyectoId");
  
                  this.verSvc.postVersiones(id_proyecto, 5, versionName.version, jsonDiagram).subscribe(
                    (nueva) => {
                      this.getVersiones();
                      this.toastr.success('Nueva versión creada', 'Éxito');
                    },
                    (error) => {
                      this.toastr.error('Error al crear la versión', 'Error');
                    }
                  );
                }
              });
            
  }

  getVersiones(){
    let proyecto = localStorage.getItem("proyectoId");
    this.verSvc.getVersiones(proyecto, 5).subscribe(
      (data) =>{
        this.versiones=data;
        console.log(this.versiones);

        if (this.versiones.length > 0) {
          const firstVersionId = this.versiones[0].id_version;
          this.cargarVersion({ target: { value: firstVersionId } });
        }
      },
      (error)=>{
        this.toastr.error('Error obteniendo versiones', 'Error');
      }
    );
  }
  
  cargarVersion(event: any): void{
    const version = event.target.value;
    console.log(version);
    this.verSvc.getVersion(version).subscribe(
      (data)=>{
        this.diagram.model = go.Model.fromJson(data.json);
        localStorage.setItem("version",version);

        
      },(error)=>{
          this.toastr.error('No hay un diagrama guardado', 'Error');
      }
    )
  }
}

