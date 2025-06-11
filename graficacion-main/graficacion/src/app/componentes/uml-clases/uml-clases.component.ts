import { Component } from '@angular/core';
import * as go from 'gojs';
import jsPDF from "jspdf";
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../../services/versiones/versiones.service';
import { MatDialog } from '@angular/material/dialog';
import { NuevaVersionComponent } from '../nueva-version/nueva-version.component';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-uml-clases',
  standalone: true,
  imports:[NavbarComponent],
  templateUrl: './uml-clases.component.html',
  styleUrls: ['./uml-clases.component.css'],
 
})
export class UmlClasesComponent {
  diagram!: go.Diagram;
  private palette!: go.Palette;
  tipoRelacion: string = "";
  versiones: any = {};
  // Declarar propertyTemplate y methodTemplate como propiedades de la clase
  private propertyTemplate!: go.Panel;
  private methodTemplate!: go.Panel;

  constructor(private toastr: ToastrService, private verSvc: VersionesService,private dialog: MatDialog, private router: Router) {}

  ngOnInit() {
    this.initDiagram();
    this.initPalette();
    this.getVersiones();
  }

  initDiagram() {
    const $ = go.GraphObject.make;

    // Función para crear puertos de conexión
    function makePort(name: string, spot: go.Spot, output: boolean, input: boolean) {
      return $(go.Shape, 'Circle', {
        fill: null,
        stroke: null,
        desiredSize: new go.Size(7, 7),
        alignment: spot,
        alignmentFocus: spot,
        portId: name,
        fromSpot: spot,
        toSpot: spot,
        fromLinkable: output,
        toLinkable: input,
        cursor: 'pointer'
      });
    }

    this.diagram = $(go.Diagram, 'myDiagramDiv', {
      'undoManager.isEnabled': true,
      'linkingTool.isEnabled': true,
      'linkReshapingTool.isEnabled': true,
      'relinkingTool.isEnabled': true,
      'grid.visible': true,
      'draggingTool.dragsLink': true,
      'draggingTool.isGridSnapEnabled': true,
      'linkingTool.isUnconnectedLinkValid': true,
      'linkingTool.portGravity': 20,
      'relinkingTool.isUnconnectedLinkValid': true,
      'relinkingTool.portGravity': 20,
      'layout': $(go.LayeredDigraphLayout, {  // Evitar colisiones entre nodos
        direction: 90,
        layerSpacing: 100,
        columnSpacing: 70,
        setsPortSpots: true
      })
    });

    // Función para convertir visibilidad a símbolos
    function convertVisibility(v: string): string {
      switch (v) {
        case 'public': return '+';
        case 'private': return '-';
        case 'protected': return '#';
        case 'package': return '~';
        default: return v;
      }
    }

    // Definir propertyTemplate
    this.propertyTemplate = $(
      go.Panel, 'Horizontal',
      $(go.TextBlock, { isMultiline: false, editable: true, width: 12 }) // editable: true
        .bind('text', 'visibility', convertVisibility) // Convierte el valor a símbolo
        .bindTwoWay('text', 'visibility') // Vincula el campo al modelo
        .bind('text', 'visibility', (v: string) => v, (v: string, textBlock: go.TextBlock) => {
          // Actualizar el valor de visibilidad en el modelo cuando el usuario edita
          const node = textBlock.part;
          if (node instanceof go.Node) {
            const data = node.data;
            const newVisibility = v.trim(); // Obtener el valor editado
            this.diagram.model.setDataProperty(data, 'visibility', newVisibility); // Actualizar el modelo
          }
          return v; // Devolver el valor original para que no se pierda
        }),
      $(go.TextBlock, { isMultiline: false, editable: true })
        .bindTwoWay('text', 'name')
        .bind('isUnderline', 'scope', (s: string) => s[0] === 'c'),
      $(go.TextBlock, '')
        .bind('text', 'type', (t: string) => t ? ': ' : ''),
      $(go.TextBlock, { isMultiline: false, editable: true })
        .bindTwoWay('text', 'type'),
      $(go.TextBlock, { isMultiline: false, editable: false })
        .bind('text', 'default', (s: string) => s ? ' = ' + s : '')
    );

    // Definir methodTemplate
    this.methodTemplate = $(
      go.Panel, 'Horizontal',
      $(go.TextBlock, { isMultiline: false, editable: true, width: 12 }) // editable: true
        .bind('text', 'visibility', convertVisibility) // Convierte el valor a símbolo
        .bindTwoWay('text', 'visibility') // Vincula el campo al modelo
        .bind('text', 'visibility', (v: string) => v, (v: string, textBlock: go.TextBlock) => {
          // Actualizar el valor de visibilidad en el modelo cuando el usuario edita
          const node = textBlock.part;
          if (node instanceof go.Node) {
            const data = node.data;
            const newVisibility = v.trim(); // Obtener el valor editado
            this.diagram.model.setDataProperty(data, 'visibility', newVisibility); // Actualizar el modelo
          }
          return v; // Devolver el valor original para que no se pierda
        }),
      $(go.TextBlock, { isMultiline: false, editable: true })
        .bindTwoWay('text', 'name')
        .bind('isUnderline', 'scope', (s: string) => s[0] === 'c'),
      $(go.TextBlock, { isMultiline: false, editable: true })
        .bindTwoWay('text', 'parameters'),
      $(go.TextBlock, '')
        .bind('text', 'type', (t: string) => t ? ': ' : ''),
      $(go.TextBlock, { isMultiline: false, editable: true })
        .bindTwoWay('text', 'type')
    );

    // Plantilla para nodos (clases)
    this.diagram.nodeTemplate = $(
      go.Node, 'Spot',
      {
        locationSpot: go.Spot.Center,
        selectable: true,
        resizable: false,
        rotatable: false,
        fromSpot: go.Spot.AllSides,
        toSpot: go.Spot.AllSides,
        mouseEnter: (e, obj) => {
          const node = obj.part;
          if (node instanceof go.Node) {
            showSmallPorts(node, true);
          }
        },
        mouseLeave: (e, obj) => {
          const node = obj.part;
          if (node instanceof go.Node) {
            showSmallPorts(node, false);
          }
        }
      },
      $(go.Panel, 'Auto',
        $(go.Shape, 'RoundedRectangle', { fill: 'white' }),
        $(go.Panel, 'Table',
          { defaultRowSeparatorStroke: 'black' },
          // Nombre de la clase
          $(go.TextBlock, {
            row: 0, columnSpan: 2, margin: 3, alignment: go.Spot.Center,
            font: 'bold 12pt sans-serif',
            isMultiline: false, editable: true
          }).bindTwoWay('text', 'name'),
          // Propiedades
          $(go.TextBlock, 'Propiedades', { row: 1, font: 'italic 10pt sans-serif' })
            .bindObject('visible', 'visible', (v: boolean) => !v, undefined, 'PROPERTIES'),
          $(go.Panel, 'Vertical', {
            name: 'PROPERTIES',
            row: 1,
            margin: 3,
            stretch: go.Stretch.Horizontal,
            defaultAlignment: go.Spot.Left,
            background: 'white',
            itemTemplate: this.propertyTemplate
          }).bind('itemArray', 'properties'),
         $(go.Panel, 'Horizontal', {
           row: 1,
           column: 1, // Colocar en la columna 1 (derecha)
           alignment: go.Spot.Right,
           padding: new go.Margin(0, 20, 0, 10) // Ajustar el padding para separar del borde
         },
           $('Button', // Botón para agregar propiedad
             {
               click: (e, obj) => {
                 if (obj?.part?.data) {
                   const node = obj.part;
                   this.diagram.startTransaction('add property');
                   this.diagram.model.addArrayItem(node.data.properties, { name: 'Prop', type: 'string', visibility: '+' });
                   this.diagram.commitTransaction('add property');
                 } else {
                   console.error("No se pudo acceder a los datos del nodo.");
                 }
               },
               width: 20, // Ancho reducido
               height: 20, // Alto reducido
               margin: 2, // Margen pequeño
               alignment: go.Spot.Center // Centrar el contenido del botón
             },
             $(go.TextBlock, '+', { font: 'bold 10pt sans-serif' }) // Símbolo "+"
           ),
           $('Button', // Botón para eliminar la última propiedad
             {
               click: (e, obj) => {
                 if (obj?.part?.data) {
                   const node = obj.part;
                   const properties = node.data.properties;
                   if (properties.length > 0) {
                     this.diagram.startTransaction('remove property');
                     this.diagram.model.removeArrayItem(properties, properties.length - 1); // Eliminar el último elemento
                     this.diagram.commitTransaction('remove property');
                   }
                 } else {
                   console.error("No se pudo acceder a los datos del nodo.");
                 }
               },
               width: 20, // Ancho reducido
               height: 20, // Alto reducido
               margin: 2, // Margen pequeño
               alignment: go.Spot.Center // Centrar el contenido del botón
             },
             $(go.TextBlock, '-', { font: 'bold 10pt sans-serif' }) // Símbolo "-"
           )
         ).bind('visible', 'properties', (arr: any[]) => arr.length > 0),
         go.GraphObject.build("PanelExpanderButton", {
           row: 1,
           column: 1,
           alignment: go.Spot.TopRight,
           visible: false
         }, "PROPERTIES")
           .bind('visible', 'properties', (arr: any[]) => arr.length > 0),
           
          // Métodos
          $(go.TextBlock, 'Metodos', { row: 2, font: 'italic 10pt sans-serif' })
            .bindObject('visible', 'visible', (v: boolean) => !v, undefined, 'METHODS'),
          $(go.Panel, 'Vertical', {
            name: 'METHODS',
            row: 2,
            margin: 3,
            stretch: go.Stretch.Horizontal,
            defaultAlignment: go.Spot.Left,
            background: 'white',
            itemTemplate: this.methodTemplate
          }).bind('itemArray', 'methods'),
          $(go.Panel, 'Horizontal', {
          row: 2,
          column: 1, // Colocar en la columna 1 (derecha)
          alignment: go.Spot.Right,
          padding: new go.Margin(0, 20, 0, 10) // Ajustar el padding para separar del borde
        },
          $('Button', // Botón para agregar método
            {
              click: (e, obj) => {
                if (obj?.part?.data) {
                  const node = obj.part;
                  this.diagram.startTransaction('add method');
                  this.diagram.model.addArrayItem(node.data.methods, { name: 'Metodo', parameters: '()', type: 'void', visibility: '+' }
                  );
                  this.diagram.commitTransaction('add method');
                } else {
                  console.error("No se pudo acceder a los datos del nodo.");
                }
              },
              width: 20, // Ancho reducido
              height: 20, // Alto reducido
              margin: 2, // Margen pequeño
              alignment: go.Spot.Center // Centrar el contenido del botón
            },
            $(go.TextBlock, '+', { font: 'bold 10pt sans-serif' }) // Símbolo "+"
          ),

          $('Button', // Botón para eliminar el último método
            {
              click: (e, obj) => {
                if (obj?.part?.data) {
                  const node = obj.part;
                  const methods = node.data.methods;
                  if (methods.length > 0) {
                    this.diagram.startTransaction('remove method');
                    this.diagram.model.removeArrayItem(methods, methods.length - 1); // Eliminar el último elemento
                    this.diagram.commitTransaction('remove method');
                  }
                } else {
                  console.error("No se pudo acceder a los datos del nodo.");
                }
              },
              width: 20, // Ancho reducido
              height: 20, // Alto reducido
              margin: 2, // Margen pequeño
              alignment: go.Spot.Center // Centrar el contenido del botón
            },
            $(go.TextBlock, '-', { font: 'bold 10pt sans-serif' }) // Símbolo "-"
          )
        ).bind('visible', 'methods', (arr: any[]) => arr.length > 0),
        go.GraphObject.build("PanelExpanderButton", {
          row: 2,
          column: 1,
          alignment: go.Spot.TopRight,
          visible: false
        }, "METHODS")
          .bind('visible', 'methods', (arr: any[]) => arr.length > 0)
      )
          
        
      ),
      // Agregar puertos de conexión en los cuatro lados
      makePort('T', go.Spot.Top, false, true),    // Puerto superior
      makePort('L', go.Spot.Left, true, true),    // Puerto izquierdo
      makePort('R', go.Spot.Right, true, true),   // Puerto derecho
      makePort('B', go.Spot.Bottom, true, false)  // Puerto inferior
    );

    // Función para mostrar/ocultar puertos
    function showSmallPorts(node: go.Node, show: boolean) {
      node.ports.each((port) => {
        if (port.portId !== '' && port instanceof go.Shape) {
          port.fill = show ? 'rgba(0,0,0,.3)' : null;
        }
      });
    }

    // Plantilla para relaciones
    this.diagram.linkTemplateMap.add('agregacion',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'StretchedDiamond', stroke: 'black', fill: 'white', scale: 2 }),
        
      )
    );

    this.diagram.linkTemplateMap.add('composicion',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'StretchedDiamond', stroke: 'black', fill: 'black', scale: 2 }),
      )
    );

    this.diagram.linkTemplateMap.add('implementacion',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2, strokeDashArray: [4,2] }),
        $(go.Shape, { toArrow: 'Triangle', stroke: 'black', fill: 'white', scale: 2 }),
    
      )
    );

    this.diagram.linkTemplateMap.add('herencia',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Triangle', stroke: 'black', fill: 'white', scale: 2 }),
    
      )
    );

    this.diagram.linkTemplateMap.add('1:*',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true,
          curve: go.Curve.JumpGap
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
    
        // Placeholder en el extremo inicial (fromEnd)
        $(go.TextBlock,
          {
            segmentIndex: 0, // Primer segmento (inicio del enlace)
            segmentOffset: new go.Point(20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '1' // Placeholder inicial
          }
        ).bind('text', 'fromText', (text: string) => text || '1'), // Enlace de datos
    
        // Placeholder en el extremo final (toEnd)
        $(go.TextBlock,
          {
            segmentIndex: -1, // Último segmento (final del enlace)
            segmentOffset: new go.Point(-20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '*' // Placeholder final
          }
        ).bind('text', 'toText', (text: string) => text || '*') // Enlace de datos
      )
    );

    this.diagram.linkTemplateMap.add('1:1',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
    
        // Placeholder en el extremo inicial (fromEnd)
        $(go.TextBlock,
          {
            segmentIndex: 0, // Primer segmento (inicio del enlace)
            segmentOffset: new go.Point(20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '1' // Placeholder inicial
          }
        ).bind('text', 'fromText', (text: string) => text || '1'), // Enlace de datos
    
        // Placeholder en el extremo final (toEnd)
        $(go.TextBlock,
          {
            segmentIndex: -1, // Último segmento (final del enlace)
            segmentOffset: new go.Point(-20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '1' // Placeholder final
          }
        ).bind('text', 'toText', (text: string) => text || '*') // Enlace de datos
      )
    );

    this.diagram.linkTemplateMap.add('m:n',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
    
        // Placeholder en el extremo inicial (fromEnd)
        $(go.TextBlock,
          {
            segmentIndex: 0, // Primer segmento (inicio del enlace)
            segmentOffset: new go.Point(20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: 'm' // Placeholder inicial
          }
        ).bind('text', 'fromText', (text: string) => text || '1'), // Enlace de datos
    
        // Placeholder en el extremo final (toEnd)
        $(go.TextBlock,
          {
            segmentIndex: -1, // Último segmento (final del enlace)
            segmentOffset: new go.Point(-20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: 'n' // Placeholder final
          }
        ).bind('text', 'toText', (text: string) => text || '*') // Enlace de datos
      )
    );

    this.diagram.linkTemplateMap.add('0:1',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
    
        // Placeholder en el extremo inicial (fromEnd)
        $(go.TextBlock,
          {
            segmentIndex: 0, // Primer segmento (inicio del enlace)
            segmentOffset: new go.Point(20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '0' // Placeholder inicial
          }
        ).bind('text', 'fromText', (text: string) => text || '1'), // Enlace de datos
    
        // Placeholder en el extremo final (toEnd)
        $(go.TextBlock,
          {
            segmentIndex: -1, // Último segmento (final del enlace)
            segmentOffset: new go.Point(-20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '1' // Placeholder final
          }
        ).bind('text', 'toText', (text: string) => text || '*') // Enlace de datos
      )
    );

    this.diagram.linkTemplateMap.add('0:*',
      $(go.Link,
        {
          routing: go.Link.AvoidsNodes, // Evitar colisiones entre enlaces
          corner: 5,
          relinkableFrom: true,
          relinkableTo: true,
          reshapable: true
        },
        $(go.Shape, { stroke: 'black', strokeWidth: 2 }),
        $(go.Shape, { toArrow: 'Standard', stroke: 'black', fill: 'black' }),
    
        // Placeholder en el extremo inicial (fromEnd)
        $(go.TextBlock,
          {
            segmentIndex: 0, // Primer segmento (inicio del enlace)
            segmentOffset: new go.Point(20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '0' // Placeholder inicial
          }
        ).bind('text', 'fromText', (text: string) => text || '1'), // Enlace de datos
    
        // Placeholder en el extremo final (toEnd)
        $(go.TextBlock,
          {
            segmentIndex: -1, // Último segmento (final del enlace)
            segmentOffset: new go.Point(-20, -10), // Ajustar posición
            font: "bold 20px sans-serif",
            stroke: "black",
            editable: false,
            text: '*' // Placeholder final
          }
        ).bind('text', 'toText', (text: string) => text || '*') // Enlace de datos
      )
    );

  
    // Estas líneas son la clave:
    this.diagram.model = new go.GraphLinksModel();
    this.diagram.model.copiesArrays = true;
    this.diagram.model.copiesArrayObjects = true;

  }

  

initPalette() {
    const $ = go.GraphObject.make;

    this.palette = $(go.Palette, 'myPaletteDiv', {
      nodeTemplate:
        $(go.Node, 'Spot',
          $(go.Panel, 'Auto',
            $(go.Shape, 'RoundedRectangle', { fill: 'lightgray' }),
            $(go.TextBlock, { margin: 5 }, new go.Binding('text', 'name'))
          )
        ),
      model: new go.GraphLinksModel([
        { // Este objeto define la estructura del nodo que se creará al arrastrar
          name: "Clase",
          properties: [
            { name: "Prop", type: "int", visibility: "public" }
          ],
          methods: [
            { name: 'Metodo', parameters: '()', type: 'void ', visibility: '+' }

          ]
        }
      ])
    });
  }

  agregacion() {
    this.tipoRelacion = 'agregacion';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'agregacion' };
    console.log("Modo de agregacion");
  }

  composicion() {
    this.tipoRelacion = 'composicion';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'composicion' };
    console.log("Modo de Inclusión");
  }

  implementacion() {
    this.tipoRelacion = 'implementacion';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'implementacion' };
  }

  herencia() {
    this.tipoRelacion = 'herencia';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'herencia' };
  }

  unouno() {
    this.tipoRelacion = '1:1';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: '1:1' };
  }

  mn() {
    this.tipoRelacion = 'm:n';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: 'm:n' };
  }
  ceromuchos() {
    this.tipoRelacion = '0:*';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: '0:*' };
  }
  unomuchos() {
    this.tipoRelacion = '1:*';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: '1:*' };
  }

  cerouno() {
    this.tipoRelacion = '0:1';
    this.diagram.toolManager.linkingTool.archetypeLinkData = { category: '0:1' };
  }

  guardarDiagrama() {
    if (!this.diagram) return;
    const jsonData = this.diagram.model.toJson();
    localStorage.setItem("diagramaGuardado", jsonData);
    this.toastr.success('Diagrama Guardado con Éxito', 'Éxito');
    let version = localStorage.getItem('version');
    this.verSvc.updateVersion(version, jsonData).subscribe(
      (data)=>{
        this.toastr.success('Diagrama Guardado con Éxito', 'Nice!');
      },(error)=>{
        this.toastr.error(`Error al guardar ${error}`, 'Error');
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
    
          this.verSvc.postVersiones(id_proyecto, 1, versionName.version, jsonDiagram).subscribe(
          (nueva) => {
            this.getVersiones();
            this.toastr.success('Nueva versión creada', 'Éxito');
          },
          (error) => {
            this.toastr.error('Error al crear la versión', 'Error');
          });
        }});          
      }
    
      getVersiones(){
        let proyecto = localStorage.getItem("proyectoId");
        this.verSvc.getVersiones(proyecto, 1).subscribe(
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

  cargarDiagrama() {
    const jsonData = localStorage.getItem("diagramaGuardado");
    if (jsonData) {
      this.diagram.model = go.Model.fromJson(jsonData);
      this.toastr.success('Diagrama Cargado con Éxito', 'Éxito');
    } else {
      this.toastr.error('No hay un diagrama guardado', 'Error');
    }
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

  eliminarElemento() {
    const selectedParts = this.diagram.selection;
    this.diagram.startTransaction('delete');
    selectedParts.each((part) => {
      this.diagram.remove(part);
    });
    this.diagram.commitTransaction('delete');
  }

  guardarComoImagen() {
    const imageData = this.diagram.makeImageData({ scale: 1, background: "white", returnType: "image/png" });
    if (typeof imageData !== "string") {
      console.error("Error: No se pudo generar la imagen del diagrama");
      return;
    }
    const pdf = new jsPDF("landscape", "mm", "a4");
    pdf.addImage(imageData, "PNG", 10, 10, 280, 150);
    pdf.save("diagrama.pdf");
  }

  ejecutarRelacion(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    switch (valor) {
      case 'cerouno': this.cerouno(); break;
      case 'ceromuchos': this.ceromuchos(); break;
      case 'unouno': this.unouno(); break;
      case 'unomuchos': this.unomuchos(); break;
      case 'mn': this.mn(); break;
      case 'agregacion': this.agregacion(); break;
      case 'composicion': this.composicion(); break;
      case 'implementacion': this.implementacion(); break;
      case 'herencia': this.herencia(); break;
    }}
    volver(){
      this.router.navigate(['diagramas']);
    }
}

