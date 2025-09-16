import { Label, LabelManager } from './LabelManager'
import type {
  REF_AnnotationManagerExportFormat,
  REF_ParagraphJSONFormat,
  REF_EntityJSONFormat,
  REF_HistoryJSONFormat,
} from '../types/REFFile'

export interface AnnotationManagerInputSentence {
  id: number
  text: string
}

/**
 * Annotation Manager
 * @description This class manages annotations imported from a text or JSON file in the Rich Entity Format (REF).
 * @property {Paragraph[]} annotations - An array of paragraphs with annotations.
 * @property {AnnotationManagerInputSentence[]} inputSentences - An array of objects containing the ID and text of each input sentence.
 */
export class AnnotationManager {
  public annotations: Paragraph[]

  /**
   * Get all input sentences from the annotations.
   * @description This method extracts input sentences from the annotations, where each sentence is represented as an object with an ID and text.
   * @returns {AnnotationManagerInputSentence[]} An array of objects containing the ID and text of each input sentence.
   */
  public get inputSentences(): AnnotationManagerInputSentence[] {
    return this.annotations.map((paragraph, i) => ({ id: i, text: paragraph.text }))
  }

  /**
   * Constructor for the AnnotationManager class.
   * @constructor
   * @description This constructor initializes the AnnotationManager with an array of paragraphs, converting each paragraph to a Paragraph instance.
   * @param {REF_ParagraphJSONFormat[]} annotations - An array of paragraphs with annotations.
   */
  constructor(annotations: REF_ParagraphJSONFormat[] = []) {
    this.annotations = annotations.map((paragraph) => Paragraph.fromJSON(paragraph)) // Convert each paragraph to a Paragraph instance
  }

  /**
   * Converts the AnnotationManager instance to a JSON object.
   * @param {string} newAnnotator - The name of the annotator for the export.
   * @returns {REF_ParagraphJSONFormat[]} An array of paragraphs in JSON format.
   */
  public toJSON(newAnnotator: string): REF_ParagraphJSONFormat[] {
    return this.annotations.map((paragraph) => paragraph.toJSON(newAnnotator)) // Convert each paragraph to JSON
  }

  /**
   * Converts the AnnotationManager instance to RDF format.
   * @param labelManager - Instance of LabelManager to include labels in the RDF export
   * @returns {string} RDF representation of the annotations
   */
  public toRDF(labelManager: LabelManager): string {
    const rdfDocumentId: string = `AnNER-RDF_${new Date().toISOString().replace(/[-:T.]/g, '').substring(2, 14)}`;
    
    this.generateIDsForExport(rdfDocumentId); // Ensure all paragraphs and entities have IDs
    const paragraphIds: string[] = this.annotations.map((paragraph) => `data:${paragraph.id}`);
    
    let rdfDocument: string = '';

    rdfDocument += this.rdfHeader(rdfDocumentId); // Add header to RDF data

    rdfDocument += `onner:directlyContainsDocumentPart ${paragraphIds.join(', ')} .\n\n`

    this.annotations.forEach((paragraph, i) => rdfDocument += paragraph.toRDF(i, rdfDocumentId, paragraphIds, labelManager));

    rdfDocument += `data:${rdfDocumentId}_EndOfDocument rdf:type onner:EndOfDocument .\n`

    rdfDocument += labelManager.toRDF(); // Add labels to RDF data

    rdfDocument += this.rdfFooter(); // Add footer to RDF data

    return rdfDocument;
  }

  /**
   * Returns new instance of AnnotationManager from a text file.
   * @description This method processes a text file, splitting it into paragraphs based on double newlines, and creates a new AnnotationManager instance.
   * @param {string} text - The text content of the file.
   * @returns {AnnotationManager} A new instance of AnnotationManager created from the text.
   */
  public static fromText(text: string): AnnotationManager {
    const transformedText: string[] = text.replace(/(\r\n|\n|\r){2,}/gm, '\n').split('\n')
    const castedParagraphs: REF_ParagraphJSONFormat[] = transformedText.map((item: string) => {
      return [
        null,
        item,
        {
          entities: [],
        },
      ]
    })
    return new AnnotationManager(castedParagraphs)
  }

