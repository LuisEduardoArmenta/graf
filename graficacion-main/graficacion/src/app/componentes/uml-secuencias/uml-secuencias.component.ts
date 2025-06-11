import { Component, ElementRef, AfterViewInit, ViewChild } from '@angular/core';
import * as go from 'gojs';
import jsPDF from 'jspdf';
import { VersionesService } from '../../services/versiones/versiones.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NuevaVersionComponent } from '../nueva-version/nueva-version.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-uml-secuencias',
  standalone: true,
  templateUrl: './uml-secuencias.component.html',
  styleUrls: ['./uml-secuencias.component.css'],
  imports:[NavbarComponent]
})
export class UmlSecuenciasComponent implements AfterViewInit {
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;
  private myDiagram!: go.Diagram;
  private myPalette!: go.Palette;
  diagram!: go.Diagram;

  versiones: any = {};


  constructor(private verSvc: VersionesService,  private toastr: ToastrService, private dialog: MatDialog, private router:Router){}

  ngAfterViewInit() {
    this.initDiagram();
    this.initPalette();
    this.getVersiones();
  }
  
  ngOnInit(){
   // this.getVersiones();
  }

  initDiagram() {
    const $ = go.GraphObject.make;

    this.myDiagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      allowCopy: false,
      "undoManager.isEnabled": true,
      "draggingTool.dragsLink": true,
      "linkingTool.isUnconnectedLinkValid": true,
      "linkingTool.portGravity": 20,
      "commandHandler.archetypeGroupData": { isGroup: true, text: "New Group" }
    });

    // Plantilla de los actores principales (grupos)
    this.myDiagram.groupTemplate = $(
      go.Group, "Vertical",
      {
        locationSpot: go.Spot.Top,
        selectionObjectName: "HEADER",
        computesBoundsAfterDrag: true,
        handlesDragDropForMembers: true,
        groupable: true,
        mouseDrop: function (e, grp) {
          const ok = grp instanceof go.Group && grp.diagram && grp.canAddMembers(grp.diagram.selection);
          if (!ok) return;
          e.diagram.selection.each(part => {
            if (part instanceof go.Node) part.containingGroup = grp;
          });
        },
        fromLinkable: false,
        toLinkable: false
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      $(
        go.Panel, "Auto", { name: "HEADER" },
        $(go.Shape, "Rectangle", { fill: "#bbdefb", stroke: null }),
        $(go.TextBlock, { editable: true, margin: 5, font: "10pt sans-serif" }, new go.Binding("text"))
      ),
      $(
        go.Shape,
        { figure: "LineV", stroke: "gray", strokeDashArray: [3, 3], width: 1 },
        new go.Binding("height", "duration")
      )
    );

    // Plantilla para los nodos de acción
    this.myDiagram.nodeTemplate = $(
      go.Node, "Auto",
      {
        locationSpot: go.Spot.Center,
        movable: true,
        groupable: true,
        dragComputation: (node: go.Part, pt: go.Point) => {
          return node.containingGroup ? new go.Point(node.containingGroup.location.x, pt.y) : pt;
        }
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      new go.Binding("group", "group"),
      $(
        go.Panel, "Vertical",
        // Puerto superior
        $(go.Shape, "Circle",
          {
            width: 6, height: 6, fill: "blue", strokeWidth: 0, cursor: "pointer",
            portId: "TOP_PORT",
            fromLinkable: true, toLinkable: true,
            fromSpot: go.Spot.Top, toSpot: go.Spot.Top,
            fromMaxLinks: 1, toMaxLinks: 1 // Opcional: limita a un link por puerto
          }
        ),
        $(go.Shape, "Rectangle", { fill: "white", stroke: "black", width: 12, height: 30 }),
        $(go.Shape, "Rectangle", { fill: "black", width: 12, height: 3 }),
        // Puerto inferior
        $(go.Shape, "Circle",
          {
            width: 6, height: 6, fill: "red", strokeWidth: 0, cursor: "pointer",
            portId: "BOTTOM_PORT",
            fromLinkable: true, toLinkable: true,
            fromSpot: go.Spot.Bottom, toSpot: go.Spot.Bottom,
            fromMaxLinks: 1, toMaxLinks: 1 // Opcional: limita a un link por puerto
          }
        )
      )
    );

    // Plantilla para las conexiones (flechas) con texto editable y placeholder
    this.myDiagram.linkTemplate = $(
      go.Link,
      {
        curve: go.Link.JumpOver,
        toShortLength: 2,
        relinkableFrom: true,
        relinkableTo: true,
        routing: go.Link.Normal, // Asegura que los links respeten los puertos
        fromPortId: "", // Se asignará dinámicamente
        toPortId: ""    // Se asignará dinámicamente
      },
      $(go.Shape, { stroke: "black" }),
      $(go.Shape, { toArrow: "OpenTriangle", stroke: "black" }),
      $(go.Panel, "Auto",
        $(go.Shape, "Rectangle", { fill: "white", stroke: "black" }),
        $(go.TextBlock, 'escribe aqui...',
          {
            font: "9pt sans-serif",
            margin: 2,
            editable: true,
            segmentIndex: 0,
            segmentOffset: new go.Point(0, -20)
          },
          new go.Binding("text", "text").makeTwoWay()
        )
      )
    );

    // Listener para asignar puertos dinámicamente según la dirección del link
    this.myDiagram.addDiagramListener("LinkDrawn", (e) => {
      const link = e.subject as go.Link;
      const fromNode = link.fromNode;
      const toNode = link.toNode;
      if (fromNode && toNode) {
        const fromY = fromNode.location.y;
        const toY = toNode.location.y;
        if (fromY < toY) {
          // Link va hacia abajo: sale del puerto inferior
          link.fromPortId = "BOTTOM_PORT";
          link.toPortId = "TOP_PORT";
        } else {
          // Link va hacia arriba: sale del puerto superior
          link.fromPortId = "TOP_PORT";
          link.toPortId = "BOTTOM_PORT";
        }
      }
    });

    // Listener para reasignar puertos al relinkear
    this.myDiagram.addDiagramListener("LinkRelinked", (e) => {
      const link = e.subject as go.Link;
      const fromNode = link.fromNode;
      const toNode = link.toNode;
      if (fromNode && toNode) {
        const fromY = fromNode.location.y;
        const toY = toNode.location.y;
        // if (fromY < toY) {
        //   link.fromPortId = "BOTTOM_PORT";
        //   link.toPortId = "TOP_PORT";
        // } else {
        //   link.fromPortId = "TOP_PORT";
        //   link.toPortId = "BOTTOM_PORT";
        // }
      }
    });

    // Evento para evitar que los enlaces queden vacíos después de editarse
    this.myDiagram.addDiagramListener("TextEdited", (e) => {
      const tb = e.subject as go.TextBlock;
      if (tb && tb.text.trim() === "") {
        this.myDiagram.model.setDataProperty(tb.part!.data, "text", "Escribe aquí...");
      }
    });

    this.loadModel();
  }

  initPalette() {
    const $ = go.GraphObject.make;

    this.myPalette = $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.myDiagram.nodeTemplateMap,
      model: new go.GraphLinksModel([
        { key: "Lifeline", text: "Lifeline", isGroup: true, duration: 300 },
        { key: "Action", text: "Action", isGroup: false, groupable: true }
      ])
    });
  }

  loadModel() {
    const modelData = {
      class: "go.GraphLinksModel",
      nodeDataArray: [
        { key: "Fred", text: "Fred: Patron", isGroup: true, loc: "0 0", duration: 300 },
        { key: "Bob", text: "Bob: Waiter", isGroup: true, loc: "120 0", duration: 300 },
        { key: "Hank", text: "Hank: Cook", isGroup: true, loc: "240 0", duration: 300 },
        { key: "Renee", text: "Renee: Cashier", isGroup: true, loc: "360 0", duration: 300 },
        { key: -5, group: "Bob", loc: "120 30" },
        { key: -6, group: "Hank", loc: "240 60" },
        { key: -7, group: "Fred", loc: "0 90" },
        { key: -8, group: "Bob", loc: "120 120" },
        { key: -9, group: "Fred", loc: "0 150" },
        { key: -10, group: "Renee", loc: "360 180" }
      ],
      linkDataArray: [
        { from: -5, to: -6, text: "order food", fromPortId: "BOTTOM_PORT", toPortId: "TOP_PORT" },
        { from: -5, to: -7, text: "serve drinks", fromPortId: "BOTTOM_PORT", toPortId: "TOP_PORT" },
        { from: -6, to: -8, text: "finish cooking", fromPortId: "BOTTOM_PORT", toPortId: "TOP_PORT" },
        { from: -8, to: -9, text: "serve food", fromPortId: "BOTTOM_PORT", toPortId: "TOP_PORT" },
        { from: -9, to: -10, text: "pay", fromPortId: "BOTTOM_PORT", toPortId: "TOP_PORT" }
      ]
    };

    this.myDiagram.model = go.Model.fromJson(modelData);
  }

  volver(){
    this.router.navigate(['diagramas']);
  }
  // Guardar el diagrama en formato JSON
  guardarDiagrama() {
    if (!this.myDiagram.model) return;
    const jsonData = this.myDiagram.model.toJson();
    localStorage.setItem("secuencia", jsonData);
    let version = localStorage.getItem('version');
    this.verSvc.updateVersion(version, jsonData).subscribe(
      (data)=>{
        this.toastr.success('Diagrama Guardado con Éxito', 'Nice!');
      },(error)=>{
        this.toastr.error(`Error al guardar ${error}`, 'Error');
      }
    )
//    console.log("Diagrama guardado", jsonData);
  }

  // Cargar el diagrama desde JSON
  cargarDiagrama() {
    const jsonData = localStorage.getItem("secuencia");
    if (jsonData) {
      this.myDiagram.model = go.Model.fromJson(jsonData);
    } else {
      console.log("No hay diagrama guardado");
    }
  }

  guardarComoImagen(diagram: go.Diagram) {
    const imageData = this.myDiagram.makeImageData({ scale: 1, background: "white", returnType: "image/png" });

    if (typeof imageData !== "string") {
      console.error("Error: No se pudo generar la imagen del diagrama");
      return;
    }
    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imageData, "PNG", 10, 10, 280, 150); // Adjust position & size
    pdf.save("diagrama.pdf");
  }

  getVersiones(){
    let proyecto = localStorage.getItem("proyectoId");
    this.verSvc.getVersiones(proyecto, 4).subscribe(
      (data) =>{
        this.versiones=data;
        console.log(this.versiones);

        if (this.versiones.length > 0) {
          const firstVersionId = this.versiones[0].id_version;
          console.log("Primera Version",firstVersionId);
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
          this.myDiagram.model = go.Model.fromJson(data.json);
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
        const jsonDiagram = this.myDiagram.model.toJson();
        const id_proyecto = localStorage.getItem("proyectoId");
  
        this.verSvc.postVersiones(id_proyecto, 4, versionName.version, jsonDiagram).subscribe(
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