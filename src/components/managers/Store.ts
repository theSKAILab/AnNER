import type TokenManager from '@/components/managers/TokenManager.ts'
import { AnnotationManager } from '@/components/managers/AnnotationManager.ts'
import { LabelManager } from '@/components/managers/LabelManager.ts'
import { UndoManager } from '@/components/managers/UndoManager.ts'

import { createStore, Store } from 'vuex'
import type { InjectionKey } from 'vue'
import type { REF_ClassesJSONFormat } from '../types/REFFile'

const mutations = {
  /**
   * Load a file into the store.
   * @description This mutation processes the file and updates the store state accordingly.
   * @param {State} state - The current state of the store.
   * @param {File} file - The file to be loaded.
   * @returns {void}
   */
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

  /**
   * Process the file content and update the store state.
   * @description This mutation processes the file content based on its type (JSON or text) and updates the annotation and label managers.
   * @param {State} state - The current state of the store.
   * @param {string} payload - The content of the file as a string.
   * @returns {void}
   */
  processFile(state: State, payload: string): void {
    if (state.fileName.split('.')[1] == 'json') {
      // Loading a JSON file
      state.annotationManager = AnnotationManager.fromJSON(payload)
      const classesJSON: REF_ClassesJSONFormat = JSON.parse(payload)
      state.labelManager = LabelManager.fromJSON(classesJSON.classes)
    } else {
      // Loading a text file
      state.annotationManager = AnnotationManager.fromText(payload)
      state.labelManager = new LabelManager()
    }
  },

  /**
   * Navigate to the next sentence in the annotation manager.
   * @description This mutation increments the current index to move to the next sentence in the annotation manager.
   * @param {State} state - The current state of the store.
   */
  nextSentence(state: State): void {
    if (
      state.annotationManager &&
      state.currentIndex < state.annotationManager.inputSentences.length - 1
    ) {
      state.currentIndex += 1
    }
  },

  /**
   * Navigate to the previous sentence in the annotation manager.
   * @description This mutation decrements the current index to move to the previous sentence in the annotation manager.
   * @param {State} state - The current state of the store.
   */
  previousSentence(state: State): void {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1
    }
  },

  /**
   * Set the current page in the store.
   * @description This mutation updates the current page state, which can be used for navigation or UI updates.
   * @param {State} state - The current state of the store.
   * @param {string} page - The name of the page to set as the current page.
   */
  setCurrentPage(state: State, page: string): void {
    state.currentPage = page
  },

  /**
   * Set the TokenManager in the store.
   * @description This mutation initializes the TokenManager and sets it in the store state, along with the UndoManager.
   * @param {State} state - The current state of the store.
   * @param {TokenManager} tokenManager - The TokenManager instance to set in the store.
   */
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