  /**
   * Returns new instance of AnnotationManager from a JSON file.
   * @description This method processes a JSON file, parsing it into an object and creating a new AnnotationManager instance.
   * @param {string} json - The JSON content of the file.
   * @returns {AnnotationManager} A new instance of AnnotationManager created from the JSON.
   */
  public static fromJSON(json: string): AnnotationManager {
    const jsonObject: REF_AnnotationManagerExportFormat = JSON.parse(json)
    return new AnnotationManager(jsonObject.annotations)
  }

  // RDF Export Builder Functions

  /**
   * Exports the RDF header with prefixes and publication metadata.
   * @param documentId - Unique identifier for the document
   * @returns {string} RDF header string with prefixes and publication metadata
   */
  private rdfHeader(documentId: string): string {
    let rdfData: string = '';
    rdfData += '@prefix onner: <http://purl.org/spatialai/onner/onner-full#> .\n';
    rdfData += '@prefix data: <http://purl.org/spatialai/onner/onner-full/data#> .\n';
    rdfData += '@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n';
    rdfData += '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n';
    rdfData += '@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n';
    rdfData += '@prefix owl: <http://www.w3.org/2002/07/owl#> .\n\n';
    rdfData += `data:Publication_${documentId} rdf:type onner:ScholarlyPublication ;\n`;
    rdfData += `onner:publicationTitle 'any title??'^^xsd:string ;\n`;
    rdfData += `onner:publicationDate 'current date??'^^xsd:date ;\n`;
    rdfData += `onner:doi 'No DOI??'^^xsd:string ;\n`;
    return rdfData;
  }

  /**
   * Exports the RDF footer with labeling schema and NER system metadata.
   * @returns {string} RDF footer string with labeling schema and NER system metadata
   */
  private rdfFooter(): string {
    let rdfData: string = '';
    rdfData += `data:Labeling_Schema rdf:type onner:LabelingSchema ;\n`;
    rdfData += `onner:schemaName 'CelloGraph'^^xsd:string .\n\n`;
    rdfData += `data:Cellulosic_NER_Model rdf:type onner:NER_System ;\n`;    // if/else required to identify system and human
    rdfData += `onner:systemVersion '1.0'^^xsd:string .\n\n`;
    return rdfData;
  }

  /**
   * Generates unique IDs for paragraphs and entities if they are missing.
   * @param rdfDocumentId - Unique identifier for the document
   */
  private generateIDsForExport(rdfDocumentId: string): void {
    this.annotations.forEach((paragraph, i) => {
      if (!paragraph.id) paragraph.id = `${rdfDocumentId}_p${i}`;
      paragraph.entities.forEach((entity, j) => {
        if (!entity.id) entity.id = `${paragraph.id}_e${j}`;
      });
    });
  }
}

/**
 * Paragraph
 * @description This class represents a paragraph in the annotations, containing text and entities.
 * @property {string} text - The text of the paragraph.
 * @property {Entity[]} entities - An array of entities in the paragraph.
 * @property {string | null} id - The ID of the paragraph.
 */
export class Paragraph {
  public text: string
  public entities: Entity[]
  public id: string | null = null;

  /**
   * Exports the paragraph to a JSON format.
   * @description This method generates a JSON format for the paragraph, including the text and entities
   * @param {string} newAnnotator - The name of the annotator for the export.
   * @returns {REF_ParagraphJSONFormat} - The JSON representation of the paragraph.
   */
  private JSONFormat(newAnnotator: string): REF_ParagraphJSONFormat {
    return [
      this.id,
      this.text, // The text of the paragraph
      {
        entities: this.entities.map((entity) => entity.toJSON(newAnnotator)), // Convert each entity to JSON
      },
    ]
  }

  /**
   * Constructor for the Paragraph class.
   * @constructor
   * @description This constructor initializes the Paragraph with text and an optional array of entities.
   * @param {string} paragraphText - The text of the paragraph.
   * @param {REF_EntityJSONFormat} paragraphEntities - An optional array of entities in the paragraph.
   */
  constructor(paragraphText: string, paragraphEntities?: REF_EntityJSONFormat[]) {
    this.text = paragraphText
    if (paragraphEntities) {
      this.entities = paragraphEntities.length
        ? paragraphEntities.map((entityJSON) => Entity.fromJSON(entityJSON))
        : [] // Array of entities in the paragraph
    } else {
      this.entities = [] // Initialize with an empty array if no entities are provided
    }
  }

