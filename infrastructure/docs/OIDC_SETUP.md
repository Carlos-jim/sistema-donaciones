# Configuración de OIDC para GitHub Actions en AWS

Este documento explica cómo configurar la autenticación OIDC entre GitHub Actions y AWS (recomendado vs. usar access keys estáticas).

## 1. Crear el proveedor de identidad OIDC

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4e98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com
```

## 2. Crear el rol de IAM para Dev

Crea el archivo `trust-policy-dev.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<TU_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<TU_ORG>/<TU_REPO>:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

```bash
aws iam create-role \
  --role-name donaciones-gha-dev-role \
  --assume-role-policy-document file://trust-policy-dev.json

aws iam attach-role-policy \
  --role-name donaciones-gha-dev-role \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Guarda el ARN en GitHub Secret: AWS_ROLE_ARN_DEV
aws iam get-role --role-name donaciones-gha-dev-role
```

## 3. Crear el rol de IAM para Prod

Crea el archivo `trust-policy-prod.json` (más restrictivo):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<TU_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<TU_ORG>/<TU_REPO>:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

```bash
aws iam create-role \
  --role-name donaciones-gha-prod-role \
  --assume-role-policy-document file://trust-policy-prod.json

aws iam attach-role-policy \
  --role-name donaciones-gha-prod-role \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Guarda el ARN en GitHub Secret: AWS_ROLE_ARN_PROD
aws iam get-role --role-name donaciones-gha-prod-role
```

## 4. Alternativa: Access Keys (no recomendado)

Si prefieres usar access keys en lugar de OIDC:

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
```

Y configura los secrets `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` en GitHub.
