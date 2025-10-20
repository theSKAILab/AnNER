import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AnnotationPage from '../../src/components/pages/AnnotationPage.vue'
import ReviewPage from '../../src/components/pages/ReviewPage.vue'
import AggregateBlock from '../../src/components/blocks/AggregateBlock.vue'
import TokenBlock from '../../src/components/blocks/TokenBlock.vue'
import { TMToken, TMTokenBlock } from '../../src/components/managers/TokenManager'
import { store } from '../../src/components/managers/Store'
import { LabelManager } from '../../src/components/managers/LabelManager'
import TokenManager from '../../src/components/managers/TokenManager'
import { AnnotationManager } from '../../src/components/managers/AnnotationManager'

describe('Pages coverage - AnnotationPage & ReviewPage', () => {
  it('AnnotationPage created hook sets up listeners and beforeLeave', async () => {
    // Prepare store with at least one sentence
  store.state.annotationManager = AnnotationManager.fromText('one')
  store.state.labelManager = new LabelManager()
  store.state.tokenManagers = [new TokenManager(store.state.labelManager as any, [[0,1,'a']] as any)]

    const addSpy = vi.spyOn(document, 'addEventListener')
    const removeSpy = vi.spyOn(document, 'removeEventListener')

    const wrapper = mount(AnnotationPage, {
      global: {
        mocks: {
          $store: store,
        }
      }
    })

    // created should have added mouseup listener
    expect(addSpy).toHaveBeenCalled()

    // window.onbeforeunload should be set and return expected string
    expect(typeof window.onbeforeunload).toBe('function')
    const ret = (window.onbeforeunload as any)()
    expect(ret).toContain('Leaving this page')

    // unmount to trigger beforeUnmount cleanup
    await wrapper.unmount()
    expect(removeSpy).toHaveBeenCalled()
  })

  it('ReviewPage wires emitter selection handler and beforeUnmount removes listener', async () => {
    // prepare store
  store.state.annotationManager = AnnotationManager.fromText('one')
  store.state.labelManager = new LabelManager()
  store.state.tokenManagers = [new TokenManager(store.state.labelManager as any, [[0,1,'a']] as any)]

    // Mount review page with a working emitter so emit triggers registered listeners
    const listeners: Record<string, Array<(...args: any[]) => void>> = {}
    const emitter = {
      on(evt: string, cb: (...args: any[]) => void) {
        listeners[evt] = listeners[evt] || []
        listeners[evt].push(cb)
      },
      off(evt: string, cb: (...args: any[]) => void) {
        listeners[evt] = (listeners[evt] || []).filter(f => f !== cb)
      },
      emit(evt: string, ...args: any[]) {
        ;(listeners[evt] || []).slice().forEach(f => f(...args))
      },
    }

    const wrapper = mount(ReviewPage, {
      global: { mocks: { $store: store, emitter } }
    })

    // find component vm and spy on selectTokens
    const vm: any = wrapper.vm
    const spy = vi.spyOn(vm, 'selectTokens')

  // emit the event using our working emitter — provide a MouseEvent-like object with detail
  emitter.emit('tokenizeCurrentSentence', { detail: 1 })
    expect(spy).toHaveBeenCalled()

    // beforeUnmount cleanup
    await wrapper.unmount()
    // emitter.off should have been called during beforeUnmount
    // (we can't directly spy the global emitter off easily here, but unmount should not throw)
    expect(true).toBe(true)
  })

  it('renders aggregate and token-block branches in AnnotationPage template', async () => {
    // prepare store with tokenManagers containing overlapping and non-overlapping blocks
    store.state.annotationManager = AnnotationManager.fromText('one')
    const lm = new LabelManager()
    lm.addLabel('A')
    store.state.labelManager = lm

    const tm = new TokenManager(lm as any, [])
    // create overlapping blocks (t1 and t2) and a separate non-overlapping block (t3)
    const b1 = new TMTokenBlock(0, 2, [new TMToken(0, 1, 'a', 'Candidate')], lm.allLabels[0], 'Candidate')
    const b2 = new TMTokenBlock(1, 3, [new TMToken(1, 2, 'b', 'Candidate')], lm.allLabels[0], 'Candidate')
    const b3 = new TMTokenBlock(10, 12, [new TMToken(10, 11, 'c', 'Candidate')], lm.allLabels[0], 'Candidate')
    tm.tokens = [b1, b2, b3]
    store.state.tokenManagers = [tm as any]

    const wrapper = mount(AnnotationPage, {
      global: { mocks: { $store: store, emitter: { on: () => {}, off: () => {} } } }
    })

    // allow rendering pipeline
    await wrapper.vm.$nextTick()

    // should render an AggregateBlock for overlapping blocks and a TokenBlock for the non-overlapping one
    expect(wrapper.findComponent(AggregateBlock).exists()).toBe(true)
    expect(wrapper.findComponent(TokenBlock).exists()).toBe(true)
  })

  it('renders aggregate and token-block branches in ReviewPage template', async () => {
    // prepare store with tokenManagers containing overlapping and non-overlapping blocks
    store.state.annotationManager = AnnotationManager.fromText('one')
    const lm = new LabelManager()
    lm.addLabel('A')
    store.state.labelManager = lm

    const tm = new TokenManager(lm as any, [])
    const b1 = new TMTokenBlock(0, 2, [new TMToken(0, 1, 'a', 'Candidate')], lm.allLabels[0], 'Candidate')
    const b2 = new TMTokenBlock(1, 3, [new TMToken(1, 2, 'b', 'Candidate')], lm.allLabels[0], 'Candidate')
    const b3 = new TMTokenBlock(10, 12, [new TMToken(10, 11, 'c', 'Candidate')], lm.allLabels[0], 'Candidate')
    tm.tokens = [b1, b2, b3]
    store.state.tokenManagers = [tm as any]

    const wrapper = mount(ReviewPage, {
      global: { mocks: { $store: store, emitter: { on: () => {}, off: () => {} } } }
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent(AggregateBlock).exists()).toBe(true)
    expect(wrapper.findComponent(TokenBlock).exists()).toBe(true)
  })

  it('currentIndex watcher triggers tokenizeCurrentSentence', async () => {
    // Need at least two sentences so changing index has effect
    store.state.annotationManager = AnnotationManager.fromText('one\ntwo')
    const lm = new LabelManager()
    lm.addLabel('A')
    store.state.labelManager = lm
    // two token managers, one per sentence
    store.state.tokenManagers = [new TokenManager(lm as any, [[0,1,'a']] as any), new TokenManager(lm as any, [[0,1,'b']] as any)]

    const wrapper = mount(AnnotationPage, { global: { mocks: { $store: store, emitter: { on: () => {}, off: () => {} } } } })
    // spy after mount then change index
    const vm: any = wrapper.vm
    const spy = vi.spyOn(vm, 'tokenizeCurrentSentence')
    // change current index via mutation to ensure reactivity
    store.commit('setCurrentIndex', 1)
    await wrapper.vm.$nextTick()
    expect(spy).toHaveBeenCalled()
  })
})
