## Install the project

### 1. Install [**AWS CLI**](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html) 
### 2. Configure your AWS credentials
- `aws configure`
### 3. Install [**Node.js 12.x**](https://nodejs.org/dist/latest-v12.x/)
### 4. Install TypeScript
- `npm -g install typescript`
### 5. Install AWS CDK
- `npm install -g aws-cdk`
### 6. Bootstrap AWS region
- `cdk bootstrap aws://<account_number>/<aws-region>`
### 7. Build the project
- `npm install`
- `npm run build`
### 8.Define the environment
- `set NODE_ENV=fizzbuz`

## Deploy the project
- `cdk deploy FizzbuzzStack`
## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
