import { expect, test } from 'vitest'
import Shared from '../../src/components/pages/shared.vue'
import { TMTokenBlock, TMToken, TMTokenAggregate } from '../../src/components/managers/TokenManager'
import { Label } from '../../src/components/managers/LabelManager'

test('eligibleTokens returns aggregate when overlapping blocks present and dedups duplicates', () => {
  const label = new Label(1, 'L', 'red-11')
  // create two overlapping blocks
  const b1 = new TMTokenBlock(0, 3, [TMToken.fromObject([0,1,'a']), TMToken.fromObject([1,2,'b']), TMToken.fromObject([2,3,'c'])], label, 'Candidate')
  const b2 = new TMTokenBlock(1, 4, [TMToken.fromObject([1,2,'b']), TMToken.fromObject([2,3,'c']), TMToken.fromObject([3,4,'d'])], label, 'Candidate')

  const tokenManager = { tokens: [b1, b2], isOverlapping: (s: number, e: number) => [b1, b2] }

  const ctx: any = {
    tokenManager,
    TMToken,
    TMTokenBlock,
    TMTokenAggregate,
  }

  const fn = (Shared as any).computed.eligibleTokens
  const out = fn.call(ctx)
  // Should return a TMTokenAggregate for the overlap
  expect(out.length).toBe(1)
  expect((out[0] as any).type).toBe('token-aggregate')
})