  /**
   * Converts the Paragraph instance to a JSON object.
   * @param {string} newAnnotator - The name of the annotator for the export.
   * @returns {REF_ParagraphJSONFormat} The JSON representation of the Paragraph.
   */
  public toJSON(newAnnotator: string): REF_ParagraphJSONFormat {
    return this.JSONFormat(newAnnotator)
  }

  /**
   * Generates the RDF representation of the paragraph.
   * @param {number} paragraphNumber position of the paragraph in the document
   * @param {string} documentId unique identifier for the document
   * @param {string[]} paragraphIds array of paragraph IDs
   * @param {LabelManager} labelManager instance of LabelManager to include labels in the RDF export
   * @returns {string} RDF representation of the paragraph
   */
  public toRDF(paragraphNumber: number, documentId: string, paragraphIds: string[], labelManager: LabelManager): string {
    let rdfData: string = '';

    rdfData += `data:${this.id} rdf:type onner:Paragraph ;\n`
    rdfData += `onner:positionInParentDocumentPart '${paragraphNumber}'^^xsd:nonNegativeInteger ;\n`
    rdfData +=
      paragraphNumber < paragraphIds.length
        ? `onner:nextDocumentPart ${this.id} ;\n`
        : `onner:nextDocumentPart data:${documentId}_EndOfDocument ;\n`
    rdfData += `onner:paragraphText '${this.text}'^^xsd:string ;\n`

    if (this.entities.length > 0) {
      rdfData += this.entities.map((entity) => entity.toRDF(this, labelManager)).join("");
    } else {
      rdfData += `onner:directlyContainsLabeledTerm data:NoLabeledTerm .\n\n`
    }

    return rdfData;
  }

  /**
   * Creates a Paragraph instance from a JSON object.
   * @description This method converts a JSON representation of a paragraph back into a Paragraph instance.
   * @param {REF_ParagraphJSONFormat} json - The JSON object to convert.
   * @returns {Paragraph} The Paragraph instance created from the JSON object.
   */
  public static fromJSON(json: REF_ParagraphJSONFormat): Paragraph {
    return new Paragraph(json[1], json[2].entities)
  }
}

/**
 * Entity
 * @description This class represents an entity in the annotations, containing start and end indices, label, and history of changes.
 * @property {number} start - The start index of the entity in the text.
 * @property {number} end - The end index of the entity in the text.
 * @property {string | undefined} currentState - The current state of the entity, e.g., "active", "inactive".
 * @property {string | undefined} name - The name of the last annotator.
 * @property {string} labelName - The name of the label assigned to the entity.
 * @property {Label | undefined} labelClass - The label class of the entity.
 * @property {History[]} history - An array to hold the history of label changes.
 * @property {boolean} reviewed - Indicates if the entity has been reviewed.
 * @property {History|null} latestEntry - A method to get the latest history entry.
 * @property {REF_EntityJSONFormat} JSONFormat - A method to export the entity to a JSON format.
 * @property {string | null} id - The ID of the entity.
 */
export class Entity {
  public start: number // Start index of the entity
  public end: number // End index of the entity
  public currentState: string | undefined // Current state of the entity, e.g., "active", "inactive"
  public name: string | undefined // Name of last annotator
  public labelName: string // Name of the label assigned to the entity
  public labelClass: Label | undefined // Label class of the entity
  public history: History[] // Array to hold the history of label changes
  public reviewed: boolean // Indicates if the entity has been reviewed
  public id: string | null = null; // ID of the entity
  public latestEntry = (): History | null => {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null // Get the latest history entry
  }
  private get JSONFormat(): REF_EntityJSONFormat {
    return [
      this.id, // Placeholder for the entity ID, can be set later
      this.start, // Start index of the entity
      this.end, // End index of the entity
      this.history.map((historyEntry) => historyEntry.toJSON()),
    ]
  }

