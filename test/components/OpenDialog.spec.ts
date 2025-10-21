import { shallowMount } from '@vue/test-utils'
import OpenDialog from '../../src/components/dialogs/OpenDialog.vue'

describe('OpenDialog', () => {
  it('re-emits hide when q-dialog hides and emits confirm when OK clicked', async () => {
    const wrapper = shallowMount(OpenDialog, {
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
    await buttons[0].trigger('click')
    expect(wrapper.emitted()).toHaveProperty('hide')
    await buttons[1].trigger('click')
    expect(wrapper.emitted()).toHaveProperty('confirm')
  })
})
