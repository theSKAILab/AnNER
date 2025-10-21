import { TokenManager } from '@/components/managers/TokenManager.ts'
import { AnnotationManager } from '@/components/managers/AnnotationManager.ts'
import { LabelManager } from '@/components/managers/LabelManager.ts'
import { VersionControlManager } from '@/components/managers/VersionControlManager.ts'

import { createStore, Store } from 'vuex'
import type { InjectionKey } from 'vue'
import type { REF_ClassesJSONFormat } from '../types/REFFile'
import Tokenizer from './Tokenizer'

const mutations = {
  /**
   * Load a file into the store.
   * @description This mutation processes the file and updates the store state accordingly.
   * @param {State} state - The current state of the store.
   * @param {File} file - The file to be loaded.
   * @returns {void}
   */
  loadFile(state: State, file: File): void {
    // Clear all current store data before processing (new) file
    state.annotationManager = null
    state.labelManager = null
    state.tokenManager = null
    state.versionControlManager = new VersionControlManager()
    state.tokenManagers = []
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

    // Setup TokenManagers for each sentence
    for (let i = 0; i < state.annotationManager.inputSentences.length; i++) {
      state.tokenManagers?.push(new TokenManager(
        state.labelManager as LabelManager,
        Tokenizer.span_tokenize(state.annotationManager.inputSentences[i].text),
        state.annotationManager?.annotations[i]
      ))
    }

    state.currentIndex = 0
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
      state.versionControlManager = new VersionControlManager()
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
      state.versionControlManager = new VersionControlManager()
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
   * Set the current index in the store.
   * @description This mutation updates the current index state, used for navigation between sentences.
   * @param {State} state - The current state of the store.
   * @param {number} index - The index to set as the current index.
   */
  setCurrentIndex(state: State, index: number): void {
    state.currentIndex = index
  },

  /**
   * Set the TokenManager in the store.
   * @description This mutation initializes the TokenManager and sets it in the store state, along with the VersionControlManager.
   * @param {State} state - The current state of the store.
   * @param {TokenManager} tokenManager - The TokenManager instance to set in the store.
   */
  setTokenManager(state: State, tokenManager: TokenManager): void {
    state.tokenManager = tokenManager
  },
}

interface State {
  currentIndex: number
  currentPage: string
  fileName: string
  annotationManager: AnnotationManager | null // Global annotation manager
  labelManager: LabelManager | null // Global label manager,
  tokenManager: TokenManager | null // Global token manager,
  versionControlManager: VersionControlManager | null // Global version control manager
  tokenManagers: TokenManager[] | null // Array of token managers for each sentence
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
      versionControlManager: new VersionControlManager(), // Global version control manager
      tokenManagers: [], // Array of token managers for each sentence
    }
  },
  mutations,
})

// Initialize VersionControlManager with store reference
if (store.state.versionControlManager) {
  store.state.versionControlManager.setStore(store)
}

export const key: InjectionKey<Store<State>> = Symbol()
