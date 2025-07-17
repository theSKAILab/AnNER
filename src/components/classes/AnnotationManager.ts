// This is the Rich Entity Format (REF) used in the TeAM-NER project.
// The format is designed to store annotations with the metadata necessary for text entity recognition tasks.

// Export format:
// {
//  "classes": [...LabelManager]
//   "annotations": [
//     [
//       "PARAGRAPH_ID",
//       "PARAGRAPH_TEXT",
//       {
//         "entities": [
//           [
//             "ENTITY_ID",
//             "ENTITY_START",
//             "ENTITY_END",
//             [
//               [
//                 "HISTORY_ENTITY_LABEL"
//                 "HISTORY_STATE",
//                 "HISTORY_ANNOTATOR_NAME",
//                 "HISTORY_TIMESTAMP",
//               ]
//             ]
//           ]
//         ]
//       }
//     ],
//   ]
// }
import { Label } from './LabelManager'

/**
 * Represents the Rich Entity Format File
 * @param {Paragraph[]} annotations - Array of paragraphs with annotations.
 */
export class AnnotationManager {
  public annotations: Paragraph[] // Array of paragraphs with annotations

  public get inputSentences(): object[] {
    return this.annotations.map((paragraph, i) => ({ id: i, text: paragraph.text }))
  }

  constructor(annotations: Paragraph[] = []) {
    this.annotations = annotations.map((paragraph) => Paragraph.fromJSON(paragraph)) // Convert each paragraph to a Paragraph instance
  }

  public toJSON(newAnnotator: string): object {
    return this.annotations.map((paragraph) => paragraph.toJSON(newAnnotator)) // Convert each paragraph to JSON
  }

