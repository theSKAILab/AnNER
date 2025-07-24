import { Label } from '@/components/managers/LabelManager'

export type REF_FileFormat = {
    classes: REF_ClassesJSONFormat,
    annotations: REF_AnnotationManagerExportFormat,
}

export type REF_ClassesJSONFormat = {
  classes: REF_LabelJSONFormat[]
}

export type REF_LabelJSONFormat = {
  id: number
  name: string
  color: string
}

export type REF_AnnotationManagerExportFormat = {
  labels: Label[] // Array of labels used in the annotations
  annotations: REF_ParagraphJSONFormat[] // Array of paragraphs with annotations
}

// JSON Export Format Types
export type REF_ParagraphJSONFormat = [
  id: null | string, // Placeholder for the paragraph ID, can be set later
  text: string, // The text of the paragraph
  entitiesObj: {
    entities: REF_EntityJSONFormat[] // Array of entities in the paragraph
  },
]

export type REF_EntityJSONFormat = [
  id: null | string, // Placeholder for the entity ID, can be set later
  start: number, // Start index of the entity
  end: number, // End index of the entity
  history: REF_HistoryJSONFormat[], // Array of history entries for the entity
]

export type REF_HistoryJSONFormat = [
  label: string, // The label of the entity at this point in history
  state: string, // The state of the entity at this point in history
  timestamp: string, // The timestamp when this change was made
  annotator: string, // The name of the annotator who made this change
]