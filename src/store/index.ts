import { AnnotationManager } from '../components/classes/AnnotationManager.ts'
import { LabelManager } from '../components/classes/LabelManager.ts'
import { UndoManager } from '@/components/classes/UndoManager.ts'

const mutations = {
  // File Loading
  loadFile(state, file) {
    state.fileName = file.name
    const fileType = file.name.split('.').pop()
    try {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.addEventListener('load', (event) => {
        mutations.processFile(state, event.target.result)

        if (fileType === 'txt') {
          mutations.setCurrentPage(state, 'annotate')
        } else if (fileType === 'json') {
          mutations.setCurrentPage(state, 'review')
        } else {
          this.$q.dialog({
            title: 'Incompatible File Type',
            message: 'Please upload either a .txt or a .json file.',
          })
          mutations.setCurrentPage(state, 'start')
        }
      })
    } catch (e) {
      this.$q.notify({
        icon: 'fas fa-exclamation-circle',
        message: 'Invalid file',
        color: 'red-6',
        position: 'top',
        timeout: 2000,
        actions: [{ label: 'Dismiss', color: 'white' }],
      })
    }
  },
  processFile(state, payload) {
    if (state.fileName.split('.')[1] == 'json') {
      // Loading a JSON file
      state.annotationManager = AnnotationManager.fromJSON(payload)
      const classesJSON: object = JSON.parse(payload)
      state.labelManager = LabelManager.fromJSON(classesJSON.classes)
    } else {
      // Loading a text file
      state.annotationManager = AnnotationManager.fromText(payload)
      state.labelManager = new LabelManager()
    }
  },

  // Navigation
  nextSentence(state) {
    if (state.currentIndex < state.annotationManager.inputSentences.length - 1) {
      state.currentIndex += 1
    }
  },
  previousSentence(state) {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1
    }
  },
  setCurrentPage(state, page) {
    state.currentPage = page
  },

  // Global Setters
  setTokenManager(state, tokenManager) {
    state.tokenManager = tokenManager
    state.undoManager = new UndoManager(state.tokenManager)
  },
}

export default {
  state() {
    return {
      currentIndex: 0,
      currentPage: 'start',
      fileName: null,
      annotationManager: null, // Global annotation manager
      labelManager: null, // Global label manager,
      tokenManager: null, // Global token manager,
      undoManager: null, // Global undo manager
    }
  },
  mutations,
}