  /**
   * Constructor for the Entity class.
   * @constructor
   * @description This constructor initializes the Entity with start and end indices, an optional history array, a label class, and a reviewed status.
   * @param {number} start - The start index of the entity in the text.
   * @param {number} end - The end index of the entity in the text.
   * @param {History[]} history - An optional array of history entries for the entity.
   * @param {Label | undefined} labelClass - An optional label class for the entity.
   * @param {boolean} reviewed - Indicates if the entity has been reviewed.
   * @param {string} currentState - The current state of the entity.
   */
  constructor(
    start: number,
    end: number,
    history: History[] = [],
    labelClass: Label | undefined = undefined,
    reviewed: boolean = false, // Indicates if the entity has been reviewed
    currentState?: string,
  ) {
    this.start = start // Start index of the entity
    this.end = end // End index of the entity
    this.reviewed = reviewed // Set the reviewed status of the entity
    this.history = history
    if (labelClass) {
      this.labelClass = labelClass // Set the label class if provided
      this.labelName = labelClass.name // Set the label name from the label class
    } else {
      this.labelName = '' // Default label name if no label class is provided
    }
    this.setFromLastHistoryEntry() // Set the current state, name, and label class from the last history entry
    // Not sure why I have to do it this way, but it works for now
    // TODO improve this at a later point
    if (currentState) {
      this.currentState = currentState // Set the current state if provided
    }
  }

  /**
   * Converts the Entity instance to a JSON object.
   * @description This method generates a JSON format for the entity, including start, end, history, and label information.
   * @param {string} newAnnotator - The name of the annotator for the export.
   * @returns {REF_EntityJSONFormat} The JSON representation of the Entity.
   */
  public toJSON(newAnnotator: string): REF_EntityJSONFormat {
    this.generateHistoryEntryForExport(newAnnotator) // Generate history entry for export
    return this.JSONFormat
  }

  /**
   * Generates the RDF representation of the entity.
   * @param {Paragraph} paragraph The paragraph containing the entity.
   * @param {LabelManager} labelManager The label manager instance.
   * @returns {string} The RDF representation of the entity.
   */
  public toRDF(paragraph: Paragraph, labelManager: LabelManager): string {
    let rdfData: string = '';

    rdfData += `data:${this.id} rdf:type onner:LabeledTerm ;\n` // deal with atomic and compound terms
    rdfData += `onner:labeledTermText '${paragraph.text.substring(this.start, this.end)}'^^xsd:string ;\n`
    rdfData += `onner:offset '${this.start}'^^xsd:nonNegativeInteger ;\n`
    rdfData += `onner:length '${this.end - this.start}'^^xsd:nonNegativeInteger ;\n`
    rdfData += `onner:labeledTermDirectlyContainedBy data:${paragraph.id} ;\n`
    rdfData += `onner:hasLabeledTermStatus ${this.history.map((historyEntry) => `data:${historyEntry.state}_${this.id}`).join(',')} .\n\n`

    this.generateHistoryEntryForExport("RDF Export"); // Ensure history is up to date for RDF export

    rdfData += this.history.map((historyEntry) => historyEntry.toRDF(this, labelManager)).join("");

    return rdfData;
  }

  /**
   * Returns a new instance of Entity from a JSON object.
   * @description This method converts a JSON representation of an entity back into an Entity instance.
   * @param {REF_EntityJSONFormat} json - The JSON object to convert.
   * @returns {Entity} The Entity instance created from the JSON object.
   */
  public static fromJSON(json: REF_EntityJSONFormat): Entity {
    return new Entity(
      json[1],
      json[2],
      json[3].map((entry) => History.fromJSON(entry)),
    )
  }

  /**
   * Sets the current state, name, and label class from the last history entry.
   * @description This method updates the current state, name, and label class of the entity
   */
  private setFromLastHistoryEntry(): void {
    if (this.history.length > 0) {
      this.currentState = this.latestEntry()?.state // Set the current state from the last history entry
      this.name = this.latestEntry()?.annotatorName // Set the name of the last annotator from the last history entry
      this.labelName = this.latestEntry()?.label ?? '' // Set the label class from the last history entry
    } else {
      this.currentState = 'Candidate' // Default state if no history is present
      this.name = '' // Default name if no history is present
    }
  }

