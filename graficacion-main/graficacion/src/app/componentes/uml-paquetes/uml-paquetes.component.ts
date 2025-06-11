import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import * as go from 'gojs';
import { VersionesService } from '../../services/versiones/versiones.service';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { NuevaVersionComponent } from '../nueva-version/nueva-version.component';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-diagram-package',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './uml-paquetes.component.html',
  styleUrl: './uml-paquetes.component.css'
})
export class UmlPaquetesComponent implements AfterViewInit {
  @ViewChild('myDiagramDiv', { static: false }) diagramDiv!: ElementRef;
  @ViewChild('myPaletteDiv', { static: false }) paletteDiv!: ElementRef;
  @ViewChild('levelSlider', { static: false }) levelSlider!: ElementRef;
  myDiagram!: go.Diagram;
  myPalette!: go.Palette;
  public relationshipMode: boolean = false;
  tipoRelacion: string = "";
  packageCounter: number = 0;
  versiones: any = {};
  modeloFueGuardado: boolean = false;
  constructor(private VerSvc: VersionesService, private toastr: ToastrService, private verSvc: VersionesService, private dialog: MatDialog, private router: Router){}

  ngAfterViewInit(): void {
    this.initDiagram();

    const savedModel = localStorage.getItem('miModelo');
    if (savedModel) {
      this.myDiagram.model = go.Model.fromJson(savedModel);
      const textarea = document.getElementById('mySavedModel') as HTMLTextAreaElement;
      if (textarea) textarea.value = savedModel;
    }
  }

  ngOnInit(){
    this.getVersiones();
  }

