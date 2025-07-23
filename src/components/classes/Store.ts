import type TokenManager from '@/components/classes/TokenManager.ts'
import { AnnotationManager } from '@/components/classes/AnnotationManager.ts'
import { LabelManager, type ClassesJSONFormat } from '@/components/classes/LabelManager.ts'
import { UndoManager } from '@/components/classes/UndoManager.ts'

import { createStore, Store } from 'vuex'
import type { InjectionKey } from 'vue'

const mutations = {
  // File Loading
  loadFile(state: State, file: File): void {
    state.fileName = file.name
    const fileType = file.name.split('.').pop()
    const reader = new FileReader()
    reader.readAsText(file)
    reader.addEventListener('load', (event) => {
      if (event.target && event.target.result)
        mutations.processFile(state, event.target.result as string)
      if (fileType === 'txt') {
        mutations.setCurrentPage(state, 'annotate')
      } else if (fileType === 'json') {
        mutations.setCurrentPage(state, 'review')
      }
    })
  },
  processFile(state: State, payload: string): void {
    if (state.fileName.split('.')[1] == 'json') {
      // Loading a JSON file
      state.annotationManager = AnnotationManager.fromJSON(payload)
      const classesJSON: ClassesJSONFormat = JSON.parse(payload)
      state.labelManager = LabelManager.fromJSON(classesJSON.classes)
    } else {
      // Loading a text file
      state.annotationManager = AnnotationManager.fromText(payload)
      state.labelManager = new LabelManager()
    }
  },

  // Navigation
  nextSentence(state: State): void {
    if (
      state.annotationManager &&
      state.currentIndex < state.annotationManager.inputSentences.length - 1
    ) {
      state.currentIndex += 1
    }
  },
  previousSentence(state: State): void {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1
    }
  },
  setCurrentPage(state: State, page: string): void {
    state.currentPage = page
  },

  // Global Setters
  setTokenManager(state: State, tokenManager: TokenManager): void {
    state.tokenManager = tokenManager
    state.undoManager = new UndoManager()
  },
}

interface State {
  currentIndex: number
  currentPage: string
  fileName: string
  annotationManager: AnnotationManager | null // Global annotation manager
  labelManager: LabelManager | null // Global label manager,
  tokenManager: TokenManager | null // Global token manager,
  undoManager: UndoManager | null // Global undo manager
}

export const store = createStore<State>({
  state() {
    return {
      currentIndex: 0,
      currentPage: 'start',
      fileName: '',
      annotationManager: null, // Global annotation manager
      labelManager: null, // Global label manager,
      tokenManager: null, // Global token manager,
      undoManager: null, // Global undo manager
    }
  },
  mutations,
})

export const key: InjectionKey<Store<State>> = Symbol()
