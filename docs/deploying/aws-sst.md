---
title: AWS w/ SST
---

# Deploying to AWS with SST

## 1. Setup

- [Create an AWS Account](https://signin.aws.amazon.com/signup?request_type=register)
- [Configure AWS Credentials](https://docs.sst.dev/advanced/iam-credentials#loading-from-a-file)
- [Install the SST CLI](https://ion.sst.dev/docs/reference/cli)

You can verify your AWS credentials by running the following command:

```shellscript
aws sts get-caller-identity
# {
#     "UserId": "[id]",
#     "Account": "[id]",
#     "Arn": "arn:aws:iam::[id]:user/[iam-user-name]"
# }
```

And verify the SST CLI is installed by running:

```shellscript nonumber
which sst
# /usr/local/bin/sst
```

Now you're ready to go!

## 2. Create a new project from a template

The following command will create a new SST project in a directory called `my-sst-app`:

```shellscript nonumber
npx degit @ryanflorence/templates/sst my-sst-app
```

## 3. Deploy the app

Change into the new directory and deploy the app. The first deploy may take a few minutes as it provisions the necessary resources.

```shellscript nonumber
sst deploy
```