 // ...existing code...
initDiagram(): void {
  const $ = go.GraphObject.make;

  this.myDiagram = $(go.Diagram, this.diagramDiv.nativeElement, {
    'grid.visible': true,
    'undoManager.isEnabled': true,
    'InitialLayoutCompleted': () => this.updateTotalGroupDepth(),
    mouseDrop: (e: go.InputEvent) => this.finishDrop(e, null),
    layout: $(go.GridLayout, { wrappingWidth: Infinity }) 
  });

  this.myDiagram.layout = $(go.GridLayout, {
    wrappingColumn: 3, // Máximo de 3 elementos por fila antes de pasar a la siguiente
    cellSize: new go.Size(100, 100), // Tamaño de cada celda
    spacing: new go.Size(10, 10) // Espaciado entre elementos
  });
  this.myDiagram.toolManager.linkingTool.isEnabled = false,  
  /** PALETA **/
  this.myPalette = $(go.Palette, this.paletteDiv.nativeElement, {
    nodeTemplateMap: this.myDiagram.nodeTemplateMap,
    groupTemplateMap: this.myDiagram.groupTemplateMap,
    layout: $(go.GridLayout, {
      wrappingColumn: 2,  // Define cuántos elementos habrá en cada fila antes de hacer un salto
      cellSize: new go.Size(100, 100),  // Tamaño uniforme para los elementos en la paleta
      spacing: new go.Size(10, 10),  // Espaciado entre los elementos
      alignment: go.GridAlignment.Position
    })
  });

  this.myPalette.layout = $(go.GridLayout, {
    wrappingColumn: 2,
    cellSize: new go.Size(100, 50),
    spacing: new go.Size(10, 10),
    alignment: go.GridAlignment.Position,

    // Aquí sobreescribimos arrangementOrigin para desplazar hacia abajo
    arrangementOrigin: new go.Point(0, 100)  // Mueve todo 100px hacia abajo
  });


  this.myPalette.nodeTemplateMap.add('ArrowNode',
    $(go.Node, 'Horizontal',
      { background: 'transparent', movable: false }, // Evita moverlo dentro de la paleta
      $(go.Shape,  // Representación de la flecha
        {
          geometryString: 'M0 0 L30 15 L0 30 Z',  // Flecha simple
          fill: 'black', stroke: null, width: 30, height: 30
        }
      ),
      $(go.TextBlock, 'Flecha', { margin: 5, font: 'bold 12px sans-serif' })
    )
  );

  /** TEMPLATE PARA NODOS **/
  this.myDiagram.nodeTemplate = $(go.Node, 'Auto',
    {
      mouseDrop: (e: go.InputEvent, node: go.GraphObject) => this.finishDrop(e, (node as go.Node).containingGroup),
      fromLinkable: true,
      toLinkable: true,
      selectionAdorned: true,
      resizable: true,
      resizeObjectName: "SHAPE"
    },
    $(go.Shape, 'RoundedRectangle', 
      { 
        name: "SHAPE",
        fill: "#ACE600",  // Default color that matches your palette
        stroke: "#333",
        strokeWidth: 1,
        minSize: new go.Size(100, 50)
      }
    ).bind('fill', 'color'),
    $(go.Panel, "Vertical",
      { margin: 8 },
      $(go.TextBlock,
        { 
          font: "bold 14px Lora, serif",
          stroke: "#333",
          margin: new go.Margin(0, 0, 4, 0),
          editable: true,
        }
        ,new go.Binding("text").makeTwoWay()
      ),
      $(go.TextBlock,
        { 
          font: "12px Lora, serif",
          stroke: "#666",
          editable: true,
          margin: new go.Margin(0, 0, 0, 0)
        }
      )
    )
  );

    this.myDiagram.linkTemplate =
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes,
          curve: go.Link.JumpOver,
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          selectable: true
        },
        $(go.Shape, { stroke: 'gray', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: null, fill: 'gray' })
      );

      this.myDiagram.linkTemplateMap.add('dashed',
        $(go.Link, {
            routing: go.Link.AvoidsNodes, 
            corner: 5, 
            relinkableFrom: true, 
            relinkableTo: true, 
            reshapable: true, 
            adjusting: go.Link.Stretch
          },
          $(go.Shape, { stroke: 'gray', strokeDashArray: [4,2] }) // Línea punteada sin texto
        )
      );
      

     this.myDiagram.linkTemplateMap.add('access',
        $(go.Link, { routing: go.Link.AvoidsNodes, corner: 5, relinkableFrom: true, relinkableTo: true, reshapable:true, adjusting: go.Link.Stretch},
          $(go.Shape, {stroke: 'green', strokeDashArray: [4,2]}),
          $(go.Shape, {toArrow: 'OpenTriangle', stroke: 'green'}),
          $(go.TextBlock, '<<access>>', {segmentFraction: 0.5, segmentOffset: new go.Point(-20, -10), font: "bold 20px sans-serif", stroke: "green", editable: true})
        )
      );
    
      this.myDiagram.linkTemplateMap.add('import',
        $(go.Link, { routing: go.Link.AvoidsNodes, corner: 5, relinkableFrom: true, relinkableTo: true, reshapable:true, adjusting: go.Link.Stretch},
          $(go.Shape, {stroke: 'green', strokeDashArray: [4,2]}),
          $(go.Shape, {toArrow: 'OpenTriangle', stroke: 'green'}),
          $(go.TextBlock, '<<import>>', {segmentFraction: 0.5, segmentOffset: new go.Point(-20, -10), font: "bold 20px sans-serif", stroke: "green", editable: true})
        )
      );

  this.myDiagram.addDiagramListener('ExternalObjectsDropped', (e) => {
    const model = this.myDiagram.model as go.GraphLinksModel;

    // Filtrar solo los grupos (paquetes)
    const groups = model.nodeDataArray.filter(data => data['isGroup']);

    // Reordenar y reasignar claves proporcionales
    groups.forEach((data, index) => {
      const newId = index + 1;
      model.setDataProperty(data, "key", newId);
      model.setDataProperty(data, "packageId", newId);
      // model.setDataProperty(data, "text", "Paquete " + newId);
    });

    // Actualizar contador
    this.packageCounter = groups.length + 1;
  });


  this.myDiagram.addDiagramListener("SelectionDeleted", (e) => {
    const model = this.myDiagram.model as go.GraphLinksModel;

    // Filtrar paquetes restantes
    const groups = model.nodeDataArray.filter(data => data['isGroup']);

    // Reasignar claves proporcionalmente
    groups.forEach((data, index) => {
      const newId = index + 1;
      model.setDataProperty(data, "key", newId);
      model.setDataProperty(data, "packageId", newId);
      // model.setDataProperty(data, "text", "Paquete " + newId);
    });

    // Actualizar contador
    this.packageCounter = groups.length + 1;
  });


  
  /** TEMPLATE PARA GRUPOS **/
  this.myDiagram.groupTemplate = $(go.Group, 'Auto',
    {
      background: 'transparent',
      ungroupable: true,
      layout: $(go.GridLayout, 
        { 
          wrappingColumn: Infinity, 
          cellSize: new go.Size(1, 1), 
          spacing: new go.Size(10, 10)
        }
      ),
      mouseDragEnter: (e: go.InputEvent, grp: go.GraphObject, prev: go.GraphObject) => this.highlightGroup(e, grp as go.Group, true),
      mouseDragLeave: (e: go.InputEvent, grp: go.GraphObject, next: go.GraphObject) => this.highlightGroup(e, grp as go.Group, false),
      mouseDrop: (e: go.InputEvent, grp: go.GraphObject) => this.finishDrop(e, grp as go.Group),
      isSubGraphExpanded: true,
      selectionAdorned: true,
      resizable: true,
      resizeObjectName: "SHAPE"
    },
    $(go.Shape, 'RoundedRectangle', 
      { 
        name: "SHAPE",
        fill: "#FFDD33",  // Default color that matches your palette
        stroke: "#59524c",
        strokeWidth: 2
      }
    ).bind('fill', 'color'),
    $(go.Panel, 'Vertical',
      { margin: new go.Margin(10, 10, 0, 10) },
      $(go.Panel, 'Horizontal', 
        { 
          stretch: go.Stretch.Horizontal,
          alignment: go.Spot.Top
        },
        $(go.TextBlock, 
          { 
            editable: true, 
            font: 'bold 16px Lora, serif',
            stroke: "#333",
            margin: new go.Margin(0, 0, 5, 0)
          }
          ,new go.Binding("text").makeTwoWay()
        ),
        $('SubGraphExpanderButton', 
          { 
            alignment: go.Spot.Right,
            margin: new go.Margin(0, 0, 5, 0)
          }
        )
      ),
      $(go.Placeholder, 
        { 
          padding: 10,
          alignment: go.Spot.TopLeft
        }
      )
    )
  );

    this.myPalette.model = new go.GraphLinksModel([
    // { text: 'Nodo', color: '#ACE600', clave: 'nodo' },  
    { isGroup: true, text: 'Paquete', color: '#FFDD33', clave: 'paquete', key: 0 },
    { text: 'Clase', color: '#FF0000', clave: 'clase' },
    // { text: 'Componente', color: '#0000FF', key: 'component' },                                                 
    ]);

    /** EVENTOS PARA SLIDER **/
    this.levelSlider.nativeElement.addEventListener('change', () => this.reexpand());
    this.levelSlider.nativeElement.addEventListener('input', () => this.reexpand());

  const fueGuardado = localStorage.getItem("modeloGuardado") === "true";
  if (fueGuardado) {
    this.load(); // Solo carga el modelo si fue guardado previamente
  }

}

 /** RESALTAR GRUPOS AL ARRASTRAR **/
  highlightGroup(e: go.InputEvent, grp: go.Group, show: boolean): void {
    if (!grp) return;
    e.handled = true;
    grp.isHighlighted = show;
  }

  /** AGRUPAR ELEMENTOS AL SOLTAR **/
  finishDrop(e: go.InputEvent, grp: go.Group | null): void {
    const ok = grp ? grp.addMembers(grp.diagram!.selection, true) : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true);
    if (!ok) e.diagram.currentTool.doCancel();
    this.updateTotalGroupDepth();
  }

  /** EXPANDIR GRUPOS SEGÚN SLIDER **/
  reexpand(): void {
    const level = parseInt(this.levelSlider.nativeElement.value);
    this.myDiagram.commit(diag => {
      diag.findTopLevelGroups().each(g => this.expandGroups(g, 0, level));
    }, 'reexpand');
  }

  expandGroups(g: go.Part, i: number, level: number): void {
    if (!(g instanceof go.Group)) return;
    g.isSubGraphExpanded = i < level;
    g.memberParts.each(m => this.expandGroups(m, i + 1, level));
  }

  /** ACTUALIZAR PROFUNDIDAD DE LOS GRUPOS **/
  updateTotalGroupDepth(): void {
    let d = 0;
    this.myDiagram.findTopLevelGroups().each(g => d = Math.max(d, this.groupDepth(g)));
    this.levelSlider.nativeElement.max = Math.max(0, d);
  }

  groupDepth(g: go.Part): number {
    if (!(g instanceof go.Group)) return 0;
    let d = 1;
    g.memberParts.each(m => d = Math.max(d, this.groupDepth(m) + 1));
    return d;
  }


  volver(){
    this.router.navigate(['diagramas']);
  }
  /** GUARDAR Y CARGAR MODELO **/
