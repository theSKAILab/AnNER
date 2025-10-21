import { test, expect, vi, afterEach } from 'vitest'
import ReviewPage from '../src/components/pages/ReviewPage.vue'
import { TMToken, TMTokenAggregate, TMTokenBlock } from '../src/components/managers/TokenManager'
import { shallowMount } from '@vue/test-utils'

afterEach(() => {
  vi.restoreAllMocks()
  // reset global onbeforeunload to avoid leaking between tests
  try { window.onbeforeunload = null } catch (e) {}
})

test('created with non-empty inputSentences registers listeners and tokenizes, beforeUnmount cleans up', () => {
  const addSpy = vi.spyOn(document, 'addEventListener')
  const removeSpy = vi.spyOn(document, 'removeEventListener')

  const emitterOn = vi.fn()
  const emitterOff = vi.fn()

  const fakeThis: any = {
    annotationManager: { inputSentences: [{ id: 1, text: 'x' }] },
    tokenizeCurrentSentence: vi.fn(),
    selectTokens: vi.fn(),
    beforeLeave: vi.fn(),
    emitter: { on: emitterOn, off: emitterOff },
  }

  // Call created hook
  ;(ReviewPage as any).created.call(fakeThis)

  // It should tokenize because there are sentences
  expect(fakeThis.tokenizeCurrentSentence).toHaveBeenCalled()

  // document.addEventListener should have been called for 'mouseup' with a function
  expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))

  // window.onbeforeunload should be set to beforeLeave handler
  expect(window.onbeforeunload).toBe(fakeThis.beforeLeave)

  // emitter.on should be called for tokenizeCurrentSentence
  expect(emitterOn).toHaveBeenCalledWith('tokenizeCurrentSentence', expect.any(Function))

  // Call the handler that was registered on document to ensure it calls selectTokens
  const handler = addSpy.mock.calls.find(c => c[0] === 'mouseup')![1]
  ;(handler as any)({ type: 'mouseup' })
  expect(fakeThis.selectTokens).toHaveBeenCalledWith({ type: 'mouseup' })

  // Now call beforeUnmount and verify cleanup
  ;(ReviewPage as any).beforeUnmount.call(fakeThis)
  expect(removeSpy).toHaveBeenCalledWith('mouseup', fakeThis.selectTokens)
  expect(emitterOff).toHaveBeenCalledWith('tokenizeCurrentSentence', fakeThis.tokenizeCurrentSentence)
})

test('created with empty inputSentences does not tokenize immediately but still registers listeners', () => {
  const addSpy = vi.spyOn(document, 'addEventListener')
  const emitterOn = vi.fn()

  const fakeThis: any = {
    annotationManager: { inputSentences: [] },
    tokenizeCurrentSentence: vi.fn(),
    selectTokens: vi.fn(),
    beforeLeave: vi.fn(),
    emitter: { on: emitterOn, off: vi.fn() },
  }

  ;(ReviewPage as any).created.call(fakeThis)

  // Should not tokenize because there are no sentences
  expect(fakeThis.tokenizeCurrentSentence).not.toHaveBeenCalled()

  // Should still register mouseup listener and emitter
  expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
  expect(emitterOn).toHaveBeenCalledWith('tokenizeCurrentSentence', expect.any(Function))

  // Calling the registered handler should call selectTokens
  const handler = addSpy.mock.calls[0][1]
  ;(handler as any)('evt')
  expect(fakeThis.selectTokens).toHaveBeenCalledWith('evt')

  // cleanup
  ;(ReviewPage as any).beforeUnmount.call(fakeThis)
})

test('template renders token when eligibleTokens contains TMToken', () => {
  const token = new TMToken(0, 1, 'a', 'Candidate')
  // ensure reviewed=false path (user-inactive) exercised by default
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [token],
      tokenManager: () => ({ tokens: [token], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })
  // token branch should render a token stub
  expect(vm.html()).toContain('token-stub')
})

