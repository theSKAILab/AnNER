import { mount } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import Tokenizer from '../../src/components/managers/Tokenizer'
import LabelsBlock from '../../src/components/blocks/LabelsBlock.vue'
import MenuBar from '../../src/components/toolbars/MenuBar.vue'
import { LabelManager } from '../../src/components/managers/LabelManager'
import { AnnotationManager } from '../../src/components/managers/AnnotationManager'

test('Tokenizer.span_tokenize handles basic spans', () => {
  const spans = Tokenizer.span_tokenize('Hello, world!')
  expect(spans.length).toBeGreaterThan(0)
})

test('LabelsBlock avatar conditional branches', async () => {
  const lm = new LabelManager()
  lm.addLabel('ONE')
  lm.addLabel('TWO')
  // set current to first
  lm.setCurrentLabel('ONE')
  const store = { state: { currentPage: 'annotate', labelManager: lm } }
  const mocks = { $q: { notify: vi.fn(), dialog: () => ({ onOk: () => {} }), dark: { isActive: true } }, $store: store }
  const wrapper = mount(LabelsBlock, { global: { mocks } })
  // should render both avatars and current-selection avatar path
  expect(wrapper.html()).toContain('ONE')
  expect(wrapper.html()).toContain('TWO')
})

test('MenuBar export/save flows create anchor and click', async () => {
  const lm = new LabelManager()
  lm.addLabel('L')
  const am = new AnnotationManager([])
  const store = { state: { currentPage: 'annotate', fileName: 'F', annotationManager: am, labelManager: lm, versionControlManager: { canUndo: false, canRedo: false }, tokenManager: null, tokenManagers: [] }, commit: vi.fn() }
  const q = { dialog: () => ({ onOk: (cb: any) => cb && cb('me') }), notify: vi.fn(), dark: { isActive: false } }
  const wrapper = mount(MenuBar, { global: { mocks: { $store: store, $q: q } } })
  // spy on document.createElement to ensure anchor click path is hit
  const createSpy = vi.spyOn(document, 'createElement')
  await (wrapper.vm as any).save()
  await (wrapper.vm as any).export()
  expect(createSpy).toHaveBeenCalled()
  createSpy.mockRestore()
})
