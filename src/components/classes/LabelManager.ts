// REF Format
//   "classes": [
//     {
//       "id": CLASS_ID,
//       "name": "CLASS_NAME",
//       "color": "CLASS_COLOR"
//     }
//   ],

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

export class LabelManager {
  private labels: Label[] = []
  public currentLabel: Label | undefined

  // Getters
  public get allLabels(): Label[] {
    return this.labels
  }
  public get lastId(): number {
    return this.labels.length
  }

  constructor(initialLabels: Label[] = []) {
    this.labels = initialLabels
    this.currentLabel = this.labels.length > 0 ? this.labels[0] : undefined
  }

  public doesAlreadyExist(newLabel: string): boolean {
    let labelExists: boolean = false
    this.labels.forEach((label) => {
      if (label.name.toLowerCase() == newLabel.toLowerCase()) {
        labelExists = true
      }
    })
    return labelExists
  }

  public addLabel(name: string) {
    this.labels.push(new Label(this.labels.length + 1, name, this.generateRandomColor()))
    if (this.labels.length === 1) {
      this.currentLabel = this.labels[0] // Set the first label as current if it's the first one added
    }
  }

  public deleteLabel(name: string) {
    this.labels = this.labels.filter((label) => label.name != name)
  }

  public getLabelByName(name: string): Label | undefined {
    return this.labels.find((label) => label.name == name)
  }

  public generateRandomColor(): string {
    return labelColors[this.lastId % labelColors.length]
  }

  public static fromJSON(json: Label[]): LabelManager {
    return new LabelManager(json.map((c: Label) => new Label(c.id, c.name, c.color)))
  }

  public setCurrentLabel(name: string): void {
    const label = this.getLabelByName(name)
    if (label) {
      this.currentLabel = label
    } else {
      throw new Error(`Label with name ${name} does not exist.`)
    }
  }

  public toJSON(): object {
    return this.labels.map((label) => ({
      id: label.id,
      name: label.name,
      color: label.color,
    }))
  }
}