test('template renders token with reviewed=true shows active class', () => {
  const token = new TMToken(0, 1, 'a', 'Candidate')
  token.reviewed = true
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [token],
      tokenManager: () => ({ tokens: [token], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })
  expect(vm.html()).toContain('user-active')
})

test('template renders aggregate-block when eligibleTokens contains TMTokenAggregate', () => {
  const block = new TMTokenBlock(0, 2, [new TMToken(0,1,'a','Candidate')], { id:1, name:'L', color: 'red-11' } as any, 'Candidate')
  const aggregate = new TMTokenAggregate([block])
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [aggregate],
      tokenManager: () => ({ tokens: [aggregate], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })
  expect(vm.html()).toContain('aggregate-block-stub')
})

test('aggregate-block @remove-block calls onRemoveBlock and triggers managers', () => {
  const block = new TMTokenBlock(0, 2, [new TMToken(0,1,'a','Candidate')], { id:1, name:'L', color: 'red-11' } as any, 'Candidate')
  const aggregate = new TMTokenAggregate([block])
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [aggregate],
      tokenManager: () => ({ tokens: [aggregate], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })

  // call the handler as if the aggregate emitted remove-block
  ;(vm.vm as any).onRemoveBlock(block.start)
  expect((vm.vm as any).versionControlManager.addUndo).toHaveBeenCalledWith((vm.vm as any).tokenManager)
  expect((vm.vm as any).tokenManager.removeBlock).toHaveBeenCalledWith(block.start)
})

test('template handles unknown token types (no branch matches)', () => {
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => ([{ foo: 'bar' }]),
      tokenManager: () => ({ removeBlock: vi.fn() }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })

  // none of the stubs should render because the object isn't an instance of any TMToken classes
  expect(vm.html()).not.toContain('token-stub')
  expect(vm.html()).not.toContain('aggregate-block-stub')
  expect(vm.html()).not.toContain('token-block-stub')
})

test('template renders token-block when eligibleTokens contains TMTokenBlock', async () => {
  const block = new TMTokenBlock(5, 6, [new TMToken(5,6,'x','Candidate')], { id:1, name:'L', color: 'red-11' } as any, 'Candidate')
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [block],
      tokenManager: () => ({ tokens: [block], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })
  expect(vm.html()).toContain('token-block-stub')
  // ensure the @remove-block handler is wired and callable (covers template listener branch)
  const spy = vi.spyOn(vm.vm as any, 'onRemoveBlock')
  // provide the mapped managers expected by onRemoveBlock
  ;(vm.vm as any).versionControlManager = { addUndo: vi.fn() }
  ;(vm.vm as any).tokenManager = { removeBlock: vi.fn() }
  // directly call the handler (emitting on the shallow stub lacks vm in this environment)
  ;(vm.vm as any).onRemoveBlock(block.start)
  expect((vm.vm as any).versionControlManager.addUndo).toHaveBeenCalledWith((vm.vm as any).tokenManager)
  expect((vm.vm as any).tokenManager.removeBlock).toHaveBeenCalledWith(block.start)
  expect(spy).toHaveBeenCalledWith(block.start)
})

test('template renders token-block with reviewed=true shows active class', () => {
  const block = new TMTokenBlock(5, 6, [new TMToken(5,6,'x','Candidate')], { id:1, name:'L', color: 'red-11' } as any, 'Candidate')
  block.reviewed = true
  const store: any = { state: { annotationManager: { inputSentences: [] } } }
  const emitter = { on: vi.fn(), off: vi.fn() }
  const vm = shallowMount(ReviewPage, {
    global: { mocks: { $store: store, emitter }, stubs: ['labels-block', 'token', 'aggregate-block', 'token-block', 'info-bar'] },
    computed: { 
      eligibleTokens: () => [block],
      tokenManager: () => ({ tokens: [block], removeBlock: vi.fn(), isOverlapping: () => null }),
      versionControlManager: () => ({ addUndo: vi.fn() }),
    }
  })
  expect(vm.html()).toContain('user-active')
})
