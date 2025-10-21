import { shallowMount } from '@vue/test-utils'
import ExitDialog from '../../src/components/dialogs/ExitDialog.vue'

describe('ExitDialog', () => {
  it('re-emits hide when q-dialog emits hide and re-emits confirm when OK clicked', async () => {
    // provide simple stubs for Quasar components so buttons render
    const wrapper = shallowMount(ExitDialog, {
      props: { show: true },
      global: {
        stubs: {
          'q-dialog': { template: '<div><slot /></div>' },
          'q-card': { template: '<div><slot /></div>' },
          'q-card-section': { template: '<div><slot /></div>' },
          'q-card-actions': { template: '<div><slot /></div>' },
          'q-btn': { template: '<button @click="$emit(\'click\')"></button>' },
        },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(2)

    await buttons[0].trigger('click') // Cancel -> emits hide
    expect(wrapper.emitted()).toHaveProperty('hide')

    await buttons[1].trigger('click') // OK -> emits confirm
    expect(wrapper.emitted()).toHaveProperty('confirm')
  })
})