save(): void {
  const jsonData = this.myDiagram.model.toJson();
  (document.getElementById('mySavedModel') as HTMLTextAreaElement).value = jsonData;
  this.myDiagram.isModified = false;

  localStorage.setItem("miModelo", jsonData);
  localStorage.setItem("modeloGuardado", "true"); // ✅ Indicador persistente
  this.modeloFueGuardado = true;

  const version = localStorage.getItem('version');
  this.VerSvc.updateVersion(version, jsonData).subscribe(
    (data) => {
      this.guardadoConExito();
    },
    (error) => {
      this.toastr.error(`Error al guardar ${error}`, 'Error');
    }
  );
}


 load(): void {
  const json = localStorage.getItem("miModelo");
  try{
      if (json) {
      this.myDiagram.model = go.Model.fromJson(json);
      this.myDiagram.delayInitialization(() => this.myDiagram.zoomToFit());
    } else {
      this.toastr.warning('No hay un modelo guardado para cargar.', 'Atención');
    }
  } catch (error) {
      console.error("Error al cargar el modelo desde localStorage:", error);
      this.toastr.error('Error al cargar el diagrama guardado.')
  }
 }


  guardadoConExito(){
    this.toastr.success('Diagrama Guardado con Éxito', 'Nice!');
  }


  toggleRelationshipMode(): void {
    this.relationshipMode = !this.relationshipMode;
    this.myDiagram.toolManager.linkingTool.isEnabled = this.relationshipMode;
  }

  inclusionAccess() {
    this.tipoRelacion = 'access';
    this.myDiagram.toolManager.linkingTool.isEnabled = true; // Habilita la herramienta de enlace
  
    // Configura el prototipo del enlace
    this.myDiagram.toolManager.linkingTool.archetypeLinkData = { 
      category: 'access', 
      text: 'Access'  // Opcional: puedes definir un texto por defecto
    };
  
    console.log("Modo de acceso activado");
  }
  
  inclusionImport() {
    this.tipoRelacion = 'import';
    this.myDiagram.toolManager.linkingTool.isEnabled = true; // Habilita la herramienta de enlace
  
    // Configura el prototipo del enlace
    this.myDiagram.toolManager.linkingTool.archetypeLinkData = { 
      category: 'import', 
      text: 'Import'  // Opcional: puedes definir un texto por defecto
    };
  
    console.log("Modo de importe activado");

  }

  setLinkType(type: string) {
  this.tipoRelacion = type;

  // Activar modo relación si no está activo
  if (!this.relationshipMode) {
    this.relationshipMode = true;
  }

  this.myDiagram.toolManager.linkingTool.isEnabled = true;

  let linkData: any = { category: type };

  if (type === "dashed") {
    linkData = { category: "dashed" };
  }

  this.myDiagram.toolManager.linkingTool.archetypeLinkData = linkData;

  console.log(`Modo de relación activado: ${type}`);
  }

  
  deleteSelection() {
    const selected = this.myDiagram.selection;
    
    if (selected.count > 0) {
      this.myDiagram.startTransaction("delete");
      selected.each(part => this.myDiagram.remove(part));
      this.myDiagram.commitTransaction("delete");
      
      console.log("Elemento eliminado");
    } else {
      console.log("No hay nada seleccionado para eliminar");
    }
  }

  getVersiones(){
    let proyecto = localStorage.getItem("proyectoId");
    this.verSvc.getVersiones(proyecto, 3).subscribe(
      (data) =>{
        this.versiones=data;
        console.log(this.versiones);

        if (this.versiones.length > 0) {
          const firstVersionId = this.versiones[0].id_version;
          this.cargarVersion(firstVersionId); // ya no necesita { target: ... }
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
        const dialogRef = this.dialog.open(NuevaVersionComponent,{width:'500 px'});
        dialogRef.afterClosed().subscribe(versionName => {
          if (versionName) {
            const jsonDiagram = this.myDiagram.model.toJson();
            const id_proyecto = localStorage.getItem("proyectoId");
      
            this.verSvc.postVersiones(id_proyecto, 3, versionName.version, jsonDiagram).subscribe(
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

}



