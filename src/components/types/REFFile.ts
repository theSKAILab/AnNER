import type { Label } from '@/components/managers/LabelManager'

/**
 * Rich Entity Format (REF) File Format
 * @description This format is used for storing annotated text data with labels and annotations.
 * @property {REF_ClassesJSONFormat} classes - The classes used in the annotations.
 * @property {REF_AnnotationManagerExportFormat} annotations - The annotations associated with the text.
 */
export type REF_FileFormat = {
    classes: REF_ClassesJSONFormat,
    annotations: REF_AnnotationManagerExportFormat,
}

/**
 * Rich Entity Format (REF) Classes JSON Format
 * @description This format defines the structure for classes used in annotations.
 * @property {REF_LabelJSONFormat[]} classes - An array of label objects defining the classes.
 */
export type REF_ClassesJSONFormat = {
  classes: REF_LabelJSONFormat[]
}

/**
 * Rich Entity Format (REF) Label JSON Format
 * @description This format defines the structure for a label used in annotations.
 * @property {number} id - The unique identifier for the label.
 * @property {string} name - The name of the label.
 * @property {string} color - The color associated with the label, used for visual representation.
 */
export type REF_LabelJSONFormat = {
  id: number
  name: string
  color: string
}

/**
 * Rich Entity Format (REF) Annotation Manager Export Format
 * @description This format is used to export annotations from the AnnotationManager.
 * @property {Label[]} labels - An array of labels used in the annotations.
 * @property {REF_ParagraphJSONFormat[]} annotations - An array of paragraphs with annotations.
 */
export type REF_AnnotationManagerExportFormat = {
  labels: Label[]
  annotations: REF_ParagraphJSONFormat[]
}

/**
 * Rich Entity Format (REF) Paragraph JSON Format
 * @description This format defines the structure for a paragraph in the annotations.
 * @property {null | string} id - The ID of the paragraph, can be set later.
 * @property {string} text - The text of the paragraph.
 * @property {{ entities: REF_EntityJSONFormat[] }} entitiesObj - An object containing an array of entities in the paragraph.
 */
export type REF_ParagraphJSONFormat = [
  id: null | string,
  text: string,
  entitiesObj: {
    entities: REF_EntityJSONFormat[]
  },
]

/**
 * Rich Entity Format (REF) Entity JSON Format
 * @description This format defines the structure for an entity in the annotations.
 * @property {null | string} id - The ID of the entity, can be set later.
 * @property {number} start - The start index of the entity in the text.
 * @property {number} end - The end index of the entity in the text.
 * @property {REF_HistoryJSONFormat[]} history - An array of history entries for the entity.
 */
export type REF_EntityJSONFormat = [
  id: null | string,
  start: number,
  end: number,
  history: REF_HistoryJSONFormat[],
]

/**
 * Rich Entity Format (REF) History JSON Format
 * @description This format defines the structure for the history of changes made to an entity.
 * @property {string} label - The label of the entity at this point in history.
 * @property {string} state - The state of the entity at this point in history.
 * @property {string} timestamp - The timestamp when this change was made.
 * @property {string} annotator - The name of the annotator who made this change
 */
export type REF_HistoryJSONFormat = [
  label: string,
  state: string,
  timestamp: string,
  annotator: string,
]