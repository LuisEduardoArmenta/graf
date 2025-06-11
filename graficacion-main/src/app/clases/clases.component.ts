import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { ToastrService } from 'ngx-toastr';
import { VersionesService } from '../services/versiones/versiones.service';

interface RelationMapping {
  fromKey: string;
  fromClassName: string;
  type: string;
  multiplicity?: string;
  availableSourceFields: any[];
  selectedSourceField: string;
  localFieldName: string;
  mappedField?: string;
  mappedSourceField?: string;
  fieldMappingType: 'new' | 'existing'; 
}

@Component({
  selector: 'app-clases',
  templateUrl: './clases.component.html',
  styleUrls: ['./clases.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class ClasesComponent implements AfterViewInit {
  diagram!: go.Diagram;
  currentVersionId!: number;
  versions: any[] = [];
  ID_Proyecto = parseInt(sessionStorage.getItem('ID_Proyecto') || '0');
  projectId = sessionStorage.getItem('proyecto') || '';
  versionData = { ID_V: 0, ID_Proyecto: this.ID_Proyecto, ID_Tipo: 5, json: '' };
  
  @ViewChild('diagramDiv') diagramDiv!: ElementRef;
  @ViewChild('paletteDiv') paletteDiv!: ElementRef;

  node: go.Node | null = null;
  isModalVisible = false;
  modalType = '';
  paramName = '';
  paramType = '';
  attributeName = '';
  attributeType = '';
  methodName = '';
  methodReturnType = '';
  methodParams: { paramName: string, paramType: string, paramVisibility: string }[] = [];
  isEditing = false;
  originalAttributeName = "";
  originalMethodName = "";
  methodVisibility = "+";  
  attributeVisibility = "";
  className = '';
  classAttributes: any[] = [];
  classMethods: any[] = [];
  selectedMultiplicity = '1..*';
  
  // Propiedades para secciones desplegables
  showAttributes = true;
  showMethods = true;
  showRelations = true;  
  openMethods: boolean[] = [];
  
  // Propiedades para relaciones
  linkedRelations: RelationMapping[] = [];  
  
  constructor(private toastr: ToastrService, private versionesService: VersionesService) {}

  ngOnInit(): void {
    this.loadVersions();
  }

  ngAfterViewInit(): void {
    this.initDiagram();
    this.initPalette();
  }

  initDiagram(): void {
    const $ = go.GraphObject.make;
    this.diagram = $(go.Diagram, this.diagramDiv.nativeElement, {
      'undoManager.isEnabled': true,
      "draggingTool.isEnabled": true,
      "linkingTool.isEnabled": true,
      "linkReshapingTool.isEnabled": true,
      "model.linkFromKeyProperty": "from",
      "model.linkToKeyProperty": "to",
    });
  
    this.diagram.nodeTemplateMap = this.createNodeTemplates($);
    this.diagram.linkTemplateMap = this.createLinkTemplates($);
    this.diagram.groupTemplateMap = this.createGroupTemplates($);
  
    this.diagram.addDiagramListener('SelectionMoved', (e) => {
      e.subject.each((node: go.Node) => {
        if (node instanceof go.Node && node.containingGroup) {
          const groupBounds = node.containingGroup.actualBounds;
          if (!groupBounds.containsRect(node.actualBounds)) {
            (this.diagram.model as go.GraphLinksModel).setDataProperty(node.data, "group", null);
          }
        }
      });
    });
    
    (this.diagram.model as go.GraphLinksModel).nodeCategoryProperty = "category";
    this.diagram.model.addChangedListener(e => { 
      if (e.isTransactionFinished) this.saveDiagram(); 
    });
  }

  initPalette(): void {
    const $ = go.GraphObject.make;
    $(go.Palette, this.paletteDiv.nativeElement, {
      nodeTemplateMap: this.createNodeTemplates($),
      groupTemplateMap: this.createGroupTemplates($),
      initialContentAlignment: go.Spot.Center,
      contentAlignment:go.Spot.Center,
      model: new go.GraphLinksModel([
        { 
          category: "class", 
          name: "Clase",
          properties: [{ visibility: "+", name: "atributo", type: "tipo", default: null, scope: "instance" }],
          methods: [{ visibility: "+", name: "metodo", parameters: [{ paramName: "par", paramType: "tipo" }], type: "tipo" }]
        },
      ])
    });
  }

  createNodeTemplates($: any): go.Map<string, go.Node> {
    const commonNodeProps = { 
      locationSpot: go.Spot.Center, 
      movable: true, 
      deletable: true, 
      resizable: true, 
      minSize: new go.Size(100, 50)
    };
    
    const classTemplate = $(go.Node, "Auto", commonNodeProps,
      $(go.Shape, "Rectangle", { strokeWidth: 1, stroke: "black", fill: "white" }),
      $(go.Panel, "Table", { defaultRowSeparatorStroke: "black", stretch: go.GraphObject.Fill },
        $(go.Panel, "Horizontal", { row: 0, margin: 4, alignment: go.Spot.Center, stretch: go.GraphObject.Fill },
          $(go.TextBlock, { 
            font: "bold 16px sans-serif", isMultiline: false, margin: new go.Margin(0, 10, 0, 0),
            textAlign: "center", stretch: go.GraphObject.Fill, minSize: new go.Size(100, 20) 
          }, new go.Binding("text", "name").makeTwoWay()),
          $(go.Panel, "Auto", { 
            width: 20,    
            height: 20,   
            margin: new go.Margin(0, 0, 0, 5),
            background: "transparent",
            cursor: "pointer"  
          },
            $(go.Shape, "Rectangle", { 
              fill: "#f0f0f0",  
              stroke: "#cccccc", 
              strokeWidth: 1,
              width: 20, 
              height: 20,
              alignment: go.Spot.Center 
            }),
            $("Button", {
                click: (e:any, obj:any) => this.openClassModal(e, obj),
                toolTip: $("ToolTip", $(go.TextBlock, "Editar clase", { margin: 4 })),
                width: 30,
                height: 30
              },
              $(go.TextBlock, "✏️", { 
                alignment: go.Spot.Center,background:"transparent"
              })
            ),
          )
        ),
        
        // Attributes panel
        $(go.Panel, "Vertical", { row: 1, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
          $(go.Panel, "Vertical", { 
            name: "properties", stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left, 
            itemTemplate: $(go.Panel, "Horizontal")
              .add(
                $(go.TextBlock, new go.Binding("text", "visibility")),
                $(go.TextBlock, { margin: new go.Margin(0, 2, 0, 0) }, new go.Binding("text", "name").makeTwoWay()),
                $(go.TextBlock, "", new go.Binding("text", "type", t => t ? ": " : "")),
                $(go.TextBlock, new go.Binding("text", "type").makeTwoWay())
              )
          }, new go.Binding("itemArray", "properties"))
        ),
        
        // Methods panel
        $(go.Panel, "Vertical", { row: 2, margin: 4, stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left },
          $(go.Panel, "Vertical", { 
            name: "methods", stretch: go.Stretch.Horizontal, defaultAlignment: go.Spot.Left, 
            itemTemplate: $(go.Panel, "Horizontal")
              .add(
                $(go.TextBlock, new go.Binding("text", "visibility")),
                $(go.TextBlock, { margin: new go.Margin(0, 2, 0, 0) }, new go.Binding("text", "name").makeTwoWay()),
                $(go.Panel, "Horizontal",
                  $(go.TextBlock, "("),
                  $(go.Panel, "Horizontal", {
                    itemTemplate: $(go.Panel, "Horizontal")
                      .add(
                        $(go.TextBlock, new go.Binding("text", "paramName").makeTwoWay()),
                        $(go.TextBlock, ": "),
                        $(go.TextBlock, new go.Binding("text", "paramType").makeTwoWay()),
                        $(go.TextBlock, ",", new go.Binding("visible", "parameters", (params, panel) => {
                          const parentPanel = panel.panel;
                          if (!params || !Array.isArray(params) || !parentPanel || !parentPanel.itemArray) return false;
                          const index = parentPanel.itemArray.indexOf(panel.data);
                          return index !== -1 && index < parentPanel.itemArray.length - 1;
                        }))
                      )
                  }, new go.Binding("itemArray", "parameters")),
                  $(go.TextBlock, ")")
                ),
                $(go.TextBlock, "", new go.Binding("text", "type", t => t ? ": " : "")),
                $(go.TextBlock, new go.Binding("text", "type").makeTwoWay())
              )
          }, new go.Binding("itemArray", "methods"))
        )
      )
    );

    return new go.Map<string, go.Node>().add("class", classTemplate);
  }

  createGroupTemplates($: any): go.Map<string, go.Group> {
    return new go.Map<string, go.Group>().add("package", $(go.Group, "Auto", {
      locationSpot: go.Spot.Center, movable: true, deletable: true, 
      resizable: true, minSize: new go.Size(160, 100),
      layout: $(go.GridLayout, { wrappingColumn: 3, alignment: go.GridLayout.Position }),
      computesBoundsAfterDrag: true,
      mouseDragEnter: (e:any, grp:any) => {
        grp.isHighlighted = true;
        grp.background = "lightgreen";
        grp.diagram?.updateAllTargetBindings();
      },
      mouseDragLeave: (e:any, grp:any) => {
        grp.isHighlighted = false;
        grp.background = "lightgoldenrodyellow";
        grp.diagram?.updateAllTargetBindings();
      },
      mouseDrop: (e:any, grp:any) => grp.diagram?.selection.size > 0 && grp.addMembers(grp.diagram.selection, true)
    },
      $(go.Shape, "Rectangle", { fill: "white", stroke: "black", strokeWidth: 2 },
        new go.Binding("stroke", "black", h => h ? "dodgerblue" : "lightgray").ofObject()),
      $(go.Panel, "Vertical",
        $(go.Panel, "Horizontal", { 
          stretch: go.GraphObject.Horizontal, background: "#DCE8E8", padding: 5
        },
          $("SubGraphExpanderButton", { margin: 5 }),
          $(go.TextBlock, { 
            alignment: go.Spot.Left, font: "Bold 12pt sans-serif", margin: 5, 
            editable: true, minSize: new go.Size(80, 20)
          }, new go.Binding("text", "name").makeTwoWay())
        ),
        $(go.Placeholder, { padding: 10 })
      )
    ));
  }

  createLinkTemplates($: any): go.Map<string, go.Link> {
    const createLink = (stroke: string, arrow: string, fill: string = "white", dashed: boolean = false) => {
      const elements = [
        $(go.Shape, { strokeWidth: 2, stroke, strokeDashArray: dashed ? [4, 2] : null }),
        $(go.TextBlock, { 
          textAlign: "center", font: "bold 14px sans-serif", 
          margin: new go.Margin(4, 10, 4, 10), background: "white", 
          minSize: new go.Size(20, 20) 
        }, new go.Binding("text", "rightText").makeTwoWay())
      ];
      
      if (arrow) {
        elements.splice(1, 0, $(go.Shape, { toArrow: arrow, stroke, fill, strokeWidth: 2 }));
      }
      
      return $(go.Link, { 
        routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, reshapable: true
      }, ...elements);
    };
    
    const linkMap = new go.Map<string, go.Link>();
    linkMap.add("multiplicity", createLink("black", "", "yellow"));
    linkMap.add("association", createLink("blue", "OpenTriangle"));
    linkMap.add("aggregation", createLink("blue", "Diamond"));
    linkMap.add("composition", createLink("blue", "Diamond", "blue"));
    linkMap.add("generalization", createLink("blue", "Triangle"));
    linkMap.add("dependency", createLink("black", "OpenTriangle", "white", true));
    linkMap.add("realization", createLink("black", "Triangle", "white", true));
    linkMap.add("reflexiveAssociation", createLink("blue", "OpenTriangle"));
    
    return linkMap;
  }

  // Link creation methods
  createLink(relationshipType: string, symbol: string = "", dashed: boolean = false): void {
    if (!this.diagram) return;
    
    const model = this.diagram.model as go.GraphLinksModel;
    const selectedNodes = this.diagram.selection.toArray().filter(n => n instanceof go.Node) as go.Node[];
    const isReflexive = relationshipType === "Asociación Reflexiva";
    
    // Validation
    if (selectedNodes.length < (isReflexive ? 1 : 2)) {
      this.toastr.info(`Selecciona ${isReflexive ? "una clase" : "al menos dos clases"} para conectar.`);
      return;
    }
    
    // Keys for connection
    const fromKey = isReflexive ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 2].data.key;
    const toKey = isReflexive ? selectedNodes[0].data.key : selectedNodes[selectedNodes.length - 1].data.key;
    
    // Map relationship type to category
    const relationshipMap: {[key: string]: string} = {
      "Dependencia": "dependency",
      "Generalización": "generalization",
      "Composición": "composition", 
      "Realización": "realization",
      "Agregación": "aggregation",
      "Asociación Reflexiva": "reflexiveAssociation",
      "Asociación": "association"
    };
    const linkCategory = relationshipMap[relationshipType] || "association";
    
    // Find existing link
    const existingLink = model.linkDataArray.find(link => 
      (link['from'] === fromKey && link['to'] === toKey) || (link['from'] === toKey && link['to'] === fromKey)
    );
    
    // Transaction
    model.startTransaction("update link");
    if (existingLink) {
      model.setDataProperty(existingLink, "category", linkCategory);
      this.toastr.success(`Relación actualizada a ${relationshipType}`);
    } else {
      model.addLinkData({ from: fromKey, to: toKey, category: linkCategory, rightText: '1..*' });
      this.toastr.success(`Relación ${relationshipType} creada`);
    }
    model.commitTransaction("update link");
  }

  // Connector methods
  connectAssociation = () => this.createLink("Asociación");
  connectAssociationReflexive = () => this.createLink("Asociación Reflexiva", "◯");
  connectAggregation = () => this.createLink("Agregación", "◇");
  connectComposition = () => this.createLink("Composición", "◆");
  connectGeneralization = () => this.createLink("Generalización", "△");
  connectDependency = () => this.createLink("Dependencia", "▷", true);
  connectRealization = () => this.createLink("Realización", "△", true);

  // Multiplicity management
  setMultiplicity(multiplicity: string): void {
    this.selectedMultiplicity = multiplicity;
    
    if (!this.diagram) return;
    const model = this.diagram.model as go.GraphLinksModel;
    const selectedLinks = this.diagram.selection.toArray().filter(part => part instanceof go.Link) as go.Link[];
    
    if (selectedLinks.length < 1) {
      this.toastr.info("Selecciona una relación para añadir la multiplicidad.");
      return;
    }
    
    model.startTransaction("update multiplicity");
    selectedLinks.forEach(link => {
      model.setDataProperty(link.data, "rightText", multiplicity);
    });
    model.commitTransaction("update multiplicity");
    
    this.toastr.success(`Multiplicidad ${multiplicity} añadida a la relación`);
  }

  // Version management
  loadVersions(): void {
    this.versionesService.getVersiones(this.ID_Proyecto).subscribe({
      next: (data: any) => {
        // Filter for type 5 versions
        this.versions = Array.isArray(data) ? data.filter(v => v.ID_Tipo === 5) : [];
        
        if (this.versions.length === 0) {
          // Create version 1 automatically
          this.versionData.json = "{}";
          this.versionesService.postVersion(this.versionData).subscribe({
            next: (newVersion: any) => {
              this.versions.push(newVersion);
              this.currentVersionId = newVersion.ID_V;
              this.versionData.ID_V = newVersion.ID_V;
              this.loadDiagram(this.currentVersionId);
            },
            error: err => {
              console.error('Error al crear la versión inicial:', err);
              this.toastr.error('Error al crear la versión inicial');
            }
          });
        } else {
          // Load latest version
          this.currentVersionId = this.versions[0].ID_V;
          this.versionData.ID_V = this.currentVersionId;
          this.loadDiagram(this.currentVersionId);
        }
      },
      error: err => {
        console.error('Error al cargar versiones:', err);
        this.toastr.error('Error al cargar versiones');
      }
    });
  }

  createNewVersion(): void {
    this.versionData.json = "{}";
    this.versionesService.postVersion(this.versionData).subscribe({
      next: (data: any) => {
        this.versions.push(data);
        this.currentVersionId = data.ID_V;
        this.diagram.model = new go.GraphLinksModel({ linkKeyProperty: "key" });
        this.toastr.success(`Nueva versión ${this.versions.length} creada`);
        this.saveDiagram();
        this.versionData.ID_V = data.ID_V;
      },
      error: err => {
        console.error('Error al crear la versión:', err);
        this.toastr.error('Error al crear la versión');
      }
    });
  }

  guardarVersion(): void {
    this.versionData.json = this.diagram.model.toJson();
    this.versionesService.putVersion(this.versionData.ID_V, {
      ID_Proyecto: this.versionData.ID_Proyecto,
      ID_Tipo: this.versionData.ID_Tipo,
      json: this.versionData.json
    }).subscribe({
      next: (data: any) => {
        this.toastr.success('Versión guardada en la base de datos');
        const index = this.versions.findIndex(v => v.ID_V == this.versionData.ID_V);
        if (index !== -1) this.versions[index] = data;
      },
      error: err => {
        console.error('Error al guardar la versión:', err);
        this.toastr.error('Error al guardar la versión');
      }
    });
  }

  changeVersion(versionId: number): void {
    this.currentVersionId = versionId;
    this.versionData.ID_V = versionId;
    this.loadDiagram(versionId);
    this.toastr.info(`Versión ${this.getVersionOrder(versionId)} cargada`);
  }

  saveDiagram(): void {
    if (!this.diagram || !this.versionData.ID_V) return;
    
    const json = this.diagram.model.toJson();
    this.versionData.json = json;
    this.versionesService.putVersion(this.versionData.ID_V, {
      ID_Proyecto: this.ID_Proyecto,
      ID_Tipo: this.versionData.ID_Tipo,
      json
    }).subscribe({
      error: err => console.error('Error actualizando el diagrama', err)
    });
  }

  loadDiagram(versionId: number): void {
    const selectedVersion = this.versions.find(v => v.ID_V == versionId);
    if (selectedVersion?.json) {
      const model = go.Model.fromJson(selectedVersion.json) as go.GraphLinksModel;
      model.linkKeyProperty = "key";
      this.diagram.model = model;
      this.diagram.model.addChangedListener(e => { 
        if (e.isTransactionFinished) this.saveDiagram(); 
      });
    } else {
      this.toastr.error('No se encontró la versión o no contiene datos');
    }
  }

  getVersionOrder(versionId: number): number {
    const index = this.versions.findIndex(v => v.ID_V == versionId);
    return index !== -1 ? index + 1 : 0;
  }

  eliminarVersion(): void {
    this.versionesService.deleteVersion(this.versionData.ID_V).subscribe({
      next: () => {
        this.versions = this.versions.filter(v => v.ID_V !== this.currentVersionId);
        this.toastr.success('Versión eliminada');
        if (this.versions.length > 0) {
          this.loadDiagram(this.versions[0].ID_V);
        }
        this.loadVersions();
      }
    });
  }

  // Modal management
  openClassModal(e: any, obj: any): void {
    if (!obj?.part?.diagram || obj.part.diagram instanceof go.Palette) return;

    const node = obj.part as go.Node;
    if (!node?.data) return;

    this.node = node;
    if (node.diagram) {
      this.diagram = node.diagram;
    }
    this.modalType = "class";
    this.className = node.data.name || "Clase";
    
    // Clone arrays to avoid direct references
    this.classAttributes = node.data.properties ? 
      JSON.parse(JSON.stringify(node.data.properties)) : [];
    this.classMethods = node.data.methods ? 
      JSON.parse(JSON.stringify(node.data.methods)) : [];
    
    // Cargar relaciones
    this.loadRelationships(node.data.key);
    
    this.openMethods = new Array(this.classMethods.length).fill(false);
    this.showAttributes = true;
    this.showMethods = true;
    this.showRelations = true;
    this.isModalVisible = true;
  }

  // Método para cargar relaciones
  loadRelationships(nodeKey: string): void {
    this.linkedRelations = [];
    if (!this.diagram) return;
    
    const model = this.diagram.model as go.GraphLinksModel;
    
    // Buscar todos los enlaces donde este nodo es el destino (relaciones entrantes)
    if (model && model.linkDataArray) {
      model.linkDataArray.forEach((link: any) => {
        if (link.to === nodeKey) {
          const sourceNode = model.findNodeDataForKey(link.from);
          if (sourceNode) {
            // Filtrar campos ID y los ya mapeados
            const availableFields = (sourceNode['properties'] || []).filter((prop: any) => {
              return !this.isFieldMappedAsFK(prop.name, sourceNode['key']);
            });
            
            // Buscar mapeos existentes para esta relación
            const existingMapping = this.findExistingMapping(link.from, nodeKey);
            
            this.linkedRelations.push({
              fromKey: link.from,
              fromClassName: sourceNode['name'] || 'Clase',
              type: link.category || 'association',
              multiplicity: link.rightText,
              availableSourceFields: availableFields,
              selectedSourceField: '',
              localFieldName: '',
              fieldMappingType: 'new', // Por defecto, crear campo nuevo
              ...(existingMapping ? {
                mappedField: existingMapping.localField,
                mappedSourceField: existingMapping.sourceField
              } : {})
            });
          }
        }
      });
    }
  }
  
  // Verificar si un campo ya está mapeado como clave foránea
  isFieldMappedAsFK(fieldName: string, sourceNodeKey: string): boolean {
    return this.classAttributes.some(attr => 
      attr.isForeignKey && 
      attr.fromKey === sourceNodeKey &&
      attr.fromField === fieldName
    );
  }
  
  // Buscar mapeos existentes
  findExistingMapping(sourceKey: string, targetKey: string): {sourceField: string, localField: string} | null {
    for (const attr of this.classAttributes) {
      if (attr.isForeignKey && attr.fromKey === sourceKey) {
        return {
          sourceField: attr.fromField,
          localField: attr.name
        };
      }
    }
    return null;
  }
  
  // Verificar si un campo está mapeado en alguna relación
  isFieldMappedInAnyRelation(fieldName: string, sourceKey: string): boolean {
    return this.classAttributes.some(attr => 
      attr.isForeignKey && 
      attr.fromKey === sourceKey && 
      attr.fromField === fieldName
    );
  }
  
  // Crear mapeo de campo
  createFieldMapping(relation: RelationMapping): void {
    if (!relation.selectedSourceField || !relation.localFieldName) {
      this.toastr.error('Por favor seleccione un campo origen y destino');
      return;
    }
    
    // Buscar el campo origen para obtener su tipo
    const model = this.diagram.model as go.GraphLinksModel;
    const sourceNode = model.findNodeDataForKey(relation.fromKey);
    if (!sourceNode) {
      this.toastr.error('No se pudo encontrar la clase origen');
      return;
    }
    
    if (!sourceNode['properties']) {
      this.toastr.error('La clase origen no tiene propiedades definidas');
      return;
    }
    
    const sourceField = sourceNode['properties'].find((p: any) => p.name === relation.selectedSourceField);
    if (!sourceField) {
      this.toastr.error('No se pudo encontrar el campo seleccionado');
      return;
    }
    
    // Si es un campo existente
    if (relation.fieldMappingType === 'existing') {
      const existingFieldIndex = this.classAttributes.findIndex(attr => attr.name === relation.localFieldName);
      if (existingFieldIndex === -1) {
        this.toastr.error('El campo seleccionado ya no existe');
        return;
      }
      
      // Actualizar el campo existente para coincidir con el campo origen
      this.classAttributes[existingFieldIndex].type = sourceField.type; // Actualizar el tipo
      this.classAttributes[existingFieldIndex].isForeignKey = true;
      this.classAttributes[existingFieldIndex].fromKey = relation.fromKey;
      this.classAttributes[existingFieldIndex].fromClass = relation.fromClassName;
      this.classAttributes[existingFieldIndex].fromField = relation.selectedSourceField;
      
      // Informar al usuario que el tipo ha cambiado
      this.toastr.info(`El tipo del campo ${relation.localFieldName} ha sido actualizado a ${sourceField.type}`);
    }
    // Si es un campo nuevo
    else {
      this.classAttributes.push({
        name: relation.localFieldName,
        type: sourceField.type,
        visibility: "+", // Por convención
        isForeignKey: true,
        fromKey: relation.fromKey,
        fromClass: relation.fromClassName,
        fromField: relation.selectedSourceField
      });
    }
    
    // Actualizar el estado de la relación
    relation.mappedField = relation.localFieldName;
    relation.mappedSourceField = relation.selectedSourceField;
    
    // Eliminar el campo origen de los disponibles para evitar duplicados
    relation.availableSourceFields = relation.availableSourceFields.filter(
      field => field.name !== relation.selectedSourceField
    );
    
    // Limpiar los campos de entrada
    relation.selectedSourceField = '';
    relation.localFieldName = '';
    relation.fieldMappingType = 'new'; // Reset a valor por defecto
    
    this.toastr.success('Campo mapeado correctamente');
  }

  // Añadir este método para obtener campos compatibles
  getCompatibleFields(relation: RelationMapping): any[] {
    if (!relation.selectedSourceField) return [];
    
    // Devolver todos los campos que no son FK
    return this.classAttributes.filter(attr => !attr.isForeignKey);
  }

  // Class attribute management
  addClassAttribute(): void {
    this.classAttributes.push({
      visibility: "+",
      name: "atr",
      type: "string",
      scope: "instance"
    });
  }
  
  removeClassAttribute(index: number): void {
    this.classAttributes.splice(index, 1);
  }
  
  // Class method management
  addClassMethod(): void {
    this.classMethods.push({
      visibility: "+",
      name: "met",
      parameters: [],
      type: "void"
    });
  }
  
  removeClassMethod(index: number): void {
    this.classMethods.splice(index, 1);
  }
  
  addClassMethodParameter(methodIndex: number): void {
    this.classMethods[methodIndex].parameters.push({
      paramName: "par",
      paramType: "string",
      paramVisibility: "+"
    });
  }
  
  removeClassMethodParameter(methodIndex: number, paramIndex: number): void {
    this.classMethods[methodIndex].parameters.splice(paramIndex, 1);
  }
  
  saveClassData(): void {
    if (!this.node || !this.diagram) {
      this.toastr.error("No se encontró el nodo o diagrama");
      return;
    }

    const data = this.node.data;
    if (!data) {
      this.toastr.error("No se encontraron datos en el nodo");
      return;
    }

    this.diagram.model.commit(m => {
      m.set(data, "name", this.className);
      m.set(data, "properties", [...this.classAttributes]);
      m.set(data, "methods", [...this.classMethods]);
    }, "class edited");

    this.closeModal();
    this.toastr.success("Clase actualizada con éxito");
  }
  
  saveModalData(): void {
    if (this.modalType === "class") {
      this.saveClassData();
      return;
    }

    if (!this.node?.data) return;
    const data = this.node.data;
    
    this.diagram?.model.commit(m => {
      if (this.modalType === "attribute") {
        if (this.isEditing) {
          const attrIndex = data.properties.findIndex((a: any) => a.name === this.originalAttributeName);
          if (attrIndex !== -1) {
            const updatedAttrs = [...data.properties];
            updatedAttrs[attrIndex] = {
              ...updatedAttrs[attrIndex],
              name: this.attributeName,
              type: this.attributeType,
              visibility: this.attributeVisibility
            };
            m.set(data, "properties", updatedAttrs);
          }
        } else {
          m.set(data, "properties", [...data.properties, {
            visibility: this.attributeVisibility,
            name: this.attributeName,
            type: this.attributeType,
            scope: "instance"
          }]);
        }
      }
      
      if (this.modalType === "method") {
        if (this.isEditing) {
          const methodIndex = data.methods.findIndex((m: any) => m.name === this.originalMethodName);
          if (methodIndex !== -1) {
            const updatedMethods = [...data.methods];
            updatedMethods[methodIndex] = {
              ...updatedMethods[methodIndex],
              name: this.methodName,
              parameters: this.methodParams,
              type: this.methodReturnType,
              visibility: this.methodVisibility
            };
            m.set(data, "methods", updatedMethods);
          }
        } else {
          m.set(data, "methods", [...data.methods, {
            visibility: this.methodVisibility,
            name: this.methodName,
            parameters: this.methodParams,
            type: this.methodReturnType
          }]);
        }
      }
    }, this.isEditing ? "edited item" : "added item");
    
    this.closeModal();
  }
  
  // Modificar toggleSection para incluir relaciones
  toggleSection(section: string): void {
    if (section === 'attributes') {
      this.showAttributes = !this.showAttributes;
    } else if (section === 'methods') {
      this.showMethods = !this.showMethods;
    } else if (section === 'relations') {
      this.showRelations = !this.showRelations;
    }
  }
  
  closeModal(): void {
    this.isModalVisible = false;
    this.attributeName = "";
    this.attributeType = "";
    this.originalAttributeName = "";
    this.methodName = "";
    this.methodReturnType = "";
    this.isEditing = false; 
    this.attributeVisibility = "";
    this.className = "";
    this.classAttributes = [];
    this.classMethods = [];
    this.linkedRelations = [];
    this.showAttributes = true;
    this.showMethods = true;
    this.showRelations = true;
    this.openMethods = [];
  }

  addParameter(): void {
    this.methodParams.push({ paramName: "", paramType: "string", paramVisibility: "+" });
  }

  removeParameter(index: number): void {
    this.methodParams.splice(index, 1);
  }

  toggleMethod(index: number): void {
    if (this.openMethods.length <= index) {
      const newArr = new Array(index + 1).fill(false);
      this.openMethods.forEach((val, i) => newArr[i] = val);
      this.openMethods = newArr;
    }
    this.openMethods[index] = !this.openMethods[index];
  }

  getRelationTypeName(type: string): string {
    const typeNames: {[key: string]: string} = {
      'association': 'Asociación',
      'aggregation': 'Agregación',
      'composition': 'Composición',
      'generalization': 'Generalización',
      'dependency': 'Dependencia',
      'realization': 'Realización',
      'reflexiveAssociation': 'Asociación Reflexiva'
    };
    return typeNames[type] || type;
  }

  removeFieldMapping(relation: RelationMapping): void {
    if (!relation.mappedField) return;
    
    // Buscar el campo mapeado
    const index = this.classAttributes.findIndex(attr => 
      attr.fromKey === relation.fromKey && 
      attr.name === relation.mappedField
    );
    
    if (index !== -1) {
      // Conservar el campo pero quitar propiedades de FK
      this.classAttributes[index].isForeignKey = false;
      delete this.classAttributes[index].fromKey;
      delete this.classAttributes[index].fromClass;
      delete this.classAttributes[index].fromField;
      
      // Resetear el estado de la relación pero conservar los datos de mapeo
      // para referencia futura en la interfaz de usuario
      const oldMappedField = relation.mappedField;
      const oldSourceField = relation.mappedSourceField;
      
      relation.mappedField = undefined;
      relation.mappedSourceField = undefined;
      
      // Volver a agregar el campo origen a los campos disponibles
      if (oldSourceField) {
        const model = this.diagram.model as go.GraphLinksModel;
        const sourceNode = model.findNodeDataForKey(relation.fromKey);
        if (sourceNode && sourceNode['properties']) {
          // Buscar el campo en las propiedades de origen
          const sourceField = sourceNode['properties'].find((p: any) => p.name === oldSourceField);
          if (sourceField && !relation.availableSourceFields.some(f => f.name === oldSourceField)) {
            // Añadir de nuevo a la lista de campos disponibles
            relation.availableSourceFields.push(sourceField);
          }
        }
      }
      
      this.toastr.success('Mapeo eliminado. Los campos se han conservado.');
    } else {
      this.toastr.warning('No se encontró el campo mapeado.');
    }
  }

  getSourceFieldType(relation: RelationMapping): string {
    if (!relation.selectedSourceField) return '';
    
    const sourceField = relation.availableSourceFields.find(f => f.name === relation.selectedSourceField);
    return sourceField ? sourceField.type : '';
  }
}