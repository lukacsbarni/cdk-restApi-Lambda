import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as cfg from './config';
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement, Effect } from '@aws-cdk/aws-iam';


export class CICDPipelineStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: cdk.StackProps) {
        super(scope, id, props);


        // Read the secret from Secrets Manager
        const sourceOutput = new codepipeline.Artifact();
        const sourceAction = new codepipeline_actions.GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'lukacsbarni', //personal repo->Username, Org Repo-> Organization Name
            repo: 'cdk-restApi-Lambda',
            oauthToken: cdk.SecretValue.secretsManager('fizzbuzz'),
            output: sourceOutput,
            trigger: codepipeline_actions.GitHubTrigger.NONE,
            branch: cfg.GIT_BRANCH, // default: 'master'
        });

        //Role for CodeBuild
        const role = new Role(this, 'CodeBuildRole', {
            assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
            managedPolicies: [
                ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),

            ]
        });

        // Add a policy to a Role
        role.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    'kms:GenerateDataKey',
                    'kms:Decrypt',
                    'ssm:GetParameters',
                ]
            })
        );

        // CodeBuild Project for CDK
        const cdkBuildOutput = new codepipeline.Artifact();
        const cdkBuild = new codebuild.PipelineProject(this, 'CdkBuildProject', {
            role: role,
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                privileged: true,
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                env: {
                    'variables': {
                        'GIT_URL': 'git@github.com:lukacsbarni/cdk-restApi-Lambda.git'
                    },
                },
                phases: {
                    install: {
                        commands: [
                            "mkdir -p ~/.ssh",
                            "aws ssm get-parameter --name SSH_KEY --output text --query Parameter.Value > ~/.ssh/id_rsa",
                            "cat ~/.ssh/id_rsa",
                            "aws ssm get-parameter --name SSH_PUB --output text --query Parameter.Value > ~/.ssh/id_rsa.pub",
                            "chmod 600 ~/.ssh/id_rsa",
                            "eval $(ssh-agent -s)",
                            "git clone $GIT_URL"
                        ]
                    },
                    pre_build: {
                        commands: [
                            'npm install',
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                            'export NODE_ENV=' + cfg.ENVIRONMENT,
                            'node_modules/.bin/cdk deploy FizzbuzzStack'
                        ],
                    },
                },
                artifacts: {
                    'base-directory': 'cdk.out',
                    files: 'FizzbuzzStack.template.json',
                },
            }),
        });

        const buildActionCdk = new codepipeline_actions.CodeBuildAction({
            actionName: 'CdkBuild',
            project: cdkBuild,
            input: sourceOutput,
            outputs: [cdkBuildOutput],
            //outputs: [new codepipeline.Artifact()], // optional
        });

        const pipeline = new codepipeline.Pipeline(this, 'BackendPipeline', {
            pipelineName: 'FizzBuzz-Pipeline',
            restartExecutionOnUpdate: true,
            stages: [
                {
                    stageName: 'Source',
                    actions: [sourceAction],
                },
                {
                    stageName: 'BuildAndDeploy',
                    actions: [buildActionCdk],
                },
            ],
        });

    }
}