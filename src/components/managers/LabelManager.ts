import type { REF_LabelJSONFormat } from "../types/REFFile"

const labelColors = [
  'red-11',
  'blue-11',
  'light-green-11',
  'deep-orange-11',
  'pink-11',
  'light-blue-11',
  'lime-11',
  'brown-11',
  'purple-11',
  'cyan-11',
  'yellow-11',
  'grey-11',
  'deep-purple-11',
  'teal-11',
  'amber-11',
  'blue-grey-11',
  'indigo-11',
  'green-11',
  'orange-11',
]

/**
 * Label
 * @description This class represents a label used in annotations.
 * @property {number} id - The unique identifier for the label.
 * @property {string} name - The name of the label.
 * @property {string} color - The color associated with the label, used for visual representation.
 */
export class Label {
  public id: number
  public name: string
  public color: string

  constructor(id: number, name: string, color: string) {
    this.id = id
    this.name = name
    this.color = color
  }
}

/**
 * LabelManager
 * @description This class manages a collection of labels used in annotations.
 * @property {Label[]} labels - An array of labels managed by this LabelManager.
 * @property {Label | undefined} currentLabel - The currently selected label.
 * @property {Label[]} allLabels - Returns all labels managed by this LabelManager.
 * @property {number} lastId - Returns the last ID used for labels.
 */
export class LabelManager {
  private labels: Label[] = []
  public currentLabel: Label | undefined
  public get allLabels(): Label[] {
    return this.labels
  }
  public get lastId(): number {
    return this.labels.length
  }

  /**
   * Constructor for the LabelManager class.
   * @constructor
   * @description Initializes the LabelManager with an optional initial set of labels.
   * @param {Label[]} [initialLabels=[]] - An optional array of initial labels to populate the manager.
   */
  constructor(initialLabels: Label[] = []) {
    this.labels = initialLabels
    this.currentLabel = this.labels.length > 0 ? this.labels[0] : undefined
  }

  /**
   * Checks if a label with the given name already exists.
   * @description This method checks if a label with the specified name already exists in the manager.
   * @param {string} newLabel - The name of the label to check for existence.
   * @returns {boolean} True if the label exists, false otherwise.
   */
  public doesAlreadyExist(newLabel: string): boolean {
    let labelExists: boolean = false
    this.labels.forEach((label) => {
      if (label.name.toLowerCase() == newLabel.toLowerCase()) {
        labelExists = true
      }
    })
    return labelExists
  }

  /**
   * Adds a new label to the manager.
   * @description This method adds a new label with a unique ID and a randomly generated color to the manager.
   * If it's the first label added, it sets it as the current label.
   * @param {string} name - The name of the new label to add.
   */
  public addLabel(name: string) {
    this.labels.push(new Label(this.labels.length + 1, name, this.generateRandomColor()))
    if (this.labels.length === 1) {
      this.currentLabel = this.labels[0] // Set the first label as current if it's the first one added
    }
  }

  /**
   * Deletes a label by its name.
   * @description This method removes a label with the specified name from the manager.
   * If the label is currently selected, it will not change the current label.
   * @param {string} name - The name of the label to delete.
   */
  public deleteLabel(name: string) {
    this.labels = this.labels.filter((label) => label.name != name)
  }

  /**
   * Gets a label by its name.
   * @description This method retrieves a label with the specified name from the manager.
   * @param {string} name - The name of the label to retrieve.
   * @returns {Label | undefined} The label if found, otherwise undefined.
   */
  public getLabelByName(name: string): Label | undefined {
    return this.labels.find((label) => label.name == name)
  }

  /**
   * Generates a random color for a new label.
   * @description This method generates a random color from the predefined list of colors.
   * @returns {string} A randomly selected color from the labelColors array.
   */
  public generateRandomColor(): string {
    return labelColors[this.lastId % labelColors.length]
  }

  /**
   * Creates a LabelManager instance from a JSON object.
   * @description This method converts a JSON representation of labels into a LabelManager instance.
   * @param {REF_LabelJSONFormat[]} json - The JSON object to convert.
   * @returns {LabelManager} The LabelManager instance created from the JSON object.
   */
  public static fromJSON(json: REF_LabelJSONFormat[]): LabelManager {
    return new LabelManager(json.map((c: Label) => new Label(c.id, c.name, c.color)))
  }

  /**
   * Sets the current label by its name.
   * @description This method updates the current label to the one with the specified name.
   * @param {string} name - The name of the label to set as current.
   */
  public setCurrentLabel(name: string): void {
    const label = this.getLabelByName(name)
    if (label) {
      this.currentLabel = label
    } else {
      throw new Error(`Label with name ${name} does not exist.`)
    }
  }

  /**
   * Converts the LabelManager instance to a JSON object.
   * @description This method generates a JSON format for the labels managed by this LabelManager.
   * @returns {REF_LabelJSONFormat[]} The JSON representation of the labels.
   */
  public toJSON(): REF_LabelJSONFormat[] {
    return this.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    }))
  }
}
