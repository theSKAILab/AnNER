import { Label } from './LabelManager'
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
 * @property {object[]} inputSentences - An array of objects containing the ID and text of each input sentence.
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
}

/**
 * Paragraph
 * @description This class represents a paragraph in the annotations, containing text and entities.
 * @property {string} text - The text of the paragraph.
 * @property {Entity[]} entities - An array of entities in the paragraph.
 */
export class Paragraph {
  public text: string
  public entities: Entity[]

  /**
   * Exports the paragraph to a JSON format.
   * @description This method generates a JSON format for the paragraph, including the text and entities
   * @param {string} newAnnotator - The name of the annotator for the export.
   * @returns {REF_ParagraphJSONFormat} - The JSON representation of the paragraph.
   */
  private JSONFormat(newAnnotator: string): REF_ParagraphJSONFormat {
    return [
      null, // Placeholder for the paragraph ID, can be set later
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
  public latestEntry = (): History | null => {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null // Get the latest history entry
  }
  private get JSONFormat(): REF_EntityJSONFormat {
    return [
      null, // Placeholder for the entity ID, can be set later
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
      this.labelName || '', // Use the label name or an empty string if not set
      this.currentState || 'Candidate', // Use the current state or default to 'Candidate'
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
          this.latestEntry()?.label || '',
          this.latestEntry()?.state || '',
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
      this.label, // The label of the entity at this point in history
      this.state, // The state of the entity at this point in history
      this.timestamp, // The timestamp when this change was made
      this.annotatorName, // The name of the annotator who made this change
    ]
  }

  /**
   * Constructor for the History class.
   * @constructor
   * @description This constructor initializes the History with label, state, annotator name, and timestamp.
   * @param {string} label - The label of the entity at this point in history.
   * @param {string} state - The state of the entity at this point in history.
   * @param {string} annotatorName - The name of the annotator who made this change.
   * @param {string} timestamp - The timestamp when this change was made.
   */
  constructor(label: string, state: string, annotatorName: string, timestamp: string) {
    this.label = label
    this.state = state
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