  public static fromText(text: string): AnnotationManager {
    const transformedText: string[] = text.replace(/(\r\n|\n|\r){2,}/gm, '\n').split('\n')
    const castedParagraphs: object[] = transformedText.map((item: string) => {
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

  public static fromJSON(json: string): AnnotationManager {
    const jsonObject = JSON.parse(json)
    return new AnnotationManager(jsonObject.annotations)
  }
}

/**
 * Represents a paragraph in the REF format.
 * @param {string} paragraphText - The text of the paragraph.
 * @optional @param {object} paragraphEntities - The entities associated with the paragraph.
 */
export class Paragraph {
  public text: string
  public entities: Entity[]

  // Export JSON format for the Paragraph class
  private JSONFormat(newAnnotator: string): object {
    return [
      null, // Placeholder for the paragraph ID, can be set later
      this.text, // The text of the paragraph
      {
        entities: this.entities.map((entity) => entity.toJSON(newAnnotator)), // Convert each entity to JSON
      },
    ]
  }

  // Constructor for the Paragraph class
  constructor(paragraphText: string, paragraphEntities: object[] = []) {
    this.text = paragraphText
    this.entities = paragraphEntities.length
      ? paragraphEntities.map((entityJSON) => Entity.fromJSON(entityJSON))
      : [] // Array of entities in the paragraph
  }

  /**
   * Converts the Paragraph instance to a JSON object.
   * @returns {object} The JSON representation of the Paragraph.
   */
  public toJSON(newAnnotator: string): object {
    return this.JSONFormat(newAnnotator)
  }

  /**
   * Creates a Paragraph instance from a JSON object.
   * @param {object} json - The JSON object to convert.
   * @returns {Paragraph} The Paragraph instance created from the JSON object.
   */
  public static fromJSON(json: any): Paragraph {
    return new Paragraph(json[1], json[2].entities)
  }
}

/**
 * Represents an entity in the Rich Entity Format.
 * @param {number} start - The start index of the entity in the paragraph.
 * @param {number} end - The end index of the entity in the paragraph.
 * @optional @param {Array} history - The history of the entity, containing label changes and timestamps.
 */
export class Entity {
  public start: number // Start index of the entity
  public end: number // End index of the entity
  public currentState: string | undefined // Current state of the entity, e.g., "active", "inactive"
  public name: string | undefined // Name of last annotator
  public labelName: string | undefined // Name of the label assigned to the entity
  public labelClass: Label | undefined // Label class of the entity
  public history: History[] // Array to hold the history of label changes
  public reviewed: boolean // Indicates if the entity has been reviewed

  public latestEntry = () => {
    return this.history.length > 0 ? this.history[this.history.length - 1] : null // Get the latest history entry
  }

  // Export JSON format for the Entity class
  private get JSONFormat(): object {
    return [
      null, // Placeholder for the entity ID, can be set later
      this.start, // Start index of the entity
      this.end, // End index of the entity
      this.history.map((historyEntry) => historyEntry.toJSON()),
    ]
  }

  // Constructor for the Entity class
  constructor(
    start: number,
    end: number,
    history: object[] | History[] = [],
    labelClass: Label | undefined = undefined,
    reviewed: boolean = false, // Indicates if the entity has been reviewed
    currentState?: string, // Default state of the entity
  ) {
    this.start = start // Start index of the entity
    this.end = end // End index of the entity
    this.reviewed = reviewed // Set the reviewed status of the entity

    if (history[0] instanceof History) {
      this.history = history
    } else {
      this.history = history.map((historyEntry) => History.fromJSON(historyEntry)) // Array to hold the history of label changes, casted
    }

    if (labelClass) {
      this.labelClass = labelClass // Set the label class if provided
      this.labelName = labelClass.name // Set the label name from the label class
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
   * @returns {JSON} The JSON representation of the Entity.
   */
  public toJSON(newAnnotator: string): object {
    this.generateHistoryEntryForExport(newAnnotator) // Generate history entry for export
    return this.JSONFormat
  }

  /**
   * Creates an Entity instance from a JSON object.
   * @param {object} json - The JSON object to convert.
   * @returns {Entity} The Entity instance created from the JSON object.
   */
  public static fromJSON(json: object[]): Entity {
    return new Entity(json[1], json[2], json[3])
  }

  /**
   * Sets the current state, name, and label class of the entity from the last history entry.
   */
  private setFromLastHistoryEntry(): void {
    if (this.history.length > 0) {
      this.currentState = this.latestEntry()?.state // Set the current state from the last history entry
      this.name = this.latestEntry()?.annotatorName // Set the name of the last annotator from the last history entry
      this.labelName = this.latestEntry()?.label // Set the label class from the last history entry
    } else {
      this.currentState = 'Candidate' // Default state if no history is present
      this.name = '' // Default name if no history is present
    }
  }

  private generateHistoryEntryForExport(newAnnotator: string): void {
    const newHistoryEntry = new History(
      this.labelName || '', // Use the label name or an empty string if not set
      this.currentState || 'Candidate', // Use the current state or default to 'Candidate'
      newAnnotator, // The name of the annotator making the change
      History.formatDate(new Date()), // Current timestamp
    )
    if (
      this.reviewed &&
      this.latestEntry()?.annotatorName != newAnnotator &&
      this.latestEntry()?.state == this.currentState &&
      this.latestEntry()?.label == this.labelName
    ) {
      this.history.push(
        new History(
          this.latestEntry()?.label,
          this.latestEntry()?.state,
          newAnnotator,
          History.formatDate(new Date()),
        ), //  Current reviewer "concurs" with previous reviewer and is not the same as previous reviewer
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
 * Represents a history entry for an entity in the Rich Entity Format.
 * @param {string} label - The label of the entity at this point in history.
 * @param {string} state - The state of the entity at this point in history.
 * @param {string} annotatorName - The name of the annotator who made this
 */
export class History {
  public label: string // The label of the entity at this point in history
  public state: string // The state of the entity at this point in history
  public annotatorName: string // The name of the annotator who made this change
  public timestamp: string | null // The timestamp when this change was made

  // Export JSON format for the History class
  private get ArrayFormat(): object {
    return [
      this.label, // The label of the entity at this point in history
      this.state, // The state of the entity at this point in history
      this.timestamp, // The timestamp when this change was made
      this.annotatorName, // The name of the annotator who made this change
    ]
  }

  constructor(
    label: string,
    state: string,
    annotatorName: string,
    timestamp: string | null = null,
  ) {
    this.label = label
    this.state = state
    this.annotatorName = annotatorName
    this.timestamp = timestamp
  }

  /**
   * Converts the History instance to a JSON object.
   * @returns {Array} The JSON representation of the History.
   */
  public toJSON(): object {
    return this.ArrayFormat
  }

  /**
   * Creates a History instance from a JSON object.
   * @param {object} json - The JSON object to convert.
   * @returns {History} The History instance created from the JSON object.
   */
  public static fromJSON(json: any): History {
    return new History(json[0], json[1], json[3], json[2])
  }

  public static formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day}~${hours}:${minutes}:${seconds}`
  }
}