  /**
   * Generates a history entry for export.
   * @description This method creates a new history entry for the entity, including the label name, current state, annotator name, and timestamp.
   * @param {string} newAnnotator - The name of the annotator making the change.
   * @returns {void}
   */
  private generateHistoryEntryForExport(newAnnotator: string): void {
    const newHistoryEntry = new History(
      this.currentState || 'Candidate', // Use the current state or default to 'Candidate'
      this.labelName || '', // Use the label name or an empty string if not set
      newAnnotator, // The name of the annotator making the change
      History.formatDate(new Date()),
    )
    if (
      this.reviewed &&
      this.latestEntry()?.annotatorName != newAnnotator &&
      this.latestEntry()?.state == this.currentState &&
      this.latestEntry()?.label == this.labelName
    ) {
      this.history.push(
        new History(
          this.latestEntry()?.state || '',
          this.latestEntry()?.label || '',
          newAnnotator,
          History.formatDate(new Date()),
        ),
      )
    } else if (
      (this.currentState == 'Candidate' || this.currentState == 'Suggested') &&
      this.history.length == 0
    ) {
      this.history.push(newHistoryEntry) // If the entity is in 'Candidate' or 'Suggested' state and has no history, add the new history entry
    } else if (
      this.latestEntry()?.state != this.currentState ||
      this.latestEntry()?.label != this.labelName
    ) {
      this.history.push(newHistoryEntry) // If the current state or label has changed, add the new history entry
    }
  }
}

/**
 * History
 * @description This class represents a history entry for an entity, containing label, state, annotator name, and timestamp.
 * @property {string} label - The label of the entity at this point in history.
 * @property {string} state - The state of the entity at this point in history.
 * @property {string} annotatorName - The name of the annotator who made this change.
 * @property {string} timestamp - The timestamp when this change was made.
 */
export class History {
  public label: string
  public state: string
  public annotatorName: string
  public timestamp: string

  /**
   * Converts the History instance to a JSON object.
   * @description This method generates a JSON format for the history entry.
   * @returns {REF_HistoryJSONFormat} The JSON representation of the History.
   */
  private get ArrayFormat(): REF_HistoryJSONFormat {
    return [
      this.state, // The state of the entity at this point in history
      this.label, // The label of the entity at this point in history
      this.timestamp, // The timestamp when this change was made
      this.annotatorName, // The name of the annotator who made this change
    ]
  }

  /**
   * Constructor for the History class.
   * @constructor
   * @description This constructor initializes the History with label, state, annotator name, and timestamp.
   * @param {string} state - The state of the entity at this point in history.
   * @param {string} label - The label of the entity at this point in history.
   * @param {string} annotatorName - The name of the annotator who made this change.
   * @param {string} timestamp - The timestamp when this change was made.
   */
  constructor(state: string, label: string, annotatorName: string, timestamp: string) {
    this.state = state
    this.label = label
    this.annotatorName = annotatorName
    this.timestamp = timestamp
  }

  /**
   * Converts the History instance to a JSON object.
   * @description This method generates a JSON format for the history entry.
   * @returns {REF_HistoryJSONFormat} The JSON representation of the History.
   */
  public toJSON(): REF_HistoryJSONFormat {
    return this.ArrayFormat
  }

  /**
   * Generates the RDF representation of the entity.
   * @param {Entity} entity The entity to convert to RDF.
   * @param {LabelManager} labelManager The label manager instance.
   * @returns {string} The RDF representation of the entity.
   */
  public toRDF(entity: Entity, labelManager: LabelManager): string {
    let rdfData: string = '';

    rdfData += `data:Candidate_${entity.id} rdf:type onner:CandidateStatus ;\n`
    rdfData += `onner:statusAssignmentDate '${this.timestamp}'^^xsd:dateTime ;\n`
    rdfData += `onner:statusAssignedBy '${this.annotatorName}'^^xsd:string ;\n`
    rdfData += `onner:hasLabeledTermLabel data:Label_${labelManager.getLabelId(this.label) ?? 0 + 1} .\n\n`

    return rdfData;
  }

  /**
   * Creates a History instance from a JSON object.
   * @description This method converts a JSON representation of a history entry back into a History instance.
   * @param {REF_HistoryJSONFormat} json - The JSON object to convert.
   * @returns {History} The History instance created from the JSON object.
   */
  public static fromJSON(json: REF_HistoryJSONFormat): History {
    return new History(json[0], json[1], json[3], json[2])
  }

  /**
   * Formats the date to a string.
   * @description This method formats the date to a string in ISO format.
   * @param {Date} date - The date to format.
   * @returns {string} The formatted date string.
   */
  public static formatDate(date: Date): string {
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    // Modified to remove milliseconds for simplicity
    // Example: 2023-10-05T14:48:00Z
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
  }
}
