import type { AnnotationManager, Entity } from './AnnotationManager'
import type { LabelManager } from './LabelManager'

/**
 * RDF Export Manager
 * @description This class manages the export of annotations and labels to RDF format.
 * @property {AnnotationManager} annotationManager - The AnnotationManager instance containing annotations to be exported.
 * @property {LabelManager} labelManager - The LabelManager instance containing labels to be included in the export.
 * @property {string} rdfData - The RDF data generated from the annotations and labels.
 * @property {string} documentId - The unique identifier for the document being exported.
 */
export class RDFManager {
  private annotationManager: AnnotationManager
  private labelManager: LabelManager
  private rdfData: string = ''
  private documentId: string = ''

  /**
   * Creates an instance of RDFManager.
   * @param annotationManager Annotation manager to export
   * @param labelManager Label manager to export
   */
  constructor(annotationManager: AnnotationManager, labelManager: LabelManager) {
    this.annotationManager = annotationManager
    this.labelManager = labelManager
    this.documentId = this.determineDocumentID()
    this.setParagraphIds()
  }

  /**
   * Exports RDF data from the current annotations and labels.
   * @returns {string} The generated RDF data as a string.
   */
  public export(): string {
    this.rdfHeader() // Add header to RDF data

    const paragraphIds: string[] = []

    for (const paragraph of this.annotationManager.annotations) {
      paragraphIds.push(`data:${paragraph.id}`)
    }

    const directlyContainedParagraphs = paragraphIds.join(', ')
    this.rdfData += `onner:directlyContainsDocumentPart ${directlyContainedParagraphs} .\n\n`

    for (const paragraph of this.annotationManager.annotations) {
      const paragraphNumber = paragraph.id!.split('_').pop()!.substring(1)
      this.rdfData += `data:${paragraph.id} rdf:type onner:Paragraph ;\n`
      this.rdfData += `onner:positionInParentDocumentPart '${paragraphNumber}'^^xsd:nonNegativeInteger ;\n`
      this.rdfData +=
        parseInt(paragraphNumber) < paragraphIds.length
          ? `onner:nextDocumentPart ${paragraphIds[parseInt(paragraphNumber)]} ;\n`
          : `onner:nextDocumentPart data:${this.documentId}_EndOfDocument ;\n`
      this.rdfData += `onner:paragraphText '${paragraph.text}'^^xsd:string ;\n`

      if (paragraph.entities.length > 0) {
        // Process entities
        for (const entity of paragraph.entities) {
          this.rdfData += `data:${entity.id} rdf:type onner:LabeledTerm ;\n` // deal with atomic and compound terms
          this.rdfData += `onner:labeledTermText '${paragraph.text.substring(entity.start, entity.end)}'^^xsd:string ;\n`
          this.rdfData += `onner:offset '${entity.start}'^^xsd:nonNegativeInteger ;\n`
          this.rdfData += `onner:length '${entity.end - entity.start}'^^xsd:nonNegativeInteger ;\n`
          this.rdfData += `onner:labeledTermDirectlyContainedBy data:${paragraph.id} ;\n`
          this.rdfData += `onner:hasLabeledTermStatus ${entity.history.map((historyEntry) => `data:${historyEntry.state}_${entity.id}`).join(',')} .\n\n`

          // Process entity history entries
          for (const historyEntry of entity.history) {
            this.rdfData += `data:Candidate_${entity.id} rdf:type onner:CandidateStatus ;\n`
            this.rdfData += `onner:statusAssignmentDate '${historyEntry.timestamp}'^^xsd:dateTime ;\n`
            this.rdfData += `onner:statusAssignedBy '${historyEntry.annotatorName}'^^xsd:string ;\n`
            this.rdfData += `onner:hasLabeledTermLabel data:Label_${this.labelManager.getLabelId(historyEntry.label) ?? 0 + 1} .\n\n`
          }
        }
      } else {
        this.rdfData += `onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n`
      }
    }

    this.rdfData += `data:${this.documentId}_EndOfDocument rdf:type onner:EndOfDocument .\n`

    // Add labels to document
    if (this.labelManager.lastId > 0) {
        for (const label of this.labelManager.allLabels) {
            this.rdfData += `data:Label_${label.id} rdf:type onner:Label ;\n`;
            this.rdfData += `onner:fromLabelingSchema data:Labeling_Schema ;\n`;
            this.rdfData += `onner:labelText '${label.name}'^^xsd:string .\n\n`;
        }
    }

    this.rdfFooter() // Add footer to RDF data

    return this.rdfData
  }

  /**
   * Sets paragraph IDs and entity IDs for all annotations.
   * @description This method assigns unique IDs to each paragraph and its contained entities
   */
  private setParagraphIds(): void {
    for (let i = 0; i < this.annotationManager.annotations.length; i++) {
      this.annotationManager.annotations[i].id = `${this.documentId}_p${i}`

      // Set entity IDs within the paragraph
      this.setEntityIds(
        this.annotationManager.annotations[i].entities,
        this.annotationManager.annotations[i].id,
      )
    }
  }

  /**
   * Sets entity IDs for a list of entities within a paragraph.
   * @param entities 
   * @param paragraphId 
   */
  private setEntityIds(entities: Entity[], paragraphId: string | null): void {
    for (let j = 0; j < entities.length; j++) {
      entities[j].id = `${paragraphId}_e${j}`
    }
  }

  /**
   * Determines document ID based on the current timestamp.
   * @returns {string} A unique document ID based on the current timestamp.
   */
  private determineDocumentID(): string {
    // Generated content from this application will never have an ID at the start
    const currentTime = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .substring(2, 14)
    return `AnNER-RDF_${currentTime}`
  }

  /**
   * Generates the RDF header with necessary prefixes and document metadata.
   * @description This method appends the RDF header information to the rdfData property.
   * It includes standard RDF prefixes and basic metadata about the document.
   */
  private rdfHeader(): void {
    this.rdfData += '@prefix onner: <http://purl.org/spatialai/onner/onner-full#> .\n'
    this.rdfData += '@prefix data: <http://purl.org/spatialai/onner/onner-full/data#> .\n'
    this.rdfData += '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n'
    this.rdfData += '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n'
    this.rdfData += '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n'
    this.rdfData += '@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n'
    this.rdfData += `data:Publication_${this.documentId} rdf:type onner:ScholarlyPublication ;\n`
    this.rdfData += `onner:publicationTitle 'any title??'^^xsd:string ;\n`
    this.rdfData += `onner:publicationDate 'current date??'^^xsd:date ;\n`
    this.rdfData += `onner:doi 'No DOI??'^^xsd:string ;\n`
  }

  /**
   * Generates the RDF footer with labeling schema and model information.
   * @description This method appends the RDF footer information to the rdfData property.
   * It includes details about the labeling schema and the NER system used.
   */
  private rdfFooter() : void {
    this.rdfData += `data:Labeling_Schema rdf:type onner:LabelingSchema ;\n`;
    this.rdfData += `onner:schemaName 'CelloGraph'^^xsd:string .\n\n`;
    this.rdfData += `data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n`;    // if/else required to identify system and human
    this.rdfData += `onner:systemVersion '1.0'^^xsd:string .\n\n`;
  }
}
