import { Component } from '@angular/core';
import * as go from 'gojs';
import jsPDF from "jspdf";
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../../services/versiones/versiones.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NuevaVersionComponent } from '../nueva-version/nueva-version.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-uml-componentes',
  standalone: true,
  imports: [NavbarComponent],
  templateUrl: './uml-componentes.component.html',
  styleUrl: './uml-componentes.component.css'
})
export class UmlComponentesComponent {
  diagram!: go.Diagram;
  private palette!: go.Palette;
  tipoRelacion: string = "";
  versiones: any = {};

  constructor(private toastr: ToastrService, private dialog: MatDialog, private router:Router, private verSvc: VersionesService) { }

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
      'draggingTool.isGridSnapEnabled': true,
      'draggingTool.dragsTree': true,
      'draggingTool.isEnabled': true,
      'layout': $(go.ForceDirectedLayout, {
        // defaultSpringLength: 50,
        // defaultElectricalCharge: 50,
        // isRealtime: false
      })
    });
    this.diagram.layout = $(go.LayeredDigraphLayout, {
      direction: 0,
      layerSpacing: 100,
      columnSpacing: 50,
      setsPortSpots: false,
      isOngoing: false
    });

    this.diagram.addDiagramListener("SelectionMoved", (e) => {
      const selectedNodes = this.diagram.selection.toArray().filter(part => part instanceof go.Node) as go.Node[];
      selectedNodes.forEach(node => {
        const bounds = node.actualBounds;
        this.diagram.nodes.each(otherNode => {
          if (otherNode.actualBounds.intersects(bounds.x, bounds.y, bounds.width, bounds.height)) {
            if (otherNode !== node && bounds.intersects(bounds.x, bounds.y, bounds.width, bounds.height)) {
              node.move(new go.Point(otherNode.actualBounds.x + otherNode.actualBounds.width + 10, node.actualBounds.y));
            }
          }
        });
      });
    });
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'normal' };


    this.diagram.nodeTemplateMap.add("subsistema",
      $(go.Node, "Vertical",
        {
          locationSpot: go.Spot.Center,
          selectionAdorned: true,
          resizable: true,
          resizeObjectName: "SHAPE"
        },
        $(go.Panel, "Auto",
          $(go.Shape, "Rectangle", {
            name: "SHAPE",
            fill: "#e2f0fb",
            stroke: "#0d6efd",
            strokeWidth: 3,
            height: 60,
            width: 100
          }),
          $(go.TextBlock, {
            margin: 10,
            font: "bold 16px sans-serif",
            textAlign: "center",
            editable: true,
            wrap: go.TextBlock.WrapFit,
            width: 100
          }, new go.Binding("text", "name").makeTwoWay())
        ),
        $(go.Panel, "Vertical",
          { margin: 10 },
          new go.Binding("itemArray", "interfaces"),
          {
            itemTemplate: $(go.Panel, "Horizontal",
              { margin: 5 },
              $("Shape",
                {
                  portId: "",
                  figure: "Circle",
                  fill: "#0dcaf0",
                  stroke: null,
                  width: 14,
                  height: 14,
                  fromLinkable: true,
                  toLinkable: true
                }
              ),
              $(go.TextBlock,
                { margin: 2, font: "12px sans-serif", editable: true },
                new go.Binding("text", "name").makeTwoWay())
            )
          }
        )
      )
    );
    this.diagram.nodeTemplateMap.add("circle",
      $(go.Node, "Vertical",
      $(go.Shape, "Circle", { fill: "gray", stroke: null, width: 30, height: 30, fromLinkable: true, toLinkable: true }),
      $(go.TextBlock, { margin: 2, font: "15px sans-serif", editable: true }, new go.Binding("text", "name").makeTwoWay())
      )
    );

    this.diagram.linkTemplateMap.add('asociar',
      $(go.Link,
        {
          // routing: go.Link.Normal, 
          routing: go.Link.AvoidsNodes,
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          adjusting: go.Link.Stretch
        },
        $(go.Shape, { stroke: "#6c757d", strokeWidth: 1.5 }),
        $(go.Shape, { fromArrow: "Standard", stroke: "#6c757d" }),
        $(go.Shape, { toArrow: "Standard", stroke: "#6c757d" }),
        $(go.TextBlock, 'Interfaz', { segmentFraction: 0.5, segmentOffset: new go.Point(-20, -10), font: "bold 20px sans-serif", stroke: "green", editable: true, angle: 0 })
      )
    );



    this.diagram.linkTemplate.selectionAdornmentTemplate =
      $(go.Adornment, 'Link',
        $(go.Shape,
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

    this.diagram.model = new go.GraphLinksModel([
      { key: "Main", name: "Main", category: "subsistema" },
      { key: "Subsistema1", name: "Subsistema 1", category: "subsistema" },
      { key: "Subsistema2", name: "Subsistema 2", category: "subsistema" },
      { key: "Subsistema3", name: "Subsistema 3", category: "subsistema" },
      { key: "Subsistema4", name: "Subsistema 4", category: "subsistema" }
    ], [
      { from: "Main", to: "Subsistema1", category: 'asociar' },
      { from: "Main", to: "Subsistema2", category: 'asociar' },
      { from: "Main", to: "Subsistema3", category: 'asociar' },
      { from: "Main", to: "Subsistema4", category: 'asociar' }
    ]);

  }

  initPalette() {
    const $ = go.GraphObject.make;

    this.palette = $(go.Palette, 'myPaletteDiv', {
      nodeTemplateMap: this.diagram.nodeTemplateMap,
    });

    this.palette.model = $(go.GraphLinksModel, {
      nodeDataArray: [
        { text: "Subsistema", category: 'subsistema', name: "Subsistema" },
        { text: "Interfaz", category: 'circle', name: "Función" }
      ]
    });
  }

  volver(){
    this.router.navigate(['diagramas']);
  }
  guardarDiagrama() {
    if (!this.diagram) return;
    const jsonData = this.diagram.model.toJson();
    localStorage.setItem("diagramaGuardado", jsonData);
    let version = localStorage.getItem('version');
    this.verSvc.updateVersion(version, jsonData).subscribe(
      (data)=>{
        this.guardadoConExito();
      },(error)=>{
        this.toastr.error(`Error al guardar ${error}`, 'Error');
      }
    )
    this.guardadoConExito();
  }

  cargarDiagrama() {
    const jsonData = localStorage.getItem("diagramaGuardado");
    if (jsonData) {
      this.diagram.model = go.Model.fromJson(jsonData);

    } else {
      this.errorCargar();
    }
  }

  eliminarElemento() {
    const selectedParts = this.diagram.selection;
    this.diagram.startTransaction('delete');
    selectedParts.each((part) => {
      this.diagram.remove(part);
    });

    this.diagram.commitTransaction('delete');
  }

  guardarComoImagen(diagram: go.Diagram) {
    const imageData = this.diagram.makeImageData({ scale: 1, background: "white", returnType: "image/png" });

    if (typeof imageData !== "string") {
      console.error("Error: No se pudo generar la imagen del diagrama");
      return;
    }
    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imageData, "PNG", 10, 10, 280, 150);
    pdf.save("diagrama.pdf");
  }



  conectar() {
    if (!this.diagram) return;
    const model = this.diagram.model as go.GraphLinksModel;
    const selectedNodes = this.diagram.selection.toArray().filter(node => node instanceof go.Node) as go.Node[];
    if (selectedNodes.length !== 2) {
      console.error("Error: Debe seleccionar exactamente dos nodos para conectar");
      return;
    }
    const fromNode = selectedNodes[0].data.key;
    const toNode = selectedNodes[1].data.key;
    model.addLinkData({ from: fromNode, to: toNode, category: 'asociar' });
  }

  guardadoConExito() {
    this.toastr.success('Diagrama Guardado con Éxito', 'Nice!');
  }

  cargadoConExito() {
    this.toastr.success('Diagrama Guardado con Éxito', 'Nice');
  }

  error() {
    this.toastr.error('Los nodos no pueden estar fuera del grupo', 'Error');
  }

  errorCargar() {
    this.toastr.error('No hay un diagrama guardado', 'Error');
  }

  getVersiones(){
    let proyecto = localStorage.getItem("proyectoId");
    this.verSvc.getVersiones(proyecto, 2).subscribe(
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

      guardarNuevaVersion(){
        const dialogRef = this.dialog.open(NuevaVersionComponent,{
        width:'500 px'});
        dialogRef.afterClosed().subscribe(versionName => {
        if (versionName) {
          const jsonDiagram = this.diagram.model.toJson();
          const id_proyecto = localStorage.getItem("proyectoId");
          this.verSvc.postVersiones(id_proyecto, 2, versionName.version, jsonDiagram).subscribe(
          (nueva) => {
            this.getVersiones();
            this.toastr.success('Nueva versión creada', 'Éxito');
          },
          (error) => {
            this.toastr.error('Error al crear la versión', 'Error');
          });
        }});       
      }
    
}
