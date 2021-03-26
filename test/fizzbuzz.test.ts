import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Fizzbuzz from '../lib/fizzbuzz-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Fizzbuzz.FizzbuzzStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
