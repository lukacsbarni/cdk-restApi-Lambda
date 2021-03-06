#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FizzbuzzStack } from '../lib/fizzbuzz-stack';
import { REGION } from '../lib/config';
import { CICDPipelineStack } from '../lib/ci-cd';

const app = new cdk.App();

const fizzbuzz = new FizzbuzzStack(app, 'FizzbuzzStack', {
  env: {
    region: REGION,
  },
});
const cicd = new CICDPipelineStack(app, 'CICDPipelineStack', {
  env: {
    region: REGION,
  },
});

