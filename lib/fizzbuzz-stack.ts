import * as cdk from '@aws-cdk/core';
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as path from "path";
import * as cfg from './config';
import * as logs from "@aws-cdk/aws-logs"
import * as secretsmanager from '@aws-cdk/aws-secretsmanager';
import { cfnTagToCloudFormation } from '@aws-cdk/core';
import { CfnSecret } from '@aws-cdk/aws-secretsmanager';

export class FizzbuzzStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Lambda Role
    const lambdarole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    //Lambda policies
    lambdarole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));

    //Lambda
    const fizzbuzzLambda = new lambda.Function(this, 'fizzbuzz', {
      runtime: lambda.Runtime.PYTHON_3_7,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'lambdas', 'fizzbuzz')),
      role: lambdarole,
      logRetention: cfg.LOG_RETENTION
    });

    // LogGrpup for API GW
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    //Api GW
    const api = new apigateway.RestApi(this, 'api', {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // this is also the default
      },
      cloudWatchRole: true,

      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true
      },
      restApiName: 'fizzbuzz-api',
      binaryMediaTypes: ['application/zip'],
    });

    //Generate API Key
    const secret = new secretsmanager.Secret(this, 'Secret', {
      generateSecretString: {
        generateStringKey: 'api_key',
        secretStringTemplate: JSON.stringify({ api_key: 'fizzbuzz' }),
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\.-,=^',
        excludePunctuation: true,
        passwordLength: 40
      },
    });

    // API key
    const key = api.addApiKey('ApiKey', {
      //apiKeyName: "key_" + cfg.ENVIRONMENT,
      value: secret.secretValueFromJson('api_key').toString(),
    });




    // Add resource
    const fizzbuzz = api.root.addResource('check');
    //Lambda Integration
    const fizzbuzzIntegrations = new apigateway.LambdaIntegration(fizzbuzzLambda, {
      proxy: false,
      integrationResponses: [
        {
          statusCode: "200",
        },
        {
          selectionPattern: '.*"statusCode": 400.*',
          statusCode: "400",
          responseTemplates: {
            'application/json': `#set ($obj = $util.parseJson($input.path('$.errorMessage')))
                                        {"error": {
                                            "statusCode":$obj.error.statusCode,
                                            "message":"$obj.error.msg"}
                                        }`
          },
        }


      ],
      passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,

    });
    // Add method
    const fizzbuzzmethod = fizzbuzz.addMethod('POST', fizzbuzzIntegrations, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL
          },

        },
        {
          statusCode: '400',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL
          },

        }

      ],
    });

    const plan = api.addUsagePlan('UsagePlan', {
      name: 'plan_' + cfg.ENVIRONMENT,
      apiKey: key,
      throttle: {
        rateLimit: 2,
        burstLimit: 1
      },
      /*quota: {
        limit: 10000,
        period: apigateway.Period.DAY
      } 
      */
    });

    plan.addApiStage({
      stage: api.deploymentStage,
      throttle: [
        {
          method: fizzbuzzmethod,
          throttle: {
            rateLimit: 2,
            burstLimit: 1
          }
        }
      ]
    });


  }
}
